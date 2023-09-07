import type { HttpRequest, HttpResponse } from '@deepkit/http';
import type {
  RequestInit as NodeRequestInit,
  Response as NodeResponse,
} from '@remix-run/node';
import {
  AbortController as NodeAbortController,
  Headers as NodeHeaders,
  Request as NodeRequest,
  writeReadableStreamToWritable,
} from '@remix-run/node';

export function createRemixHeaders(
  requestHeaders: HttpRequest['headers'],
): NodeHeaders {
  const headers = new NodeHeaders();

  for (const [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
}

export async function createRemixRequest(
  req: HttpRequest,
  res?: HttpResponse,
): Promise<NodeRequest> {
  // FIXME: needs to be the correct url
  const url = new URL(req.getUrl(), `http://${req.headers.host!}`);

  // Abort action/loaders once we can no longer write a response
  const controller = new NodeAbortController();
  res?.on('close', () => controller.abort());

  let init: RequestInit = {
    method: req.method,
    headers: createRemixHeaders(req.headers),
    // Cast until reason/throwIfAborted added
    // https://github.com/mysticatea/abort-controller/issues/36
    signal: controller.signal as NodeRequestInit['signal'],
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init = {
      ...init,
      body: await req.readBody(),
      // duplex must be set if request.body is ReadableStream or Async Iterables.
      // See https://fetch.spec.whatwg.org/#dom-requestinit-duplex.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      duplex: 'half',
    };
  }

  return new NodeRequest(url.href, init);
}

export async function sendRemixResponse(
  res: HttpResponse,
  nodeResponse: NodeResponse,
): Promise<void> {
  const headers = Object.fromEntries(nodeResponse.headers.entries());
  res.writeHead(nodeResponse.status, nodeResponse.statusText, headers);

  if (nodeResponse.body) {
    await writeReadableStreamToWritable(nodeResponse.body, res);
  } else {
    res.end();
  }
}
