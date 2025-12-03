import { ZodError } from 'zod';
import superjson from 'superjson';
import { NotAuthenticatedError } from './getSetServerSession';

/**
 * Centralized API Response Utility
 * Provides consistent response formatting across all endpoints
 */

// Custom error classes for different error types
export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found.') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Too many requests. Please try again later.', public retryAfterMinutes?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Resource already exists.') {
    super(message);
    this.name = 'ConflictError';
  }
}

// Standard response headers
const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * Creates a successful JSON response using superjson for serialization
 */
export function successResponse<T>(data: T, status: number = 200): Response {
  return new Response(superjson.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

/**
 * Creates an error JSON response using superjson for serialization
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): Response {
  const body: { error: string; details?: unknown } = { error: message };
  if (details !== undefined) {
    body.details = details;
  }
  return new Response(superjson.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

interface ErrorContext {
  endpoint: string;
  resourceId?: string | number;
}

/**
 * Centralized error handler for all endpoints.
 * Maps error types to appropriate HTTP responses with consistent formatting.
 */
export function handleApiError(error: unknown, context: ErrorContext): Response {
  // Log error with context for debugging
  console.error(`Error in ${context.endpoint}:`, {
    context,
    errorName: error instanceof Error ? error.name : 'Unknown',
    errorMessage: error instanceof Error ? error.message : String(error),
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return errorResponse('Invalid input data.', 400, error.flatten());
  }

  // Handle authentication errors
  if (error instanceof NotAuthenticatedError) {
    return errorResponse('Authentication required.', 401);
  }

  // Handle authorization errors
  if (error instanceof UnauthorizedError) {
    return errorResponse(error.message, 403);
  }

  // Handle not found errors
  if (error instanceof NotFoundError) {
    return errorResponse(error.message, 404);
  }

  // Handle conflict errors (e.g., duplicate resources)
  if (error instanceof ConflictError) {
    return errorResponse(error.message, 409);
  }

  // Handle rate limiting
  if (error instanceof RateLimitError) {
    return errorResponse(error.message, 429);
  }

  // Handle validation errors
  if (error instanceof ValidationError) {
    return errorResponse(error.message, 400, error.details);
  }

  // Generic fallback for unexpected errors
  // Don't expose internal error details to clients
  return errorResponse('An unexpected server error occurred.', 500);
}

// Re-export legacy error classes for backward compatibility with existing code
export { UnauthorizedPolicyActionError, PolicyNotFoundError, handlePolicyError } from './policyErrorService';
