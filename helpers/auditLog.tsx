import { Transaction } from "kysely";
import { DB, Json } from "./schema";
import { AuditLogAction } from "../endpoints/policies/audit_GET.schema";

type AuditLogCreator = {
  organizationId: number;
  actionBy: number;
  policyId: number;
  policyName: string;
  action: AuditLogAction;
  details?: Json | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Creates an audit log entry within a transaction.
 * @param trx The Kysely transaction object.
 * @param logData The data for the audit log entry.
 */
export async function createAuditLog(
  trx: Transaction<DB>,
  logData: AuditLogCreator
) {
  try {
    await trx
      .insertInto("policyAuditLog")
      .values({
        ...logData,
        actionTimestamp: new Date(),
      })
      .execute();
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // We don't re-throw here to avoid failing the main transaction
    // just because logging failed. This can be debated based on requirements.
  }
}