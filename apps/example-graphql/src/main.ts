import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';
import { GraphQLModule } from '@deepkitx/graphql';
import { ApolloDriver } from '@deepkitx/apollo-graphql-driver';

import { PostResolver, UserResolver } from './resolvers';

void new App({
  imports: [new FrameworkModule(), new GraphQLModule().useDriver(ApolloDriver)],
  controllers: [PostResolver, UserResolver],
}).run(['server:start']);
