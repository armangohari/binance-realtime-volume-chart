FROM node:20-alpine AS base

# Builder stage: Installs all deps, builds the app
FROM base AS builder
WORKDIR /app

# Copy package files and prisma schema first for better caching
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --verbose

# Copy the rest of the application code
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# --- Runner stage: Final production image --- 
FROM base AS runner
WORKDIR /app

# Install utilities needed in the final image
RUN apk add --no-cache wget postgresql-client

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files for production dependencies
COPY package.json package-lock.json ./

# Copy necessary artifacts from builder stage
COPY --from=builder /app/public ./public/
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static/
COPY --from=builder /app/node_modules ./node_modules

# Copy entrypoint script
COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set ownership for runtime files/cache
RUN mkdir -p .next && chown nextjs:nodejs .next

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run the entrypoint script
CMD ["/entrypoint.sh"]
