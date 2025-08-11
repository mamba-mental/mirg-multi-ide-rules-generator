# Multi-IDE Rules Generator - Portainer Deployment Guide

## 🎯 Deployment Summary

The Multi-IDE Rules Generator is ready for deployment to your NAS server (192.168.86.97) using Portainer with the following optimized configuration:

### 📊 Application Architecture
- **Frontend**: React 18 + TypeScript + Vite 7.0.6 (Development Mode with HMR)
- **Backend**: Node.js 20 + Express + LangChain (Development Mode)
- **Vector Database**: Weaviate 1.25.0 (Standalone Mode)
- **Container Orchestration**: Docker Compose via Portainer
- **Network**: Custom bridge network (172.20.0.0/16)

### 🔌 Port Configuration (Conflict-Free)
- **Frontend**: `3011` → React dev server with hot reload
- **Backend**: `3121` → Node.js API server  
- **Weaviate**: `8092` → Vector database HTTP API
- **Weaviate gRPC**: `50052` → Vector database gRPC API

## 🚀 Quick Deployment Steps

### 1. Prepare Project Files
```bash
# Copy project to NAS
./copy-to-nas.sh admin 192.168.86.97
```

### 2. Deploy via Portainer Web Interface
1. Open: http://192.168.86.97:9000
2. Navigate: Stacks → Add stack
3. Stack Name: `multi-ide-rules-generator`
4. Method: Web editor
5. Copy content from `docker-compose.portainer.yml`
6. Add environment variables (see section below)
7. Deploy the stack

### 3. Verify Deployment
```bash
# Test all services
./verify-deployment.sh 192.168.86.97
```

## 🔧 Environment Variables

Add these variables in Portainer's "Environment Variables" section. **Replace placeholder values with your actual API keys**:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | ⚠️ **Required** | Claude AI API key (format: sk-ant-api03-...) |
| `OPENAI_API_KEY` | Optional | OpenAI API key (format: sk-proj-...) |
| `PERPLEXITY_API_KEY` | Optional | Perplexity AI API key (format: pplx-...) |
| `GOOGLE_API_KEY` | Optional | Google Gemini API key |
| `MISTRAL_API_KEY` | Optional | Mistral AI API key |
| `XAI_API_KEY` | Optional | xAI API key |
| `GROQ_API_KEY` | Optional | Groq API key |
| `OPENROUTER_API_KEY` | Optional | OpenRouter API key |
| `AZURE_OPENAI_API_KEY` | Optional | Azure OpenAI API key |
| `OLLAMA_API_KEY` | Optional | Ollama API key |
| `GITHUB_API_KEY` | Optional | GitHub API key for import/export features |

## 🏗️ Development Mode Features

### Frontend Development Optimizations
- **Hot Module Replacement (HMR)**: Instant code updates
- **File Watching**: Polling enabled for NAS file systems
- **Fast Refresh**: React state preservation during updates
- **Development Server**: Vite dev server with optimizations
- **PostCSS**: Automatic TailwindCSS v4 compatibility

### Backend Development Optimizations  
- **Auto-restart**: nodemon for automatic server restart
- **TypeScript**: Development compilation with ts-node-dev
- **Hot reload**: File watching for backend changes
- **Health checks**: Comprehensive service monitoring
- **Graceful degradation**: Fallback mode when vector store unavailable

### Security Features
- **Non-root execution**: All containers run as unprivileged users
- **Resource limits**: CPU and memory constraints applied
- **Network isolation**: Custom bridge network
- **Volume security**: Proper permission mapping (1000:1000)

## 📁 NAS Directory Structure

The deployment expects the following directory structure on your NAS:

```
/volume1/docker/projects/
├── rules-generator/
│   ├── frontend/          # React application source
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── backend/           # Node.js API source
│       ├── src/
│       └── package.json
└── knowledge-base/        # Shared knowledge base (optional)
```

## 🔍 Post-Deployment Verification

### Service Health Checks
```bash
# Backend health
curl http://192.168.86.97:3121/health

# Frontend accessibility  
curl http://192.168.86.97:3011

# Weaviate readiness
curl http://192.168.86.97:8092/v1/.well-known/ready
```

### Expected Response Examples

