#!/bin/bash
set -e

echo "🧹 Tearing down test database..."

# Stop and remove test database container
docker-compose -f docker-compose.test.yml down -v

echo "✅ Test database teardown complete!"