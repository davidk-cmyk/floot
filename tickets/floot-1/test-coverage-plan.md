# FLOOT-1: Super Admin Test Coverage Plan (TDD)

## Overview

This document outlines the test coverage strategy for the Super Admin feature using Test-Driven Development (TDD). Tests should be written **before** implementation code for each phase.

---

## Prerequisites Checklist

Before starting test implementation, verify:

- [ ] Vitest is installed and configured in `package.json`
- [ ] Playwright is installed for E2E tests
- [ ] Supertest is available for API integration tests
- [ ] React Testing Library is configured
- [ ] Test database is set up and isolated from development
- [ ] CI environment has test database access
- [ ] `__tests__/` directory structure matches this plan

---

## Test Stack

| Layer | Framework | Location |
|-------|-----------|----------|
| Unit Tests | Vitest | `__tests__/unit/` |
| Integration Tests | Vitest + Supertest | `__tests__/integration/` |
| E2E Tests | Playwright | `__tests__/e2e/` |
| Component Tests | Vitest + Testing Library | `__tests__/components/` |
| Performance Tests | Vitest + custom benchmarks | `__tests__/performance/` |
| Contract Tests | Vitest + Zod | `__tests__/contracts/` |

---

## Phase 1: Database Layer Tests

### 1.1 Schema Validation Tests

**File**: `__tests__/unit/schema/superAdmin.test.ts`

```typescript
describe('Super Admin Schema', () => {
  describe('users table modifications', () => {
    it('should allow null organizationId for super admin users');
    it('should have isSuperAdmin boolean field defaulting to false');
    it('should enforce isSuperAdmin as boolean type');
    it('should enforce constraint: super admin cannot have organizationId');
    it('should reject non-super-admin with null organizationId');
  });

  describe('superAdminImpersonationLogs table', () => {
    it('should require superAdminUserId foreign key');
    it('should require targetOrganizationId foreign key');
    it('should auto-generate startedAt timestamp');
    it('should allow null endedAt for active sessions');
    it('should store ipAddress up to 45 characters (IPv6)');
    it('should store userAgent as text');
    it('should store endReason as valid enum value');
    it('should cascade delete when user is deleted');
    it('should cascade delete when organization is deleted');
  });

  describe('unique constraints', () => {
    it('should enforce only one active impersonation per super admin');
    it('should allow multiple completed impersonations for same super admin');
    it('should allow same org to be impersonated by different super admins');
  });
});
```

### 1.2 Migration Tests

**File**: `__tests__/integration/migrations/superAdmin.test.ts`

```typescript
describe('Super Admin Migrations', () => {
  describe('forward migration', () => {
    it('should successfully add isSuperAdmin column');
    it('should successfully make organizationId nullable');
    it('should create superAdminImpersonationLogs table');
    it('should create partial index on isSuperAdmin where true');
    it('should create unique index for active impersonation');
    it('should create indexes for common queries');
  });

  describe('data preservation', () => {
    it('should preserve existing user data after migration');
    it('should default isSuperAdmin to false for existing users');
    it('should keep existing organizationId values intact');
  });

  describe('rollback migration', () => {
    it('should rollback cleanly when no super admins exist');
    it('should fail rollback if super admin users exist');
    it('should fail rollback if null organizationIds exist');
    it('should drop impersonation logs table on rollback');
    it('should remove indexes on rollback');
  });
});
```

### 1.3 Database Integrity Tests

**File**: `__tests__/integration/database/integrity.test.ts`

```typescript
describe('Database Integrity', () => {
  describe('foreign key constraints', () => {
    it('should reject impersonation log with non-existent super admin');
    it('should reject impersonation log with non-existent organization');
    it('should cascade delete impersonation logs when org deleted');
    it('should cascade delete impersonation logs when user deleted');
  });

  describe('check constraints', () => {
    it('should reject super admin with non-null organizationId');
    it('should reject non-super-admin with null organizationId');
  });

  describe('partial unique index', () => {
    it('should prevent two active impersonations for same super admin');
    it('should allow new active impersonation after previous ended');
  });
});
```

---

## Phase 2: Authentication & Session Tests

### 2.1 Session Interface Tests

**File**: `__tests__/unit/helpers/getSetServerSession.test.ts`

```typescript
describe('Extended Session Interface', () => {
  describe('activeImpersonationId field', () => {
    it('should support optional activeImpersonationId');
    it('should store impersonation ID as number');
    it('should return undefined when not impersonating');
  });

  describe('session serialization', () => {
    it('should correctly serialize session with impersonation to JWT');
    it('should correctly deserialize JWT to session with impersonation');
    it('should handle session without impersonation field');
    it('should not include sensitive data in JWT payload');
  });

  describe('session updates', () => {
    it('should update session with activeImpersonationId');
    it('should clear activeImpersonationId when set to null');
  });
});
```

