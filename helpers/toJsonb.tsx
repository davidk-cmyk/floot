import { sql, RawBuilder } from 'kysely';

/**
 * Wraps a serializable JavaScript value to be inserted as a JSONB type in PostgreSQL using Kysely.
 *
 * This helper uses `JSON.stringify()` to serialize all values (primitives, objects, and arrays)
 * and then casts the result to `::jsonb`. This approach is simple, reliable, and type-safe.
 *
 * **How it works:**
 * - `JSON.stringify()` is called on the value to produce a JSON-encoded string representation
 * - The stringified value is then cast to `::jsonb` so PostgreSQL interprets it as JSONB
 * - This works for all types:
 *   - Primitives: JSON.stringify('hello') → '"hello"' → cast to jsonb → stores as JSON string "hello"
 *   - Numbers: JSON.stringify(123) → '123' → cast to jsonb → stores as JSON number 123
 *   - Objects: JSON.stringify({x: 1}) → '{"x":1}' → cast to jsonb → stores as JSON object {"x":1}
 *   - null/undefined: JSON.stringify(null) → 'null' → cast to jsonb → stores as JSON null
 *
 * @example
 * // String value
 * await db
 *   .updateTable('settings')
 *   .set({ settingValue: toJsonb('dark') })
 *   .where('settingKey', '=', 'theme')
 *   .execute();
 * // Results in: UPDATE settings SET setting_value = '"dark"'::jsonb
 * // Database stores: "dark" (a JSON string)
 *
 * @example
 * // Object value
 * await db
 *   .updateTable('settings')
 *   .set({ settingValue: toJsonb({ theme: 'dark', notifications: true }) })
 *   .where('settingKey', '=', 'user_preferences')
 *   .execute();
 * // Results in: UPDATE settings SET setting_value = '{"theme":"dark","notifications":true}'::jsonb
 *
 * @example
 * // Usage in an insert statement
 * await db
 *   .insertInto('settings')
 *   .values({
 *     settingKey: 'feature_flags',
 *     settingValue: toJsonb({ newDashboard: true, betaAccess: false }),
 *   })
 *   .execute();
 *
 * @template T The type of the value being serialized. It should be serializable to JSON.
 * @param {T} value The JavaScript value to be converted to a JSONB literal.
 * @returns {RawBuilder<T>} A Kysely `RawBuilder` instance representing the JSONB expression.
 */
export function toJsonb<T>(value: T): RawBuilder<T> {
  // Serialize to JSON and use as a raw SQL literal to prevent double-serialization
  // by postgres-js driver. We need to escape single quotes in the JSON string.
  const jsonString = JSON.stringify(value);
  const escapedJsonString = jsonString.replace(/'/g, "''");
  return sql<T>`${sql.raw(`'${escapedJsonString}'`)}::jsonb`;
}