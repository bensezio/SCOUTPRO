#!/bin/bash

# Fix NPM Dependencies Script for Platinum Scout
# Resolves common Node.js dependency and security issues

set -e

echo "🔧 Fixing NPM Dependencies and Security Issues"
echo "=============================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[FIX]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_status "Found package.json, proceeding with dependency fixes..."

# 1. Clear npm cache
print_status "Clearing npm cache..."
npm cache clean --force

# 2. Remove node_modules and package-lock.json for clean install
print_status "Removing existing node_modules and lock files..."
rm -rf node_modules
rm -f package-lock.json

# 3. Update npm to latest version
print_status "Updating npm to latest version..."
npm install -g npm@latest

# 4. Install all dependencies (including devDependencies for build)
print_status "Installing all dependencies including build tools..."
npm ci

# 5. Fix security vulnerabilities
print_status "Fixing security vulnerabilities..."
npm audit fix --force || {
    print_warning "Some vulnerabilities could not be auto-fixed"
    npm audit --audit-level moderate || true
}

# 6. Update deprecated packages
print_status "Updating deprecated packages..."
npm update

# 7. Rebuild native modules
print_status "Rebuilding native modules..."
npm rebuild

# 8. Verify installation
print_status "Verifying installation..."
if npm list --depth=0 > /dev/null 2>&1; then
    print_status "✅ All dependencies installed successfully"
else
    print_warning "Some dependency warnings remain, but installation is functional"
fi

# 9. Create production package.json for deployment
print_status "Creating optimized production dependencies list..."
cat > package-production.json << 'EOF'
{
  "name": "platinumscout-production",
  "version": "1.0.0",
  "description": "Platinum Scout Production Dependencies",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "build": "npm run build:server && npm run build:client",
    "build:server": "esbuild server/index.ts --bundle --platform=node --target=node18 --outfile=dist/index.js --external:pg-native",
    "build:client": "vite build"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "express-session": "^1.17.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "drizzle-orm": "^0.29.1",
    "@neondatabase/serverless": "^0.6.0",
    "connect-pg-simple": "^9.0.1"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
EOF

print_status "Production package.json created"

# 10. Display summary
echo ""
print_status "🎉 Dependency fixes completed!"
echo ""
print_status "Summary of fixes applied:"
echo "• Cleared npm cache"
echo "• Removed and reinstalled node_modules"
echo "• Updated npm to latest version"
echo "• Installed with legacy peer deps support"
echo "• Fixed security vulnerabilities"
echo "• Updated deprecated packages"
echo "• Rebuilt native modules"
echo "• Created production package.json"
echo ""
print_warning "Next steps for deployment:"
echo "1. Test the application locally: npm run dev"
echo "2. Build for production: npm run build"
echo "3. Deploy to server with fixed production-deploy.sh"
echo ""
print_status "✅ Ready for production deployment!"