### 2.2 Super Admin Helper Tests

**File**: `__tests__/unit/helpers/superAdmin.test.ts`

```typescript
describe('superAdmin helpers', () => {
  describe('isSuperAdmin()', () => {
    it('should return true for user with isSuperAdmin=true');
    it('should return false for user with isSuperAdmin=false');
    it('should return false for user without isSuperAdmin field');
    it('should return false for null user');
    it('should return false for undefined user');
  });

  describe('getActiveImpersonation()', () => {
    it('should return impersonation object when active');
    it('should return null when no active impersonation');
    it('should return null when all impersonations are ended');
    it('should include organizationId, organizationName, startedAt');
    it('should join with organizations table for name');
  });

  describe('isImpersonationExpired()', () => {
    it('should return false for impersonation started now');
    it('should return false for impersonation started 7 hours ago');
    it('should return true for impersonation started 8 hours ago');
    it('should return true for impersonation started 24 hours ago');
    it('should handle timezone differences correctly');
  });

  describe('getEffectiveOrganizationId()', () => {
    it('should return user organizationId for non-super-admin');
    it('should return null for super admin without active impersonation');
    it('should return impersonated orgId for active impersonation');
    it('should return null and end impersonation if expired');
    it('should handle database errors gracefully');
  });

  describe('requireOrganizationId()', () => {
    it('should return orgId for non-super-admin');
    it('should return impersonated orgId for impersonating super admin');
    it('should throw ForbiddenError for super admin not impersonating');
    it('should provide helpful error message for super admin');
  });

  describe('startImpersonation()', () => {
    it('should create impersonation record in database');
    it('should end any existing active impersonation first');
    it('should return new impersonation ID');
    it('should store IP address and user agent');
    it('should throw NotFoundError for non-existent organization');
    it('should handle concurrent start requests (race condition)');
  });

  describe('endImpersonation()', () => {
    it('should set endedAt timestamp on active impersonation');
    it('should set endReason to provided value');
    it('should not modify already-ended impersonations');
    it('should handle case when no active impersonation exists');
  });
});
```

### 2.3 User Type Tests

**File**: `__tests__/unit/helpers/User.test.ts`

```typescript
describe('User type with super admin fields', () => {
  it('should include isSuperAdmin boolean field');
  it('should allow null organizationId');
  it('should include optional impersonating object');
  it('should correctly type impersonating with id, name, startedAt');
});
```

---

## Phase 3: Backend Endpoint Tests

### 3.1 Super Admin Login Endpoint

**File**: `__tests__/integration/endpoints/superadmin/login.test.ts`

```typescript
describe('POST /_api/superadmin/login', () => {
  describe('successful login', () => {
    it('should return 200 with user data for valid super admin credentials');
    it('should set session cookie on successful login');
    it('should return isSuperAdmin=true in response');
    it('should not include organizationId for super admin');
    it('should log superadmin_login security event');
    it('should invalidate previous sessions for this user');
  });

  describe('failed login', () => {
    it('should return 401 for invalid password');
    it('should return 401 for non-existent email');
    it('should return 401 for valid user who is not super admin');
    it('should return 400 for missing email');
    it('should return 400 for missing password');
    it('should return 400 for invalid email format');
    it('should log superadmin_login_failed security event');
    it('should use same error message for all auth failures (prevent enumeration)');
  });

  describe('CSRF protection', () => {
    it('should return 403 without CSRF token');
    it('should return 403 with invalid CSRF token');
    it('should return 403 with mismatched CSRF token');
    it('should succeed with valid CSRF token');
  });

  describe('rate limiting', () => {
    it('should allow first 5 login attempts');
    it('should return 429 after 5 failed attempts');
    it('should rate limit by IP and email combination');
    it('should reset rate limit after 15 minutes');
    it('should apply 30-minute lockout after rate limit exceeded');
    it('should log rate limit events');
  });

  describe('security', () => {
    it('should not reveal whether email exists on failure');
    it('should use timing-safe password comparison');
    it('should sanitize error messages');
    it('should not include password hash in logs');
  });

  describe('edge cases', () => {
    it('should handle database connection failure gracefully');
    it('should handle bcrypt comparison failure gracefully');
    it('should trim and lowercase email before lookup');
  });
});
```

### 3.2 Super Admin Logout Endpoint

**File**: `__tests__/integration/endpoints/superadmin/logout.test.ts`

