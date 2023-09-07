import { AppModule, createModule } from '@deepkit/app';
import { ControllerConfig } from '@deepkit/app';
import { ReceiveType, resolveReceiveType } from '@deepkit/type';
import { ClassType } from '@deepkit/core';

import { gqlResolverDecorator } from './decorators';
import { DeepkitGraphQLResolvers } from './resolvers';
import { GraphQLServer } from './graphql-server';
import { GraphQLConfig } from './graphql-config';
import { Driver } from './driver';

export class GraphQLModule extends createModule({
  config: GraphQLConfig,
  listeners: [GraphQLServer],
  forRoot: true,
}) {
  readonly resolvers: DeepkitGraphQLResolvers = new DeepkitGraphQLResolvers();

  process(): void {
    this.addProvider({
      provide: DeepkitGraphQLResolvers,
      useValue: this.resolvers,
    });
    // TODO: https://discord.com/channels/759513055117180999/956485358382624790/1148211788270280814
    /*this.addProvider({
      provide: Driver,
      useClass: this.config.driver,
    })*/
  }

  useDriver(driver: ClassType<Driver>): this {
    this.addProvider({
      provide: Driver,
      useClass: driver,
    });
    this.addListener(driver);
    return this;
  }

  // TODO
  addType<T>(type?: ReceiveType<T>): this {
    type = resolveReceiveType(type);
    return this;
  }

  processController(
    module: AppModule<any>,
    { controller }: ControllerConfig,
  ): void {
    if (!controller) return;

    const resolver = gqlResolverDecorator._fetch(controller);
    if (!resolver) return;

    if (!module.isProvided(controller)) {
      module.addProvider({ provide: controller });
    }

    this.resolvers.add({ controller, module });
  }
}
