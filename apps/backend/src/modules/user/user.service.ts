import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../db/index.js';
import { user } from '../../db/schemas/user.table.js';

@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findById(id: string) {
    const foundUser = await this.db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!foundUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return foundUser;
  }

  async findByEmail(email: string) {
    return this.db.query.user.findFirst({
      where: eq(user.email, email),
    });
  }
}
