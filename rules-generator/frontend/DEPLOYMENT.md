# Multi-IDE Rules Generator - Deployment Guide

This guide provides comprehensive instructions for deploying the Multi-IDE Rules Generator frontend application with all the implemented enhancements.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- Node.js 18.x or higher
- npm 8.x or higher
- Modern web browser with ES2020 support
- Backend API server running on port 3120 (default)

### Required Dependencies

All dependencies are listed in `package.json` and should be installed via:

```bash
npm install
```

## Environment Setup

### Development Environment

1. Clone the repository:
```bash
git clone <repository-url>
cd rules-generator/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

### Production Environment

1. Set environment variables:
```bash
# Create .env.production file
echo "VITE_API_BASE_URL=https://your-api-domain.com" > .env.production
echo "VITE_APP_ENV=production" >> .env.production
```

2. Build the application:
```bash
npm run build
```

## Build Process

### Development Build

```bash
npm run dev
```
- Starts Vite development server
- Hot Module Replacement (HMR) enabled
- Source maps included
- Runs on `http://localhost:5173`

### Production Build

```bash
npm run build
```
- Creates optimized build in `dist/` directory
- Minifies JavaScript and CSS
- Removes development-only code
- Optimizes assets for production

### Type Checking

```bash
npm run build
```
- Runs TypeScript compiler before build
- Ensures type safety
- Fails build on type errors

### Linting

```bash
npm run lint
```
- Runs ESLint
- Enforces code quality standards
- Checks for potential issues

## Deployment Options

### Static Hosting (Vercel, Netlify, GitHub Pages)

#### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Configure environment variables in Vercel dashboard:
   - `VITE_API_BASE_URL`: Your backend API URL
   - `VITE_APP_ENV`: `production`

#### Netlify Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to Netlify:
```bash
# Install Netlify CLI
npm install netlify-cli -g

# Deploy
netlify deploy --prod --dir=dist
```

#### GitHub Pages

1. Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/rules-generator/', // Your repository name
  build: {
    outDir: 'docs',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

2. Build and deploy:
```bash
npm run build
git add docs/
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### Docker Deployment

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html index.htm;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy to backend
        location /api/ {
            proxy_pass http://backend:3120;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

3. Build and run Docker container:
```bash
# Build image
docker build -t rules-generator-frontend .

# Run container
docker run -p 80:80 rules-generator-frontend
```

### Traditional Server Deployment

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/rules-generator;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/js text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3120;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/rules-generator

    <Directory /var/www/rules-generator>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Enable compression
    AddOutputFilterByType DEFLATE text/plain text/css text/js text/xml text/javascript application/javascript application/xml+rss application/json

    # SPA fallback
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </IfModule>

    # API proxy
    ProxyPass /api/ http://localhost:3120/
    ProxyPassReverse /api/ http://localhost:3120/
</VirtualHost>
```

## Configuration

### Environment Variables

Create `.env` files for different environments:

#### `.env.development`
```env
VITE_API_BASE_URL=http://localhost:3120
VITE_APP_ENV=development
```

#### `.env.production`
```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_APP_ENV=production
```

#### `.env.staging`
```env
VITE_API_BASE_URL=https://staging-api-domain.com
VITE_APP_ENV=staging
```

### API Configuration

The application expects the backend API to be available at the configured `VITE_API_BASE_URL`. Ensure the following endpoints are available:

- `POST /api/rules/generate` - Generate rules packages
- `POST /api/rules/add` - Add custom rules
- `GET /api/rules` - List available rules
- `GET /api/config` - Get system configuration

### CORS Configuration

Ensure your backend API is configured to accept requests from your frontend domain:

```javascript
// Example backend CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-frontend-domain.com' 
    : 'http://localhost:5173',
  credentials: true,
}));
```

## Testing

### Pre-Deployment Testing

1. Run all tests:
```bash
npm test
```

2. Run tests with coverage:
```bash
npm run test:coverage
```

3. Run tests in UI mode:
```bash
npm run test:ui
```

### Post-Deployment Testing

1. **Smoke Testing**:
   - Verify the application loads
   - Check all navigation links work
   - Test form submissions
   - Verify error handling

2. **Integration Testing**:
   - Test API connectivity
   - Verify data persistence
   - Test error boundary functionality
   - Check responsive design

3. **Performance Testing**:
   - Load time testing
   - Bundle size analysis
   - Memory usage monitoring

### Automated Testing Pipeline

Create `.github/workflows/deploy.yml` for automated testing and deployment:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:run
    
    - name: Build application
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: dist/

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-files
        path: dist/
    
    - name: Deploy to production
      run: |
        # Add your deployment commands here
        echo "Deploying to production..."
```

## Monitoring

### Application Performance Monitoring

1. **Error Tracking**:
   - The application includes comprehensive error handling
   - Errors are logged to console and stored in Zustand
   - Consider integrating with Sentry or similar services

2. **Performance Metrics**:
   - Monitor bundle size
   - Track load times
   - Monitor API response times

3. **User Analytics**:
   - Consider adding analytics tracking
   - Monitor user engagement
   - Track feature usage

### Health Checks

Create a health check endpoint in your application:

```typescript
// src/utils/healthCheck.ts
export const performHealthCheck = async () => {
  const checks = {
    api: false,
    storage: false,
    network: false,
  };

  try {
    // Check API connectivity
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/health`);
    checks.api = response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
  }

  try {
    // Check localStorage
    localStorage.setItem('health-check', 'test');
    localStorage.removeItem('health-check');
    checks.storage = true;
  } catch (error) {
    console.error('Storage health check failed:', error);
  }

  try {
    // Check network connectivity
    await fetch('https://www.google.com', { mode: 'no-cors' });
    checks.network = true;
  } catch (error) {
    console.error('Network health check failed:', error);
  }

  return checks;
};
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Problem**: TypeScript compilation errors
```bash
npm run build
# Error: TypeScript compilation failed
```

**Solution**:
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix type errors and rebuild
npm run build
```

#### 2. Runtime Errors

**Problem**: Application fails to load in production
```
Uncaught TypeError: Cannot read property 'xxx' of undefined
```

**Solution**:
- Check environment variables
- Verify API endpoints are accessible
- Check browser console for specific errors
- Ensure all dependencies are properly installed

#### 3. API Connection Issues

**Problem**: Frontend cannot connect to backend API
```
CORS error: No 'Access-Control-Allow-Origin' header is present
```

**Solution**:
- Verify backend CORS configuration
- Check API base URL configuration
- Ensure backend is running and accessible
- Verify network connectivity

#### 4. Performance Issues

**Problem**: Application loads slowly
```
Large bundle size detected
```

**Solution**:
- Run bundle analysis:
```bash
npm install --save-dev rollup-plugin-visualizer
```

- Update `vite.config.ts`:
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

- Analyze and optimize large dependencies

### Debug Mode

Enable debug mode for troubleshooting:

```typescript
// src/utils/debug.ts
export const enableDebugMode = () => {
  if (import.meta.env.DEV) {
    console.log('Debug mode enabled');
    // Add debug-specific configurations
  }
};
```

### Log Collection

Implement comprehensive logging:

```typescript
// src/utils/logger.ts
export class Logger {
  private static instance: Logger;
  private logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
    context?: any;
  }> = [];

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  log(level: 'info' | 'warn' | 'error', message: string, context?: any) {
    const entry = {
      timestamp: new Date(),
      level,
      message,
      context,
    };
    
    this.logs.push(entry);
    console[level](`[${level.toUpperCase()}] ${message}`, context);
  }

  getLogs() {
    return this.logs;
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}
```

## Support

For deployment issues or questions:

1. Check the troubleshooting section above
2. Review the application logs
3. Verify environment configuration
4. Contact the development team

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Multi-IDE Rules Generator frontend application with all implemented enhancements. Follow the steps carefully and ensure all prerequisites are met before deployment.

Remember to:
- Test thoroughly in staging before production deployment
- Monitor application performance and errors
- Keep dependencies updated
- Follow security best practices
- Maintain proper backup and rollback procedures