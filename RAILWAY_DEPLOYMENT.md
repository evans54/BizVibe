# Single Service Railway Deployment
# This solves "Cannot GET /" by combining frontend + backend in one service

## What This Does
- **Single container** serves both frontend and API
- **No monorepo complexity**
- **No CORS issues** (same origin)
- **Single URL** for entire app

## Deployment Steps

1. **Set Root Directory to `.`** in Railway dashboard
2. **Generate Production Secrets** in Railway variables:
   - JWT_SECRET
   - JWT_REFRESH_SECRET  
   - ENCRYPTION_KEY
3. **Deploy**:
   ```bash
   railway up
   ```

## Result
- **Single URL**: `https://bizvibe-production-fc8d.up.railway.app`
- **Frontend**: Served at `/`
- **API**: Available at `/api/*`
- **Health Check**: `/health`

## Why This Works
- Frontend static files served from `/public`
- API routes mounted at `/api`
- SPA routing handled with fallback to `index.html`
- No "Cannot GET /" errors
