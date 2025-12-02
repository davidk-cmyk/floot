import { randomBytes } from "crypto";

/**
 * Generates a secure random password.
 * @param length The desired length of the password. Defaults to 12.
 * @returns A random password string.
 */
export function generateRandomPassword(length: number = 12): string {
  // A more robust character set to ensure password complexity
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";
  if (length <= 0) {
    throw new Error("Password length must be a positive number.");
  }

  const randomValues = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    // Use modulo to map random byte to an index in the character set
    password += chars[randomValues[i] % chars.length];
  }
  return password;
}