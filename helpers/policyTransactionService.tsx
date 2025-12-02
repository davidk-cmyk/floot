import { db } from './db';
import { Transaction, Kysely } from 'kysely';
import { DB } from './schema';

/**
 * A type for the callback function that will be executed within a transaction.
 * It receives the transaction object (`trx`) as an argument.
 */
type TransactionCallback<T> = (trx: Transaction<DB>) => Promise<T>;

/**
 * Wraps a database operation in a transaction.
 * It automatically handles beginning the transaction, committing it on success,
 * and rolling it back on any error that occurs within the callback.
 *
 * @param callback - An async function that receives the transaction object and contains the database logic.
 * @returns The result of the callback function.
 * @throws Throws any error that occurs within the callback, after ensuring the transaction is rolled back.
 *
 * @example
 * await withPolicyTransaction(async (trx) => {
 *   const newPolicy = await trx.insertInto('policies')...
 *   await trx.insertInto('policyAuditLog')...
 *   return newPolicy;
 * });
 */
export const withPolicyTransaction = async <T,>(callback: TransactionCallback<T>): Promise<T> => {
  return db.transaction().execute(callback);
};