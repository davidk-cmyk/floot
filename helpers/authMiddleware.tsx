import { getServerUserSession } from './getServerUserSession';
import { UnauthorizedError } from './apiResponse';
import { UserRole } from './schema';

/**
 * Authorization Middleware
 * Provides reusable authorization checks for endpoints
 */

// User with session context
export interface AuthenticatedUser {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  organizationId: number;
}

export interface AuthContext {
  user: AuthenticatedUser;
}

/**
 * Require authentication for an endpoint.
 * Throws NotAuthenticatedError if no valid session.
 */
export async function requireAuth(request: Request): Promise<AuthContext> {
  const { user } = await getServerUserSession(request);
  return { user };
}

/**
 * Require specific role(s) for an endpoint.
 * Throws UnauthorizedError if user doesn't have required role.
 */
export async function requireRole(
  request: Request,
  ...allowedRoles: UserRole[]
): Promise<AuthContext> {
  const { user } = await getServerUserSession(request);

  if (!allowedRoles.includes(user.role)) {
    const rolesText = allowedRoles.length === 1
      ? allowedRoles[0]
      : allowedRoles.slice(0, -1).join(', ') + ' or ' + allowedRoles[allowedRoles.length - 1];
    throw new UnauthorizedError(`This action requires ${rolesText} role.`);
  }

  return { user };
}

/**
 * Require admin role for an endpoint.
 */
export async function requireAdmin(request: Request): Promise<AuthContext> {
  return requireRole(request, 'admin');
}

/**
 * Require admin or editor role for an endpoint.
 */
export async function requireEditor(request: Request): Promise<AuthContext> {
  return requireRole(request, 'admin', 'editor');
}

/**
 * Verify that a resource belongs to the user's organization.
 * Throws UnauthorizedError if organization mismatch.
 */
export function requireOrganizationAccess(
  user: AuthenticatedUser,
  resourceOrganizationId: number,
  resourceName: string = 'resource'
): void {
  if (user.organizationId !== resourceOrganizationId) {
    throw new UnauthorizedError(`You do not have access to this ${resourceName}.`);
  }
}

/**
 * Verify that the user owns a resource or is an admin.
 * Throws UnauthorizedError if neither condition is met.
 */
export function requireOwnershipOrAdmin(
  user: AuthenticatedUser,
  resourceOwnerId: number,
  resourceName: string = 'resource'
): void {
  if (user.id !== resourceOwnerId && user.role !== 'admin') {
    throw new UnauthorizedError(`You do not have permission to modify this ${resourceName}.`);
  }
}
