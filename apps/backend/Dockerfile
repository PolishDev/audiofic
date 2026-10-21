# Multi-stage Dockerfile for @audiofic/backend (Turborepo + Bun monorepo)
# Optimized for Coolify and production environments
#
# Coolify configuration:
#   - Build Pack: Dockerfile
#   - Base Directory: /
#   - Dockerfile Location: apps/backend/Dockerfile (or /apps/backend/Dockerfile)
#   - Port: 3000

# 1. Prune stage: Isolate @audiofic/backend and its monorepo dependencies
FROM oven/bun:1-alpine AS pruner
WORKDIR /app
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune @audiofic/backend --docker

# 2. Installer stage: Install dependencies with Bun and build NestJS
FROM oven/bun:1-alpine AS installer
WORKDIR /app

# Copy lockfile and package manifests for layer caching
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile

# Copy source code and build NestJS application
COPY --from=pruner /app/out/full/ .
RUN bun run --filter=@audiofic/backend build

# 3. Production runner stage: Secure, lightweight Node 22 Alpine runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Security: Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy installed modules and built application
COPY --from=installer --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=nestjs:nodejs /app/apps/backend ./apps/backend

# Copy entrypoint script for optional automatic migrations on startup
COPY --chown=nestjs:nodejs apps/backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER nestjs
WORKDIR /app/apps/backend

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "dist/main.js"]
