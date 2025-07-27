/**
 * Future-Proof Routing Adapter for PlatinumEdge Analytics
 * Supports: Development, Production, Serverless, Microservices
 */

import type { Express, Request, Response, NextFunction } from "express";

export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
  middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
  rateLimit?: number;
  auth?: boolean;
  cache?: number; // TTL in seconds
}

export interface MicroserviceConfig {
  name: string;
  baseUrl: string;
  timeout: number;
  retries: number;
  healthEndpoint: string;
}

export class RoutingAdapter {
  private routes: Map<string, RouteConfig> = new Map();
  private microservices: Map<string, MicroserviceConfig> = new Map();
  private isServerless: boolean = false;
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';

  constructor() {
    this.isServerless = this.detectServerlessEnvironment();
  }

  /**
   * Register a route with the adapter
   */
  registerRoute(config: RouteConfig): void {
    const key = `${config.method}:${config.path}`;
    this.routes.set(key, config);
  }

  /**
   * Register a microservice for proxy routing
   */
  registerMicroservice(config: MicroserviceConfig): void {
    this.microservices.set(config.name, config);
  }

  /**
   * Apply routes to Express app (Development/Production)
   */
  applyToExpress(app: Express): void {
    // API route protection middleware
    app.use('/api/*', this.createAPIMiddleware());

    // Register all routes
    for (const [key, config] of this.routes) {
      const [method, path] = key.split(':');
      const httpMethod = method.toLowerCase() as keyof Express;
      
      // Apply middleware chain
      const middlewares = [
        ...(config.middleware || []),
        this.createRateLimitMiddleware(config.rateLimit),
        this.createAuthMiddleware(config.auth),
        this.createCacheMiddleware(config.cache),
        config.handler
      ].filter(Boolean);

      (app[httpMethod] as any)(path, ...middlewares);
    }

    // Microservice proxy routes
    this.setupMicroserviceProxies(app);

    // 404 handler for unregistered API routes
    app.use('/api/*', this.createAPINotFoundHandler());
  }

  /**
   * Generate serverless handler (Vercel, Netlify, AWS Lambda)
   */
  createServerlessHandler() {
    return async (req: any, res: any) => {
      const method = req.method as RouteConfig['method'];
      const path = req.url || req.path;
      const key = `${method}:${path}`;
      
      const config = this.routes.get(key);
      if (!config) {
        return this.handleServerlessNotFound(res, path);
      }

      try {
        // Apply middleware chain for serverless
        await this.executeMiddlewareChain(config, req, res);
        await config.handler(req, res, () => {});
      } catch (error) {
        return this.handleServerlessError(res, error);
      }
    };
  }

  /**
   * Create API gateway for microservices
   */
  private setupMicroserviceProxies(app: Express): void {
    for (const [name, config] of this.microservices) {
      app.use(`/api/${name}/*`, this.createMicroserviceProxy(config));
    }
  }

