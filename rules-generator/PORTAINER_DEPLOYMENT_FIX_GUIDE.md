# MIRG Stack Portainer Deployment Fix Guide

## 🚨 Issue Resolution: "Error on the Build" - Root Cause Found

### **Problem Identified**
Your deployment failures are caused by **Docker build context path resolution issues** in Portainer Git deployments. The error "unable to prepare context" occurs because:

1. **Build Context Mismatch**: `./frontend` and `./backend` paths cannot be resolved in Portainer Git deployment
2. **Conflicting Branches**: Different compose files with different port mappings
3. **Missing Build Strategy**: Mixed approach between building and using pre-built images

## 📋 **Solution Options**

### **Option A: Fixed Git-Based Build Deployment (RECOMMENDED)**

**File**: `docker-compose.portainer-git-fixed.yml`

**Key Fixes Applied**:
- ✅ Build context changed from `./frontend` to `.` (repository root)
- ✅ Dockerfile paths corrected: `frontend/Dockerfile.portainer-fixed`
- ✅ Port mappings standardized: `8093:8080` (Weaviate), `3121:3100` (Backend), `3011:3000` (Frontend)
- ✅ Added resource limits and health checks
- ✅ Enhanced environment variable support

**Deployment Steps**:

1. **Create Portainer Stack from Git**:
   ```
   Repository: https://github.com/crtjohn/rules-generator
   Branch: main
   Compose File Path: docker-compose.portainer-git-fixed.yml
   ```

2. **Set Environment Variables in Portainer**:
   ```
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   PERPLEXITY_API_KEY=your_perplexity_key
   # ... add other API keys as needed
   ```

3. **Deploy Stack** with name `mirg-stack`

### **Option B: Pre-built Image Deployment**

Use the `phase-2-security` branch configuration:

**File**: `docker-compose.portainer-production.yml` (from phase-2-security branch)

**Pre-requisites**:
1. Build and push images to a registry:
   ```bash
   docker build -t mirg-backend:latest ./backend
   docker build -t mirg-frontend:latest ./frontend
   docker tag mirg-backend:latest your-registry/mirg-backend:latest
   docker tag mirg-frontend:latest your-registry/mirg-frontend:latest
   docker push your-registry/mirg-backend:latest
   docker push your-registry/mirg-frontend:latest
   ```

2. Update image references in compose file

## 🛠️ **Implementation Plan**

### **Phase 1: Repository Cleanup**

1. **Commit Current Fixed Files**:
   ```bash
   git add docker-compose.portainer-git-fixed.yml
   git add backend/Dockerfile.portainer-fixed
   git add frontend/Dockerfile.portainer-fixed
   git commit -m "Fix: Portainer Git deployment with corrected build contexts"
   git push origin main
   ```

### **Phase 2: Portainer Deployment**

1. **Remove Existing Failed Stack** (if any):
   - Go to Portainer → Stacks
   - Delete any existing MIRG stacks

2. **Create New Stack**:
   - Name: `mirg-production`
   - Build Method: **Git Repository**
   - Repository URL: `https://github.com/crtjohn/rules-generator`
   - Reference: `refs/heads/main`
   - Compose path: `docker-compose.portainer-git-fixed.yml`

3. **Configure Environment Variables**:
   ```
   OPENAI_API_KEY=your_actual_key_here
   ANTHROPIC_API_KEY=your_actual_key_here
   PERPLEXITY_API_KEY=your_actual_key_here
   GOOGLE_API_KEY=your_actual_key_here
   MISTRAL_API_KEY=your_actual_key_here
   XAI_API_KEY=your_actual_key_here
   GROQ_API_KEY=your_actual_key_here
   OPENROUTER_API_KEY=your_actual_key_here
   AZURE_OPENAI_API_KEY=your_actual_key_here
   OLLAMA_API_KEY=your_actual_key_here
   GITHUB_API_KEY=your_actual_key_here
   ```

4. **Deploy Stack**

### **Phase 3: Verification**

1. **Access Points**:
   - Frontend: `http://192.168.86.97:3011`
   - Backend API: `http://192.168.86.97:3121`
   - Weaviate: `http://192.168.86.97:8093`

2. **Health Checks**:
   - Backend: `http://192.168.86.97:3121/health`
   - Weaviate: `http://192.168.86.97:8093/v1/.well-known/ready`

3. **Container Logs Monitoring**:
   - Check Portainer → Containers → individual container logs
   - Look for successful startup messages

## 🔧 **Troubleshooting Guide**

### **If Build Still Fails**:

1. **Check Portainer Logs**:
   ```bash
   docker logs portainer
   ```

2. **Verify Repository Access**:
   - Ensure repository is public or Portainer has access
   - Check branch name and compose file path

3. **Manual Build Test**:
   ```bash
   git clone https://github.com/crtjohn/rules-generator
   cd rules-generator
   docker-compose -f docker-compose.portainer-git-fixed.yml build
   ```

### **Port Conflict Resolution**:

If ports are in use:
1. Check existing containers: `docker ps`
2. Stop conflicting containers
3. Or modify ports in compose file

### **Memory Issues**:

If containers are killed due to memory:
1. Reduce resource limits in compose file
2. Check NAS available memory: `free -h`
3. Consider using swap if needed

## 📊 **Resource Monitoring**

**Expected Resource Usage**:
- Weaviate: ~512MB-2GB RAM
- Backend: ~256MB-1GB RAM  
- Frontend: ~256MB-1GB RAM
- Total: ~1-4GB RAM recommended

## 🎯 **Success Criteria**

✅ All three containers running and healthy  
✅ Frontend accessible at `:3011`  
✅ Backend API responding at `:3121`  
✅ Weaviate ready at `:8093`  
✅ No port conflicts  
✅ Proper container restart policies active  

## 🚀 **Next Steps After Successful Deployment**

1. **Setup SSL/TLS** with reverse proxy (Nginx/Traefik)
2. **Configure Backup Strategy** for Weaviate data
3. **Implement Monitoring** (Prometheus/Grafana)
4. **Setup CI/CD Pipeline** for automatic deployments
5. **Configure Log Aggregation** (ELK/Loki)

This fix addresses the core build context issue that was causing your "error on the build" failures. The corrected Docker contexts and standardized port mappings should resolve the deployment problems completely.