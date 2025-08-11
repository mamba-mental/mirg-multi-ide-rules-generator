#!/bin/bash

# Multi-IDE Rules Generator Frontend Deployment Script
# This script automates the deployment process for the frontend application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="rules-generator-frontend"
DOCKER_IMAGE="${PROJECT_NAME}:latest"
CONTAINER_NAME="${PROJECT_NAME}"
BACKEND_CONTAINER="rules-generator-backend"
NETWORK_NAME="rules-generator-network"

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log "Docker and Docker Compose are installed"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log "Node.js version: $NODE_VERSION"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    npm ci --only=production
    log "Dependencies installed successfully"
}

# Run tests
run_tests() {
    log "Running tests..."
    npm run test:run
    
    if [ $? -eq 0 ]; then
        log "All tests passed"
    else
        error "Tests failed. Aborting deployment."
        exit 1
    fi
}

# Build the application
build_application() {
    log "Building the application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        log "Application built successfully"
    else
        error "Build failed. Aborting deployment."
        exit 1
    fi
}

# Build Docker image
build_docker_image() {
    log "Building Docker image..."
    docker build -t $DOCKER_IMAGE .
    
    if [ $? -eq 0 ]; then
        log "Docker image built successfully"
    else
        error "Docker image build failed. Aborting deployment."
        exit 1
    fi
}

# Stop and remove existing container
stop_existing_container() {
    if docker ps -a --format 'table {{.Names}}' | grep -q "$CONTAINER_NAME"; then
        log "Stopping existing container..."
        docker stop $CONTAINER_NAME || true
        docker rm $CONTAINER_NAME || true
        log "Existing container stopped and removed"
    fi
}

# Create Docker network if it doesn't exist
create_network() {
    if ! docker network ls --format 'table {{.Name}}' | grep -q "$NETWORK_NAME"; then
        log "Creating Docker network..."
        docker network create $NETWORK_NAME
        log "Docker network created"
    fi
}

# Run the container
run_container() {
    log "Starting container..."
    docker run -d \
        --name $CONTAINER_NAME \
        --network $NETWORK_NAME \
        -p 8080:8080 \
        -e NODE_ENV=production \
        -e VITE_API_URL=http://$BACKEND_CONTAINER:3120 \
        -e VITE_APP_ENV=production \
        --restart unless-stopped \
        $DOCKER_IMAGE
    
    if [ $? -eq 0 ]; then
        log "Container started successfully"
    else
        error "Failed to start container"
        exit 1
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:8080/health > /dev/null 2>&1; then
            log "Health check passed"
            return 0
        fi
        
        info "Health check attempt $attempt/$max_attempts failed. Retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Deploy using Docker Compose
deploy_with_compose() {
    log "Deploying with Docker Compose..."
    
    # Stop existing services
    docker-compose down || true
    
    # Build and start services
    docker-compose up -d --build
    
    if [ $? -eq 0 ]; then
        log "Docker Compose deployment successful"
    else
        error "Docker Compose deployment failed"
        exit 1
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    # Remove dangling images
    docker image prune -f || true
    log "Cleanup completed"
}

# Show deployment status
show_status() {
    log "Deployment Status:"
    echo "----------------------------------------"
    docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo "----------------------------------------"
    info "Application is accessible at: http://localhost:8080"
    info "Health check endpoint: http://localhost:8080/health"
}

# Main deployment function
deploy() {
    log "Starting deployment of $PROJECT_NAME"
    
    # Pre-deployment checks
    check_docker
    check_node
    
    # Build process
    install_dependencies
    run_tests
    build_application
    build_docker_image
    
    # Deployment
    stop_existing_container
    create_network
    run_container
    
    # Post-deployment
    health_check
    cleanup
    show_status
    
    log "Deployment completed successfully!"
}

# Deploy with Docker Compose
deploy_compose() {
    log "Starting Docker Compose deployment of $PROJECT_NAME"
    
    # Pre-deployment checks
    check_docker
    check_node
    
    # Build process
    install_dependencies
    run_tests
    build_application
    
    # Deployment
    deploy_with_compose
    
    # Post-deployment
    sleep 10  # Wait for services to start
    health_check
    cleanup
    show_status
    
    log "Docker Compose deployment completed successfully!"
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -c, --compose       Deploy using Docker Compose (default: single container)"
    echo "  -t, --test-only     Only run tests, don't deploy"
    echo "  -b, --build-only    Only build the application, don't deploy"
    echo "  -s, --status        Show deployment status"
    echo "  -l, --logs          Show container logs"
    echo "  -d, --down          Stop and remove containers"
    echo ""
    echo "Examples:"
    echo "  $0                  Deploy using single container"
    echo "  $0 -c              Deploy using Docker Compose"
    echo "  $0 -t              Run tests only"
    echo "  $0 -s              Show deployment status"
}

# Show logs
show_logs() {
    if docker ps --format 'table {{.Names}}' | grep -q "$CONTAINER_NAME"; then
        docker logs -f $CONTAINER_NAME
    else
        error "Container $CONTAINER_NAME is not running"
    fi
}

# Stop deployment
stop_deployment() {
    log "Stopping deployment..."
    
    # Stop single container
    if docker ps -a --format 'table {{.Names}}' | grep -q "$CONTAINER_NAME"; then
        docker stop $CONTAINER_NAME
        docker rm $CONTAINER_NAME
        log "Container stopped and removed"
    fi
    
    # Stop Docker Compose services
    if [ -f "docker-compose.yml" ]; then
        docker-compose down
        log "Docker Compose services stopped"
    fi
}

# Parse command line arguments
USE_COMPOSE=false
TEST_ONLY=false
BUILD_ONLY=false
SHOW_STATUS=false
SHOW_LOGS=false
STOP_DEPLOYMENT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -c|--compose)
            USE_COMPOSE=true
            shift
            ;;
        -t|--test-only)
            TEST_ONLY=true
            shift
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -s|--status)
            SHOW_STATUS=true
            shift
            ;;
        -l|--logs)
            SHOW_LOGS=true
            shift
            ;;
        -d|--down)
            STOP_DEPLOYMENT=true
            shift
            ;;
        *)
            error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main script logic
main() {
    if [ "$SHOW_STATUS" = true ]; then
        show_status
        exit 0
    fi
    
    if [ "$SHOW_LOGS" = true ]; then
        show_logs
        exit 0
    fi
    
    if [ "$STOP_DEPLOYMENT" = true ]; then
        stop_deployment
        exit 0
    fi
    
    if [ "$TEST_ONLY" = true ]; then
        check_docker
        check_node
        install_dependencies
        run_tests
        log "Tests completed successfully"
        exit 0
    fi
    
    if [ "$BUILD_ONLY" = true ]; then
        check_docker
        check_node
        install_dependencies
        run_tests
        build_application
        build_docker_image
        log "Build completed successfully"
        exit 0
    fi
    
    if [ "$USE_COMPOSE" = true ]; then
        deploy_compose
    else
        deploy
    fi
}

# Run main function
main "$@"