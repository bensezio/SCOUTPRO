# How VPS Gets Updates from GitHub

## Git Pull Process
Your VPS connects to GitHub using git commands:

```bash
cd /opt/platinumscout
git pull origin main  # Downloads latest changes from GitHub
```

This automatically downloads:
- New/modified source code files
- Updated configuration files  
- New deployment scripts
- Any file changes you committed to GitHub

## Files NOT Needed for Production

### Development/Testing Files (Delete from GitHub)
```
attached_assets/                    # User uploaded test files
test-upload/                       # Test file uploads
tmp/                              # Temporary files
python_ml_logs/                   # Development logs  
ai-services/                      # Development AI services
docs/                            # Documentation folder
tests/                           # Test files
*.log                            # Log files
```

### Duplicate Deployment Scripts (Keep only 1)
```
production-deploy.sh              # OLD - Delete
production-deploy-git.sh          # OLD - Delete  
deploy-cloud-run-fixed.sh         # OLD - Delete
deploy-cloud-run-optimized.sh     # OLD - Delete
deploy-static-optimized.sh        # OLD - Delete
build-static-optimized.sh         # OLD - Delete
cloud-run-deploy.sh               # OLD - Delete
deployment-optimization.sh        # OLD - Delete
```

### Documentation Files (Optional - Keep for reference)
```
AI-AGENT-IMPLEMENTATION-PLAN.md   # Reference only
DEPLOYMENT-*.md                   # Multiple deployment docs
LOCAL-SETUP-INSTRUCTIONS.md       # Local dev only
MACBOOK-DEPLOYMENT-GUIDE.md       # Local dev only
PRODUCTION-DEPLOYMENT-GUIDE.md    # Outdated
REPOSITORY-MIGRATION-GUIDE.md     # One-time use
SECURITY-ENHANCEMENTS.md          # Reference only
TIER-TEST-CREDENTIALS.md          # Testing only
```

### Archive Files
```
SCOUTPRO-DEPLOYMENT-FIXED-*.tar.gz # Old deployment packages
*.backup.*                         # Backup files
```

## Recommended Clean File Structure

### Keep These Essential Files:
```
/client/                          # Frontend React app
/server/                          # Backend Node.js app  
/shared/                          # Shared types/constants
/public/                          # Static assets
package.json                      # Dependencies
package-production.json           # Clean production deps
ecosystem.config.js               # PM2 configuration
nginx-platinumscout.conf          # Nginx config
production-update-script.sh       # Single deployment script
Dockerfile                        # Docker config
.env.production                   # Production environment
```

### Keep These Documentation Files:
```
README.md                         # Main documentation
replit.md                         # Project context  
PRODUCTION-VITE-FIX.md           # Critical production fix
VPS-UPDATE-INSTRUCTIONS.md        # Deployment guide
```

## Single Deployment Solution

I'll create one unified deployment script that handles all scenarios:
- Git updates
- Dependency installation
- Production builds  
- PM2 restart
- Error handling

This eliminates the need for multiple deployment scripts.