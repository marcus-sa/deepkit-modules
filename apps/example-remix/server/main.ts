import * as path from 'node:path';
import { App } from '@deepkit/app';
import { workspaceRoot } from '@nx/devkit';
import { FrameworkModule } from '@deepkit/framework';
import { AppLoadContext, ServerBuild } from '@remix-run/server-runtime';
import { RemixAppModule } from 'deepkit-remix';

import { AuthMiddleware } from './auth.middleware';
import { AuthService } from './auth.service';
import { ExampleRemixConfig } from './config';

declare const __non_webpack_require__: typeof require;

const appDir = path.join(
  workspaceRoot,
  'dist/apps',
  process.env.NX_TASK_TARGET_PROJECT!,
);
const publicDir = path.join(appDir, 'public');
const buildDir = path.join(appDir, 'build');
const isDev = process.env.NODE_ENV === 'development';

const prodServerBuild = !isDev ? __non_webpack_require__(buildDir) : null;

function getDevServerBuild(): ServerBuild {
  for (const key in __non_webpack_require__.cache) {
    if (key.includes('@deepkit-modules/') || key.includes(buildDir)) {
      // eslint-disable-next-line functional/immutable-data,@typescript-eslint/no-dynamic-delete
      delete __non_webpack_require__.cache[key];
    }
  }

  return __non_webpack_require__(buildDir);
}

void new App({
  config: ExampleRemixConfig,
  imports: [
    new FrameworkModule({
      publicDir,
      debug: isDev,
      publicDirPrefix: '/',
    }),
    new RemixAppModule()
      .getServerBuild(() => (isDev ? getDevServerBuild() : prodServerBuild))
      .getLoadContext(
        (config: ExampleRemixConfig, auth: AuthService): AppLoadContext => ({
          config,
          auth,
        }),
      ),
  ],
  providers: [AuthService, AuthMiddleware],
  controllers: [],
})
  .loadConfigFromEnv({
    prefix: 'NX_',
  })
  .run(['server:start']);
