// Load environment variables from .env.production
require('dotenv').config({ path: '.env.production' });

module.exports = {
  apps: [{
    name: 'platinumscout-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || 3000,
      HOST: process.env.HOST || '0.0.0.0',
      DATABASE_URL: process.env.DATABASE_URL,
      APP_NAME: process.env.APP_NAME || 'Platinum Scout',
      FRONTEND_URL: process.env.FRONTEND_URL,
      API_URL: process.env.API_URL,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      JWT_SECRET: process.env.JWT_SECRET,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY
    },
    error_file: '/var/log/pm2/platinumscout-error.log',
    out_file: '/var/log/pm2/platinumscout-out.log',
    log_file: '/var/log/pm2/platinumscout-combined.log',
    time: true,
    max_memory_restart: '2G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist/public']
  }]
};
