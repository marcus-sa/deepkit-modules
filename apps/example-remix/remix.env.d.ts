/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />
import type {
  ExampleRemixConfig,
  AuthService,
} from './server';

declare module '@remix-run/server-runtime' {
  export interface AppLoadContext {
    readonly config: ExampleRemixConfig;
    readonly auth: AuthService;
  }
}
