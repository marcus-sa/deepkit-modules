import type { HttpRequest, HttpResponse } from '@deepkit/http';
import { writeReadableStreamToWritable } from '@remix-run/node';

export function createRemixHeaders(
  requestHeaders: HttpRequest['headers'],
): Headers {
  const headers = new Headers();

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
): Promise<Request> {
  // FIXME: needs to be the correct url
  const url = new URL(req.getUrl(), `http://${req.headers.host!}`);

  // Abort action/loaders once we can no longer write a response
  const controller = new AbortController();
  res?.on('close', () => controller.abort());

  let init: RequestInit = {
    method: req.method,
    headers: createRemixHeaders(req.headers),
    signal: controller.signal,
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

  return new Request(url.href, init);
}

export async function sendRemixResponse(
  res: HttpResponse,
  nodeRes: Response,
): Promise<void> {
  const headers: Record<string, string | string[]> = {}

  nodeRes.headers.forEach((value, key) => {
    if (key in headers) {
      if (!Array.isArray(headers[key])) {
        headers[key] = [headers[key] as string];
      }
      (headers[key] as string[]).push(value);
    } else {
      headers[key] = value;
    }
  });

  res.writeHead(nodeRes.status, nodeRes.statusText, headers);

  if (nodeRes.body) {
    await writeReadableStreamToWritable(nodeRes.body, res);
  } else {
    res.end();
  }
}
