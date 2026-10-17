import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard, OptionalAuthGuard } from './auth.guard.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, OptionalAuthGuard],
  exports: [AuthService, AuthGuard, OptionalAuthGuard],
})
export class AuthModule {}
