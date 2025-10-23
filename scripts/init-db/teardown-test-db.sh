#!/bin/bash

# Database cleanup script for testing
# This script cleans up the test database

set -e

echo "🧹 Cleaning up test database..."

# Drop test database if it exists
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS falador_test;" || echo "Database doesn't exist or already dropped"

echo "✅ Test database cleanup completed"