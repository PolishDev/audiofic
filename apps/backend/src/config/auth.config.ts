import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { expo } from '@better-auth/expo';
import { bearer } from 'better-auth/plugins';
import { ulid } from 'ulid';
import { db } from '../db/index.js';
import { schema } from '../db/schemas/index.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  advanced: {
    database: {
      generateId: () => ulid(),
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [expo(), bearer()],
  trustedOrigins: [
    'audiofic://',
    'shortstory://',
    'http://localhost:8081',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://192.168.0.13:8081',
    'http://192.168.0.13:3000',
    'http://192.168.0.13:3001',
    'http://10.0.2.2:8081',
    'http://10.0.2.2:3000',
    'http://10.0.2.2:3001',
    'exp://*',
  ],
  secret:
    process.env.BETTER_AUTH_SECRET ||
    'audiofic-super-secret-key-change-in-production-min-32-chars',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
});

export type Auth = typeof auth;
