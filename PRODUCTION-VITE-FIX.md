# Production Vite Import Fix

## Issue Fixed
- **Problem**: Production build was importing `vite` package which is development-only
- **Error**: `Cannot find package 'vite' imported from /opt/platinumscout/dist/index.js`
- **Impact**: Application couldn't start in production despite successful deployment

## Solution Applied
1. **Conditional Vite Imports**: Modified `server/index.ts` to only import vite in development
2. **Production Static Serving**: Added dedicated production static file serving without vite
3. **Environment Detection**: Uses `process.env.NODE_ENV` to determine runtime mode

## Code Changes

### Before (Broken in Production)
```typescript
import { setupVite, serveStatic, log } from "./vite";
```

### After (Fixed for Production)
```typescript
// Setup vite in development or static serving in production
if (process.env.NODE_ENV === "development") {
  const { setupVite } = await import("./vite");
  await setupVite(app, server);
} else {
  await serveStatic(app);
}
```

## Deployment Instructions

1. **Rebuild Application**:
   ```bash
   cd /opt/platinumscout
   npm run build
   pm2 restart platinumscout
   ```

2. **Alternative - Full Redeploy**:
   ```bash
   cd /opt/platinumscout
   git pull origin main
   npm ci
   npm run build
   pm2 restart platinumscout
   ```

## Verification
- Check PM2 status: `pm2 status`
- Check application logs: `pm2 logs platinumscout`
- Test website access: `curl http://localhost:5000`
- Test domain access: `curl http://platinumscout.ai`

## Production Environment
- **NODE_ENV**: Should be set to "production" 
- **Port**: Application runs on port 5000
- **Process Manager**: PM2 with ecosystem.config.js
- **Web Server**: Nginx reverse proxy

This fix ensures the application works correctly in production without requiring development-only packages like vite.