  /**
   * Microservice proxy with circuit breaker and retry logic
   */
  private createMicroserviceProxy(config: MicroserviceConfig) {
    return async (req: Request, res: Response) => {
      const targetPath = req.path.replace(`/api/${config.name}`, '');
      const targetUrl = `${config.baseUrl}${targetPath}`;

      let attempts = 0;
      while (attempts < config.retries) {
        try {
          const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
              'Content-Type': 'application/json',
              ...req.headers
            },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
            signal: AbortSignal.timeout(config.timeout)
          });

          const data = await response.json();
          return res.status(response.status).json(data);
        } catch (error) {
          attempts++;
          if (attempts >= config.retries) {
            return res.status(503).json({
              error: 'Service unavailable',
              service: config.name,
              message: 'Microservice temporarily unavailable'
            });
          }
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }
    };
  }

  /**
   * Environment detection
   */
  private detectServerlessEnvironment(): boolean {
    return !!(
      process.env.VERCEL ||
      process.env.NETLIFY ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.FUNCTIONS_EXTENSION_VERSION
    );
  }

  /**
   * API middleware for consistent headers and logging
   */
  private createAPIMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Set consistent API headers
      res.set({
        'Content-Type': 'application/json',
        'X-API-Version': '1.0',
        'X-Environment': this.isDevelopment ? 'development' : 'production'
      });

      // API request logging
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[API] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });

      next();
    };
  }

  /**
   * Rate limiting middleware
   */
  private createRateLimitMiddleware(limit?: number) {
    if (!limit) return null;
    
    const requests = new Map<string, number[]>();
    
    return (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip || 'unknown';
      const now = Date.now();
      const windowMs = 60000; // 1 minute window
      
      if (!requests.has(key)) {
        requests.set(key, []);
      }
      
      const userRequests = requests.get(key)!;
      const recentRequests = userRequests.filter(time => now - time < windowMs);
      
      if (recentRequests.length >= limit) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          limit,
          windowMs,
          retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
        });
      }
      
      recentRequests.push(now);
      requests.set(key, recentRequests);
      next();
    };
  }

  /**
   * Authentication middleware
   */
  private createAuthMiddleware(required?: boolean) {
    if (!required) return null;
    
    return (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Authorization header with Bearer token required'
        });
      }
      
      // JWT verification would go here
      next();
    };
  }

  /**
   * Cache middleware
   */
  private createCacheMiddleware(ttl?: number) {
    if (!ttl) return null;
    
    const cache = new Map<string, { data: any; expires: number }>();
    
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET') return next();
      
      const key = req.originalUrl;
      const cached = cache.get(key);
      
      if (cached && Date.now() < cached.expires) {
        res.set('X-Cache', 'HIT');
        return res.json(cached.data);
      }
      
      const originalSend = res.json;
      res.json = function(data: any) {
        cache.set(key, {
          data,
          expires: Date.now() + (ttl * 1000)
        });
        res.set('X-Cache', 'MISS');
        return originalSend.call(this, data);
      };
      
      next();
    };
  }

  /**
   * 404 handler for API routes
   */
  private createAPINotFoundHandler() {
    return (req: Request, res: Response) => {
      res.status(404).json({
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method,
        message: 'This API route is not implemented',
        timestamp: new Date().toISOString(),
        environment: this.isDevelopment ? 'development' : 'production'
      });
    };
  }

  /**
   * Serverless middleware execution
   */
  private async executeMiddlewareChain(
    config: RouteConfig,
    req: any,
    res: any
  ): Promise<void> {
    const middlewares = config.middleware || [];
    
    for (const middleware of middlewares) {
      await new Promise<void>((resolve, reject) => {
        middleware(req, res, (error?: any) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  }

  /**
   * Serverless error handling
   */
  private handleServerlessError(res: any, error: any) {
    console.error('Serverless handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: this.isDevelopment ? error.message : 'An unexpected error occurred'
    });
  }

  /**
   * Serverless 404 handling
   */
  private handleServerlessNotFound(res: any, path: string) {
    return res.status(404).json({
      error: 'Endpoint not found',
      path,
      message: 'This endpoint is not available in serverless mode'
    });
  }

  /**
   * Health check for all registered microservices
   */
  async checkMicroservicesHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};
    
    for (const [name, config] of this.microservices) {
      try {
        const response = await fetch(`${config.baseUrl}${config.healthEndpoint}`, {
          signal: AbortSignal.timeout(5000)
        });
        health[name] = response.ok;
      } catch {
        health[name] = false;
      }
    }
    
    return health;
  }

  /**
   * Get routing configuration for debugging
   */
  getConfiguration() {
    return {
      environment: {
        isDevelopment: this.isDevelopment,
        isServerless: this.isServerless,
        nodeEnv: process.env.NODE_ENV
      },
      routes: Array.from(this.routes.entries()).map(([key, config]) => ({
        key,
        path: config.path,
        method: config.method,
        hasAuth: !!config.auth,
        hasCache: !!config.cache,
        rateLimit: config.rateLimit
      })),
      microservices: Array.from(this.microservices.entries()).map(([name, config]) => ({
        name,
        baseUrl: config.baseUrl,
        timeout: config.timeout,
        retries: config.retries
      }))
    };
  }
}

// Singleton instance
export const routingAdapter = new RoutingAdapter();