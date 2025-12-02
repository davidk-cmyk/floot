import { ZodError } from 'zod';
import superjson from 'superjson';

// Custom error for unauthorized policy actions
export class UnauthorizedPolicyActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedPolicyActionError';
  }
}

// Custom error for when a policy is not found
export class PolicyNotFoundError extends Error {
  constructor(message: string = 'Policy not found.') {
    super(message);
    this.name = 'PolicyNotFoundError';
  }
}

interface ErrorContext {
  endpoint: string;
  policyId?: number | string;
}

/**
 * Centralized error handler for policy-related endpoints.
 * It logs the error with context and returns a standardized JSON error response.
 *
 * @param error - The error object caught in the try-catch block.
 * @param context - Contextual information about where the error occurred.
 * @returns A Response object with the appropriate status code and error message.
 */
export const handlePolicyError = (error: unknown, context: ErrorContext): Response => {
  console.error(`Error in ${context.endpoint}:`, { context, error });

  if (error instanceof ZodError) {
    return new Response(superjson.stringify({ error: 'Invalid input data.', details: error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (error instanceof UnauthorizedPolicyActionError) {
    return new Response(superjson.stringify({ error: error.message }), {
      status: 403, // Forbidden
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (error instanceof PolicyNotFoundError) {
    return new Response(superjson.stringify({ error: error.message }), {
      status: 404, // Not Found
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (error instanceof Error) {
    // Handle specific database or other known errors if necessary
    // For example, check for unique constraint violations, etc.
  }

  // Generic fallback for unexpected errors
  return new Response(superjson.stringify({ error: 'An unexpected server error occurred.' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
};