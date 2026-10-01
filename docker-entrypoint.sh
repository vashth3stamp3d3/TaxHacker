#!/bin/sh
set -e

# Extract server part from DATABASE_URL (remove database name)
SERVER_URL=$(echo "$DATABASE_URL" | sed 's/\/[^/]*$//')

# Wait for database to be ready using psql and SERVER_URL
echo "Waiting for PostgreSQL server to be ready at $SERVER_URL..."
until psql "$SERVER_URL" -c '\q' >/dev/null 2>&1; do
  echo "PostgreSQL server is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL server is ready!"

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Idempotent: skip journals already posted. Do not fail the app if a period is closed.
if [ "${POST_2025_SHOP_BOOKS:-true}" != "false" ]; then
  echo "Posting 2025 shop books if they are not already on the ledger..."
  SKIP_EXISTING_JOURNALS=1 npx tsx scripts/post-2025-shop-books.ts --skip-existing \
    || echo "Shop books seed failed; continuing to start the app."
fi

echo "Starting: $*"
exec "$@"
