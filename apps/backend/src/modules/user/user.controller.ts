import { Controller, Get, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { UserService } from './user.service.js';
import type { User } from '../../db/schemas/user.table.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() currentUser: User) {
    return this.userService.findById(currentUser.id);
  }

  /**
   * Delete account and cascade all data. Required by Apple & Google Play stores.
   * DELETE /users/me
   */
  @Delete('me')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteMe(@CurrentUser() currentUser: User) {
    return this.userService.deleteAccount(currentUser.id);
  }
}
