import { InjectorModule } from '@deepkit/injector';
import { ClassType } from '@deepkit/core';
import { GraphQLError, GraphQLFieldResolver } from 'graphql';
import {
  deserialize,
  metaAnnotation,
  ReflectionKind,
  ReflectionMethod,
  ReflectionParameter,
  serialize,
  serializer,
  validate,
  ValidationError,
} from '@deepkit/type';

import { Instance, PARENT_META_NAME } from './types-builder';

export class DeepkitGraphQLResolvers extends Set<{
  readonly module: InjectorModule;
  readonly controller: ClassType;
}> {}

export class Resolvers extends WeakMap<ClassType, Instance> {
  readonly classTypes = new Set<ClassType>();

  constructor(instances: readonly Instance[]) {
    const entries = instances.map<readonly [ClassType, Instance]>(instance => [
      instance.constructor,
      instance,
    ]);
    super(entries);
    entries.forEach(([classType]) => this.classTypes.add(classType));
  }
}

export function getParentMetaAnnotationReflectionParameterIndex(
  parameters: readonly ReflectionParameter[],
): number {
  return parameters.findIndex(({ parameter }) =>
    metaAnnotation.getForName(parameter.type, PARENT_META_NAME) ||
    // FIXME: `Parent<T>` annotation is somehow not available in `example-graphql` app
    parameter.type.kind === ReflectionKind.unknown,
  );
}

export function filterReflectionParametersMetaAnnotationsForArguments(
  parameters: readonly ReflectionParameter[],
): readonly ReflectionParameter[] {
  const argsParameters = [...parameters];

  const parentIndex =
    getParentMetaAnnotationReflectionParameterIndex(argsParameters);

  if (parentIndex !== -1) {
    // eslint-disable-next-line functional/immutable-data
    argsParameters.splice(parentIndex, 1);
  }

  return argsParameters;
}

// eslint-disable-next-line functional/prefer-readonly-type
export function createResolveFunction<Resolver, Args extends unknown[] = []>(
  instance: Resolver,
  { parameters, name, type }: ReflectionMethod,
): GraphQLFieldResolver<unknown, unknown, Args> {
  // @ts-ignore
  const resolve = instance[name as keyof Resolver].bind(instance) as (
    ...args: Args
  ) => unknown;

  return async (parent, args) => {
    const argsParameters =
      filterReflectionParametersMetaAnnotationsForArguments(parameters);

    const argsValidationErrors = argsParameters.flatMap(parameter =>
      validate(args[parameter.name as keyof Args], parameter.type),
    );
    if (argsValidationErrors.length) {
      const originalError = new ValidationError(argsValidationErrors);
      throw new GraphQLError(originalError.message, {
        originalError,
        path: [name],
      });
    }

    const resolveArgs = argsParameters.map(parameter =>
      deserialize(
        args[parameter.name as keyof Args],
        undefined,
        serializer,
        undefined,
        parameter.type,
      ),
    ) as Parameters<typeof resolve>;

    const parentParameterIndex =
      getParentMetaAnnotationReflectionParameterIndex(parameters);
    if (parentParameterIndex !== -1) {
      // eslint-disable-next-line functional/immutable-data
      resolveArgs.splice(parentParameterIndex, 0, parent);
    }

    return serialize(
      await resolve(...resolveArgs),
      undefined,
      serializer,
      undefined,
      type.return,
    );
  };
}
