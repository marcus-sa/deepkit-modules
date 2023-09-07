import { eventDispatcher } from '@deepkit/event';
import { http, httpWorkflow } from '@deepkit/http';
import { Inject, InjectorContext } from '@deepkit/injector';
import type { ServerBuild } from '@remix-run/server-runtime';
import type { AppLoadContext, Response as NodeResponse } from '@remix-run/node';
import { createRequestHandler as createRemixRequestHandler } from '@remix-run/node';

import { createRemixRequest, sendRemixResponse } from './utils';

export class RemixAppController {
  constructor(
    private readonly injector: InjectorContext,
    private readonly getServerBuild: Inject<
      () => ServerBuild,
      'getServerBuild'
    >,
  ) {}

  @eventDispatcher.listen(httpWorkflow.onRouteNotFound)
  async onRequest(
    event: typeof httpWorkflow.onRouteNotFound.event,
  ): Promise<void> {
    if (event.request.url) {
      const build = this.injector.get<() => ServerBuild>('getServerBuild')();

      const handleRequest = createRemixRequestHandler(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        build,
        process.env.NODE_ENV,
      );

      const request = await createRemixRequest(event.request, event.response);

      const httpScope = this.injector.createChildScope('http');
      const loadContext = httpScope.get<AppLoadContext>('loadContext');

      const response = (await handleRequest(
        request,
        loadContext,
      )) as NodeResponse;

      await sendRemixResponse(event.response, response);
    }
  }

  @http.GET('/_remix')
  remix(): void {}
}
