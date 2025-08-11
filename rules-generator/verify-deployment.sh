#!/bin/bash

# Verify Multi-IDE Rules Generator deployment on NAS
# Usage: ./verify-deployment.sh [nas-ip]

set -e

NAS_IP="${1:-192.168.86.97}"
FRONTEND_URL="http://${NAS_IP}:3011"
BACKEND_URL="http://${NAS_IP}:3121"
WEAVIATE_URL="http://${NAS_IP}:8092"

echo "🔍 Verifying Multi-IDE Rules Generator Deployment"
echo "📍 NAS IP: ${NAS_IP}"
echo ""

# Function to test URL with timeout
test_url() {
    local url="$1"
    local name="$2"
    local timeout="${3:-10}"
    
    echo -n "Testing ${name} (${url})... "
    
    if curl -s -m "${timeout}" "${url}" > /dev/null 2>&1; then
        echo "✅ ONLINE"
        return 0
    else
        echo "❌ OFFLINE"
        return 1
    fi
}

# Test backend health endpoint
echo -n "Testing Backend Health (${BACKEND_URL}/health)... "
if response=$(curl -s -m 10 "${BACKEND_URL}/health" 2>/dev/null); then
    echo "✅ HEALTHY"
    echo "   Response: ${response}"
    
    # Parse the health status
    if echo "${response}" | grep -q '"status":"OK"'; then
        echo "   ✅ Status: OK"
    else
        echo "   ⚠️ Status: Unknown"
    fi
    
    if echo "${response}" | grep -q '"vectorStoreReady":true'; then
        echo "   ✅ Vector Store: Ready"
    elif echo "${response}" | grep -q '"vectorStoreReady":false'; then
        echo "   ⚠️ Vector Store: Not Ready (fallback mode)"
    else
        echo "   ❓ Vector Store: Status unknown"
    fi
else
    echo "❌ UNHEALTHY"
fi

echo ""

# Test Weaviate readiness
echo -n "Testing Weaviate Readiness (${WEAVIATE_URL}/v1/.well-known/ready)... "
if curl -s -m 10 "${WEAVIATE_URL}/v1/.well-known/ready" > /dev/null 2>&1; then
    echo "✅ READY"
else
    echo "❌ NOT READY"
fi

echo ""

# Test Frontend (simple connectivity test)
test_url "${FRONTEND_URL}" "Frontend"

echo ""
echo "🌐 Service URLs:"
echo "   • Frontend:  ${FRONTEND_URL}"
echo "   • Backend:   ${BACKEND_URL}"
echo "   • Backend Health: ${BACKEND_URL}/health"
echo "   • Weaviate:  ${WEAVIATE_URL}"
echo "   • Weaviate Health: ${WEAVIATE_URL}/v1/.well-known/ready"

echo ""
echo "📊 Container Status (if you have SSH access):"
echo "   ssh admin@${NAS_IP} 'docker ps --filter name=mirg'"

echo ""
echo "🔧 Troubleshooting:"
echo "   • Check Portainer logs for failed services"
echo "   • Verify environment variables are set"
echo "   • Ensure NAS directories have proper permissions (1000:1000)"
echo "   • Check that ports 3011, 3121, 8092 are not blocked"