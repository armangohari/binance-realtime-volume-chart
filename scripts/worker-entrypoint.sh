#!/bin/sh

set -e

echo "Starting worker container..."

# Print environment information
echo "Environment:"
echo "NODE_ENV=$NODE_ENV"
echo "DATABASE_URL exists: $(if [ -n "$DATABASE_URL" ]; then echo "yes"; else echo "no"; fi)"
echo "BINANCE_WS_URL=$BINANCE_WS_URL"
echo "SYMBOLS=$SYMBOLS"

# Generate Prisma client if DATABASE_URL is set, but don't run migrations
if [ -n "$DATABASE_URL" ]; then
  echo "Generating Prisma client..."
  npx prisma generate
  echo "Prisma client generated!"
  
  # Wait for database to be ready and migrations to be applied (by app container)
  echo "Waiting for database and migrations to be ready..."
  npx prisma db pull --force > /dev/null 2>&1
  while [ $? -ne 0 ]; do
    echo "Database not ready yet, waiting..."
    sleep 5
    npx prisma db pull --force > /dev/null 2>&1
  done
  echo "Database is ready with schema applied!"
else
  echo "Warning: DATABASE_URL is not set, skipping client generation"
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