import { createModule } from '@deepkit/app';
import type { ServerBuild } from '@remix-run/server-runtime';
import type { AppLoadContext } from '@remix-run/node';

import { RemixAppController } from './remix-app.controller';
import {
  APP_LOAD_CONTEXT,
  GET_SERVER_BUILD,
  RemixAppConfig,
} from './remix-app-config';

export class RemixAppModule extends createModule({
  config: RemixAppConfig,
  controllers: [RemixAppController],
  listeners: [RemixAppController],
  forRoot: true,
}) {
  getServerBuild(load: () => ServerBuild): this {
    this.addProvider({
      provide: GET_SERVER_BUILD,
      useValue: load,
    });
    return this;
  }

  // Load Remix app context once per request
  getLoadContext<T extends readonly unknown[], C extends AppLoadContext>(
    load: (...args: T) => C,
  ): this {
    this.addProvider({
      provide: APP_LOAD_CONTEXT,
      scope: 'http',
      useFactory: load,
    });
    return this;
  }
}
