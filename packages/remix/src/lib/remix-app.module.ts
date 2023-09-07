import { createModule } from '@deepkit/app';
import type { ServerBuild } from '@remix-run/server-runtime';
import type { AppLoadContext } from '@remix-run/node';

import { RemixAppController } from './remix-app.controller';
import { RemixAppConfig } from './remix-app-config';

export class RemixAppModule extends createModule({
  config: RemixAppConfig,
  controllers: [RemixAppController],
  listeners: [RemixAppController],
  forRoot: true,
}) {
  getServerBuild(load: () => ServerBuild): this {
    this.addProvider({
      provide: 'getServerBuild',
      useValue: load,
    });
    return this;
  }

  // Load Remix app context once per request
  getLoadContext<T extends readonly unknown[], C extends AppLoadContext>(
    load: (...args: T) => C,
  ): this {
    this.addProvider({
      provide: 'loadContext',
      useFactory: load,
    });
    return this;
  }
}
