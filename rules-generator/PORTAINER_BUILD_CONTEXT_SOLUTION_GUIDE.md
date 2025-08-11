# Portainer Build Context Error - Complete Solution Guide

## Problem Analysis

The error "Failed to deploy a stack: compose build operation failed: unable to prepare context: path "/data/compose/286/v3/backend" not found" occurs because:

1. **Portainer stores uploaded compose files** in its internal directory structure (`/data/compose/286/v3/`)
2. **Docker build runs from this internal directory**, not your original project location
3. **Relative build contexts** (`./backend`, `./frontend`) are resolved from Portainer's internal path, not your source code location

## Solution Overview

You have **three viable deployment strategies**, listed in order of recommendation:

### 🏆 Solution 1: Pre-Built Images (Production-Ready)
- **File**: `docker-compose.portainer-production.yml`
- **Use Case**: Production deployments, stable releases
- **Pros**: Fast deployment, no build dependencies, most reliable
- **Cons**: Requires pre-building images

### 🥈 Solution 2: Git Repository Deployment (Development-Friendly)
- **File**: `docker-compose.portainer-git.yml`
- **Use Case**: Development with CI/CD, version-controlled deployments
- **Pros**: Proper build context resolution, version control integration
- **Cons**: Requires Git repository setup

### 🥉 Solution 3: Volume-Mounted Build (Fallback)
- **File**: `docker-compose.portainer-volume-build.yml`
- **Use Case**: Emergency deployment when other methods fail
- **Pros**: Can work with uploaded files
- **Cons**: Complex setup, requires manual file management

## Detailed Implementation Guide

### Solution 1: Pre-Built Images (RECOMMENDED)

#### Step 1: Build Images Locally
```bash
# Navigate to your project
cd /volume1/docker/projects/rules-generator

# Build backend image
cd backend
docker build -f Dockerfile.portainer -t mirg-backend:latest .

# Build frontend image
cd ../frontend
docker build -f Dockerfile.portainer -t mirg-frontend:latest .
```

#### Step 2: Deploy in Portainer
1. Go to **Stacks** → **Add stack**
2. **Method**: Web editor
3. **Copy contents** of `docker-compose.portainer-production.yml`
4. **Set environment variables** in the Environment Variables section:
   ```
   OPENAI_API_KEY=your_key_here
   ANTHROPIC_API_KEY=your_key_here
   # ... other API keys
   ```
5. **Deploy the stack**

#### Step 3: Update Workflow
When you need to update:
1. Rebuild images locally with new tags
2. Update the compose file with new image tags
3. Redeploy the stack in Portainer

---

### Solution 2: Git Repository Deployment (RECOMMENDED FOR DEVELOPMENT)

#### Step 1: Create Git Repository
```bash
# If not already a git repo
cd /volume1/docker/projects/rules-generator
git init
git add .
git commit -m "Initial commit for Portainer deployment"

# Push to your Git hosting (GitHub, GitLab, etc.)
```

#### Step 2: Deploy from Git in Portainer
1. Go to **Stacks** → **Add stack**
2. **Method**: Repository
3. **Repository configuration**:
   - **Repository URL**: Your Git repository URL
   - **Reference**: main (or your target branch)
   - **Compose path**: `docker-compose.portainer-git.yml`
4. **Set environment variables**
5. **Deploy the stack**

#### Step 3: Development Workflow
1. Make changes to your code
2. Commit and push to Git
3. In Portainer: Stack → **Update the stack** (pulls latest from Git)
4. Portainer rebuilds images with proper context resolution

---

### Solution 3: Volume-Mounted Build (FALLBACK ONLY)

#### Step 1: Prepare Build Contexts
```bash
# Ensure your source code is in the correct location
cp -r /mnt/w/projects/rules-generator/* /volume1/docker/projects/rules-generator/

# Set proper permissions
chmod -R 755 /volume1/docker/projects/rules-generator/
```

#### Step 2: Deploy in Portainer
1. Go to **Stacks** → **Add stack**
2. **Method**: Web editor
3. **Copy contents** of `docker-compose.portainer-volume-build.yml`
4. **Set environment variables**
5. **Deploy the stack**

**Note**: This approach is complex and error-prone. Use only if Solutions 1 & 2 are not feasible.

---

## Port Configuration

All solutions use these port mappings:
- **Weaviate**: `8093:8080` (HTTP), `50054:50051` (gRPC)
- **Backend**: `3121:3100`
- **Frontend**: `3011:5173`

Verify these ports are available on your NAS:
```bash
netstat -tulpn | grep -E ':(8093|3121|3011|50054)' 
```

## Environment Variables

Required environment variables for all solutions:
```env
# Required for backend functionality
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
PERPLEXITY_API_KEY=your_perplexity_key
GOOGLE_API_KEY=your_google_key
MISTRAL_API_KEY=your_mistral_key
XAI_API_KEY=your_xai_key
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key
AZURE_OPENAI_API_KEY=your_azure_key
OLLAMA_API_KEY=your_ollama_key
GITHUB_API_KEY=your_github_key
```

## Troubleshooting

### Build Context Still Not Found
- **Check**: Are you using the correct compose file for your deployment method?
- **Verify**: Do the source files exist at `/volume1/docker/projects/rules-generator/`?
- **Test**: Try Solution 1 (pre-built images) first to isolate the issue

### Permission Errors
```bash
# Fix permissions on NAS
chown -R 1000:1000 /volume1/docker/projects/rules-generator/
chmod -R 755 /volume1/docker/projects/rules-generator/
```

### Port Conflicts
```bash
# Check for port conflicts
docker ps --format "table {{.Names}}\t{{.Ports}}"
# Stop conflicting containers if needed
docker stop container_name
```

### Memory Issues
If containers fail to start due to memory:
1. Reduce memory limits in compose file
2. Check available system memory: `free -h`
3. Stop unnecessary containers

## Best Practices

### For Production
- ✅ Use **Solution 1** (pre-built images)
- ✅ Set `NODE_ENV=production`
- ✅ Use specific image tags (not `latest`)
- ✅ Set appropriate memory limits
- ✅ Use read-only volume mounts where possible

### For Development
- ✅ Use **Solution 2** (Git repository)
- ✅ Set `NODE_ENV=development`
- ✅ Enable file watching and hot reload
- ✅ Use volume mounts for live code updates
- ✅ Mount source directories for real-time development

### General
- ✅ Always use absolute paths for volume mounts
- ✅ Set resource limits to prevent system overload
- ✅ Use health checks for critical services
- ✅ Implement proper restart policies
- ✅ Use named volumes for persistent data

## Next Steps

1. **Choose your deployment strategy** based on your use case
2. **Test the deployment** with the appropriate compose file
3. **Set up monitoring** to track container health and performance
4. **Document your deployment process** for team members
5. **Set up backup procedures** for persistent data

## Additional Resources

- [Docker Compose Build Reference](https://docs.docker.com/compose/compose-file/build/)
- [Portainer Stack Documentation](https://docs.portainer.io/user/docker/stacks)
- [Docker Build Context Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Files Created:**
- `/mnt/w/projects/rules-generator/docker-compose.portainer-production.yml` - Pre-built images approach
- `/mnt/w/projects/rules-generator/docker-compose.portainer-git.yml` - Git repository approach  
- `/mnt/w/projects/rules-generator/docker-compose.portainer-volume-build.yml` - Volume-mounted build fallback
- `/mnt/w/projects/rules-generator/PORTAINER_BUILD_CONTEXT_SOLUTION_GUIDE.md` - This comprehensive guide