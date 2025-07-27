#!/bin/bash

# =============================================================================
# PLATINUM SCOUT - PRODUCTION DEPLOYMENT SCRIPT
# =============================================================================
# Single authoritative deployment script for https://platinumscout.ai/
# Location: /var/www/platinumscout/deploy.sh
# User: root (no www-data references)
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# =============================================================================
# DEPLOYMENT START
# =============================================================================

echo ""
echo "==============================================="
echo "🚀 PLATINUM SCOUT PRODUCTION DEPLOYMENT"
echo "==============================================="
echo "Domain: https://platinumscout.ai/"
echo "Directory: /var/www/platinumscout"
echo "User: root"
echo "==============================================="
echo ""

# Change to project directory
if [[ ! -d "/var/www/platinumscout" ]]; then
    error "Project directory /var/www/platinumscout does not exist"
fi

cd /var/www/platinumscout
log "Changed to project directory: $(pwd)"

# Set production environment
export NODE_ENV=production

# =============================================================================
# CLEAN DEPENDENCY INSTALLATION
# =============================================================================

log "Cleaning existing dependencies..."
rm -rf node_modules package-lock.json
success "Removed node_modules and package-lock.json"

log "Installing ALL dependencies (including devDependencies for build)..."
# CRITICAL: Install all dependencies INCLUDING devDependencies for build tools
if npm install --include=dev; then
    success "Dependencies installed successfully"
else
    error "Failed to install dependencies"
fi

# Verify critical build tools are available
log "Verifying build tools..."
if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
fi

if ! command -v npm &> /dev/null; then
    error "npm is not installed"
fi

# CRITICAL VERIFICATION: Ensure Vite is actually installed and accessible
log "Checking Vite installation..."
if [[ ! -f "node_modules/.bin/vite" ]]; then
    error "Vite binary missing: node_modules/.bin/vite does not exist"
fi

if ! npx vite --version; then
    error "Vite is not accessible - installation failed"
fi

VITE_VERSION=$(npx vite --version | head -1)
success "Vite verified: $VITE_VERSION"

# Verify esbuild
if ! npx esbuild --version &> /dev/null; then
    error "esbuild is not available - check package.json dependencies"
fi

success "All build tools verified"

# =============================================================================
# BUILD APPLICATION
# =============================================================================

log "Building frontend (Vite)..."
# Ensure Vite can find its configuration
if [[ ! -f "vite.config.ts" ]]; then
    error "vite.config.ts not found in project directory"
fi

# Run Vite build with detailed output
log "Running: npx vite build --mode production"
if npx vite build --mode production --logLevel info; then
    success "Frontend build completed"
else
    error "Frontend build failed - deployment aborted"
fi

log "Building backend (excluding Vite dependencies)..."
if node build-backend-only.js; then
    success "Backend build completed"
else
    error "Backend build failed - deployment aborted"
fi

# Verify build outputs exist
if [[ ! -f "dist/index.js" ]]; then
    error "Backend build output missing: dist/index.js"
fi

if [[ ! -d "dist/public" ]]; then
    error "Frontend build output missing: dist/public directory"
fi

success "Build verification completed"

# =============================================================================
# NGINX CONFIGURATION
# =============================================================================

log "Configuring Nginx..."
if [[ -f "nginx-platinumscout.conf" ]]; then
    cp nginx-platinumscout.conf /etc/nginx/sites-available/platinumscout.ai
    
    # Enable site if not already enabled
    if [[ ! -L "/etc/nginx/sites-enabled/platinumscout.ai" ]]; then
        ln -sf /etc/nginx/sites-available/platinumscout.ai /etc/nginx/sites-enabled/
        info "Nginx site enabled"
    fi
    
    # Test Nginx configuration
    if nginx -t; then
        systemctl reload nginx
        success "Nginx configuration updated and reloaded"
    else
        error "Nginx configuration test failed"
    fi
else
    warning "nginx-platinumscout.conf not found - skipping Nginx configuration"
fi

# =============================================================================
# PM2 PROCESS MANAGEMENT
# =============================================================================

log "Managing PM2 processes..."

# Stop existing processes (ignore errors if not running)
pm2 stop platinumscout-api || true
pm2 delete platinumscout-api || true

# Start application using ecosystem config
if [[ -f "ecosystem.config.cjs" ]]; then
    log "Starting application with ecosystem.config.cjs..."
    pm2 start ecosystem.config.cjs --env production
    success "Application started with PM2 ecosystem config"
elif [[ -f "ecosystem.config.js" ]]; then
    log "Starting application with ecosystem.config.js..."
    pm2 start ecosystem.config.js --env production
    success "Application started with PM2 ecosystem config"
else
    log "Starting application directly with PM2..."
    pm2 start dist/index.js --name "platinumscout-api" --instances max --exec-mode cluster
    success "Application started with PM2 direct config"
fi

# Save PM2 configuration for auto-restart on reboot
pm2 save
pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true

# =============================================================================
# POST-DEPLOYMENT VERIFICATION
# =============================================================================

log "Verifying deployment..."

# Check PM2 status
echo ""
info "PM2 Process Status:"
pm2 status

# Show recent logs
echo ""
info "Recent Application Logs (last 10 lines):"
pm2 logs platinumscout-api --lines 10 --nostream

# Check if application is responding
sleep 5
if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
    success "Application health check passed"
else
    warning "Application health check failed - check logs above"
fi

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================

echo ""
echo "==============================================="
echo "✅ DEPLOYMENT COMPLETE"
echo "==============================================="
echo "🌐 Domain: https://platinumscout.ai/"
echo "📁 Directory: /var/www/platinumscout"
echo "🔧 Process: PM2 cluster mode"
echo "🚀 Status: Production ready"
echo "==============================================="
echo ""
echo "📊 Next Steps:"
echo "- Check SSL: https://platinumscout.ai/"
echo "- Monitor logs: pm2 logs platinumscout-api"
echo "- Check status: pm2 status"
echo "- Restart if needed: pm2 restart platinumscout-api"
echo ""
success "Platinum Scout deployment successful!"
echo ""