#!/bin/bash

# Database initialization script for testing
# This script sets up the test database schema

set -e

echo "🗄️ Initializing test database..."

# Wait for PostgreSQL to be ready
until pg_isready -h localhost -p 5432 -U postgres; do
  echo "⏳ Waiting for PostgreSQL to start..."
  sleep 2
done

echo "✅ PostgreSQL is ready"

# Create database if it doesn't exist
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE IF NOT EXISTS falador_test;" || echo "Database already exists"

echo "🚀 Test database initialized successfully"