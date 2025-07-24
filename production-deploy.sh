#!/bin/bash

# Platinum Scout Production Deployment Script
# Domain: https://platinumscout.ai/
# Server: Ubuntu 22, 4 Cores, 16GB RAM, 200GB SSD
# Location: London Datacenter

set -e

echo "🚀 Starting Platinum Scout Production Deployment to https://platinumscout.ai/"
echo "📍 Location: London Datacenter (4 Cores, 16GB RAM, 200GB SSD)"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root (required for some operations)
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root. This is acceptable for initial setup."
fi

# Step 1: System Updates and Dependencies
print_step "1. Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_step "2. Installing required dependencies..."
sudo apt install -y curl wget unzip git nginx certbot python3-certbot-nginx ufw fail2ban

# Step 2: Install Node.js 18 LTS
print_step "3. Installing Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

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

# Step 5: Create application directory
print_step "6. Setting up application directory..."
APP_DIR="/var/www/platinumscout"
sudo mkdir -p $APP_DIR
sudo chown platinumscout:platinumscout $APP_DIR

# Step 6: Clone/copy application files
print_step "7. Deploying application files..."
if [ -d ".git" ]; then
    print_status "Git repository detected, copying files..."
    sudo cp -r . $APP_DIR/
else
    print_status "Copying application files..."
    sudo cp -r . $APP_DIR/
fi

# Fix permissions
sudo chown -R platinumscout:platinumscout $APP_DIR
cd $APP_DIR

# Step 7: Install dependencies and build
print_step "8. Installing application dependencies..."
sudo -u platinumscout npm ci --production

print_step "9. Building production application..."
sudo -u platinumscout npm run build

# Step 8: Setup environment variables
print_step "10. Setting up environment variables..."
if [ ! -f ".env" ]; then
    sudo -u platinumscout cp .env.production .env
    print_warning "Copied .env.production to .env. Please update with actual secrets!"
    print_warning "Required secrets: DATABASE_URL, JWT_SECRET, SENDGRID_API_KEY, OPENAI_API_KEY"
fi

# Step 9: Setup PostgreSQL database
print_step "11. Setting up PostgreSQL database..."
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE platinumscout_prod;
CREATE USER platinumscout_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE platinumscout_prod TO platinumscout_user;
\q
EOF

print_status "PostgreSQL database created: platinumscout_prod"
print_warning "Please update DATABASE_URL in .env with the actual password"

# Step 10: Setup PM2 ecosystem file
print_step "12. Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'platinumscout-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    error_file: '/var/log/pm2/platinumscout-error.log',
    out_file: '/var/log/pm2/platinumscout-out.log',
    log_file: '/var/log/pm2/platinumscout-combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Step 11: Setup Nginx configuration
