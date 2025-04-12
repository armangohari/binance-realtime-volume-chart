#!/bin/sh

set -e

echo "Starting Next.js app container..."

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

# Check if server.js exists
if [ ! -f ./server.js ]; then
  echo "Error: server.js not found!"
  ls -la
  exit 1
fi

# Start the Next.js app
echo "Starting Next.js server..."
exec node server.js 