import 'dotenv/config';

export const databaseConfig = {
  url:
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/shortstory',
  maxConnections: process.env.DB_MAX_CONNECTIONS
    ? parseInt(process.env.DB_MAX_CONNECTIONS, 10)
    : 10,
};
