/**
 * Formats a role name for display in the UI.
 * Converts system role names to user-friendly display names.
 * - 'admin' -> 'Superadmin'
 * - 'editor' -> 'Editor'
 * - 'approver' -> 'Approver'
 * - 'user' -> 'User'
 */
export function formatRoleName(role: string): string {
  if (role === 'admin') {
    return 'Superadmin';
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
}
