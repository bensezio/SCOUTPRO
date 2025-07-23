# Platinum Scout - Production Deployment

AI-powered football talent scouting platform for https://platinumscout.ai/

## Quick Deployment

```bash
# Clone and deploy to your server
git clone https://github.com/bensezio/SCOUTPRO.git /var/www/platinumscout
cd /var/www/platinumscout
chmod +x production-deploy.sh
sudo ./production-deploy.sh
```

## Configuration

1. Update `.env` with your actual values:
   - `DATABASE_URL` - PostgreSQL connection
   - `JWT_SECRET` - Authentication secret  
   - `OPENAI_API_KEY` - AI functionality
   - `SENDGRID_API_KEY` - Email notifications

2. Configure domain in your DNS:
   - A record: `platinumscout.ai` → your server IP
   - A record: `www.platinumscout.ai` → your server IP

## Features

- AI-powered player analytics with OpenAI GPT-4
- Advanced video analysis system
- Business process automation dashboard
- Role-based access control (5 subscription tiers)
- Professional email integration (info@platinumscout.ai)
- Enterprise security and GDPR compliance

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript  
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with role-based access
- **Deployment**: Ubuntu 22 LTS + Nginx + PM2 + SSL

## Production Infrastructure

- Ubuntu 22 LTS automated setup
- Nginx with SSL/HTTPS (Let's Encrypt)
- PostgreSQL database with optimization
- PM2 cluster mode process management
- UFW firewall + fail2ban security
- Comprehensive monitoring and logging

## Demo Accounts

| Role | Email | Password | Features |
|------|-------|----------|----------|
| Freemium | demo-freemium@platinumscout.ai | Demo123! | Basic features |
| ScoutPro | demo-scoutpro@platinumscout.ai | Demo123! | Enhanced scouting |
| Agent/Club | demo-agent@platinumscout.ai | Demo123! | Team management |
| Enterprise | demo-enterprise@platinumscout.ai | Demo123! | Full analytics |
| Admin | demo-admin@platinumscout.ai | Demo123! | Admin panel |

## Support

**Live Platform**: https://platinumscout.ai/  
**Deployment Guide**: See production-deploy.sh for automated setup
**System Requirements**: 4+ GB RAM, 50+ GB storage, Ubuntu 22 LTS

This is the production-ready version of Platinum Scout, optimized for deployment without development/test files.