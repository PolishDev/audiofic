import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../../config/auth.config.js';

@Controller('api/auth')
export class AuthController {
  private readonly handler = toNodeHandler(auth);

  @All()
  async handleRoot(@Req() req: Request, @Res() res: Response) {
    return this.handler(req, res);
  }

  @All('*splat')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    return this.handler(req, res);
  }
}
