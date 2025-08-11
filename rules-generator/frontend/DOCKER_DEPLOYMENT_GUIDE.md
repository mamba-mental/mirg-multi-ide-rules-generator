# Docker Deployment Guide for Enhanced Rules Generator

This guide provides comprehensive instructions for updating and deploying the enhanced Rules Generator application with Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 1.29 or higher)
- Node.js 18+ (for local development)
- At least 2GB of RAM available for Docker

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Navigate to the frontend directory
cd rules-generator/frontend

# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Using the Deployment Script

```bash
# Navigate to the frontend directory
cd rules-generator/frontend

# Make the script executable
chmod +x deploy.sh

# Deploy using Docker Compose
./deploy.sh --compose

# Deploy using single container
./deploy.sh

# Other options
./deploy.sh --help
```

## Configuration

### Environment Variables

The application supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `VITE_API_URL` | Backend API URL | `http://localhost:3120` |
| `VITE_APP_ENV` | Application environment | `production` |

### Docker Compose Configuration

The `docker-compose.yml` file includes:

1. **Frontend Service**: Enhanced React application with persistence and error handling
2. **Backend Service**: Rules generator backend API
3. **Redis Service**: Optional caching layer
4. **Nginx Proxy**: Optional reverse proxy for production
5. **Monitoring Stack**: Prometheus and Grafana for observability

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 8080 | Main application |
| Backend | 3120 | API server |
| Redis | 6379 | Caching service |
| Nginx Proxy | 80/443 | Reverse proxy |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3000 | Dashboard visualization |

## Deployment Steps

### 1. Build the Application

```bash
# Install dependencies
npm ci

# Run tests
npm run test:run

# Build the application
npm run build
```

### 2. Build Docker Image

```bash
# Build using Dockerfile
docker build -t rules-generator-frontend:latest .

# Or using docker-compose
docker-compose build
```

### 3. Run the Container

#### Single Container Deployment

```bash
# Run the container
docker run -d \
  --name rules-generator-frontend \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e VITE_API_URL=http://backend:3120 \
  --restart unless-stopped \
  rules-generator-frontend:latest
```

#### Multi-Service Deployment

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f frontend
```

### 4. Health Checks

The application includes comprehensive health checks:

```bash
# Check container health
docker ps --filter "name=rules-generator-frontend"

# Test health endpoint
curl http://localhost:8080/health

# Test application endpoint
curl http://localhost:8080/
```

## Enhanced Features

### 1. Frontend Persistence

The enhanced application includes Zustand-based persistence:

- User configurations are saved to localStorage
- Settings persist across browser sessions
- Hydration-aware loading states
- Performance-optimized state management

### 2. Enhanced Error Handling

Comprehensive error management system:

- Categorized error types (network, validation, API, UI, storage)
- Error boundaries with graceful fallbacks
- Global error handling and logging
- User-friendly error notifications

### 3. API Documentation

Interactive API documentation:

- Complete endpoint reference
- Search and filtering capabilities
- Request/response examples
- Copy-to-clipboard functionality
- OpenAPI specification ready

## Monitoring and Logging

### Application Logs

```bash
# View container logs
docker logs rules-generator-frontend

# Follow logs in real-time
docker logs -f rules-generator-frontend

# View logs with timestamps
docker logs --timestamps rules-generator-frontend
```

### Nginx Logs

```bash
# Access logs
docker exec rules-generator-frontend tail -f /var/log/nginx/access.log

# Error logs
docker exec rules-generator-frontend tail -f /var/log/nginx/error.log
```

### Health Monitoring

```bash
# Container health status
docker inspect --format='{{.State.Health.Status}}' rules-generator-frontend

# Detailed health information
docker inspect rules-generator-frontend | grep -A 10 Health
```

## Production Deployment

### 1. Environment Setup

```bash
# Production environment variables
export NODE_ENV=production
export VITE_API_URL=https://your-api-domain.com
export VITE_APP_ENV=production
```

### 2. SSL Configuration

Update `nginx.conf` to enable SSL:

```nginx
# Uncomment the HTTPS server section
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # SSL configuration
    ssl_session_cache shared:SSL:1m;
    ssl_session_timeout 5m;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Location blocks...
}
```

### 3. Docker Compose Production

```yaml
# Production docker-compose.override.yml
version: '3.8'
services:
  frontend:
    environment:
      - NODE_ENV=production
      - VITE_API_URL=https://your-api-domain.com
      - VITE_APP_ENV=production
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
  
  nginx-proxy:
    environment:
      - LETSENCRYPT_HOST=your-domain.com
      - LETSENCRYPT_EMAIL=admin@your-domain.com
```

## Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   # Check container logs
   docker logs rules-generator-frontend
   
   # Check for port conflicts
   netstat -tulpn | grep :8080
   ```

2. **Backend connection issues**
   ```bash
   # Check backend service status
   docker-compose ps backend
   
   # Test backend connectivity
   docker exec rules-generator-frontend curl http://backend:3120/health
   ```

3. **Persistence not working**
   ```bash
   # Check browser console for errors
   # Verify localStorage is available
   docker exec rules-generator-frontend curl -I http://localhost:8080
   ```

### Performance Optimization

1. **Resource Limits**
   ```yaml
   # Add to docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '0.5'
       reservations:
         memory: 256M
         cpus: '0.25'
   ```

2. **Caching Strategy**
   ```nginx
   # Add to nginx.conf
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

## Security Considerations

### Container Security

1. **Non-root User**: The container runs as a non-root user
2. **Read-only Filesystem**: Static files are mounted as read-only
3. **Security Headers**: Nginx includes comprehensive security headers
4. **CSP**: Content Security Policy prevents XSS attacks

### Network Security

1. **Firewall Rules**: Only expose necessary ports
2. **Internal Network**: Services communicate via internal Docker network
3. **API Rate Limiting**: Nginx includes rate limiting for API endpoints

## Backup and Recovery

### Data Backup

```bash
# Backup persistent data
docker run --rm \
  -v rules-generator-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/data-backup.tar.gz -C /data .

# Backup configuration
tar czf config-backup.tar.gz nginx.conf docker-compose.yml
```

### Disaster Recovery

```bash
# Restore from backup
docker run --rm \
  -v rules-generator-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/data-backup.tar.gz -C /data

# Restart services
docker-compose up -d
```

## Scaling

### Horizontal Scaling

```yaml
# Add to docker-compose.yml
services:
  frontend:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

### Load Balancing

```nginx
# Add to nginx.conf
upstream frontend {
    server frontend1:8080;
    server frontend2:8080;
    server frontend3:8080;
}

server {
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Conclusion

This enhanced Docker deployment provides a robust, scalable, and secure platform for the Rules Generator application. The deployment includes comprehensive monitoring, logging, and security features suitable for production environments.

For additional support or questions, refer to the project documentation or create an issue in the repository.