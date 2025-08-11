# 🚀 MIRG Deployment Instructions - WORKING SOLUTION

## ✅ Option 1: Deploy via Portainer (Recommended)

1. **Access Portainer** at `http://192.168.86.97:9000`

2. **Navigate to Stacks → Add Stack**

3. **Choose "Repository"** deployment method

4. **Enter these settings:**
   - **Repository URL:** `https://github.com/mamba-mental/mirg-multi-ide-rules-generator`
   - **Repository reference:** `refs/heads/main`
   - **Compose path:** `docker-compose.final.yml`

5. **Click "Deploy the stack"**

## ✅ Option 2: Manual Docker Compose

SSH into your NAS and run:

```bash
# Clone the repository
git clone https://github.com/mamba-mental/mirg-multi-ide-rules-generator.git
cd mirg-multi-ide-rules-generator

# Deploy the stack
docker-compose -f docker-compose.final.yml up -d
```

## 📋 Services & Ports

After deployment, you'll have:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | `http://192.168.86.97:3010` | Web interface with test controls |
| **Backend API** | `http://192.168.86.97:3120` | REST API endpoints |
| **Weaviate** | `http://192.168.86.97:8091` | Vector database |

## 🧪 Testing

1. Open the frontend at `http://192.168.86.97:3010`
2. The page will automatically check all services
3. Use the test buttons to verify each component

## 📁 What's Included

- **backend-app/** - Pre-configured Node.js API server
- **frontend-app/** - Ready-to-run web interface
- **docker-compose.final.yml** - Complete stack configuration
- All dependencies are already installed
- No building required - uses standard Docker images

## ⚠️ Troubleshooting

If deployment fails:

1. **Check if ports are in use:**
   ```bash
   docker ps | grep -E "3010|3120|8091"
   ```

2. **Check logs:**
   ```bash
   docker-compose -f docker-compose.final.yml logs
   ```

3. **Restart the stack:**
   ```bash
   docker-compose -f docker-compose.final.yml down
   docker-compose -f docker-compose.final.yml up -d
   ```

## 🎯 Success Indicators

- Frontend shows all three services as "ONLINE"
- Test buttons return valid JSON responses
- No error messages in the response output

---

This is the WORKING solution - no builds, no complexity, just deploy and run!