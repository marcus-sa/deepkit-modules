import { AppModule, createModule } from '@deepkit/app';
import { ControllerConfig } from '@deepkit/app';

import { gqlResolverDecorator } from './decorators';
import { DeepkitGraphQLResolvers } from './resolvers';
import { GraphQLKernel } from './listener';

export class GraphQLModule extends createModule({
  listeners: [GraphQLKernel],
  forRoot: true,
}) {
  readonly resolvers: DeepkitGraphQLResolvers = new DeepkitGraphQLResolvers();

  process(): void {
    this.addProvider({
      provide: DeepkitGraphQLResolvers,
      useValue: this.resolvers,
    });
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
