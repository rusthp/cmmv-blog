# CMMV Blog Admin Server

This is the production server for the CMMV Blog administrative interface. It replicates all Vite proxy functionality in production environment, including dynamic whitelabel support.

## 🚀 Features

- **Dynamic Proxy**: Automatically configures proxies for whitelabels based on API data
- **Retry Logic**: Robust retry system with exponential backoff to fetch whitelabel configurations
- **Health Checks**: Endpoints for server health monitoring
- **Detailed Logs**: Logging system with emojis for easy identification
- **Centralized Configuration**: All configuration in separate file

## 📁 File Structure

```
apps/admin/
├── server.js          # Main server
├── server.config.js   # Centralized configuration  
├── package.json       # Dependencies
└── dist/             # Built static files
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file at the project root:

```env
VITE_API_URL=http://localhost:5000
VITE_PORT=5002
VITE_ALLOWED_HOSTS=blog.cmmv.io,localhost
```

### Server Configuration (server.config.js)

```javascript
export const serverConfig = {
    mode: 'production',
    port: '5002',
    host: '0.0.0.0',
    apiUrl: 'http://localhost:5000',
    
    // Retry configuration for whitelabels
    whitelabel: {
        maxRetries: 10,
        timeout: 5000,
        baseDelay: 2000,
        maxDelay: 10000,
        backoffMultiplier: 1.5
    }
};
```

## 🌐 Proxy Routes

### Main Proxies

- `/api/*` → `${API_URL}/*` (Main API)
- `/api/admin/*` → `${API_URL}/*` (Administrative API)
- `/images/*` → `${API_URL}/images/*` (Images)

### Dynamic Proxies (Whitelabels)

For each configured whitelabel:
- `/${WHITELABEL_ID}/*` → `${WHITELABEL_API_URL}/*`

Example:
- `/client1/*` → `https://client1-api.example.com/*`
- `/client2/*` → `https://client2-api.example.com/*`

## 📊 Monitoring Endpoints

### Health Check
```
GET /health
```

Returns:
```json
{
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "production",
    "whitelabels": {
        "count": 2,
        "configured": ["client1", "client2"]
    },
    "apiUrl": "http://localhost:5000",
    "version": "1.0.0"
}
```

### Whitelabel Information
```
GET /whitelabels
```

Returns:
```json
{
    "count": 2,
    "whitelabels": {
        "client1": "https://client1-api.example.com",
        "client2": "https://client2-api.example.com"
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🚀 How to Run

### Development
```bash
cd apps/admin
pnpm dev
```

### Production
```bash
# 1. Build the application
cd apps/admin
pnpm build

# 2. Install production dependencies
pnpm install --prod

# 3. Start server
pnpm start:server
```

### Docker
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY apps/admin/package.json ./
RUN npm install --only=production

COPY apps/admin/dist ./dist
COPY apps/admin/server.js ./
COPY apps/admin/server.config.js ./

EXPOSE 5002
CMD ["node", "server.js"]
```

## 🔄 Whitelabel System Operation

1. **Initialization**: Server attempts to fetch whitelabel configurations from main API
2. **Retry Logic**: If it fails, retries with exponential backoff (up to 10 attempts)
3. **Dynamic Configuration**: For each whitelabel found, creates a specific proxy
4. **Fallback**: If unable to fetch whitelabels, continues working with main proxies only

### Example Flow

```
1. Server Start → GET /whitelabel/admin
2. Response: [
     { id: "client1", apiUrl: "https://api.client1.com" },
     { id: "client2", apiUrl: "https://api.client2.com" }
   ]
3. Proxy Setup:
   - /client1/* → https://api.client1.com/*
   - /client2/* → https://api.client2.com/*
```

## 🛠️ Forwarded Headers

The server automatically forwards the following headers:

- `refresh-token`: Refresh token for authentication
- `x-whitelabel-id`: Whitelabel ID for identification
- `authorization`: Authorization token

## 🐛 Logs and Debugging

The server produces detailed logs:

```
🚀 Starting CMMV Admin Server...
🌍 Environment: production
🔗 API URL: http://localhost:5000
🔍 Fetching whitelabel configurations...
✅ Added whitelabel: client1 -> https://api.client1.com
🎉 Successfully loaded 1 whitelabel configurations
🔧 Setting up whitelabel proxies...
✅ Server started successfully!
📡 Listening on: http://0.0.0.0:5002
🔗 API Proxy: http://localhost:5000
🏷️  Whitelabels: 1 configured

📋 Whitelabel Routes:
   /client1 -> https://api.client1.com

🔍 Health check: http://0.0.0.0:5002/health
📊 Whitelabels info: http://0.0.0.0:5002/whitelabels
```

## 📝 Available Scripts

```json
{
    "dev": "vite --clearScreen false",
    "build": "vite build", 
    "start": "vite",
    "start:server": "node server.js",
    "lint": "eslint \"src/**/*.ts\""
}
```

## 🔒 Graceful Shutdown

The server supports graceful shutdown through signals:
- `SIGINT` (Ctrl+C)
- `SIGTERM`

## 📦 Dependencies

### Main Dependencies
- `@cmmv/server`: CMMV framework HTTP server
- `http-proxy-middleware`: HTTP proxy middleware
- `vite`: For loading environment variables

### Structure
```json
{
    "dependencies": {
        "http-proxy-middleware": "^3.0.3"
    }
}
``` 
