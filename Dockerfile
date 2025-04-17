FROM node:20-alpine AS base

# Add Alpine repository mirror for better reliability
RUN echo 'https://dl-cdn.alpinelinux.org/alpine/v3.19/main/' > /etc/apk/repositories && \
    echo 'https://dl-cdn.alpinelinux.org/alpine/v3.19/community/' >> /etc/apk/repositories && \
    apk update

# Builder stage: Use pre-built node_modules and builds the app
FROM base AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all application code
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client (no need to re-install dependencies)
RUN npx prisma generate

# Build Next.js
RUN npm run build

# --- Runner stage: Final production image --- 
FROM base AS runner
WORKDIR /app

# Install utilities needed in the final image
RUN apk add --no-cache postgresql wget

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary artifacts from builder stage
COPY --from=builder /app/public ./public/
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static/
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

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
