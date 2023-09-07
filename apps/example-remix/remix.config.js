const path = require('node:path');
const { workspaceRoot } = require('@nx/devkit');
const { withEsbuildOverride } = require('remix-esbuild-override');

const define = {}

const project = process.env.NX_TASK_TARGET_PROJECT;

const assetsBuildDirectory = path.join(
  workspaceRoot,
  'dist/apps',
  project,
  'public/build',
);
const serverBuildPath = path.join(
  workspaceRoot,
  'dist/apps',
  project,
  'build/index.js',
);
const cacheDirectory = path.join(
  workspaceRoot,
  'node_modules/.cache/remix',
  project,
);

const tsconfig = path.join(workspaceRoot, 'apps', project, 'tsconfig.app.json');

const libs = path.join(workspaceRoot, 'libs');

const server = path.join(workspaceRoot, 'apps', project, 'server');

// requires node-linker=hoisted to be set in .npmrc
withEsbuildOverride((options, context) =>
  !context.isServer
    ? {
        ...options,
        tsconfig,
        define: {
          ...options.define,
          ...define,
          global: 'window',
          process: 'process',
          Buffer: 'Buffer',
        },
      }
    : {
        ...options,
        tsconfig,
        define: {
          ...options.define,
          ...define,
        },
      },
);

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  devServerBroadcastDelay: 1000, // allow time for deepkit server to restart
  ignoredRouteFiles: ['**/.*'],
  cacheDirectory,
  assetsBuildDirectory,
  appDirectory: 'app',
  serverModuleFormat: 'cjs', // esm not supported by webpack yet
  serverBuildPath,
  watchPaths: [
    libs,
    path.join('!', libs, '**/*.spec.ts'),
    server,
    path.join('!', server, '**/*.spec.ts'),
  ],
  tailwind: true,
  future: {
    v2_errorBoundary: true,
    v2_headers: true,
    // v2_meta: true,
    v2_routeConvention: true,
    v2_normalizeFormMethod: true,
  },
  serverDependenciesToBundle: [],
};
