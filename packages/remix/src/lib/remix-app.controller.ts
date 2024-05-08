import { eventDispatcher } from '@deepkit/event';
import { http, httpWorkflow } from '@deepkit/http';
import { InjectorContext } from '@deepkit/injector';
import type { ServerBuild } from '@remix-run/server-runtime';
import type { AppLoadContext } from '@remix-run/node';
import { createRequestHandler as createRemixRequestHandler } from '@remix-run/node';

import { createRemixRequest, sendRemixResponse } from './utils.js';
import { APP_LOAD_CONTEXT, LOAD_SERVER_BUILD_FN, LoadServerBuildFn } from './remix-app-config.js';

export class RemixAppController {
  constructor(private readonly injector: InjectorContext) {}

  @eventDispatcher.listen(httpWorkflow.onRouteNotFound)
  async onRequest(
    event: typeof httpWorkflow.onRouteNotFound.event,
  ): Promise<void> {
    if (event.request.url) {
      const loadServerBuild = this.injector.get<LoadServerBuildFn>(LOAD_SERVER_BUILD_FN);

      const handleRequest = createRemixRequestHandler(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        loadServerBuild,
        process.env.NODE_ENV,
      );

      const request = await createRemixRequest(event.request, event.response);

      const httpScope = this.injector.createChildScope('http');
      const loadContext = httpScope.get<AppLoadContext>(APP_LOAD_CONTEXT);

      const response = await handleRequest(
        request,
        loadContext,
      );

      await sendRemixResponse(event.response, response);
    }
  }

  @http.GET('/_remix')
  remix(): void {}
}