```typescript
describe('POST /_api/superadmin/logout', () => {
  describe('authorization', () => {
    it('should return 401 without authentication');
    it('should return 403 for non-super-admin user');
  });

  describe('successful logout', () => {
    it('should return 200 on successful logout');
    it('should clear session cookie');
    it('should invalidate session in database');
    it('should end any active impersonation');
    it('should log superadmin_logout security event');
  });

  describe('CSRF protection', () => {
    it('should return 403 without CSRF token');
    it('should succeed with valid CSRF token');
  });

  describe('with active impersonation', () => {
    it('should end impersonation before clearing session');
    it('should log impersonation end with reason "logout"');
    it('should update impersonation log endedAt');
  });
});
```

### 3.3 Organizations List Endpoint

**File**: `__tests__/integration/endpoints/superadmin/organizations.test.ts`

```typescript
describe('GET /_api/superadmin/organizations', () => {
  describe('authorization', () => {
    it('should return 401 without authentication');
    it('should return 403 for non-super-admin user');
    it('should return 200 for authenticated super admin');
  });

  describe('response data', () => {
    it('should return array of organizations');
    it('should include id, name, slug, createdAt for each org');
    it('should include userCount for each organization');
    it('should include adminEmail (or null) for each org');
    it('should return empty array when no organizations exist');
    it('should format createdAt as ISO string');
  });

  describe('pagination', () => {
    it('should return 25 items per page by default');
    it('should return correct pagination metadata');
    it('should return correct totalPages calculation');
    it('should return empty array for page beyond total');
    it('should respect custom pageSize parameter');
    it('should cap pageSize at 100');
  });

  describe('search', () => {
    it('should filter organizations by name (case insensitive)');
    it('should return empty array when no matches');
    it('should update pagination based on search results');
    it('should handle special characters in search');
  });

  describe('sorting', () => {
    it('should sort by name ascending by default');
    it('should sort by name descending when specified');
    it('should sort by createdAt ascending');
    it('should sort by createdAt descending');
    it('should sort by userCount ascending');
    it('should sort by userCount descending');
  });

  describe('data accuracy', () => {
    it('should return correct userCount matching actual users');
    it('should return correct adminEmail from org admin');
    it('should handle org with no admin');
    it('should handle org with multiple admins (return first)');
  });

  describe('when impersonating', () => {
    it('should still return all organizations');
    it('should not filter based on impersonation context');
  });
});
```

### 3.4 Organization Details Endpoint

**File**: `__tests__/integration/endpoints/superadmin/organizationDetail.test.ts`

```typescript
describe('GET /_api/superadmin/organizations/:id', () => {
  describe('authorization', () => {
    it('should return 401 without authentication');
    it('should return 403 for non-super-admin user');
    it('should return 200 for authenticated super admin');
  });

  describe('successful response', () => {
    it('should return organization details');
    it('should include all organization fields');
    it('should include userCount');
    it('should include admin info if exists');
  });

  describe('validation', () => {
    it('should return 404 for non-existent organization');
    it('should return 400 for invalid ID format');
    it('should return 400 for negative ID');
  });
});
```

### 3.5 Start Impersonation Endpoint

**File**: `__tests__/integration/endpoints/superadmin/impersonate.test.ts`

```typescript
describe('POST /_api/superadmin/impersonate', () => {
  describe('authorization', () => {
    it('should return 401 without authentication');
    it('should return 403 for non-super-admin user');
    it('should return 200 for authenticated super admin');
  });

  describe('CSRF protection', () => {
    it('should return 403 without CSRF token');
    it('should succeed with valid CSRF token');
  });

  describe('successful impersonation', () => {
    it('should update session with impersonation context');
    it('should return user object with impersonating field');
    it('should log superadmin_impersonation_start event');
    it('should create entry in superAdminImpersonationLogs table');
    it('should store IP address in impersonation log');
    it('should store user agent in impersonation log');
    it('should return organization name in response');
  });

  describe('validation', () => {
    it('should return 400 for missing organizationId');
    it('should return 400 for non-numeric organizationId');
    it('should return 400 for negative organizationId');
    it('should return 404 for non-existent organizationId');
  });

  describe('when already impersonating', () => {
    it('should switch to new organization');
    it('should end previous impersonation log entry');
    it('should set previous endReason to "manual"');
    it('should create new impersonation log entry');
    it('should log both end and start events');
  });

  describe('concurrent requests', () => {
    it('should handle two simultaneous impersonate requests safely');
    it('should result in only one active impersonation');
  });
});
```

### 3.6 Stop Impersonation Endpoint

**File**: `__tests__/integration/endpoints/superadmin/stop-impersonate.test.ts`

