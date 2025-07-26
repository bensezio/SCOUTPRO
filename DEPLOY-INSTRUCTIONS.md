# Platinum Scout Deployment Instructions

## Quick Deploy on VPS

1. **Upload to GitHub:**
   ```bash
   # Upload this clean package to your GitHub repository
   git add .
   git commit -m "Clean production deployment package"
   git push origin main
   ```

2. **Deploy on VPS:**
   ```bash
   cd /opt/platinumscout
   sudo ./deploy.sh
   ```

That's it! The deploy.sh script handles everything:
- Git updates from GitHub
- Dependency installation  
- Production builds
- PM2 process management
- Health checks

## How VPS Gets Updates

Your VPS pulls updates using: `git pull origin main`

This downloads all changes you commit to GitHub, including:
- Code changes
- Configuration updates
- New deployment scripts

## File Structure

- `client/` - React frontend
- `server/` - Node.js backend  
- `shared/` - Shared types/constants
- `deploy.sh` - Single deployment script
- `package-production.json` - Clean production dependencies
- `ecosystem.config.js` - PM2 configuration
- `nginx-platinumscout.conf` - Nginx configuration

## Environment Setup

1. Copy `.env.production` to `.env` on your VPS
2. Update environment variables as needed
3. Ensure PostgreSQL database is running
4. Run deployment script

## Troubleshooting

- Check logs: `pm2 logs platinumscout`
- Check status: `pm2 status` 
- Test locally: `curl http://localhost:5000`
- Restart: `pm2 restart platinumscout`

The production package eliminates all unnecessary files and provides a single deployment script for reliability.
