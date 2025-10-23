#!/bin/bash
set -e

echo "🚀 Setting up test database..."

# Load test environment
export NODE_ENV=test
if [ -f ".env.test" ]; then
  source .env.test
else
  echo "⚠️ .env.test file not found. Using environment variables."
fi

# Start test database
echo "📦 Starting test database container..."
docker-compose -f docker-compose.test.yml up -d test-db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose -f docker-compose.test.yml exec -T test-db pg_isready -U test_user -d falador_test; do
  echo "Waiting for postgres..."
  sleep 2
done

echo "✅ Test database is ready!"

# Note: Database migrations would be run here if Prisma schema exists
# echo "🔄 Running database migrations..."
# export DATABASE_URL="$TEST_DATABASE_URL"
# bun run migrate:test

echo "🎉 Test database setup complete!"
echo "📍 Database URL: ${TEST_DATABASE_URL:-postgresql://test_user:test_password@localhost:5433/falador_test}"
echo "🌐 API URL: ${TEST_API_URL:-http://localhost:3001}"