```typescript
describe('POST /_api/superadmin/stop-impersonate', () => {
  describe('authorization', () => {
    it('should return 401 without authentication');
    it('should return 403 for non-super-admin user');
  });

  describe('CSRF protection', () => {
    it('should return 403 without CSRF token');
    it('should succeed with valid CSRF token');
  });

  describe('successful stop', () => {
    it('should clear impersonation from session');
    it('should return user without impersonating field');
    it('should log superadmin_impersonation_end event');
    it('should update endedAt in impersonation log');
    it('should set endReason to "manual"');
    it('should include duration in log event');
  });

  describe('when not impersonating', () => {
    it('should return 400 when no active impersonation');
    it('should not create any log entries');
  });
});
```

### 3.7 Session Status Endpoint

**File**: `__tests__/integration/endpoints/superadmin/session.test.ts`

```typescript
describe('GET /_api/superadmin/session', () => {
  describe('authorization', () => {
    it('should return 401 without authentication');
    it('should return 403 for non-super-admin user');
  });

  describe('response without impersonation', () => {
    it('should return user with isSuperAdmin=true');
    it('should not include impersonating field');
  });

  describe('response with impersonation', () => {
    it('should return impersonating object');
    it('should include organization id and name');
    it('should include startedAt timestamp');
  });

  describe('expired impersonation handling', () => {
    it('should detect expired impersonation');
    it('should end expired impersonation automatically');
    it('should return impersonationExpired=true');
    it('should log expiration event');
  });
});
```

---

## Phase 4: Frontend Component Tests

### 4.1 Super Admin Login Page Tests

**File**: `__tests__/components/pages/superadmin.login.test.tsx`

```typescript
describe('SuperAdminLoginPage', () => {
  describe('rendering', () => {
    it('should render email input field');
    it('should render password input field');
    it('should render login button');
    it('should display "Super Admin" branding');
    it('should not show link to regular login');
    it('should not show forgot password link');
  });

  describe('form validation', () => {
    it('should show error for empty email');
    it('should show error for invalid email format');
    it('should show error for empty password');
    it('should disable submit button while loading');
    it('should enable submit button when form is valid');
  });

  describe('form submission', () => {
    it('should call login API with email and password');
    it('should include CSRF token in request');
    it('should redirect to /superadmin/organizations on success');
    it('should display error message on failure');
    it('should clear password field on failure');
    it('should not clear email field on failure');
  });

  describe('loading state', () => {
    it('should show loading indicator during submission');
    it('should disable form inputs during submission');
  });

  describe('accessibility', () => {
    it('should have proper label associations');
    it('should support keyboard navigation');
    it('should announce errors to screen readers');
    it('should focus email field on mount');
    it('should have proper aria attributes');
  });
});
```

### 4.2 Organizations List Page Tests

**File**: `__tests__/components/pages/superadmin.organizations.test.tsx`

```typescript
describe('SuperAdminOrganizationsPage', () => {
  describe('rendering', () => {
    it('should render organizations table');
    it('should display ID column');
    it('should display Name column');
    it('should display Slug column');
    it('should display Admin column');
    it('should display Users column');
    it('should display Created Date column');
    it('should display Actions column');
    it('should show "Login As" button for each row');
  });

  describe('data loading', () => {
    it('should show loading state while fetching');
    it('should display organizations from API');
    it('should show empty state when no organizations');
    it('should handle API error gracefully');
    it('should show error message on failure');
  });

  describe('table functionality', () => {
    it('should sort by Name column when header clicked');
    it('should sort by Created Date column when header clicked');
    it('should sort by Users column when header clicked');
    it('should toggle sort direction on repeated clicks');
    it('should show sort indicator on active column');
  });

  describe('pagination', () => {
    it('should show pagination when more than one page');
    it('should hide pagination when single page');
    it('should navigate to next page');
    it('should navigate to previous page');
    it('should disable previous on first page');
    it('should disable next on last page');
    it('should show current page number');
  });

  describe('search', () => {
    it('should filter organizations by name');
    it('should show "no results" when filter matches nothing');
    it('should reset to page 1 when search changes');
    it('should debounce search input');
  });

  describe('Login As action', () => {
    it('should show confirmation modal when clicked');
    it('should display organization name in modal');
    it('should warn that actions will be logged');
    it('should call impersonate API on confirm');
    it('should close modal on cancel');
    it('should redirect to org dashboard on success');
    it('should show error toast on failure');
    it('should disable button while loading');
  });
});
```

### 4.3 Super Admin Layout Tests

**File**: `__tests__/components/SuperAdminLayout.test.tsx`

```typescript
describe('SuperAdminLayout', () => {
  describe('rendering', () => {
    it('should render "Super Admin Panel" title');
    it('should render logout button');
    it('should render children content');
  });

  describe('logout', () => {
    it('should call logout API when clicked');
    it('should include CSRF token in request');
    it('should redirect to super admin login on logout');
    it('should clear query cache on logout');
    it('should show loading state while logging out');
  });

  describe('styling', () => {
    it('should have minimal design without sidebar');
    it('should be responsive on mobile');
    it('should have dark header');
  });
});
```

