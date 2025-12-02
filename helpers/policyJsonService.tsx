import { JsonValue } from './schema';

/**
 * Recursively converts a value to a JSON-compatible type (`JsonValue`).
 * Handles primitives, Dates (to ISO string), arrays, and objects.
 * Any other type is converted to its string representation as a fallback.
 *
 * @param value - The input value of any type.
 * @returns A `JsonValue` that is safe for JSON serialization.
 */
export const toJsonValue = (value: any): JsonValue => {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  if (Array.isArray(value)) {
    return value.map(item => toJsonValue(item));
  }
  
  if (typeof value === 'object') {
    // Check if it's a plain object (not Date, RegExp, etc.)
    if (value.constructor === Object) {
      const result: Record<string, JsonValue> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = toJsonValue(val);
      }
      return result;
    }
    // For non-plain objects (RegExp, etc.), convert to string
    return String(value);
  }
  
  // Fallback for other types, convert to string
  return String(value);
};

/**
 * Creates a deep copy of an object, ensuring all its values are
 * converted to JSON-safe types using the `toJsonValue` helper.
 * This is useful for preparing data for storage in a JSONB column
 * or for audit logging.
 *
 * @param obj - The object to convert.
 * @returns A new object with all values being `JsonValue`.
 */
export const buildJsonSafeCopy = (obj: Record<string, any>): Record<string, JsonValue> => {
  const result: Record<string, JsonValue> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = toJsonValue(value);
  }
  return result;
};