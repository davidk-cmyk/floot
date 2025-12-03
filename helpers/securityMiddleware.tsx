import type { Context, Next } from 'hono';

/**
 * Security Middleware for Hono
 * Adds security headers and CORS configuration
 */

// CORS configuration
export interface CorsConfig {
  origins: string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const DEFAULT_CORS_CONFIG: CorsConfig = {
  origins: ['*'], // Should be restricted in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Creates CORS middleware for Hono
 */
export function corsMiddleware(config: Partial<CorsConfig> = {}) {
  const corsConfig = { ...DEFAULT_CORS_CONFIG, ...config };

  return async (c: Context, next: Next) => {
    const origin = c.req.header('Origin') || '';

    // Check if origin is allowed
    const isAllowed = corsConfig.origins.includes('*') ||
      corsConfig.origins.some(allowed => {
        if (allowed === '*') return true;
        if (allowed === origin) return true;
        // Support wildcard subdomains (e.g., *.example.com)
        if (allowed.startsWith('*.')) {
          const domain = allowed.slice(2);
          return origin.endsWith(domain);
        }
        return false;
      });

    if (isAllowed && origin) {
      c.res.headers.set('Access-Control-Allow-Origin', origin);
    }

    if (corsConfig.credentials) {
      c.res.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight requests
    if (c.req.method === 'OPTIONS') {
      c.res.headers.set('Access-Control-Allow-Methods', corsConfig.methods!.join(', '));
      c.res.headers.set('Access-Control-Allow-Headers', corsConfig.headers!.join(', '));
      c.res.headers.set('Access-Control-Max-Age', String(corsConfig.maxAge));
      return new Response(null, { status: 204, headers: c.res.headers });
    }

    await next();
  };
}

/**
 * Security headers middleware
 * Adds standard security headers to all responses
 */
export function securityHeadersMiddleware() {
  return async (c: Context, next: Next) => {
    await next();

    // Prevent MIME type sniffing
    c.res.headers.set('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    c.res.headers.set('X-Frame-Options', 'SAMEORIGIN');

    // Enable XSS filter in older browsers
    c.res.headers.set('X-XSS-Protection', '1; mode=block');

    // Control referrer information
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy (formerly Feature-Policy)
    c.res.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );

    // Only set strict CSP for HTML responses
    const contentType = c.res.headers.get('Content-Type') || '';
    if (contentType.includes('text/html')) {
      // Content Security Policy
      // Adjust based on your app's requirements
      c.res.headers.set(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for React dev
          "style-src 'self' 'unsafe-inline'", // Needed for CSS-in-JS
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' https://api.anthropic.com",
          "frame-ancestors 'self'",
        ].join('; ')
      );
    }

    // Strict Transport Security (only in production)
    if (process.env.NODE_ENV === 'production') {
      c.res.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
    }
  };
}

/**
 * Request size limiting middleware
 * Prevents DoS via large payloads
 */
export function requestSizeLimitMiddleware(maxSizeBytes: number = 1024 * 1024) { // 1MB default
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('Content-Length');

    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      return c.json(
        { error: 'Request body too large' },
        { status: 413 }
      );
    }

    await next();
  };
}
