import { InjectorContext } from '@deepkit/injector';
import { eventDispatcher } from '@deepkit/event';
import { onServerBootstrap, onServerShutdown } from '@deepkit/framework';

import { DeepkitGraphQLResolvers, Resolvers } from './resolvers';
import { buildSchema } from './schema-builder';

export class GraphQLKernel {
  constructor(
    private readonly resolvers: DeepkitGraphQLResolvers,
    private readonly injectorContext: InjectorContext,
  ) {}

  private createResolvers(): Resolvers {
    return new Resolvers(
      [...this.resolvers.values()].map(({ controller, module }) =>
        this.injectorContext.get(controller, module),
      ),
    );
  }

  @eventDispatcher.listen(onServerBootstrap)
  onServerBootstrap(): void {
    const resolvers = this.createResolvers();

    const schema = buildSchema({ resolvers });
    // TODO: start server
  }

  @eventDispatcher.listen(onServerShutdown)
  onServerShutdown(): void {}
}
