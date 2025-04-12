#!/bin/sh

set -e

echo "Starting worker container..."

# Wait for the database to be ready
echo "Waiting for database to be available..."
/wait-for-it.sh db 5432
echo "Database is available!"

# Run migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Migrations completed!"

# Print environment information
echo "Environment:"
echo "NODE_ENV=$NODE_ENV"
echo "DATABASE_URL=$DATABASE_URL"
echo "BINANCE_WS_URL=$BINANCE_WS_URL"
echo "SYMBOLS=$SYMBOLS"

# Check if index.js exists
if [ ! -f ./worker/index.js ]; then
  echo "Error: worker/index.js not found!"
  ls -la worker/
  exit 1
fi

# Start the worker
echo "Starting worker process..."
exec node worker/index.js 