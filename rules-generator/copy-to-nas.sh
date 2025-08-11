#!/bin/bash

# Copy project files to NAS for Portainer deployment
# Usage: ./copy-to-nas.sh [nas-admin-user] [nas-ip]

set -e

NAS_USER="${1:-admin}"
NAS_IP="${2:-192.168.86.97}"
NAS_PROJECT_DIR="/volume1/docker/projects/rules-generator"

echo "🚀 Copying Multi-IDE Rules Generator to NAS"
echo "📍 Target: ${NAS_USER}@${NAS_IP}:${NAS_PROJECT_DIR}"
echo ""

# Check if rsync is available
if ! command -v rsync &> /dev/null; then
    echo "❌ rsync is not available. Please install it first:"
    echo "   Ubuntu/Debian: sudo apt install rsync"
    echo "   CentOS/RHEL: sudo yum install rsync"
    echo "   macOS: brew install rsync"
    exit 1
fi

# Test SSH connectivity
echo "🔍 Testing SSH connectivity..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes "${NAS_USER}@${NAS_IP}" exit 2>/dev/null; then
    echo "✅ SSH connection successful"
else
    echo "❌ Cannot connect via SSH to ${NAS_USER}@${NAS_IP}"
    echo "Please ensure:"
    echo "   • SSH is enabled on the NAS"
    echo "   • You have SSH access to the NAS"
    echo "   • Your SSH keys are set up or use: ssh-copy-id ${NAS_USER}@${NAS_IP}"
    exit 1
fi

# Create project directory on NAS
echo "📁 Creating project directory on NAS..."
ssh "${NAS_USER}@${NAS_IP}" "mkdir -p ${NAS_PROJECT_DIR}"
ssh "${NAS_USER}@${NAS_IP}" "mkdir -p /volume1/docker/projects/knowledge-base"

# Copy frontend files
echo "📂 Copying frontend files..."
rsync -av --progress --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
    ./frontend/ "${NAS_USER}@${NAS_IP}:${NAS_PROJECT_DIR}/frontend/"

# Copy backend files  
echo "📂 Copying backend files..."
rsync -av --progress --exclude 'node_modules' --exclude '.git' \
    ./backend/ "${NAS_USER}@${NAS_IP}:${NAS_PROJECT_DIR}/backend/"

# Set proper permissions
echo "🔧 Setting permissions..."
ssh "${NAS_USER}@${NAS_IP}" "chown -R 1000:1000 ${NAS_PROJECT_DIR}"

echo ""
echo "✅ Files copied successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Open Portainer: http://${NAS_IP}:9000"
echo "2. Create stack named: multi-ide-rules-generator"
echo "3. Use the docker-compose.portainer.yml configuration"
echo "4. Add environment variables with your actual API keys"
echo "5. Deploy the stack"
echo ""
echo "🌐 After deployment, services will be available at:"
echo "   • Frontend:  http://${NAS_IP}:3011"
echo "   • Backend:   http://${NAS_IP}:3121"
echo "   • Weaviate:  http://${NAS_IP}:8092"