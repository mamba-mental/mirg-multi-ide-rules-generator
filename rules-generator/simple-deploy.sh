#!/bin/bash

# Simple MIRG Deployment Script for Portainer
# This script provides instructions for manual deployment

set -e

PORTAINER_URL="http://192.168.86.97:9000"
STACK_NAME="mirg"
COMPOSE_FILE="docker-compose.portainer-fixed.yml"

echo "🚀 MIRG Portainer Deployment Guide"
echo "=================================="
echo ""

# Check prerequisites
echo "🔍 Pre-deployment Checks"
echo "========================"

# Check Portainer accessibility
echo "Checking Portainer accessibility..."
if curl -s "$PORTAINER_URL/api/status" > /dev/null; then
    echo "✅ Portainer is accessible at $PORTAINER_URL"
else
    echo "❌ Error: Cannot access Portainer at $PORTAINER_URL"
    exit 1
fi

# Check compose file exists
if [ -f "$COMPOSE_FILE" ]; then
    echo "✅ Docker Compose file found: $COMPOSE_FILE"
else
    echo "❌ Error: Compose file not found: $COMPOSE_FILE"
    exit 1
fi

# Check port availability
echo ""
echo "🔌 Port Availability Check"
echo "=========================="

check_port() {
    local port=$1
    if curl -s --connect-timeout 2 "http://192.168.86.97:$port" > /dev/null 2>&1; then
        echo "⚠️  Port $port is in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

PORTS_OK=true
for port in 3011 3121 8093; do
    if ! check_port $port; then
        PORTS_OK=false
    fi
done

if [ "$PORTS_OK" = false ]; then
    echo ""
    echo "⚠️  Some ports are already in use. This may be from a previous deployment."
    echo "   You can either:"
    echo "   1. Stop the existing services"
    echo "   2. Use different ports in the compose file"
    echo "   3. Continue anyway (may cause conflicts)"
    echo ""
fi

echo ""
echo "📋 Deployment Instructions"
echo "=========================="
echo ""
echo "1. Open Portainer in your browser:"
echo "   $PORTAINER_URL"
echo ""
echo "2. Navigate to: Stacks → Add Stack"
echo ""
echo "3. Stack Configuration:"
echo "   - Name: $STACK_NAME"
echo "   - Build method: Web editor"
echo ""
echo "4. Copy and paste the following Docker Compose content:"
echo ""
echo "--- DOCKER COMPOSE CONTENT (COPY FROM HERE) ---"
cat "$COMPOSE_FILE"
echo "--- END OF DOCKER COMPOSE CONTENT ---"
echo ""
echo "5. Environment Variables (if needed):"
echo "   Add any API keys as environment variables in Portainer:"
echo "   - OPENAI_API_KEY"
echo "   - ANTHROPIC_API_KEY"
echo "   - PERPLEXITY_API_KEY"
echo "   - etc."
echo ""
echo "6. Deploy the stack by clicking 'Deploy the stack'"
echo ""
echo "7. Monitor the deployment in the stack logs"
echo ""

echo "🎯 Expected URLs After Deployment"
echo "================================="
echo "- Frontend:    http://192.168.86.97:3011"
echo "- Backend API: http://192.168.86.97:3121"
echo "- Weaviate:    http://192.168.86.97:8093"
echo ""

echo "✅ Verification Commands"
echo "========================"
echo "After deployment, run these commands to verify:"
echo ""
echo "# Check Weaviate health"
echo "curl http://192.168.86.97:8093/v1/.well-known/ready"
echo ""
echo "# Check Backend health (may take a few minutes to start)"
echo "curl http://192.168.86.97:3121/health"
echo ""
echo "# Check Frontend (should return HTML)"
echo "curl -s http://192.168.86.97:3011 | head -5"
echo ""

echo "🔄 Troubleshooting"
echo "=================="
echo "If services fail to start:"
echo "1. Check Portainer stack logs"
echo "2. Ensure NAS paths exist: /volume1/docker/projects/rules-generator/"
echo "3. Verify Dockerfiles are present:"
echo "   - /volume1/docker/projects/rules-generator/backend/Dockerfile.portainer"
echo "   - /volume1/docker/projects/rules-generator/frontend/Dockerfile.portainer"
echo "4. Check available disk space and memory"
echo ""

echo "📁 Required Files on NAS"
echo "========================"
echo "Ensure these files are copied to the NAS server:"
echo "1. Backend Dockerfile: backend/Dockerfile.portainer"
echo "2. Frontend Dockerfile: frontend/Dockerfile.portainer"
echo "3. All source code in respective directories"
echo ""

echo "Ready for deployment! Open $PORTAINER_URL to continue."