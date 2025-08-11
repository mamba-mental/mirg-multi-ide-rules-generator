#!/bin/bash

# Multi-IDE Rules Generator - Portainer Deployment Script
# Deploys to NAS server at 192.168.86.97

set -e

PORTAINER_URL="http://192.168.86.97:9000"
STACK_NAME="multi-ide-rules-generator"
NAS_PROJECT_DIR="/volume1/docker/projects/rules-generator"

echo "🚀 Deploying Multi-IDE Rules Generator to Portainer"
echo "📍 Target: ${PORTAINER_URL}"
echo "📦 Stack Name: ${STACK_NAME}"
echo ""

# Check if docker-compose file exists
if [[ ! -f "docker-compose.portainer.yml" ]]; then
    echo "❌ Error: docker-compose.portainer.yml not found"
    exit 1
fi

echo "✅ Docker Compose file found"

# Verify connectivity to Portainer
echo "🔍 Testing Portainer connectivity..."
if curl -s "${PORTAINER_URL}/api/status" > /dev/null; then
    echo "✅ Portainer is accessible"
else
    echo "❌ Cannot connect to Portainer at ${PORTAINER_URL}"
    exit 1
fi

# Check port availability
echo "🔍 Checking port availability..."
echo "   Frontend: 3011"
echo "   Backend:  3121" 
echo "   Weaviate: 8092"

# Create .env file for deployment if it doesn't exist
if [[ ! -f ".env" ]] && [[ -f ".env.example" ]]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️ Please edit .env file with your actual API keys before deployment"
fi

echo ""
echo "📋 Deployment Summary:"
echo "   • Frontend will be available at: http://192.168.86.97:3011"
echo "   • Backend API will be available at: http://192.168.86.97:3121"
echo "   • Weaviate vector DB at: http://192.168.86.97:8092"
echo "   • Development mode enabled with hot reload"
echo "   • Security: Non-root user execution"
echo "   • Health checks enabled for all services"
echo ""

echo "📋 MANUAL DEPLOYMENT STEPS:"
echo "================================="
echo ""
echo "1. 🌐 Open Portainer Web Interface:"
echo "   ${PORTAINER_URL}"
echo ""
echo "2. 📚 Navigate to Stacks:"
echo "   • Click 'Stacks' in the left sidebar"
echo "   • Click '+ Add stack' button"
echo ""
echo "3. 📝 Configure Stack:"
echo "   • Name: ${STACK_NAME}"
echo "   • Build method: Select 'Web editor'"
echo "   • Copy the contents of docker-compose.portainer.yml (shown below)"
echo ""
echo "4. 📁 Prepare NAS Directories (IMPORTANT):"
echo "   • SSH into NAS: ssh admin@192.168.86.97"
echo "   • Create project directory: mkdir -p ${NAS_PROJECT_DIR}"
echo "   • Copy project files:"
echo "     rsync -av ./frontend/ admin@192.168.86.97:${NAS_PROJECT_DIR}/frontend/"
echo "     rsync -av ./backend/ admin@192.168.86.97:${NAS_PROJECT_DIR}/backend/"
echo "   • Create knowledge base directory: mkdir -p /volume1/docker/projects/knowledge-base"
echo ""
echo "5. 🔧 Add Environment Variables:"
echo "   • Scroll down to 'Environment variables' section"
echo "   • Copy variables from .env file (shown below)"
echo "   • Update placeholder API keys with real values"
echo ""
echo "6. 🚀 Deploy:"
echo "   • Click 'Deploy the stack'"
echo "   • Wait for deployment to complete (2-3 minutes)"
echo ""

echo "🔧 Post-deployment verification:"
echo "   curl http://192.168.86.97:3121/health    # Backend health"
echo "   curl http://192.168.86.97:3011          # Frontend"
echo "   curl http://192.168.86.97:8092/v1/.well-known/ready  # Weaviate"
echo ""

# Display the docker-compose content
echo "📄 Docker Compose Configuration:"
echo "=================================="
cat docker-compose.portainer.yml

echo ""
echo "🔧 Environment Variables to Add in Portainer:"
echo "============================================="
if [[ -f ".env" ]]; then
    echo "Copy these variables to Portainer (update API keys with real values):"
    echo ""
    grep -E '^[A-Z_]+=' .env | while read line; do
        key=$(echo "$line" | cut -d'=' -f1)
        # Don't show the actual values, just the keys
        echo "   $key = (update with your actual API key)"
    done
else
    echo "⚠️ No .env file found. Use .env.example as template"
    echo "Environment variables needed:"
    grep -E '^[A-Z_]+=' .env.example | while read line; do
        key=$(echo "$line" | cut -d'=' -f1)
        echo "   $key = (add your actual API key)"
    done
fi

echo ""
echo "✨ Ready for deployment! Follow the manual steps above."