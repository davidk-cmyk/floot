import { db } from './db';
import type { Transaction } from 'kysely';
import type { DB } from './schema';

/**
 * Parameters for creating a policy version snapshot.
 */
interface CreateVersionSnapshotParams {
  /** The ID of the policy. */
  policyId: number;
  /** The organization ID. */
  organizationId: number;
  /** The version number for this snapshot. */
  versionNumber: number;
  /** The ID of the user creating this version. */
  createdBy: number;
  /** The policy title. */
  title: string;
  /** The policy content. */
  content: string;
  /** The policy status. */
  status: string;
  /** Optional change summary describing what changed in this version. */
  changeSummary?: string | null;
  /** Optional effective date. */
  effectiveDate?: Date | null;
  /** Optional expiration date. */
  expirationDate?: Date | null;
  /** Optional tags array. */
  tags?: string[] | null;
  /** Optional department. */
  department?: string | null;
  /** Optional category. */
  category?: string | null;

  /** Whether the policy requires acknowledgment. */
  requiresAcknowledgment?: boolean | null;
  /** Optional review date. */
  reviewDate?: Date | null;
}

/**
 * Creates a version snapshot in the policyVersions table.
 * This function can be used with or without a transaction.
 *
 * @param params - The parameters for the version snapshot.
 * @param trx - Optional transaction to use for the database operation.
 */
export const createVersionSnapshot = async (
  params: CreateVersionSnapshotParams,
  trx?: Transaction<DB>
): Promise<void> => {
  try {
    const dbInstance = trx || db;

    await dbInstance
      .insertInto('policyVersions')
      .values({
        policyId: params.policyId,
        organizationId: params.organizationId,
        versionNumber: params.versionNumber,
        createdBy: params.createdBy,
        title: params.title,
        content: params.content,
        status: params.status,
        changeSummary: params.changeSummary || null,
        effectiveDate: params.effectiveDate || null,
        expirationDate: params.expirationDate || null,
        tags: params.tags || null,
        department: params.department || null,
        category: params.category || null,

        requiresAcknowledgment: params.requiresAcknowledgment || true,
        reviewDate: params.reviewDate || null,
      })
      .execute();

    console.log(`Successfully created version snapshot: version ${params.versionNumber} for policy "${params.title}" (ID: ${params.policyId})`, {
      reviewDate: params.reviewDate,
      effectiveDate: params.effectiveDate,
      expirationDate: params.expirationDate,
    });

  } catch (error) {
    console.error('Failed to create policy version snapshot:', {
      policyId: params.policyId,
      versionNumber: params.versionNumber,
      error: error instanceof Error ? error.message : String(error),
    });
    // Re-throw the error since version creation is critical for audit trails
    throw error;
  }
};