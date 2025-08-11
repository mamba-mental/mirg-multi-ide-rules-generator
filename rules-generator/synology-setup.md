# Synology NAS Docker Setup for Portainer

## Required Configurations

### 1. Container Manager Settings
- Access Container Manager in DSM
- Go to Settings → Advanced → Docker Engine
- Ensure these settings are configured:

```json
{
  "data-root": "/volume1/@docker",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "btrfs",
  "experimental": false,
  "live-restore": true
}
```

### 2. File Permissions Setup
SSH to your NAS and run:

```bash
# Set proper ownership for the project directory
sudo chown -R root:docker /volume1/docker/projects/rules-generator
sudo chmod -R 755 /volume1/docker/projects/rules-generator

# Ensure Portainer has access to the Docker socket
sudo usermod -aG docker portainer || true

# Create necessary directories with proper permissions
sudo mkdir -p /volume1/docker/projects/rules-generator/knowledge-base
sudo chown -R 1001:1000 /volume1/docker/projects/rules-generator/knowledge-base
```

### 3. Port Conflict Prevention
Current port allocations:
- Weaviate: 8093:8080, 50054:50051
- Backend: 3121:3100  
- Frontend: 3011:5173

Verify these ports are available:
```bash
sudo netstat -tulpn | grep -E "(8093|50054|3121|3011)"
```

### 4. Volume Mount Optimization
For better performance with live development:
- Use named volumes for node_modules (already configured)
- Mount source directories as read-write for development
- Use read-only mounts for configuration files

### 5. Troubleshooting Commands

#### Check Docker daemon status:
```bash
sudo systemctl status docker
```

#### Check Portainer logs:
```bash
docker logs portainer
```

#### Verify volume mounts:
```bash
docker exec -it mirg-backend ls -la /app
docker exec -it mirg-backend ls -la /app/knowledge-base
```

#### Test file access from container:
```bash
docker exec -it mirg-backend sh -c "echo 'test' > /tmp/testfile && ls -la /tmp/testfile"
```

## Common Issues and Solutions

### Issue: "bind: address already in use"
**Solution**: Change port mappings in docker-compose file

### Issue: "permission denied" on volume mounts
**Solution**: Run permission setup commands above

### Issue: Build context not found
**Solution**: Use volume mount approach instead of build contexts

### Issue: Container cannot access NAS files
**Solution**: Verify file ownership and Docker group membership

## Network Configuration
The stack uses a custom bridge network `mirg-network` for service isolation and communication.

## Resource Limits
Configured resource limits:
- Weaviate: 2GB max, 512MB reserved
- Backend: 1GB max, 256MB reserved  
- Frontend: 1GB max, 256MB reserved