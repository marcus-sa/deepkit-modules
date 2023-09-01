import { ReceiveType, resolveReceiveType, Type } from '@deepkit/type';
import { GraphQLFieldConfigMap, GraphQLNamedType, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

import { Resolvers } from './resolvers';
import { TypesBuilder } from './types-builder';
import { gqlResolverDecorator } from './decorators';
import { ClassType } from '@deepkit/core';

export interface SchemaBuilderOptions {
  readonly resolvers: Resolvers;
  readonly inputTypes?: readonly Type[];
  readonly outputTypes?: readonly Type[];
}

export function buildSchema(options: SchemaBuilderOptions): GraphQLSchema {
  return new SchemaBuilder(options).buildSchema();
}

export class SchemaBuilder {
  private readonly inputTypes = new Set<Type>(this.options.inputTypes);

  private readonly outputTypes = new Set<Type>(this.options.outputTypes);

  private readonly typesBuilder = new TypesBuilder(this.options.resolvers);

  constructor(private readonly options: SchemaBuilderOptions) {
  }

  private buildInputTypes(): readonly GraphQLNamedType[] {
    return [...this.inputTypes].map(type =>
      // input or output?
      this.typesBuilder.createNamedInputType(type),
    );
  }

  private buildOutputTypes(): readonly GraphQLNamedType[] {
    return [...this.outputTypes].map(type =>
      // input or output?
      this.typesBuilder.createNamedOutputType(type),
    );
  }

  private buildRootMutationType(): GraphQLObjectType | undefined {
    const classTypes = [...this.options.resolvers.classTypes];

    const someMutations = classTypes.some(
      classType => this.hasMutationResolvers(classType),
    );
    if (!someMutations) return;

    return new GraphQLObjectType({
      name: 'Mutation',
      fields: () =>
        classTypes.reduce<GraphQLFieldConfigMap<unknown, unknown>>(
          (fields, classType) => ({
            // TODO: validate that fields don't override each other
            ...fields,
            ...this.typesBuilder.generateMutationResolverFields(
              this.options.resolvers.get(classType),
            ),
          }),
          {},
        ),
    });
  }

  /*private buildRootSubscriptionType(
    resolvers: Function[],
  ): GraphQLObjectType | undefined {
    const subscriptionsHandlers = this.filterHandlersByResolvers(
      getMetadataStorage().subscriptions,
      resolvers,
    );
    if (subscriptionsHandlers.length === 0) {
      return undefined;
    }

    return new GraphQLObjectType({
      name: 'Subscription',
      fields: this.generateSubscriptionsFields(subscriptionsHandlers),
    });
  }*/

  hasQueryResolvers(classType: ClassType): boolean {
    const resolver = gqlResolverDecorator._fetch(classType);
    return !!resolver?.queries.size;
  }

  hasMutationResolvers(classType: ClassType): boolean {
    const resolver = gqlResolverDecorator._fetch(classType);
    return !!resolver?.mutations.size;
  }

  hasFieldResolvers(classType: ClassType): boolean {
    const resolver = gqlResolverDecorator._fetch(classType);
    return !!resolver?.resolveFields.size;
  }

  private buildRootQueryType(): GraphQLObjectType | undefined {
    const classTypes = [...this.options.resolvers.classTypes];

    const someQueries = classTypes.some(
      classType => this.hasQueryResolvers(classType),
    );
    if (!someQueries) {
      return new GraphQLObjectType({
        name: 'Query',
        fields: {
          _dummy: { type: GraphQLString },
        },
      });
    }

    return new GraphQLObjectType({
      name: 'Query',
      fields: () =>
        classTypes.reduce<GraphQLFieldConfigMap<unknown, unknown>>(
          (fields, classType) => ({
            // TODO: validate that fields don't override each other
            ...fields,
            ...this.typesBuilder.generateQueryResolverFields(
              this.options.resolvers.get(classType),
            ),
          }),
          {},
        ),
    });
  }

  addInputType<T>(type?: ReceiveType<T>): void {
    type = resolveReceiveType(type);

    if (!this.inputTypes.has(type)) {
      this.inputTypes.add(type);
    }
  }

  addOutputType<T>(type?: ReceiveType<T>): void {
    type = resolveReceiveType(type);

    if (!this.outputTypes.has(type)) {
      this.outputTypes.add(type);
    }
  }

  buildSchema(): GraphQLSchema {
    const mutation = this.buildRootMutationType();
    const query = this.buildRootQueryType();
    const types = [...this.buildInputTypes(), ...this.buildInputTypes()];

    return new GraphQLSchema({
      query,
      mutation,
      types,
    });
  }
}
