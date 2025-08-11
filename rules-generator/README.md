# MIRG - Multi-IDE Rules Generator

A hybrid SaaS/CLI platform for generating and managing IDE-specific rule packages with vector database integration.

## 🚀 Quick Start with Portainer

This repository is optimized for deployment via Portainer using Git repository integration.

### Prerequisites
- Portainer installed and accessible
- Docker environment with internet access
- OpenAI API key (optional, for AI features)

### Deployment Steps

1. **Add this repository to Portainer:**
   - Navigate to Portainer → Stacks → Add Stack
   - Select "Repository" as deployment method
   - Repository URL: `https://github.com/[username]/mirg-multi-ide-rules-generator`
   - Compose file path: `docker-compose.portainer-git.yml`

2. **Configure Environment Variables (Optional):**
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Deploy the Stack:**
   - Click "Deploy the Stack"
   - Wait for all services to build and start

### Service URLs (After Deployment)

- **Frontend UI**: http://your-server:3011
- **Backend API**: http://your-server:3121
- **Weaviate DB**: http://your-server:8001

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Weaviate      │
│   (React/Vite)  │◄───┤   (Node.js)     │◄───┤   (Vector DB)   │
│   Port: 3011    │    │   Port: 3121    │    │   Port: 8001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   └── index.ts        # Main server file
│   ├── package.json        # Dependencies
│   ├── Dockerfile.portainer # Multi-stage Docker build
│   └── tsconfig.json       # TypeScript configuration
├── frontend/               # React/Vite frontend
│   ├── src/
│   │   ├── App.tsx         # Main React component
│   │   └── main.tsx        # Application entry point
│   ├── package.json        # Dependencies
│   ├── Dockerfile.portainer # Multi-stage Docker build
│   └── vite.config.ts      # Vite configuration
├── docker-compose.portainer-git.yml  # Main deployment file
└── README.md               # This file
```

## 🔧 Local Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend  
npm install
npm run dev
```

## 🐳 Docker Build

Each service uses multi-stage Docker builds optimized for production:
- Non-root user implementation
- Health checks included
- Minimal Alpine-based images

## 📊 Health Monitoring

All services include health checks:
- **Frontend**: HTTP probe on port 3000
- **Backend**: Health endpoint at `/health`
- **Weaviate**: Built-in health monitoring

## 🔒 Security Features

- Non-root containers
- Security headers in nginx
- Environment-based configuration
- No hardcoded secrets

## 📈 Version

- **Version**: 1.0.0
- **Deployment Method**: Git Repository + Portainer
- **Container Runtime**: Docker Compose

---

**Deployment Target**: Portainer Git Integration  
**Build Method**: Multi-stage Docker builds  
**Network**: Bridge network with service isolation