#!/bin/sh

set -e

echo "Starting worker container..."

# Print environment information
echo "Environment:"
echo "NODE_ENV=$NODE_ENV"
echo "DATABASE_URL exists: $(if [ -n "$DATABASE_URL" ]; then echo "yes"; else echo "no"; fi)"
echo "BINANCE_WS_URL=$BINANCE_WS_URL"
echo "SYMBOLS=$SYMBOLS"

# Run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
  echo "Migrations completed!"
else
  echo "Warning: DATABASE_URL is not set, skipping migrations"
fi

# Check if index.js exists
if [ ! -f ./worker/index.js ]; then
  echo "Error: worker/index.js not found!"
  ls -la worker/
  exit 1
fi

# Start the worker
echo "Starting worker process..."
exec node worker/index.js 