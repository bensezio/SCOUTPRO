#!/bin/bash

# Platinum Scout Production Deployment Script
# OPTIMIZED FOR: Git Clone Workflow (cd ~ && git clone https://github.com/bensezio/SCOUTPRO.git platinumscout)

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() { echo -e "${GREEN}[STEP]${NC} $1"; }
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_step "Platinum Scout Production Deployment"
print_status "Optimized for Git Clone Workflow"
echo "=============================================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "This script must be run from the git repository directory"
    print_status "Expected workflow:"
    print_status "  cd ~"
    print_status "  git clone https://github.com/bensezio/SCOUTPRO.git platinumscout" 
    print_status "  cd platinumscout"
    print_status "  sudo ./production-deploy.sh"
    exit 1
fi

# Verify we have essential files
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the correct directory?"
    exit 1
fi

CURRENT_DIR=$(pwd)
print_status "Deploying from git repository: $CURRENT_DIR"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root. This is acceptable for initial setup."
fi

# Step 1: System Updates and Dependencies
print_step "1. Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_step "2. Installing required dependencies..."
sudo apt install -y curl wget unzip git nginx certbot python3-certbot-nginx ufw fail2ban build-essential

# Install Node.js build dependencies
print_status "Installing Node.js build dependencies..."
sudo apt install -y python3-dev python3-pip gcc g++ make

# Step 2: Install Node.js 20 LTS (Latest Stable)
print_step "3. Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Update npm to latest version
print_status "Updating npm to latest version..."
sudo npm install -g npm@latest

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
print_status "Node.js version: $node_version"
print_status "NPM version: $npm_version"

# Step 3: Install PM2 for process management
print_step "4. Installing PM2 process manager..."
sudo npm install -g pm2
pm2 install pm2-logrotate

# Step 4: Create application user
print_step "5. Creating application user..."
if ! id "platinumscout" &>/dev/null; then
    sudo useradd -m -s /bin/bash platinumscout
    sudo usermod -aG sudo platinumscout
    print_status "Created user: platinumscout"
else
    print_status "User platinumscout already exists"
fi

# Step 5: NO FILE COPYING NEEDED - We're already in the right place!
print_step "6. Setting up application directory..."
APP_DIR="/opt/platinumscout"

# If we're not already in /opt/platinumscout, we need to move there
if [ "$CURRENT_DIR" != "$APP_DIR" ]; then
    print_status "Moving repository to production location..."
    sudo mkdir -p /opt
    
    # If /opt/platinumscout already exists, back it up
    if [ -d "$APP_DIR" ]; then
        sudo mv "$APP_DIR" "${APP_DIR}.backup.$(date +%Y%m%d-%H%M)" 
        print_status "Backed up existing installation"
    fi
    
    # Move current directory to /opt/platinumscout
    sudo mv "$CURRENT_DIR" "$APP_DIR"
    cd "$APP_DIR"
    print_status "✅ Repository moved to $APP_DIR"
else
    print_status "✅ Already in production location: $APP_DIR"
fi

# Set proper ownership
sudo chown -R platinumscout:platinumscout "$APP_DIR"
print_status "✅ Set ownership to platinumscout user"

# Step 6: Install dependencies and build
print_step "7. Installing application dependencies..."

# Clear npm cache to avoid conflicts
print_status "Clearing npm cache..."
sudo -u platinumscout npm cache clean --force

# Install ALL dependencies (including devDependencies for build tools like vite)
print_status "Installing dependencies including build tools..."
sudo -u platinumscout npm ci

# Attempt to fix security vulnerabilities
print_status "Fixing security vulnerabilities..."
sudo -u platinumscout npm audit fix --force || true

# Step 7: Build application if build script exists
print_step "8. Building production application..."

# Set memory limit for build process
export NODE_OPTIONS="--max-old-space-size=4096"

# Check if build script exists and run it
if sudo -u platinumscout NODE_OPTIONS="--max-old-space-size=4096" npm run build 2>/dev/null; then
    print_status "✅ Application built successfully"
else
    print_warning "No build script or build failed - using source files"
fi

# Step 8: Clean production dependencies
print_step "9. Optimizing for production..."
sudo -u platinumscout npm prune --production
print_status "✅ Development dependencies removed"

# Step 9: Configure environment
print_step "10. Setting up environment..."
if [ -f ".env.production" ]; then
    sudo -u platinumscout cp .env.production .env
    print_status "✅ Production environment configured"
fi

# Step 10: Configure Nginx (if config exists)
if [ -f "nginx-platinumscout.conf" ]; then
    print_step "11. Configuring Nginx..."
    sudo cp nginx-platinumscout.conf /etc/nginx/sites-available/platinumscout
    sudo ln -sf /etc/nginx/sites-available/platinumscout /etc/nginx/sites-enabled/
    
    # Remove default nginx site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    if sudo nginx -t; then
        sudo systemctl reload nginx
        print_status "✅ Nginx configured and reloaded"
    else
        print_error "Nginx configuration test failed"
    fi
fi

# Step 11: Start application with PM2 (if config exists)
if [ -f "ecosystem.config.js" ]; then
    print_step "12. Starting application with PM2..."
    
    # Stop any existing PM2 processes
    sudo -u platinumscout pm2 delete platinumscout 2>/dev/null || true
    
    # Start the application
    sudo -u platinumscout pm2 start ecosystem.config.js
    sudo -u platinumscout pm2 save
    
    # Set up PM2 to start on boot
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u platinumscout --hp /home/platinumscout
    
    print_status "✅ Application started with PM2"
    
    # Show PM2 status
    print_status "Current PM2 status:"
    sudo -u platinumscout pm2 status
fi

# Step 12: Configure firewall
print_step "13. Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 2222/tcp  # Custom SSH port from your guide
sudo ufw --force enable
print_status "✅ Firewall configured"

# Step 13: Final security hardening (if script exists)
if [ -f "security-hardening-enhanced.sh" ]; then
    print_step "14. Applying security hardening..."
    sudo chmod +x security-hardening-enhanced.sh
    sudo ./security-hardening-enhanced.sh
    print_status "✅ Security hardening applied"
fi

# Final status
print_step "✅ Platinum Scout deployment completed successfully!"
print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "🌐 Application accessible at:"
print_status "   • http://platinumscout.ai (if domain configured)"
print_status "   • http://your-server-ip (direct access)"
print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "📋 Next steps:"
print_status "   1. Configure DNS: A record pointing to your server IP"
print_status "   2. Enable HTTPS: sudo certbot --nginx -d platinumscout.ai"
print_status "   3. Check application: pm2 status"
print_status "   4. View logs: pm2 logs platinumscout"
print_status "   5. Monitor: pm2 monit"
print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "🔧 Useful commands:"
print_status "   • Restart app: pm2 restart platinumscout"
print_status "   • Update code: git pull && npm ci && npm run build && pm2 restart platinumscout"
print_status "   • Check nginx: sudo nginx -t && sudo systemctl status nginx"
print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"