### 4.4 Impersonation Banner Tests

**File**: `__tests__/components/ImpersonationBanner.test.tsx`

```typescript
describe('ImpersonationBanner', () => {
  describe('rendering', () => {
    it('should display warning icon');
    it('should display "IMPERSONATING:" text');
    it('should display organization name');
    it('should display elapsed time');
    it('should render "Return to Panel" button');
  });

  describe('elapsed time', () => {
    it('should show 0h 0m initially');
    it('should update every minute');
    it('should format hours and minutes correctly');
  });

  describe('styling', () => {
    it('should have sticky positioning');
    it('should have highest z-index (9999)');
    it('should have warning/amber background color');
    it('should be visible above all other content');
  });

  describe('Return to Panel action', () => {
    it('should call stop-impersonate API');
    it('should include CSRF token');
    it('should redirect to /superadmin/organizations');
    it('should show loading state while processing');
    it('should invalidate user query on success');
  });

  describe('conditional rendering', () => {
    it('should return null when not impersonating');
    it('should render when impersonating');
  });
});
```

### 4.5 Super Admin Protected Route Tests

**File**: `__tests__/components/SuperAdminProtectedRoute.test.tsx`

```typescript
describe('SuperAdminProtectedRoute', () => {
  describe('loading state', () => {
    it('should show loading spinner while auth loading');
  });

  describe('unauthenticated', () => {
    it('should redirect to /superadmin/login when not logged in');
    it('should use replace navigation');
  });

  describe('non-super-admin', () => {
    it('should show access denied for regular users');
    it('should show access denied for org admins');
    it('should display helpful error message');
  });

  describe('super admin', () => {
    it('should render children for authenticated super admin');
  });
});
```

### 4.6 Dashboard Layout Integration Tests

**File**: `__tests__/components/DashboardLayout.test.tsx`

```typescript
describe('DashboardLayout with impersonation', () => {
  describe('without impersonation', () => {
    it('should not render ImpersonationBanner');
    it('should render normal layout');
  });

  describe('with impersonation', () => {
    it('should render ImpersonationBanner at top');
    it('should render banner above sidebar');
    it('should render banner with highest z-index');
    it('should still render normal layout content');
  });
});
```

### 4.7 Confirm Modal Tests

**File**: `__tests__/components/ConfirmModal.test.tsx`

```typescript
describe('ConfirmModal', () => {
  describe('rendering', () => {
    it('should display title');
    it('should display message');
    it('should display confirm button with custom label');
    it('should display cancel button');
  });

  describe('interactions', () => {
    it('should call onConfirm when confirm clicked');
    it('should call onCancel when cancel clicked');
    it('should call onCancel when backdrop clicked');
    it('should call onCancel when Escape pressed');
  });

  describe('accessibility', () => {
    it('should trap focus within modal');
    it('should have proper aria attributes');
    it('should restore focus on close');
  });
});
```

---

## Phase 5: Hook Tests

### 5.1 useSuperAdmin Hook Tests

**File**: `__tests__/unit/helpers/useSuperAdmin.test.ts`

```typescript
describe('useSuperAdmin hook', () => {
  describe('isSuperAdmin', () => {
    it('should return true when user.isSuperAdmin is true');
    it('should return false when user.isSuperAdmin is false');
    it('should return false when user is null');
    it('should return false when user is undefined');
  });

  describe('isImpersonating', () => {
    it('should return true when impersonating field exists');
    it('should return false when not impersonating');
    it('should return false when user is null');
  });

  describe('impersonatedOrg', () => {
    it('should return organization object when impersonating');
    it('should include organizationId, organizationName, startedAt');
    it('should return undefined when not impersonating');
  });

  describe('startImpersonation', () => {
    it('should call impersonate API with orgId');
    it('should include CSRF token in request');
    it('should return response on success');
    it('should throw error on API failure');
    it('should throw with error message from API');
  });

  describe('stopImpersonation', () => {
    it('should call stop-impersonate API');
    it('should include CSRF token in request');
    it('should return response on success');
    it('should throw error on API failure');
  });
});
```

---

## Phase 6: Route Protection Tests

### 6.1 ProtectedRoute Integration Tests

**File**: `__tests__/integration/routing/protectedRoute.test.ts`