**Backend Health (Healthy):**
```json
{
  "status": "OK",
  "timestamp": "2024-08-11T00:00:00.000Z",
  "vectorStoreReady": true,
  "message": "All services operational"
}
```

**Backend Health (Fallback Mode):**
```json
{
  "status": "OK", 
  "timestamp": "2024-08-11T00:00:00.000Z",
  "vectorStoreReady": false,
  "message": "Vector store unavailable - fallback mode active"
}
```

### Container Status Verification
```bash
# SSH into NAS and check containers
ssh admin@192.168.86.97 'docker ps --filter name=mirg'
```

Expected output:
```
CONTAINER ID   IMAGE                            STATUS
xxxxx         semitechnologies/weaviate:1.25.0  Up (healthy)
xxxxx         node:20-alpine                    Up (healthy)  # backend
xxxxx         node:20-alpine                    Up (healthy)  # frontend
```

## 🌐 Access URLs

After successful deployment:

- **Frontend Application**: http://192.168.86.97:3011
- **Backend API**: http://192.168.86.97:3121  
- **API Health Check**: http://192.168.86.97:3121/health
- **Vector Database**: http://192.168.86.97:8092
- **Weaviate Console**: http://192.168.86.97:8092/v1/

## 🔧 Troubleshooting

### Common Issues

#### 1. Services Not Starting
- **Check Portainer logs** for specific error messages
- **Verify environment variables** are properly set in Portainer
- **Ensure NAS directories** exist and have correct permissions (1000:1000)

#### 2. Frontend Not Loading
- Verify Vite dev server started successfully in logs
- Check if port 3011 is accessible from your network
- Confirm `VITE_API_URL` environment variable points to correct backend URL

#### 3. Backend API Errors
- Check backend container logs for startup errors
- Verify Weaviate connectivity (backend will start in fallback mode if needed)
- Confirm required API keys are properly configured

#### 4. Vector Store Issues
- Weaviate container may take 30-60 seconds to fully initialize
- Check Weaviate logs for initialization progress
- Backend will operate in fallback mode if vector store unavailable

### Debug Commands

```bash
# View container logs
ssh admin@192.168.86.97 'docker logs mirg-frontend'
ssh admin@192.168.86.97 'docker logs mirg-backend' 
ssh admin@192.168.86.97 'docker logs mirg-weaviate'

# Check resource usage
ssh admin@192.168.86.97 'docker stats --filter name=mirg'

# Restart specific service
ssh admin@192.168.86.97 'docker restart mirg-frontend'
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Portainer accessible at http://192.168.86.97:9000
- [ ] Ports 3011, 3121, 8092 are available
- [ ] Project files copied to NAS using `copy-to-nas.sh`
- [ ] NAS directories have proper permissions (1000:1000)
- [ ] Environment file configured with actual API keys

### During Deployment  
- [ ] Stack created in Portainer with name: `multi-ide-rules-generator`
- [ ] Docker Compose configuration pasted correctly
- [ ] All environment variables added with real API keys
- [ ] Stack deployment completed without errors

### Post-Deployment
- [ ] All containers show "Up (healthy)" status
- [ ] Frontend accessible at http://192.168.86.97:3011
- [ ] Backend health check returns "OK" status
- [ ] Weaviate returns ready status (or backend shows fallback mode)
- [ ] Development features working (hot reload, file watching)

## 🔄 Updates and Maintenance

### Updating Code
1. Make changes to local project files
2. Run `./copy-to-nas.sh` to sync changes to NAS
3. In Portainer, restart affected containers or redeploy stack

### Adding New Environment Variables
1. Update local `.env` file
2. In Portainer, go to Stacks → multi-ide-rules-generator → Editor
3. Add new environment variables to the compose configuration
4. Update the stack

### Scaling Resources
The containers are configured with resource limits. To adjust:
1. Edit `docker-compose.portainer.yml`
2. Modify the `deploy.resources` sections
3. Update the stack in Portainer

---

## 📞 Support

If you encounter issues:

1. **Check the logs** using the debug commands above
2. **Verify network connectivity** to the NAS and between containers
3. **Confirm file permissions** on the NAS match expected values (1000:1000)
4. **Test individual components** using the verification script
5. **Review Portainer stack logs** for deployment-specific issues

The application is designed to be resilient and will gracefully handle various failure scenarios, including vector database unavailability.