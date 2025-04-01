FROM node:20-alpine AS base

# Install Redis
RUN apk add --no-cache redis

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a Redis configuration
RUN echo "maxmemory 256mb" > /etc/redis.conf && \
    echo "maxmemory-policy allkeys-lru" >> /etc/redis.conf && \
    echo "daemonize yes" >> /etc/redis.conf && \
    echo "bind 127.0.0.1" >> /etc/redis.conf

# Add PM2 globally
RUN npm install -g pm2

# Add ts-node and tsconfig-paths for worker script
RUN npm install -g ts-node tsconfig-paths

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets from builder stage
COPY --from=builder /app/public ./public

# Copy PM2 ecosystem file
COPY --from=builder /app/ecosystem.config.js ./

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy source files needed for the worker
COPY --from=builder --chown=nextjs:nodejs /app/src/services ./src/services

# Create data directory for SQLite database and ensure it's writable
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV REDIS_URL "redis://localhost:6379"

# Create healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Command to run Redis and PM2 directly without a shell script
CMD ["sh", "-c", "redis-server /etc/redis.conf && pm2-runtime start ecosystem.config.js --env production"] 