```typescript
describe('ProtectedRoute with super admin impersonation', () => {
  describe('super admin without impersonation', () => {
    it('should redirect to /superadmin/organizations for org pages');
    it('should allow access to super admin pages');
    it('should not show regular dashboard');
  });

  describe('super admin while impersonating', () => {
    it('should grant admin access to impersonated org pages');
    it('should pass role checks as admin');
    it('should use impersonated org for data fetching');
    it('should show regular dashboard UI');
  });

  describe('effective organization resolution', () => {
    it('should return impersonated orgId when impersonating');
    it('should return null when super admin not impersonating');
    it('should return user orgId for regular users');
  });

  describe('role-based access', () => {
    it('should grant admin-only page access when impersonating');
    it('should deny editor-only pages when impersonating as admin');
  });
});
```

---

## Phase 7: Security Tests

### 7.1 Audit Logging Tests

**File**: `__tests__/integration/security/auditLogging.test.ts`

```typescript
describe('Super Admin Audit Logging', () => {
  describe('superadmin_login event', () => {
    it('should log successful super admin login');
    it('should include user ID');
    it('should include timestamp');
    it('should include IP address');
    it('should include user agent');
  });

  describe('superadmin_login_failed event', () => {
    it('should log failed login attempts');
    it('should include attempted email');
    it('should include failure reason');
    it('should include IP address');
    it('should NOT include password');
  });

  describe('superadmin_logout event', () => {
    it('should log logout');
    it('should include user ID');
    it('should include IP address');
  });

  describe('superadmin_impersonation_start event', () => {
    it('should log impersonation start');
    it('should include super admin user ID');
    it('should include target organization ID');
    it('should include organization name');
    it('should include IP address');
    it('should include user agent');
  });

  describe('superadmin_impersonation_end event', () => {
    it('should log impersonation end');
    it('should include super admin user ID');
    it('should include target organization ID');
    it('should include duration in milliseconds');
    it('should include end reason');
  });

  describe('superadmin_impersonation_expired event', () => {
    it('should log auto-expiration');
    it('should include duration');
  });

  describe('actions while impersonating', () => {
    it('should include impersonatedBy field in action logs');
    it('should track original super admin ID');
    it('should not attribute actions to organization admin');
  });
});
```

### 7.2 Authorization Security Tests

**File**: `__tests__/integration/security/authorization.test.ts`

```typescript
describe('Super Admin Authorization Security', () => {
  describe('privilege escalation prevention', () => {
    it('should not allow regular user to access super admin endpoints');
    it('should not allow org admin to impersonate other orgs');
    it('should not allow forged isSuperAdmin flag in request');
    it('should validate super admin status from database, not token');
  });

  describe('session security', () => {
    it('should invalidate impersonation on session expiry');
    it('should clear impersonation on logout');
    it('should not leak impersonation across sessions');
    it('should invalidate old session on new login');
    it('should handle session hijacking attempts');
  });

  describe('API security', () => {
    it('should validate organizationId exists before impersonation');
    it('should not expose sensitive org data to non-super-admins');
    it('should validate all input parameters');
    it('should sanitize output to prevent XSS');
  });

  describe('CSRF protection', () => {
    it('should reject login without CSRF token');
    it('should reject impersonate without CSRF token');
    it('should reject stop-impersonate without CSRF token');
    it('should reject logout without CSRF token');
    it('should accept valid CSRF token');
  });

  describe('rate limiting', () => {
    it('should rate limit super admin login separately from regular login');
    it('should apply stricter limits to super admin endpoints');
    it('should not reveal rate limit status to attackers');
  });
});
```

### 7.3 Data Protection Tests

**File**: `__tests__/integration/security/dataProtection.test.ts`

```typescript
describe('Data Protection', () => {
  describe('sensitive data handling', () => {
    it('should not include password hash in any API response');
    it('should not log passwords');
    it('should not include session tokens in logs');
  });

  describe('data isolation', () => {
    it('should only show impersonated org data when impersonating');
    it('should not leak other org data during impersonation');
    it('should clear impersonation context on org deletion');
  });
});
```

---

## Phase 8: E2E Tests

### 8.1 Super Admin Login Flow

**File**: `__tests__/e2e/superadmin/login.spec.ts`

```typescript
describe('Super Admin Login E2E', () => {
  it('should display login page at /superadmin/login');
  it('should complete full login flow');
  it('should show error for invalid credentials');
  it('should show error for non-super-admin user');
  it('should redirect to organizations page after login');
  it('should persist session across page refresh');
  it('should logout and redirect to login page');
  it('should show rate limit error after multiple failures');
});
```

### 8.2 Organizations List Flow

**File**: `__tests__/e2e/superadmin/organizations.spec.ts`

```typescript
describe('Organizations List E2E', () => {
  beforeEach('login as super admin');

  it('should display organizations table');
  it('should paginate through organizations');
  it('should search organizations by name');
  it('should sort by different columns');
  it('should show organization details on row');
});
```

