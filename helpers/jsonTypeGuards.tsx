/**
 * Checks if a value is an array of strings.
 * This is a type guard, meaning if it returns true, TypeScript will know
 * the value is of type string[].
 *
 * This is particularly useful for validating data from JSON columns in the database,
 * such as from the `settings` table.
 *
 * @param value The value to check, expected to be of type `unknown` or `any`.
 * @returns `true` if the value is a string array, `false` otherwise.
 */
export function isStringArray(value: unknown): value is string[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item) => typeof item === "string");
}