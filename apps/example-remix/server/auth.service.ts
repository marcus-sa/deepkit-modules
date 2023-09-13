import { HttpRequest } from '@deepkit/http';

import { createRemixRequest } from '@deepkit-modules/remix';

export class AuthService {
  async getSessionFromDeepkit(request: HttpRequest): Promise<{} | null> {
    // eslint-disable-next-line functional/immutable-data
    const remixRequest = (request.store.remixRequest ||=
      await createRemixRequest(request));
    // eslint-disable-next-line functional/immutable-data
    return (request.store.session ||= await this.getSession(remixRequest));
  }

  async getSession(request: Request): Promise<{} | null> {
    return {};
  }
}
