import { createModule } from '@deepkit/app';
import { GraphQLModule } from '@deepkit-community-test/graphql';
import { ApolloServerPlugin } from '@apollo/server/dist/esm/externalTypes/plugins';

import { ApolloDriver } from './apollo-graphql-driver';
import { ApolloGraphQLConfig } from './apollo-graphql-config';
import { ApolloServerPlugins } from './plugins';

export class ApolloGraphQLModule extends createModule({
  config: ApolloGraphQLConfig,
}) {
  readonly plugins = new ApolloServerPlugins();

  process() {
    this.addModuleImport(
      new GraphQLModule().useDriver(ApolloDriver).addProvider({
        provide: ApolloServerPlugins,
        useValue: this.plugins,
      }),
    );
  }

  addPlugin(plugin: ApolloServerPlugin): this {
    this.plugins.add(plugin);
    return this;
  }
}
