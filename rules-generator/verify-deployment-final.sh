#!/bin/bash

# MIRG Deployment Verification Script
# Comprehensive health checks for all services

echo "🔍 MIRG Deployment Verification"
echo "==============================="
echo ""

# Service endpoints
FRONTEND_URL="http://192.168.86.97:3011"
BACKEND_URL="http://192.168.86.97:3121"
WEAVIATE_URL="http://192.168.86.97:8093"

# Health check function
check_service() {
    local name=$1
    local url=$2
    local expected_content=$3
    
    echo -n "Checking $name... "
    
    # Try to connect with timeout
    response=$(curl -s --connect-timeout 10 --max-time 30 "$url" 2>/dev/null)
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        if [ -n "$expected_content" ] && [[ "$response" == *"$expected_content"* ]]; then
            echo "✅ OK (Content verified)"
            return 0
        elif [ -z "$expected_content" ]; then
            echo "✅ OK"
            return 0
        else
            echo "⚠️ Responding but unexpected content"
            echo "     Response: ${response:0:100}..."
            return 1
        fi
    else
        echo "❌ Not responding (curl exit code: $exit_code)"
        return 1
    fi
}

# Main verification
echo "Service Health Checks"
echo "===================="

# Check Weaviate (should be fastest to start)
check_service "Weaviate Vector DB" "$WEAVIATE_URL/v1/.well-known/ready" '"status": "ok"'
WEAVIATE_OK=$?

# Check Backend (takes longer to compile TypeScript)
check_service "Backend API" "$BACKEND_URL/health" "status"
BACKEND_OK=$?

# Check Frontend (Vite dev server)
check_service "Frontend App" "$FRONTEND_URL" "<!doctype html"
FRONTEND_OK=$?

echo ""
echo "Detailed Service Information"
echo "============================"

# Weaviate detailed check
if [ $WEAVIATE_OK -eq 0 ]; then
    echo "📊 Weaviate Details:"
    weaviate_info=$(curl -s "$WEAVIATE_URL" 2>/dev/null)
    if [[ "$weaviate_info" == *"api v1"* ]]; then
        echo "   ✅ API endpoint responding"
        echo "   🔗 Access: $WEAVIATE_URL"
    fi
else
    echo "📊 Weaviate: Not accessible"
fi

# Backend detailed check  
if [ $BACKEND_OK -eq 0 ]; then
    echo "📊 Backend Details:"
    echo "   ✅ Health endpoint responding"
    echo "   🔗 API Base: $BACKEND_URL"
    echo "   🔗 Health: $BACKEND_URL/health"
else
    echo "📊 Backend: Not accessible (may still be starting up)"
    echo "   ⏳ TypeScript compilation can take 2-3 minutes"
fi

# Frontend detailed check
if [ $FRONTEND_OK -eq 0 ]; then
    echo "📊 Frontend Details:"
    echo "   ✅ Vite dev server responding"  
    echo "   🔗 Access: $FRONTEND_URL"
else
    echo "📊 Frontend: Not accessible"
fi

echo ""
echo "Container Status Check"
echo "====================="

# Try to get container information if docker is available
if command -v docker &> /dev/null; then
    echo "Docker containers with 'mirg' in name:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -i mirg || echo "No MIRG containers found locally"
else
    echo "Docker not available locally - check Portainer dashboard for container status"
fi

echo ""
echo "Summary Report"
echo "============="

total_services=3
working_services=$((3 - WEAVIATE_OK - BACKEND_OK - FRONTEND_OK))

if [ $working_services -eq $total_services ]; then
    echo "🎉 SUCCESS: All $total_services services are running!"
    echo ""
    echo "🌐 Access URLs:"
    echo "   - Frontend:    $FRONTEND_URL"
    echo "   - Backend API: $BACKEND_URL" 
    echo "   - Weaviate DB: $WEAVIATE_URL"
    echo ""
    echo "✅ MIRG deployment is fully operational!"
    
elif [ $working_services -gt 0 ]; then
    echo "⚠️ PARTIAL: $working_services/$total_services services running"
    echo ""
    echo "Services that may need more time to start:"
    [ $BACKEND_OK -ne 0 ] && echo "   - Backend (TypeScript compilation)"
    [ $FRONTEND_OK -ne 0 ] && echo "   - Frontend (Vite dev server)"
    [ $WEAVIATE_OK -ne 0 ] && echo "   - Weaviate (Vector database)"
    echo ""
    echo "⏳ Wait 2-3 minutes and run this script again"
    
else
    echo "❌ FAILED: No services are responding"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Check Portainer stack status: http://192.168.86.97:9000"
    echo "2. Review container logs for errors"
    echo "3. Verify NAS file paths exist: /volume1/docker/projects/rules-generator/"
    echo "4. Check available disk space and memory"
fi

echo ""