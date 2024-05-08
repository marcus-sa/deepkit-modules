import { createModule } from '@deepkit/app';
import type { ServerBuild } from '@remix-run/server-runtime';
import type { AppLoadContext } from '@remix-run/node';

import { RemixAppController } from './remix-app.controller.js';
import {
  APP_LOAD_CONTEXT,
  LOAD_SERVER_BUILD_FN,
  LoadServerBuildFn,
  RemixAppConfig,
} from './remix-app-config.js';

export class RemixAppModule extends createModule({
  config: RemixAppConfig,
  controllers: [RemixAppController],
  listeners: [RemixAppController],
  forRoot: true,
}) {
  getServerBuild(load: LoadServerBuildFn): this {
    this.addProvider({
      provide: LOAD_SERVER_BUILD_FN,
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
