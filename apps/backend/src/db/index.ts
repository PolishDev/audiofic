import { Global, Module, type OnModuleDestroy } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { schema } from './schemas/index.js';
import { databaseConfig } from '../config/database.config.js';

export const DRIZZLE = Symbol('DRIZZLE_ORM');

export type Database = NodePgDatabase<typeof schema>;

const { Pool } = pg;

export const pool = new Pool({
  connectionString: databaseConfig.url,
  max: databaseConfig.maxConnections,
});

export const db: Database = drizzle(pool, { schema });

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useValue: db,
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnModuleDestroy {
  async onModuleDestroy() {
    await pool.end();
  }
}

export * from './schemas/index.js';