print_step "13. Configuring Nginx..."
sudo tee /etc/nginx/sites-available/platinumscout.ai << EOF
server {
    listen 80;
    server_name platinumscout.ai www.platinumscout.ai;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=general:10m rate=1r/s;
    
    # API proxy
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files
    location / {
        limit_req zone=general burst=10 nodelay;
        root /var/www/platinumscout/dist/public;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/platinumscout.ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Step 12: Setup UFW Firewall
print_step "14. Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH with rate limiting
sudo ufw limit ssh comment 'SSH with rate limiting'

# Allow HTTP/HTTPS with rate limiting
sudo ufw limit 80/tcp comment 'HTTP with rate limiting'
sudo ufw limit 443/tcp comment 'HTTPS with rate limiting'

# Allow application port only from localhost
sudo ufw allow from 127.0.0.1 to any port 3000 comment 'App internal'

# Allow PostgreSQL only from localhost
sudo ufw allow from 127.0.0.1 to any port 5432 comment 'PostgreSQL'

# Enable logging
sudo ufw logging on

sudo ufw --force enable
sudo ufw status verbose

# Step 13: Setup fail2ban for security
print_step "15. Configuring fail2ban..."
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Add Nginx specific configuration
sudo tee /etc/fail2ban/jail.d/nginx.conf << EOF
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 1800

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 2
bantime = 86400

[nginx-dos]
enabled = true
port = http,https
filter = nginx-dos
logpath = /var/log/nginx/platinumscout-access.log
maxretry = 300
findtime = 600
bantime = 1800
EOF

# Create DOS filter
sudo tee /etc/fail2ban/filter.d/nginx-dos.conf << EOF
[Definition]
failregex = ^<HOST> -.*"(GET|POST).*HTTP.*" 200
ignoreregex =
EOF

# Start fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Step 14: Create log directory for PM2
print_step "16. Setting up logging..."
sudo mkdir -p /var/log/pm2
sudo chown platinumscout:platinumscout /var/log/pm2

# Step 15: Start the application
print_step "17. Starting Platinum Scout application..."
sudo -u platinumscout pm2 start ecosystem.config.js
sudo -u platinumscout pm2 save
sudo -u platinumscout pm2 startup

# Step 16: Start services
print_step "18. Starting services..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Step 17: Setup SSL with Let's Encrypt
print_step "19. Setting up SSL certificate with Let's Encrypt..."
print_warning "Please ensure DNS A record points to this server IP before proceeding"
read -p "Press enter when DNS is configured and propagated..."

sudo certbot --nginx -d platinumscout.ai -d www.platinumscout.ai --non-interactive --agree-tos --email admin@platinumscout.ai

# Setup automatic renewal
sudo systemctl enable certbot.timer

# Step 18: Setup database migrations (if needed)
print_step "20. Running database migrations..."
if [ -f "package.json" ] && grep -q "db:push" package.json; then
    sudo -u platinumscout npm run db:push
    print_status "Database schema pushed"
fi

# Step 19: Apply enhanced security hardening
print_step "21. Applying enterprise security hardening..."
if [ -f "security-hardening-enhanced.sh" ]; then
    chmod +x security-hardening-enhanced.sh
    print_warning "Enhanced security hardening available. Run ./security-hardening-enhanced.sh after deployment for enterprise-grade security."
else
    print_warning "Enhanced security script not found. Consider running additional security hardening."
fi

# Setup basic security monitoring
print_step "22. Setting up security monitoring..."
sudo mkdir -p /var/log/platinumscout
sudo chown platinumscout:platinumscout /var/log/platinumscout

# Create security check script
sudo tee /usr/local/bin/platinumscout-security-check << 'EOF'
#!/bin/bash
# Basic security monitoring for Platinum Scout

LOG_FILE="/var/log/platinumscout/security-$(date +%Y%m%d).log"

echo "$(date): Security check started" >> $LOG_FILE

# Check for suspicious processes
ps aux | grep -E "(bitcoin|crypto|mining)" >> $LOG_FILE 2>/dev/null

# Check network connections
netstat -tulpn | grep -E ":(22|80|443|3000|5432)" >> $LOG_FILE

# Check fail2ban status
fail2ban-client status >> $LOG_FILE 2>/dev/null

# Check firewall status
ufw status >> $LOG_FILE 2>/dev/null

echo "$(date): Security check completed" >> $LOG_FILE
EOF

sudo chmod +x /usr/local/bin/platinumscout-security-check

# Schedule security checks
echo "*/30 * * * * root /usr/local/bin/platinumscout-security-check" | sudo tee -a /etc/crontab

# Setup log rotation for security logs
sudo tee /etc/logrotate.d/platinumscout << 'EOF'
/var/log/platinumscout/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 platinumscout platinumscout
}
EOF

# Final status check
print_step "23. Final status check..."
echo ""
print_status "🎉 Deployment completed successfully!"
print_status "Domain: https://platinumscout.ai/"
print_status "Application running on port 3000 (proxied through Nginx)"
print_status "SSL certificate installed and configured"
print_status "Firewall configured and active"
print_status "PM2 process manager configured for auto-restart"

echo ""
print_warning "⚠️  IMPORTANT: Please complete these manual steps:"
echo "1. Update .env file with actual secrets (DATABASE_URL, JWT_SECRET, etc.)"
echo "2. Configure DNS A record: platinumscout.ai → $(curl -s ifconfig.me)"
echo "3. Test the application: https://platinumscout.ai/"
echo "4. Monitor logs: pm2 logs platinumscout-api"
echo "5. Check PM2 status: pm2 status"
echo "6. Run enhanced security: ./security-hardening-enhanced.sh"
echo "7. Review security logs: tail -f /var/log/platinumscout/security-*.log"

# Display useful commands
echo ""
print_status "📋 Useful commands:"
echo "• Check application status: pm2 status"
echo "• View logs: pm2 logs platinumscout-api"
echo "• Restart application: pm2 restart platinumscout-api"
echo "• Check Nginx status: sudo systemctl status nginx"
echo "• View Nginx error logs: sudo tail -f /var/log/nginx/error.log"
echo "• Check firewall status: sudo ufw status verbose"
echo "• Check fail2ban status: sudo fail2ban-client status"
echo "• View blocked IPs: sudo fail2ban-client status nginx-limit-req"
echo "• Security monitoring: tail -f /var/log/platinumscout/security-*.log"
echo "• Renew SSL manually: sudo certbot renew"
echo "• Run security check: sudo /usr/local/bin/platinumscout-security-check"

print_status "🚀 Platinum Scout is now deployed to production!"
