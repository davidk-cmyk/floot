import { db } from './db';
import { sql } from 'kysely';

/**
 * Rate Limiting Utility
 * Provides reusable rate limiting for registration and other sensitive endpoints
 */

export interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  lockoutMinutes: number;
  cleanupProbability?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingMinutes?: number;
  attemptCount: number;
}

// Default configurations for different use cases
export const RATE_LIMIT_CONFIGS = {
  login: {
    maxAttempts: 5,
    windowMinutes: 15,
    lockoutMinutes: 15,
    cleanupProbability: 0.1,
  },
  registration: {
    maxAttempts: 3,
    windowMinutes: 60,
    lockoutMinutes: 60,
    cleanupProbability: 0.1,
  },
  aiRequest: {
    maxAttempts: 20,
    windowMinutes: 1,
    lockoutMinutes: 1,
    cleanupProbability: 0.05,
  },
  passwordReset: {
    maxAttempts: 3,
    windowMinutes: 60,
    lockoutMinutes: 60,
    cleanupProbability: 0.1,
  },
  codeVerification: {
    maxAttempts: 5,
    windowMinutes: 15,
    lockoutMinutes: 15,
    cleanupProbability: 0.1,
  },
} as const;

/**
 * Check rate limit for a given identifier (e.g., email, IP, user ID)
 * Uses PostgreSQL advisory locks for atomic checking
 */
export async function checkRateLimit(
  identifier: string,
  type: 'registration' | 'aiRequest' | 'passwordReset' | 'codeVerification',
  config: RateLimitConfig = RATE_LIMIT_CONFIGS[type]
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);
  const normalizedIdentifier = identifier.toLowerCase();
  const attemptType = `rate_limit_${type}`;

  const result = await db.transaction().execute(async (trx) => {
    // Use advisory lock to serialize access per identifier
    await sql`SELECT pg_advisory_xact_lock(hashtextextended(${normalizedIdentifier + attemptType}, 0))`.execute(trx);

    // Count recent attempts
    const countResult = await trx
      .selectFrom('loginAttempts')
      .select([
        trx.fn.countAll<number>().as('attemptCount'),
        trx.fn.max(trx.dynamic.ref('attemptedAt')).as('lastAttemptAt'),
      ])
      .where('email', '=', `${attemptType}:${normalizedIdentifier}`)
      .where('attemptedAt', '>=', windowStart)
      .executeTakeFirst();

    const attemptCount = Number(countResult?.attemptCount ?? 0);
    const lastAttemptAt = countResult?.lastAttemptAt
      ? new Date(countResult.lastAttemptAt as unknown as string)
      : null;

    // Check if locked out
    if (attemptCount >= config.maxAttempts && lastAttemptAt) {
      const lockoutEnd = new Date(lastAttemptAt.getTime() + config.lockoutMinutes * 60 * 1000);

      if (now < lockoutEnd) {
        const remainingMinutes = Math.ceil((lockoutEnd.getTime() - now.getTime()) / (60 * 1000));
        return { allowed: false, remainingMinutes, attemptCount };
      }
    }

    return { allowed: true, attemptCount };
  });

  // Cleanup old entries probabilistically
  if (config.cleanupProbability && Math.random() < config.cleanupProbability) {
    const cleanupBefore = new Date(now.getTime() - config.windowMinutes * 2 * 60 * 1000);
    try {
      await db
        .deleteFrom('loginAttempts')
        .where('email', 'like', `rate_limit_${type}:%`)
        .where('attemptedAt', '<', cleanupBefore)
        .execute();
    } catch {
      // Ignore cleanup errors
    }
  }

  return result;
}

/**
 * Record an attempt for rate limiting
 */
export async function recordRateLimitAttempt(
  identifier: string,
  type: 'registration' | 'aiRequest' | 'passwordReset' | 'codeVerification',
  success: boolean = false
): Promise<void> {
  const normalizedIdentifier = identifier.toLowerCase();
  const attemptType = `rate_limit_${type}`;

  await db
    .insertInto('loginAttempts')
    .values({
      email: `${attemptType}:${normalizedIdentifier}`,
      attemptedAt: new Date(),
      success,
    })
    .execute();
}

/**
 * Clear rate limit attempts on success (e.g., after successful registration)
 */
export async function clearRateLimitAttempts(
  identifier: string,
  type: 'registration' | 'aiRequest' | 'passwordReset' | 'codeVerification'
): Promise<void> {
  const normalizedIdentifier = identifier.toLowerCase();
  const attemptType = `rate_limit_${type}`;

  await db
    .deleteFrom('loginAttempts')
    .where('email', '=', `${attemptType}:${normalizedIdentifier}`)
    .where('success', '=', false)
    .execute();
}
