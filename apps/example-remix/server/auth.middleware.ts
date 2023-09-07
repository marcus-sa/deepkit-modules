import {
  HttpAccessDeniedError,
  HttpMiddleware,
  HttpRequest,
  HttpResponse,
} from '@deepkit/http';

import { AuthService } from './auth.service';

export class AuthMiddleware implements HttpMiddleware {
  constructor(private readonly auth: AuthService) {}

  async execute(
    request: HttpRequest,
    response: HttpResponse,
    next: (err?: unknown) => void,
  ): Promise<void> {
    const session = await this.auth.getSessionFromDeepkit(request);
    if (!session) {
      throw new HttpAccessDeniedError('Missing session');
    }

    next();
  }
}
