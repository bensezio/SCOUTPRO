# Platinum Scout - Production Deployment Guide

## 🎯 **Complete Start-from-Scratch Production Deployment**

### **Prerequisites**
- Ubuntu VPS server (22.04 LTS recommended)
- Root access via SSH (port 2222 or custom)
- Domain: https://platinumscout.ai/
- Node.js 20 LTS, PM2, Nginx, PostgreSQL

---

## 📋 **Step 1: Initial Server Setup**

### **Connect to VPS**
```bash
ssh root@your-server-ip -p 2222
```

### **Install Required Software**
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Git
apt install -y git curl wget ufw
```

---

## 📂 **Step 2: Clone Repository**

### **Create Project Directory**
```bash
cd /var/www/
git clone https://github.com/bensezio/SCOUTPRO.git platinumscout
cd platinumscout
```

### **Set Proper Ownership**
```bash
chown -R root:root /var/www/platinumscout
chmod +x deploy.sh
```

---

## 🧹 **Step 3: Clean Up Files (Optional)**

### **Remove Development Files**
```bash
# Remove archived documentation (already moved to archive/)
rm -rf archive/

# Remove temporary directories
rm -rf tmp/ .cache/ .pythonlibs/

# Remove development artifacts
rm -rf node_modules/ package-lock.json
rm *.tar.gz *.zip 2>/dev/null || true

# Remove backup scripts (keeping only deploy.sh)
rm -rf backup/
```

---

## 🔧 **Step 4: Configure Environment**

### **Create Production Environment File**
```bash
cp .env.production .env
```

### **Edit Environment Variables**
```bash
nano .env
```
Required variables:
```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@localhost:5432/platinumscout
JWT_SECRET=your-secure-jwt-secret
OPENAI_API_KEY=your-openai-api-key
SENDGRID_API_KEY=your-sendgrid-api-key
```

---

## 🗄️ **Step 5: Setup Database**

### **Create PostgreSQL Database**
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE platinumscout;
CREATE USER platinumscout_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE platinumscout TO platinumscout_user;
\q
```

### **Update Database URL**
```bash
nano .env
# Update: DATABASE_URL=postgresql://platinumscout_user:secure_password@localhost:5432/platinumscout
```

---

## 🚀 **Step 6: Deploy Application**

### **Run Single Deployment Command**
```bash
cd /var/www/platinumscout
sudo ./deploy.sh
```

### **What This Script Does:**
1. **Clean Install:** Deletes node_modules, runs `npm install`
2. **Build Verification:** Builds frontend (Vite) and backend (esbuild)
3. **Nginx Configuration:** Updates and reloads Nginx config
4. **PM2 Management:** Starts application in cluster mode
5. **Health Check:** Verifies application is running

---

## 🌐 **Step 7: Configure Domain & SSL**

### **Install Certbot**
```bash
apt install -y certbot python3-certbot-nginx
```

### **Get SSL Certificate**
```bash
certbot --nginx -d platinumscout.ai -d www.platinumscout.ai
```

### **Test SSL Renewal**
```bash
certbot renew --dry-run
```

---

## 🔥 **Step 8: Configure Firewall**

### **Setup UFW**
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 2222/tcp  # Custom SSH port
ufw allow 'Nginx Full'
ufw --force enable
```

---

## ✅ **Step 9: Verify Deployment**

### **Check Application Status**
```bash
pm2 status
pm2 logs platinumscout-api --lines 20
```

### **Test Application**
```bash
curl -f http://localhost:3000/health
```

### **Access Website**
- Visit: https://platinumscout.ai/
- Should show Platinum Scout homepage

---

## 📊 **Post-Deployment Management**

### **Common Commands**
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs platinumscout-api

# Restart application
pm2 restart platinumscout-api

# Redeploy (after git pull)
cd /var/www/platinumscout
git pull origin main
sudo ./deploy.sh
```

### **Monitoring**
```bash
# System resources
htop

# Nginx status
systemctl status nginx

# Database connection
sudo -u postgres psql -d platinumscout -c "SELECT version();"
```

---

## 🛠️ **Troubleshooting**

### **If Build Fails**
- Check Node.js version: `node --version` (should be 20.x)
- Verify package.json exists and has correct Vite version (5.4.19)
- Check disk space: `df -h`

### **If PM2 Fails**
- Check ecosystem.config.js syntax
- Verify dist/index.js was built
- Check PM2 logs: `pm2 logs platinumscout-api`

### **If Nginx Fails**
- Test config: `nginx -t`
- Check error logs: `tail -f /var/log/nginx/error.log`
- Verify SSL certificates: `certbot certificates`

### **If Database Connection Fails**
- Check PostgreSQL status: `systemctl status postgresql`
- Verify DATABASE_URL in .env file
- Test connection: `psql $DATABASE_URL`

---

## 🎯 **Success Indicators**

- ✅ PM2 shows platinumscout-api running
- ✅ https://platinumscout.ai/ loads correctly
- ✅ SSL certificate valid
- ✅ Health check passes
- ✅ No errors in PM2 logs

---

## 📝 **Key Files**

### **Essential Files**
- `deploy.sh` - Single deployment script
- `ecosystem.config.js` - PM2 configuration
- `nginx-platinumscout.conf` - Nginx configuration
- `.env` - Environment variables

### **Cleaned Up**
- Archived 18 documentation files to `archive/docs/`
- Archived 3 log files to `archive/logs/`
- Archived 14 test files to `archive/tests/`
- Removed redundant deployment scripts

---

## 🏆 **Result**

**Single-command deployment:** `sudo ./deploy.sh`
**Production-ready:** Clean, bulletproof, scalable deployment
**Maintainable:** One script, clear process, reliable results