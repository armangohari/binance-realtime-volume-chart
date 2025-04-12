#!/bin/sh

set -e

echo "Starting Next.js app container..."

# Print environment information
echo "Environment:"
echo "NODE_ENV=$NODE_ENV"
echo "DATABASE_URL exists: $(if [ -n "$DATABASE_URL" ]; then echo "yes"; else echo "no"; fi)"

# Run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
  echo "Migrations completed!"
else
  echo "Warning: DATABASE_URL is not set, skipping migrations"
fi

# Check if server.js exists
if [ ! -f ./server.js ]; then
  echo "Error: server.js not found!"
  ls -la
  exit 1
fi

# Start the Next.js app
echo "Starting Next.js server..."
exec node server.js 