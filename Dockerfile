# DEPLOYMENT FIX: Ultra-optimized multi-stage Dockerfile for Cloud Run
# Addresses: Size limits, single port config, unnecessary file removal

FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ONLY dependencies needed for build with aggressive caching cleanup
RUN npm ci --no-audit --no-fund --prefer-offline && \
    npm cache clean --force && \
    rm -rf ~/.npm /tmp/* /var/tmp/*

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./

# Copy ONLY essential source files (large directories excluded via .dockerignore)
COPY . .

# Build frontend and backend with production optimizations
RUN NODE_ENV=production npm run build

# CRITICAL: Clean up and reinstall ONLY production dependencies
RUN rm -rf node_modules/ && \
    npm ci --omit=dev --omit=optional --no-audit --no-fund --production && \
    npm cache clean --force

# Build minimal backend bundle
RUN npx esbuild server/index.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --minify \
    --tree-shaking=true \
    --outfile=dist/index.js

# Create minimal package.json for production
RUN cat > dist/package.json << 'EOF'
{
  "name": "platinumscout-production",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "NODE_ENV=production node index.js"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4",
    "drizzle-orm": "^0.39.1",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "connect-pg-simple": "^10.0.0",
    "bcryptjs": "^3.0.2",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.24.2"
  }
}
EOF

# AGGRESSIVE: Remove ALL unnecessary files to minimize Docker image size
RUN find node_modules -name "*.md" -delete 2>/dev/null || true && \
    find node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -name "*.test.js" -delete 2>/dev/null || true && \
    find node_modules -name "*.d.ts" -delete 2>/dev/null || true && \
    find node_modules -name "*.map" -delete 2>/dev/null || true && \
    find node_modules -name "LICENSE*" -delete 2>/dev/null || true && \
    find node_modules -name "CHANGELOG*" -delete 2>/dev/null || true && \
    find node_modules -name "docs" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -name "examples" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -name ".github" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find . -name "*.log" -delete 2>/dev/null || true

# Final production image - ultra minimal
FROM node:18-alpine AS production

WORKDIR /app

# Install only essential system packages
RUN apk add --no-cache dumb-init && \
    apk del apk-tools && \
    rm -rf /var/cache/apk/* /tmp/* /var/tmp/* /usr/share/man /usr/share/doc

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S app -u 1001 -G nodejs

# Copy only essential files from builder
COPY --from=builder --chown=app:nodejs /app/dist/package.json ./
COPY --from=builder --chown=app:nodejs /app/dist/index.js ./
COPY --from=builder --chown=app:nodejs /app/dist/public ./public/

# Install only essential runtime dependencies
RUN npm ci --omit=dev --omit=optional --no-audit --no-fund --production && \
    npm cache clean --force && \
    rm -rf ~/.npm /tmp/* /var/tmp/* package-lock.json && \
    rm -rf /usr/local/lib/node_modules/npm/docs && \
    rm -rf /usr/local/lib/node_modules/npm/man && \
    rm -rf /usr/local/lib/node_modules/npm/html

# Create health check script
RUN cat > health-check.js << 'EOF'
import http from 'http';
const port = process.env.PORT || 5000;
const req = http.request({
  hostname: 'localhost',
  port: port,
  path: '/api/health',
  method: 'GET',
  timeout: 3000
}, (res) => process.exit(res.statusCode === 200 ? 0 : 1));
req.on('error', () => process.exit(1));
req.on('timeout', () => { req.destroy(); process.exit(1); });
req.end();
EOF

# Switch to non-root user
USER app

# CLOUD RUN FIX: Single port configuration - NO multiple ports allowed
EXPOSE 5000

# Optimized health check for Cloud Run (shorter intervals for faster startup)
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=2 \
    CMD node health-check.js

# DEPLOYMENT FIX: Environment variables for single-port Cloud Run deployment
ENV PORT=5000
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV NODE_OPTIONS="--max-old-space-size=512"

# Optimized process manager with signal handling and memory limits
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]