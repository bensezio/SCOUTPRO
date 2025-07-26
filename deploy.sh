#!/bin/bash

# Platinum Scout - Unified Production Deployment Script
# Handles all deployment scenarios for VPS production environment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    warning "Running as root. Consider using a dedicated user for security."
fi

# Deployment directory
DEPLOY_DIR="${DEPLOY_DIR:-/opt/platinumscout}"
APP_NAME="platinumscout"

log "Starting Platinum Scout deployment..."
log "Deploy directory: $DEPLOY_DIR"

# Navigate to deployment directory
if [[ ! -d "$DEPLOY_DIR" ]]; then
    error "Deployment directory $DEPLOY_DIR does not exist"
    exit 1
fi

cd "$DEPLOY_DIR"

# Backup current deployment
log "Creating backup of current deployment..."
if [[ -d "dist" ]]; then
    cp -r dist "dist.backup.$(date +%Y%m%d_%H%M%S)" || warning "Backup failed, continuing..."
fi

# Update from Git
log "Fetching latest changes from GitHub..."
git fetch origin main
git reset --hard origin/main
success "Code updated from GitHub"

# Set production environment
export NODE_ENV=production

# Handle dependency installation with fallback options
log "Installing dependencies..."
if npm ci --legacy-peer-deps --only=production; then
    success "Dependencies installed with --legacy-peer-deps"
elif npm ci --force --only=production; then
    warning "Dependencies installed with --force flag"
elif npm install --legacy-peer-deps --only=production; then
    warning "Dependencies installed with npm install fallback"
else
    error "All dependency installation methods failed"
    exit 1
fi

# Build application
log "Building application for production..."

# Frontend build
if command -v npx &> /dev/null; then
    if npx vite build; then
        success "Frontend built with npx vite"
    elif ./node_modules/.bin/vite build; then
        success "Frontend built with local vite"
    else
        error "Frontend build failed"
        exit 1
    fi
else
    error "npx not available, using local build"
    ./node_modules/.bin/vite build || {
        error "Local vite build failed"
        exit 1
    }
fi

# Backend build
if npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist; then
    success "Backend built successfully"
elif ./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist; then
    success "Backend built with local esbuild"
else
    error "Backend build failed"
    exit 1
fi

# Set proper permissions
chmod +x dist/index.js 2>/dev/null || true

# PM2 Management
log "Managing PM2 process..."

if command -v pm2 &> /dev/null; then
    # Stop existing process
    pm2 stop $APP_NAME 2>/dev/null || warning "No existing PM2 process to stop"
    
    # Start/restart application
    if [[ -f "ecosystem.config.js" ]]; then
        pm2 start ecosystem.config.js
        success "Application started with ecosystem config"
    else
        pm2 start dist/index.js --name $APP_NAME --env production
        success "Application started with basic PM2 config"
    fi
    
    # Save PM2 configuration
    pm2 save
    
    # Show status
    pm2 status
    
    # Show recent logs
    log "Recent application logs:"
    pm2 logs $APP_NAME --lines 10 --nostream
    
else
    warning "PM2 not found, starting with node directly..."
    nohup node dist/index.js > app.log 2>&1 &
    echo $! > app.pid
    success "Application started with node (PID saved to app.pid)"
fi

# Health check
log "Performing health check..."
sleep 5

if curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
    success "Health check passed - application is responding"
elif curl -f -s http://localhost:5000 > /dev/null 2>&1; then
    success "Application is responding on port 5000"
else
    warning "Health check failed - check application logs"
fi

# Final status
log "Deployment completed!"
echo ""
echo "=== DEPLOYMENT SUMMARY ==="
echo "✅ Code updated from GitHub"
echo "✅ Dependencies installed"  
echo "✅ Application built for production"
echo "✅ Process management configured"
echo ""
echo "=== NEXT STEPS ==="
echo "• Check logs: pm2 logs $APP_NAME"
echo "• Check status: pm2 status"
echo "• Test locally: curl http://localhost:5000"
echo "• Check domain: curl http://platinumscout.ai"
echo ""
success "Platinum Scout deployment successful!"