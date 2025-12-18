#!/bin/sh

# Run database migrations
echo "Running database migrations..."
node scripts/migrate.js

# Check if migrations succeeded
if [ $? -eq 0 ]; then
    echo "Migrations completed successfully!"
else
    echo "Migrations failed!"
    exit 1
fi

# Start the Next.js application
echo "Starting Next.js application..."
exec npm run start
