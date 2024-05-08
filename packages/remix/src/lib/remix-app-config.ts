import type { ServerBuild } from '@remix-run/server-runtime';

export class RemixAppConfig {}

export type LoadServerBuildFn = () => ServerBuild | Promise<ServerBuild>;

export const LOAD_SERVER_BUILD_FN = Symbol('LOAD_SERVER_BUILD_FN');

export const APP_LOAD_CONTEXT = Symbol('APP_LOAD_CONTEXT');
