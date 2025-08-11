#!/bin/bash

# MIRG Portainer Deployment Script
# This script prepares and deploys the Multi-IDE Rules Generator stack to Portainer

set -e  # Exit on any error

PORTAINER_URL="http://192.168.86.97:9000"
STACK_NAME="mirg"
NAS_PROJECT_PATH="/volume1/docker/projects/rules-generator"

echo "🚀 MIRG Portainer Deployment Script"
echo "========================================"

# Function to check if a command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "❌ Error: $1 is not installed or not in PATH"
        exit 1
    fi
}

# Function to check if Portainer is accessible
check_portainer() {
    echo "🔍 Checking Portainer accessibility..."
    if curl -s "$PORTAINER_URL/api/status" > /dev/null; then
        echo "✅ Portainer is accessible at $PORTAINER_URL"
    else
        echo "❌ Error: Cannot access Portainer at $PORTAINER_URL"
        echo "Please ensure Portainer is running and accessible from this machine"
        exit 1
    fi
}

# Function to check if NAS paths exist
check_nas_paths() {
    echo "🔍 Checking NAS project paths..."
    
    # Check if we can access the NAS project directory (if running on NAS)
    if [ -d "$NAS_PROJECT_PATH" ]; then
        echo "✅ NAS project path exists: $NAS_PROJECT_PATH"
        
        # Check required files
        if [ -f "$NAS_PROJECT_PATH/backend/Dockerfile.portainer" ]; then
            echo "✅ Backend Dockerfile found"
        else
            echo "❌ Error: Backend Dockerfile.portainer not found"
            echo "Please ensure the Dockerfile.portainer files are copied to the NAS"
            exit 1
        fi
        
        if [ -f "$NAS_PROJECT_PATH/frontend/Dockerfile.portainer" ]; then
            echo "✅ Frontend Dockerfile found"
        else
            echo "❌ Error: Frontend Dockerfile.portainer not found"
            echo "Please ensure the Dockerfile.portainer files are copied to the NAS"
            exit 1
        fi
    else
        echo "⚠️  Warning: Cannot access NAS project path directly"
        echo "Please ensure the following files are present on the NAS:"
        echo "  - $NAS_PROJECT_PATH/backend/Dockerfile.portainer"
        echo "  - $NAS_PROJECT_PATH/frontend/Dockerfile.portainer"
        echo ""
        read -p "Press Enter to continue if files are in place, or Ctrl+C to abort..."
    fi
}

# Function to check for port conflicts
check_ports() {
    echo "🔍 Checking for port conflicts..."
    
    PORTS=("3011" "3121" "8092")
    for port in "${PORTS[@]}"; do
        if ss -tuln | grep -q ":$port "; then
            echo "⚠️  Warning: Port $port appears to be in use"
        else
            echo "✅ Port $port is available"
        fi
    done
}

# Function to create deployment summary
create_deployment_summary() {
    echo ""
    echo "📋 Deployment Summary"
    echo "===================="
    echo "Stack Name: $STACK_NAME"
    echo "Services:"
    echo "  - Weaviate:  Port 8092 (Vector Database)"
    echo "  - Backend:   Port 3121 (Node.js/Express API)"
    echo "  - Frontend:  Port 3011 (React/Vite App)"
    echo ""
    echo "Key Fixes Applied:"
    echo "  ✅ Custom Dockerfiles eliminate sudo/su dependency"
    echo "  ✅ Proper file permissions set at build time"
    echo "  ✅ Named volumes for node_modules prevent permission issues"
    echo "  ✅ Read-only source mounts for development"
    echo "  ✅ Alpine containers with necessary utilities pre-installed"
    echo ""
    echo "Access URLs after deployment:"
    echo "  - Frontend: http://192.168.86.97:3011"
    echo "  - Backend API: http://192.168.86.97:3121"
    echo "  - Weaviate: http://192.168.86.97:8092"
}

# Function to create rollback instructions
create_rollback_instructions() {
    echo ""
    echo "🔄 Rollback Instructions"
    echo "========================"
    echo "If deployment fails or needs to be rolled back:"
    echo "1. In Portainer, go to Stacks and remove the '$STACK_NAME' stack"
    echo "2. Clean up volumes if needed:"
    echo "   docker volume rm ${STACK_NAME}_weaviate_data"
    echo "   docker volume rm ${STACK_NAME}_backend_node_modules"
    echo "   docker volume rm ${STACK_NAME}_frontend_node_modules"
    echo "   docker volume rm ${STACK_NAME}_backend_dist"
    echo "   docker volume rm ${STACK_NAME}_frontend_dist"
    echo "3. Remove any custom images:"
    echo "   docker rmi ${STACK_NAME}_backend"
    echo "   docker rmi ${STACK_NAME}_frontend"
}

# Function to provide post-deployment verification steps
create_verification_steps() {
    echo ""
    echo "✅ Post-Deployment Verification"
    echo "==============================="
    echo "After deployment, verify the following:"
    echo ""
    echo "1. Check Portainer Stack Status:"
    echo "   - All services should show as 'running'"
    echo "   - No restart loops or error states"
    echo ""
    echo "2. Test Service Endpoints:"
    echo "   curl http://192.168.86.97:8092/v1/.well-known/ready  # Weaviate health"
    echo "   curl http://192.168.86.97:3121/health               # Backend health"
    echo "   curl http://192.168.86.97:3011                      # Frontend app"
    echo ""
    echo "3. Check Container Logs:"
    echo "   - Backend: Should show 'ts-node-dev' starting successfully"
    echo "   - Frontend: Should show Vite dev server running on port 5173"
    echo "   - Weaviate: Should show successful startup and ready state"
    echo ""
    echo "4. Verify Development Features:"
    echo "   - Hot Module Replacement (HMR) for frontend changes"
    echo "   - Auto-restart for backend changes"
    echo "   - Proper API connectivity between services"
}

# Main deployment function
main() {
    echo "🔧 Pre-deployment Checks"
    echo "========================"
    
    # Check prerequisites
    check_command "curl"
    check_command "ss"
    
    # Perform checks
    check_portainer
    check_nas_paths
    check_ports
    
    # Create summaries
    create_deployment_summary
    create_rollback_instructions
    create_verification_steps
    
    echo ""
    echo "🎯 Ready for Deployment"
    echo "======================="
    echo "All pre-deployment checks completed successfully!"
    echo ""
    echo "Next Steps:"
    echo "1. Copy the docker-compose.portainer-fixed.yml to your clipboard"
    echo "2. In Portainer, create a new stack named '$STACK_NAME'"
    echo "3. Paste the docker-compose content"
    echo "4. Add any required environment variables"
    echo "5. Deploy the stack"
    echo "6. Monitor the deployment and run verification tests"
    echo ""
    echo "📝 Files ready for deployment:"
    echo "   - docker-compose.portainer-fixed.yml (Updated compose file)"
    echo "   - backend/Dockerfile.portainer (Custom backend image)"
    echo "   - frontend/Dockerfile.portainer (Custom frontend image)"
}

# Run main function
main "$@"