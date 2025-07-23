module.exports = {
  apps: [{
    name: 'platinumscout-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0',
      APP_NAME: 'Platinum Scout',
      FRONTEND_URL: 'https://platinumscout.ai',
      API_URL: 'https://platinumscout.ai/api',
      ALLOWED_ORIGINS: 'https://platinumscout.ai,https://www.platinumscout.ai'
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
    ignore_watch: ['node_modules', 'logs', 'dist/public'],
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    }
  }]
};