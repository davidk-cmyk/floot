import { randomInt } from "crypto";
import { addMinutes } from "date-fns";

/**
 * Generates a cryptographically secure confirmation code.
 *
 * @param digits - Number of digits in the code (default: 6)
 * @returns A string representation of the numeric code
 */
export function generateConfirmationCode(digits: number = 6): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return randomInt(min, max).toString();
}

/**
 * Calculates the expiration time for a confirmation code.
 *
 * @param minutes - Number of minutes until expiration (default: 15)
 * @returns The expiration date
 */
export function getCodeExpiration(minutes: number = 15): Date {
  return addMinutes(new Date(), minutes);
}

/**
 * Default configuration for confirmation codes.
 */
export const CODE_CONFIG = {
  digits: 6,
  expirationMinutes: 15,
} as const;
