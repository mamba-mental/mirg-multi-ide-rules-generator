#!/bin/bash

# Direct deployment script for MIRG to NAS
# No Docker builds, no Git, just copy and run

NAS_IP="192.168.86.97"
NAS_USER="admin"  # Change this to your NAS username

echo "🚀 Direct MIRG Deployment to NAS"
echo "================================"

# Step 1: Build frontend locally
echo "📦 Building frontend..."
cd /mnt/w/projects/rules-generator/frontend
npm install
npm run build

# Step 2: Create deployment package
echo "📦 Creating deployment package..."
cd /mnt/w/projects
mkdir -p mirg-deploy
cp -r rules-generator/backend mirg-deploy/
cp -r rules-generator/frontend/dist mirg-deploy/frontend
cp -r rules-generator/docker-compose.yml mirg-deploy/

# Step 3: Create simple docker-compose for NAS
cat > mirg-deploy/docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: node:18-alpine
    container_name: mirg-backend
    working_dir: /app
    volumes:
      - ./backend:/app
    ports:
      - "3120:3100"
    environment:
      NODE_ENV: production
      PORT: 3100
      WEAVIATE_URL: http://weaviate:8080
    command: node dist/index.js
    restart: unless-stopped

  frontend:
    image: nginx:alpine
    container_name: mirg-frontend
    volumes:
      - ./frontend:/usr/share/nginx/html
    ports:
      - "3010:80"
    restart: unless-stopped

  weaviate:
    image: semitechnologies/weaviate:1.25.0
    container_name: mirg-weaviate
    ports:
      - "8091:8080"
    environment:
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
      DEFAULT_VECTORIZER_MODULE: 'none'
    volumes:
      - weaviate_data:/var/lib/weaviate
    restart: unless-stopped

volumes:
  weaviate_data:
EOF

echo "📦 Package ready in mirg-deploy/"
echo ""
echo "🔧 Manual Deployment Steps:"
echo "1. Copy mirg-deploy folder to your NAS (use file manager or SCP)"
echo "2. SSH into your NAS: ssh $NAS_USER@$NAS_IP"
echo "3. Navigate to the folder: cd /path/to/mirg-deploy"
echo "4. Run: docker-compose up -d"
echo ""
echo "Or use Portainer:"
echo "1. Upload the mirg-deploy folder to NAS"
echo "2. In Portainer, create new stack"
echo "3. Use 'Upload' method"
echo "4. Browse to docker-compose.yml in mirg-deploy folder"
echo "5. Deploy"