### 8.3 Impersonation Flow

**File**: `__tests__/e2e/superadmin/impersonation.spec.ts`

```typescript
describe('Impersonation E2E', () => {
  beforeEach('login as super admin');

  it('should complete full impersonation flow');

  describe('step by step', () => {
    it('should view organizations list');
    it('should show confirmation modal on Login As click');
    it('should cancel impersonation from modal');
    it('should confirm and start impersonation');
    it('should see impersonation banner');
    it('should show organization name in banner');
    it('should show elapsed time in banner');
    it('should have admin access to org dashboard');
    it('should navigate org pages with banner visible');
    it('should return to panel via banner button');
    it('should no longer see banner after return');
  });

  describe('impersonation persistence', () => {
    it('should maintain impersonation across page navigation');
    it('should maintain impersonation on page refresh');
    it('should maintain banner visibility across routes');
    it('should clear impersonation on logout');
  });

  describe('switching organizations', () => {
    it('should allow switching to different org');
    it('should update banner with new org name');
    it('should reset elapsed time');
  });
});
```

### 8.4 Impersonation Expiration Flow

**File**: `__tests__/e2e/superadmin/impersonationExpiry.spec.ts`

```typescript
describe('Impersonation Expiration E2E', () => {
  it('should auto-expire after 8 hours');
  it('should show expiration message');
  it('should redirect to super admin panel');
  it('should log expiration event');
});
```

### 8.5 Regular User Unaffected

**File**: `__tests__/e2e/superadmin/regularUser.spec.ts`

```typescript
describe('Regular User Not Affected E2E', () => {
  it('should not show impersonation banner for regular users');
  it('should not allow access to /superadmin/login');
  it('should not allow access to /superadmin/organizations');
  it('should redirect /superadmin/* to 404 or home');
  it('should maintain normal login flow');
  it('should maintain normal dashboard access');
  it('should not see super admin UI elements');
});
```

### 8.6 Edge Cases E2E

**File**: `__tests__/e2e/superadmin/edgeCases.spec.ts`

```typescript
describe('Edge Cases E2E', () => {
  describe('organization deletion during impersonation', () => {
    it('should handle org deletion gracefully');
    it('should show error message');
    it('should redirect to super admin panel');
    it('should clear impersonation state');
  });

  describe('concurrent sessions', () => {
    it('should invalidate first session when logging in from second browser');
    it('should show session expired message in first browser');
  });

  describe('super admin flag revocation', () => {
    it('should handle flag removal during active session');
    it('should deny access on next request');
  });
});
```

---

## Phase 9: Performance Tests

### 9.1 API Performance Tests

**File**: `__tests__/performance/api.test.ts`

```typescript
describe('Super Admin API Performance', () => {
  describe('organizations list', () => {
    it('should load 100 organizations in < 200ms');
    it('should load 1000 organizations in < 500ms');
    it('should paginate efficiently');
    it('should search efficiently with index');
  });

  describe('impersonation', () => {
    it('should start impersonation in < 200ms');
    it('should stop impersonation in < 200ms');
    it('should check session status in < 50ms');
  });

  describe('authentication', () => {
    it('should complete login in < 500ms');
    it('should validate session in < 50ms');
  });
});
```

### 9.2 Database Performance Tests

**File**: `__tests__/performance/database.test.ts`

```typescript
describe('Database Performance', () => {
  describe('indexes', () => {
    it('should use index for super admin lookup');
    it('should use index for active impersonation lookup');
    it('should use index for organization search');
  });

  describe('query efficiency', () => {
    it('should not N+1 on organizations list');
    it('should use efficient joins');
  });
});
```

---

## Phase 10: Contract Tests

### 10.1 API Response Schema Tests

**File**: `__tests__/contracts/apiSchemas.test.ts`

```typescript
describe('API Response Schemas', () => {
  describe('login response', () => {
    it('should match expected schema');
    it('should include all required fields');
  });

  describe('organizations list response', () => {
    it('should match expected schema');
    it('should include pagination metadata');
  });

  describe('impersonate response', () => {
    it('should match expected schema');
    it('should include impersonating object');
  });

  describe('error responses', () => {
    it('should match error schema');
    it('should include code and message');
  });
});
```

### 10.2 Frontend-Backend Contract Tests

**File**: `__tests__/contracts/frontendBackend.test.ts`

```typescript
describe('Frontend-Backend Contract', () => {
  it('should have matching TypeScript types and API responses');
  it('should validate Zod schemas match API behavior');
  it('should ensure all required fields are present');
});
```

---

## Test Data Fixtures

### Factory Functions

**File**: `__tests__/fixtures/superAdmin.ts`

