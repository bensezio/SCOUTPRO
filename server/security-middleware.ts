import type { Express, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

// Security configuration for production
export interface SecurityConfig {
  enableHTTPS: boolean;
  sessionSecret: string;
  cookieSecure: boolean;
  cookieHttpOnly: boolean;
  cookieSameSite: 'strict' | 'lax' | 'none';
  csrfProtection: boolean;
  rateLimiting: boolean;
}

// Default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  enableHTTPS: process.env.NODE_ENV === 'production',
  sessionSecret: process.env.SESSION_SECRET || 'your-super-secret-session-key-for-development',
  cookieSecure: process.env.NODE_ENV === 'production',
  cookieHttpOnly: true,
  cookieSameSite: 'lax',
  csrfProtection: process.env.NODE_ENV === 'production',
  rateLimiting: true,
};

// Rate limiting configurations
export const rateLimiters = {
  // Authentication endpoints - stricter limits
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { 
      error: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
  }),

  // Password reset - very strict
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: { 
      error: 'Too many password reset attempts. Please try again in 1 hour.',
      retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // General API - more lenient
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { 
      error: 'Too many requests. Please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Admin endpoints - moderate limits
  admin: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per window
    message: { 
      error: 'Too many admin requests. Please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS (only for HTTPS)
  if (req.secure || req.get('X-Forwarded-Proto') === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy - optimized for Stripe and Tableau Public integration
  const isDev = process.env.NODE_ENV !== 'production';
  const csp = isDev 
    ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.google.com https://www.gstatic.com https://public.tableau.com https://replit.com; " +
      "frame-src 'self' https://js.stripe.com https://public.tableau.com https://replit.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; " +
      "connect-src 'self' ws: wss: https://js.stripe.com https://api.stripe.com https://public.tableau.com https://replit.com; " +
      "img-src 'self' data: blob: https: https://*.stripe.com https://public.tableau.com https://replit.com; " +
      "media-src 'self' data: blob: https: https://*.youtube.com https://*.vimeo.com https://*.wistia.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com;"
    : "default-src 'self'; " +
      "script-src 'self' https://js.stripe.com https://www.google.com https://www.gstatic.com https://public.tableau.com https://replit.com; " +
      "frame-src 'self' https://js.stripe.com https://public.tableau.com https://replit.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; " +
      "connect-src 'self' https://js.stripe.com https://api.stripe.com https://public.tableau.com https://replit.com; " +
      "img-src 'self' data: https: https://*.stripe.com https://public.tableau.com https://replit.com; " +
      "media-src 'self' data: blob: https: https://*.youtube.com https://*.vimeo.com https://*.wistia.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com;";
  
  res.setHeader('Content-Security-Policy', csp);
  
  next();
};

// HTTPS redirect middleware (for production)
export const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('X-Forwarded-Proto') !== 'https') {
    return res.redirect(301, `https://${req.get('Host')}${req.url}`);
  }
  next();
};

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize common injection patterns
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .replace(/[<>]/g, '') // Remove basic HTML
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
    }
    return value;
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return sanitizeValue(obj);
    };

    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = sanitizeValue(value);
      }
    }
  }

  next();
};

// Apply security middleware to Express app
export const applySecurityMiddleware = (app: Express, config: SecurityConfig = defaultSecurityConfig) => {
  // HTTPS redirect (must be first)
  if (config.enableHTTPS) {
    app.use(httpsRedirect);
  }

  // Security headers
  app.use(securityHeaders);

  // Input validation
  app.use(validateInput);

  // Rate limiting for different endpoint types
  if (config.rateLimiting) {
    // Apply general rate limiting to all routes
    app.use('/api/', rateLimiters.general);
    
    // More specific rate limits will be applied in individual route files
  }

  console.log('Security middleware applied:', {
    https: config.enableHTTPS,
    rateLimiting: config.rateLimiting,
    environment: process.env.NODE_ENV || 'development'
  });
};

// JWT token validation improvements
export const validateJWTSecurity = (token: string): boolean => {
  try {
    // Basic token format validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Check for suspicious patterns
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Validate token structure
    if (!payload.userId || !payload.iat || !payload.jti) {
      return false;
    }

    // Check token age (should not be too old)
    const tokenAge = Date.now() / 1000 - payload.iat;
    const maxAge = 7 * 24 * 60 * 60; // 7 days
    
    if (tokenAge > maxAge) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Password security validation
export const validatePasswordSecurity = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  if (password.length > 128) {
    errors.push('Password must be no more than 128 characters long');
  }
  
  // Check for common weak patterns
  const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password contains common patterns and is not secure');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};