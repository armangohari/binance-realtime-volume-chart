#!/bin/sh
set -e

# Extract database connection info from DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set"
    exit 1
fi

# Extract host and port from DATABASE_URL
# Format: postgresql://username:password@host:port/dbname
DB_HOST=$(echo $DATABASE_URL | sed -E 's/.*@([^:]+):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed -E 's/.*:([0-9]+)\/.*/\1/')

echo "Waiting for database to be ready..."
# Wait for database to be ready (up to 60 seconds)
for i in $(seq 1 12); do
    if pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
        echo "Database is ready!"
        break
    fi
    
    echo "Database not ready yet, retrying in 5 seconds..."
    sleep 5
    
    if [ $i -eq 12 ]; then
        echo "Database connection timed out after 60 seconds"
        exit 1
    fi
done

# Check for available disk space
echo "Checking disk space..."
FREE_DISK=$(df -k /tmp | tail -1 | awk '{print $4}')
if [ $FREE_DISK -lt 102400 ]; then  # Less than 100MB
    echo "WARNING: Low disk space on /tmp: $FREE_DISK KB"
fi

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# If migrations fail, try to push the schema
if [ $? -ne 0 ]; then
    echo "Migration failed, trying to push schema..."
    npx prisma db push
fi

# Generate Prisma client if needed
if [ ! -d "node_modules/.prisma/client" ]; then
    echo "Generating Prisma client..."
    npx prisma generate
fi

# Start the application
echo "Starting application..."
node server.js 