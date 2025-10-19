#!/bin/bash

# Docker Development Environment Script
# Facilitates local development with Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="falador"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Check if .env file exists
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f ".env.docker.example" ]; then
            cp .env.docker.example .env
            print_success "Created .env from .env.docker.example"
            print_warning "Please review and update the .env file with your specific configuration."
        else
            print_error ".env.docker.example not found. Please create .env file manually."
            exit 1
        fi
    fi
}

# Build and start services
start_services() {
    print_status "Starting Docker services..."
    docker-compose -f $COMPOSE_FILE --project-name $PROJECT_NAME up -d

    print_status "Waiting for services to be healthy..."
    sleep 10

    # Check service health
    app_healthy=$(docker-compose -f $COMPOSE_FILE ps -q app | xargs docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")
    postgres_healthy=$(docker-compose -f $COMPOSE_FILE ps -q postgres | xargs docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")
    redis_healthy=$(docker-compose -f $COMPOSE_FILE ps -q redis | xargs docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")

    print_success "Services status:"
    echo "  App (API Gateway): $app_healthy"
    echo "  PostgreSQL: $postgres_healthy"
    echo "  Redis: $redis_healthy"

    if [ "$app_healthy" = "healthy" ] && [ "$postgres_healthy" = "healthy" ] && [ "$redis_healthy" = "healthy" ]; then
        print_success "All services are healthy and ready!"
        show_service_info
    else
        print_warning "Some services may still be starting. Check logs with: ./scripts/docker-dev.sh logs"
    fi
}

# Stop services
stop_services() {
    print_status "Stopping Docker services..."
    docker-compose -f $COMPOSE_FILE --project-name $PROJECT_NAME down
    print_success "Services stopped."
}

# Stop services and remove volumes
clean() {
    print_status "Stopping services and removing volumes..."
    docker-compose -f $COMPOSE_FILE --project-name $PROJECT_NAME down -v
    docker system prune -f
    print_success "Cleanup completed."
}

# Show service information
show_service_info() {
    echo ""
    echo -e "${BLUE}=== Service Information ===${NC}"
    echo -e "${GREEN}Application (API Gateway):${NC} http://localhost:3000"
    echo -e "${GREEN}PostgreSQL:${NC} localhost:5432"
    echo -e "${GREEN}Redis:${NC} localhost:6379"
    echo ""
    echo -e "${BLUE}=== Development Commands ===${NC}"
    echo "View logs:           ./scripts/docker-dev.sh logs"
    echo "Follow logs:         ./scripts/docker-dev.sh logs -f"
    echo "Access app shell:    ./scripts/docker-dev.sh shell app"
    echo "Access database:     ./scripts/docker-dev.sh db"
    echo "Stop services:       ./scripts/docker-dev.sh stop"
    echo "Clean everything:    ./scripts/docker-dev.sh clean"
    echo ""
}

# Show logs
show_logs() {
    docker-compose -f $COMPOSE_FILE --project-name $PROJECT_NAME logs "$@"
}

# Access service shell
access_shell() {
    service=${1:-app}
    print_status "Accessing shell for service: $service"
    docker-compose -f $COMPOSE_FILE --project-name $PROJECT_NAME exec $service /bin/bash
}

# Access database
access_database() {
    print_status "Connecting to PostgreSQL database..."
    docker-compose -f $COMPOSE_FILE --project-name $PROJECT_NAME exec postgres psql -U falador -d falador
}

# Build images
build_images() {
    print_status "Building Docker images..."
    docker-compose -f $COMPOSE_FILE --project-name $PROJECT_NAME build
    print_success "Images built successfully."
}

# Restart services
restart_services() {
    print_status "Restarting services..."
    docker-compose -f $COMPOSE_FILE --project-name $PROJECT_NAME restart
    print_success "Services restarted."
}

# Run tests in Docker
run_tests() {
    print_status "Running tests in Docker..."
    docker-compose -f $COMPOSE_FILE --project-name $PROJECT_NAME exec app bun test
}

# Show help
show_help() {
    echo -e "${BLUE}Docker Development Environment Script${NC}"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       Build and start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  build       Build Docker images"
    echo "  logs        Show service logs (add -f to follow)"
    echo "  shell [svc] Access shell for service (default: app)"
    echo "  db          Connect to PostgreSQL database"
    echo "  test        Run tests in Docker"
    echo "  clean       Stop services and remove volumes"
    echo "  status      Show service status"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start              # Start all services"
    echo "  $0 logs -f            # Follow logs"
    echo "  $0 shell app          # Access app shell"
    echo "  $0 shell postgres     # Access PostgreSQL shell"
    echo "  $0 db                 # Connect to database"
}

# Show status
show_status() {
    print_status "Service status:"
    docker-compose -f $COMPOSE_FILE --project-name $PROJECT_NAME ps
}

# Main script logic
case "${1:-help}" in
    start)
        check_docker
        check_env_file
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    build)
        check_docker
        build_images
        ;;
    logs)
        show_logs "${@:2}"
        ;;
    shell)
        access_shell "$2"
        ;;
    db)
        access_database
        ;;
    test)
        run_tests
        ;;
    clean)
        clean
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac