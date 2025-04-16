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
  echo "Generating Prisma client..."
  npx prisma generate
  echo "Prisma client generated!"
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
  echo "Migrations completed!"
else
  echo "Warning: DATABASE_URL is not set, skipping migrations and client generation"
fi

# Check if the compiled index.js exists in dist
if [ ! -f ./dist/worker/index.js ]; then
  echo "Error: dist/worker/index.js not found!"
  echo "Listing dist directory:"
  ls -la dist/
  echo "Listing dist/worker directory:"
  ls -la dist/worker/
  exit 1
fi

# Start the worker using the compiled file
echo "Starting worker process..."
exec node dist/worker/index.js 