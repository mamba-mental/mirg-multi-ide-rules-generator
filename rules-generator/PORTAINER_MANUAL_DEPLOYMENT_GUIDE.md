# MIRG Stack - Manual Portainer Deployment Guide

## 🎯 Quick Deployment Steps

Since API authentication is required, follow these steps to deploy via Portainer web interface:

### 1. Access Portainer Dashboard
- Navigate to: **http://192.168.86.97:9000**
- Login with your admin credentials

### 2. Create New Stack
1. Click **"Stacks"** in the left sidebar
2. Click **"+ Add stack"** button
3. Enter stack name: **`mirg`**

### 3. Deploy Using Web Editor
1. Select **"Web editor"** tab
2. Copy the entire content of `docker-compose.portainer-fixed.yml` into the editor
3. Scroll down and click **"Deploy the stack"**

### 4. Monitor Deployment
- Watch the deployment progress in Portainer
- Expected deployment time: 3-5 minutes
- Services will start in dependency order: Weaviate → Backend → Frontend

## 📋 Complete Docker Compose Content

```yaml
services:
  weaviate:
    image: semitechnologies/weaviate:1.25.0
    container_name: mirg-weaviate
    ports:
      - "8093:8080"
      - "50054:50051"
    environment:
      QUERY_DEFAULTS_LIMIT: 25
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
      DEFAULT_VECTORIZER_MODULE: 'none'
      ENABLE_MODULES: ''
      CLUSTER_HOSTNAME: 'node1'
      CLUSTER_ADVERTISE_ADDR: '127.0.0.1'
      CLUSTER_GOSSIP_BIND_PORT: '7946'
      CLUSTER_DATA_BIND_PORT: '7947'
      STANDALONE_MODE: 'true'
      DISABLE_GOSSIP: 'true'
    volumes:
      - weaviate_data:/var/lib/weaviate
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/v1/.well-known/ready"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M
    networks:
      - mirg-network

  backend:
    build:
      context: /volume1/docker/projects/rules-generator/backend
      dockerfile: Dockerfile.portainer
    container_name: mirg-backend
    ports:
      - "3121:3100"
    environment:
      - NODE_ENV=development
      - WEAVIATE_URL=http://weaviate:8080
      - PORT=3100
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
      - PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY:-}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY:-}
      - MISTRAL_API_KEY=${MISTRAL_API_KEY:-}
      - XAI_API_KEY=${XAI_API_KEY:-}
      - GROQ_API_KEY=${GROQ_API_KEY:-}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-}
      - AZURE_OPENAI_API_KEY=${AZURE_OPENAI_API_KEY:-}
      - OLLAMA_API_KEY=${OLLAMA_API_KEY:-}
      - GITHUB_API_KEY=${GITHUB_API_KEY:-}
    depends_on:
      weaviate:
        condition: service_healthy
    volumes:
      # Mount source code for development (read-only for security in production)
      - /volume1/docker/projects/rules-generator/backend/src:/app/src:ro
      - /volume1/docker/projects/rules-generator/backend/tsconfig.json:/app/tsconfig.json:ro
      # Mount knowledge base as read-only
      - /volume1/docker/projects/knowledge-base:/app/knowledge-base:ro
      # Use named volumes for node_modules and dist to prevent permission issues
      - backend_node_modules:/app/node_modules
      - backend_dist:/app/dist
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 256M
    networks:
      - mirg-network

  frontend:
    build:
      context: /volume1/docker/projects/rules-generator/frontend
      dockerfile: Dockerfile.portainer
    container_name: mirg-frontend
    ports:
      - "3011:5173"
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://192.168.86.97:3121
      - VITE_DEV_MODE=true
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
      - FAST_REFRESH=true
    depends_on:
      - backend
    volumes:
      # Mount source code for development with file watching
      - /volume1/docker/projects/rules-generator/frontend/src:/app/src:ro
      - /volume1/docker/projects/rules-generator/frontend/public:/app/public:ro
      - /volume1/docker/projects/rules-generator/frontend/index.html:/app/index.html:ro
      - /volume1/docker/projects/rules-generator/frontend/vite.config.ts:/app/vite.config.ts:ro
      - /volume1/docker/projects/rules-generator/frontend/tailwind.config.js:/app/tailwind.config.js:ro
      - /volume1/docker/projects/rules-generator/frontend/tsconfig.json:/app/tsconfig.json:ro
      - /volume1/docker/projects/rules-generator/frontend/tsconfig.node.json:/app/tsconfig.node.json:ro
      # Use named volumes for node_modules and dist to prevent permission issues
      - frontend_node_modules:/app/node_modules
      - frontend_dist:/app/dist
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 256M
    networks:
      - mirg-network

volumes:
  weaviate_data:
    driver: local
  backend_node_modules:
    driver: local
  backend_dist:
    driver: local
  frontend_node_modules:
    driver: local
  frontend_dist:
    driver: local

networks:
  mirg-network:
    driver: bridge
```

## 🌐 Expected Service URLs After Deployment

- **Frontend Application**: http://192.168.86.97:3011
- **Backend API**: http://192.168.86.97:3121
- **Backend Health Check**: http://192.168.86.97:3121/health
- **Weaviate Vector Database**: http://192.168.86.97:8093
- **Weaviate Health Check**: http://192.168.86.97:8093/v1/.well-known/ready

## ⏱️ Deployment Timeline

1. **Stack Creation** (30 seconds): Portainer validates and starts deployment
2. **Weaviate Startup** (30-60 seconds): Vector database initialization
3. **Backend Build & Start** (2-3 minutes): TypeScript compilation and Node.js startup
4. **Frontend Build & Start** (1-2 minutes): Vite development server startup
5. **Health Checks** (30 seconds): All services reach healthy state

**Total Expected Time**: 4-6 minutes for full deployment

## 🔧 Troubleshooting

### If Deployment Fails:
1. Check **Stack Logs** in Portainer dashboard
2. Verify NAS file paths exist: `/volume1/docker/projects/rules-generator/`
3. Ensure sufficient disk space (2GB+ required)
4. Check memory availability (4GB+ recommended)

### If Services Don't Start:
1. **Weaviate Issues**: Check if port 8093 is available
2. **Backend Issues**: TypeScript compilation may take longer on first run
3. **Frontend Issues**: Verify Vite can access source files

### Common Solutions:
- **Port Conflicts**: Verify ports 3011, 3121, 8093 are not in use
- **Permission Issues**: Ensure Docker can access `/volume1/docker/projects/`
- **Build Failures**: Check Docker build logs in Portainer

## ✅ Verification Commands

After deployment, run this script to verify all services:

```bash
./verify-deployment-final.sh
```

## 🎉 Success Indicators

- All three containers show "running" status in Portainer
- Frontend loads at http://192.168.86.97:3011
- Backend health endpoint returns success at http://192.168.86.97:3121/health  
- Weaviate ready endpoint returns success at http://192.168.86.97:8093/v1/.well-known/ready