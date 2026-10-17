import { Injectable } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import { auth, type Auth } from '../../config/auth.config.js';

@Injectable()
export class AuthService {
  get authInstance(): Auth {
    return auth;
  }

  async getSessionFromHeaders(headers: IncomingHttpHeaders) {
    return auth.api.getSession({
      headers: fromNodeHeaders(headers),
    });
  }
}
