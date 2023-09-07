import * as http from 'node:http';
import * as https from 'node:https';
import * as url from 'node:url';
import { ApolloServer, HeaderMap, HTTPGraphQLRequest } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { GraphQLSchema } from 'graphql';
import { WebWorkerFactory,ApplicationServer, WebWorker } from '@deepkit/framework';
import { eventDispatcher } from '@deepkit/event';
import { httpWorkflow } from '@deepkit/http';
import { Driver } from '@deepkitx/graphql';

export class ApolloDriver extends Driver {
  private server?: ApolloServer | null;

  constructor(private readonly appServer: ApplicationServer, private readonly webWorkerFactory: WebWorkerFactory) {
    super();
  }


  @eventDispatcher.listen(httpWorkflow.onRequest, 1)
  async onRequest(
    event: typeof httpWorkflow.onRequest.event,
  ) {
    if (!event.request.method) return;

    const headers = new HeaderMap()
    for (const [key, value] of Object.entries(event.request.headers)) {
      if (value) {
        // Node/Express headers can be an array or a single value. We join
        // multi-valued headers with `, ` just like the Fetch API's `Headers`
        // does. We assume that keys are already lower-cased (as per the Node
        // docs on IncomingMessage.headers) and so we don't bother to lower-case
        // them or combine across multiple keys that would lower-case to the
        // same value.
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }


    const httpGraphQLRequest: HTTPGraphQLRequest = {
      method: event.request.method,
      headers,
      search: url.parse(event.url).search ?? '',
      body: await event.request.readBody(),
    };


    const response = await this.server?.executeHTTPGraphQLRequest({
      httpGraphQLRequest,
      context: async () => ({}),
    })


    for (const [key, value] of response!.headers) {
      event.response.setHeader(key, value);
    }

    for await (const chunk of response?.body.asyncIterator) {
      res.write(chunk);
      // Express/Node doesn't define a way of saying "it's time to send this
      // data over the wire"... but the popular `compression` middleware
      // (which implements `accept-encoding: gzip` and friends) does, by
      // monkey-patching a `flush` method onto the response. So we call it
      // if it's there.
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    }

    if (response?.body.kind === 'complete') {
      event.response.write(response.body.string);
      return;
    }
    // res.statusCode = httpGraphQLResponse.status || 200;

    event.response.end();
  }

  async start(schema: GraphQLSchema): Promise<void> {
    let httpWorker: WebWorker & any;
    try {
      httpWorker = this.appServer.getHttpWorker() as any;
    } catch {
      (this.appServer as any).httpWorker = this.webWorkerFactory.create(1, this.appServer.config);
      (this.appServer as any).httpWorker.start();
      httpWorker = this.appServer.getHttpWorker() as any;
    }

    const httpServer: https.Server | http.Server = httpWorker.servers || httpWorker.server;

    this.server = new ApolloServer({
      schema,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });
    await this.server.start();
  }

  async stop() {
    await this.server?.stop();
    this.server = null;
  }
}