```typescript
export function createSuperAdminUser(overrides?: Partial<User>): User;
export function createRegularUser(overrides?: Partial<User>): User;
export function createOrganization(overrides?: Partial<Organization>): Organization;
export function createImpersonationSession(superAdminId: number, orgId: number): Session;
export function createImpersonationLog(overrides?: Partial<ImpersonationLog>): ImpersonationLog;
export function createExpiredImpersonation(superAdminId: number, orgId: number): ImpersonationLog;
```

### Seed Data

**File**: `__tests__/fixtures/seeds/superAdmin.seed.ts`

```typescript
export async function seedSuperAdmin(): Promise<User>;
export async function seedOrganizations(count: number): Promise<Organization[]>;
export async function seedOrganizationsWithUsers(count: number): Promise<Organization[]>;
export async function seedImpersonationLogs(): Promise<ImpersonationLog[]>;
export async function seedExpiredImpersonation(superAdminId: number): Promise<ImpersonationLog>;
export async function cleanupTestData(): Promise<void>;
```

### Mock Helpers

**File**: `__tests__/fixtures/mocks.ts`

```typescript
export function mockSuperAdminSession(): Session;
export function mockImpersonatingSession(orgId: number): Session;
export function mockCsrfToken(): string;
export function mockRequest(overrides?: Partial<Request>): Request;
export function mockResponse(): Response;
```

---

## Test Coverage Requirements

| Category | Minimum Coverage | Critical Paths |
|----------|-----------------|----------------|
| Database migrations | 100% | All |
| Backend endpoints | 95% | Auth, impersonation |
| Session/Auth helpers | 95% | All |
| Frontend components | 90% | Login, banner |
| Hooks | 95% | useSuperAdmin |
| Security-critical paths | 100% | All |
| E2E critical flows | 100% | Login, impersonation |
| Performance benchmarks | N/A | Must pass thresholds |

---

## TDD Implementation Order

For each phase, follow this TDD cycle:

1. **Write failing tests first** (Red)
2. **Implement minimum code to pass** (Green)
3. **Refactor while keeping tests green** (Refactor)

### Recommended Test-First Order

1. Database integrity tests → Database migrations
2. Schema validation tests → Schema type changes
3. Super admin helper tests → Helper functions
4. CSRF helper tests → CSRF implementation
5. Login endpoint tests → Login endpoint
6. Logout endpoint tests → Logout endpoint
7. Organizations endpoint tests → Organizations endpoint
8. Impersonate endpoint tests → Impersonate endpoint
9. Stop-impersonate endpoint tests → Stop-impersonate endpoint
10. Session endpoint tests → Session endpoint
11. Component tests → React components
12. Hook tests → Custom hooks
13. Integration tests → Route protection
14. Security tests → Security hardening
15. Performance tests → Optimization (if needed)
16. Contract tests → API schema validation
17. E2E tests → Full flow validation

---

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run component tests only
npm run test:components

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:perf

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- __tests__/integration/endpoints/superadmin/login.test.ts

# Run tests matching pattern
npm test -- --grep "super admin login"

# Run tests in watch mode
npm run test:watch

# Run E2E tests headed (visible browser)
npm run test:e2e -- --headed

# Run E2E tests for specific browser
npm run test:e2e -- --project=chromium
```

---

## CI/CD Integration

Tests should run in this order in CI pipeline:

1. **Lint** - Code style checks
2. **Type Check** - TypeScript compilation
3. **Unit Tests** - Fast, isolated tests (~30s)
4. **Integration Tests** - API and database tests (~2min)
5. **Component Tests** - React component tests (~1min)
6. **Contract Tests** - Schema validation (~30s)
7. **E2E Tests** - Full browser tests (~5min, after staging deploy)
8. **Performance Tests** - Benchmark tests (~1min)

### Required CI Checks

- [ ] All tests pass
- [ ] Coverage thresholds met (95% backend, 90% frontend)
- [ ] No security vulnerabilities detected
- [ ] No console errors in E2E tests
- [ ] Performance benchmarks pass
- [ ] No TypeScript errors
- [ ] Linting passes

### CI Environment Variables

```yaml
TEST_DATABASE_URL: postgresql://test@localhost/floot_test
REDIS_URL: redis://localhost:6379/1
CI: true
NODE_ENV: test
```

### Parallel Test Execution

```yaml
# Run in parallel for speed
test-unit:
  runs-on: ubuntu-latest
  steps:
    - run: npm run test:unit

test-integration:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:14
  steps:
    - run: npm run test:integration

test-e2e:
  runs-on: ubuntu-latest
  needs: [deploy-staging]
  steps:
    - run: npm run test:e2e
```
