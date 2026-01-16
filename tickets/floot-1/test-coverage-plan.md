# FLOOT-1: Super Admin Test Coverage Plan (TDD)

## Overview

This document outlines the test coverage strategy for the Super Admin feature using Test-Driven Development (TDD). Tests should be written **before** implementation code for each phase.

---

## Test Stack

| Layer | Framework | Location |
|-------|-----------|----------|
| Unit Tests | Vitest | `__tests__/unit/` |
| Integration Tests | Vitest + Supertest | `__tests__/integration/` |
| E2E Tests | Playwright | `__tests__/e2e/` |
| Component Tests | Vitest + Testing Library | `__tests__/components/` |

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
  });

  describe('superAdminImpersonationLogs table', () => {
    it('should require superAdminUserId foreign key');
    it('should require targetOrganizationId foreign key');
    it('should auto-generate startedAt timestamp');
    it('should allow null endedAt for active sessions');
    it('should store ipAddress up to 45 characters (IPv6)');
    it('should store userAgent as text');
  });
});
```

### 1.2 Migration Tests

**File**: `__tests__/integration/migrations/superAdmin.test.ts`

```typescript
describe('Super Admin Migrations', () => {
  it('should successfully run migration to add isSuperAdmin column');
  it('should successfully run migration to make organizationId nullable');
  it('should successfully create superAdminImpersonationLogs table');
  it('should create partial index on isSuperAdmin where true');
  it('should rollback cleanly without data loss');
  it('should preserve existing user data after migration');
});
```

---

## Phase 2: Authentication & Session Tests

### 2.1 Session Interface Tests

**File**: `__tests__/unit/helpers/getSetServerSession.test.ts`

```typescript
describe('Extended Session Interface', () => {
  describe('impersonation field', () => {
    it('should support optional impersonation object');
    it('should store organizationId in impersonation context');
    it('should store organizationName in impersonation context');
    it('should store startedAt timestamp in impersonation context');
    it('should return undefined when not impersonating');
  });

  describe('session serialization', () => {
    it('should correctly serialize session with impersonation to JWT');
    it('should correctly deserialize JWT to session with impersonation');
    it('should handle session without impersonation field');
  });
});
```

### 2.2 Super Admin Session Helper Tests

**File**: `__tests__/unit/helpers/getSuperAdminSession.test.ts`

```typescript
describe('getSuperAdminSession helpers', () => {
  describe('isSuperAdmin()', () => {
    it('should return true for user with isSuperAdmin=true');
    it('should return false for user with isSuperAdmin=false');
    it('should return false for user without isSuperAdmin field');
    it('should return false for null/undefined user');
  });

  describe('getImpersonationContext()', () => {
    it('should return impersonation object when active');
    it('should return null when not impersonating');
    it('should include organizationId, organizationName, startedAt');
  });

  describe('isImpersonating()', () => {
    it('should return true when session has impersonation context');
    it('should return false when session has no impersonation');
    it('should return false for null session');
  });
});
```

### 2.3 User Type Tests

**File**: `__tests__/unit/helpers/User.test.ts`

```typescript
describe('User type with super admin fields', () => {
  it('should include isSuperAdmin boolean field');
  it('should include optional impersonatingOrganization object');
  it('should correctly type impersonatingOrganization with id and name');
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
  });

  describe('failed login', () => {
    it('should return 401 for invalid password');
    it('should return 401 for non-existent email');
    it('should return 403 for valid user who is not super admin');
    it('should return 400 for missing email');
    it('should return 400 for missing password');
    it('should return 400 for invalid email format');
    it('should log superadmin_login_failed security event');
  });

  describe('rate limiting', () => {
    it('should allow up to N login attempts');
    it('should return 429 after exceeding rate limit');
    it('should reset rate limit after cooldown period');
  });

  describe('security', () => {
    it('should not reveal whether email exists on failure');
    it('should hash password comparison be timing-safe');
    it('should sanitize error messages');
  });
});
```

### 3.2 Organizations List Endpoint

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
  });

  describe('data accuracy', () => {
    it('should return correct userCount matching actual users');
    it('should return correct adminEmail from org admin');
    it('should format createdAt as ISO string');
  });

  describe('when impersonating', () => {
    it('should still return all organizations');
    it('should not filter based on impersonation context');
  });
});
```

### 3.3 Start Impersonation Endpoint

**File**: `__tests__/integration/endpoints/superadmin/impersonate.test.ts`

```typescript
describe('POST /_api/superadmin/impersonate', () => {
  describe('authorization', () => {
    it('should return 401 without authentication');
    it('should return 403 for non-super-admin user');
    it('should return 200 for authenticated super admin');
  });

  describe('successful impersonation', () => {
    it('should update session with impersonation context');
    it('should return user object with impersonatingOrganization');
    it('should log superadmin_impersonation_start event');
    it('should create entry in superAdminImpersonationLogs table');
    it('should store IP address in impersonation log');
    it('should store user agent in impersonation log');
  });

  describe('validation', () => {
    it('should return 400 for missing organizationId');
    it('should return 400 for non-numeric organizationId');
    it('should return 404 for non-existent organizationId');
  });

  describe('when already impersonating', () => {
    it('should switch to new organization');
    it('should end previous impersonation log entry');
    it('should create new impersonation log entry');
  });
});
```

### 3.4 Stop Impersonation Endpoint

**File**: `__tests__/integration/endpoints/superadmin/stop-impersonate.test.ts`

```typescript
describe('POST /_api/superadmin/stop-impersonate', () => {
  describe('authorization', () => {
    it('should return 401 without authentication');
    it('should return 403 for non-super-admin user');
  });

  describe('successful stop', () => {
    it('should clear impersonation from session');
    it('should return user without impersonatingOrganization');
    it('should log superadmin_impersonation_end event');
    it('should update endedAt in impersonation log');
  });

  describe('when not impersonating', () => {
    it('should return 400 when no active impersonation');
    it('should not create any log entries');
  });
});
```

### 3.5 Session Status Endpoint

**File**: `__tests__/integration/endpoints/superadmin/session.test.ts`

```typescript
describe('GET /_api/superadmin/session', () => {
  describe('authorization', () => {
    it('should return 401 without authentication');
    it('should return 403 for non-super-admin user');
  });

  describe('response without impersonation', () => {
    it('should return user with isSuperAdmin=true');
    it('should not include impersonatingOrganization');
  });

  describe('response with impersonation', () => {
    it('should return impersonatingOrganization object');
    it('should include organization id and name');
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
  });

  describe('form validation', () => {
    it('should show error for empty email');
    it('should show error for invalid email format');
    it('should show error for empty password');
    it('should disable submit button while loading');
  });

  describe('form submission', () => {
    it('should call login API with email and password');
    it('should redirect to /superadmin/organizations on success');
    it('should display error message on failure');
    it('should clear password field on failure');
  });

  describe('accessibility', () => {
    it('should have proper label associations');
    it('should support keyboard navigation');
    it('should announce errors to screen readers');
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
    it('should display Created Date column');
    it('should display Actions column');
    it('should show "Login As" button for each row');
  });

  describe('data loading', () => {
    it('should show loading state while fetching');
    it('should display organizations from API');
    it('should show empty state when no organizations');
    it('should handle API error gracefully');
  });

  describe('table functionality', () => {
    it('should sort by Name column when header clicked');
    it('should sort by Created Date column when header clicked');
    it('should sort by ID column when header clicked');
    it('should toggle sort direction on repeated clicks');
  });

  describe('search/filter (optional)', () => {
    it('should filter organizations by name');
    it('should show "no results" when filter matches nothing');
    it('should clear filter when X clicked');
  });

  describe('Login As action', () => {
    it('should call impersonate API when clicked');
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
    it('should redirect to super admin login on logout');
    it('should clear session cookie');
  });

  describe('styling', () => {
    it('should have minimal design without sidebar');
    it('should be responsive on mobile');
  });
});
```

### 4.4 Impersonation Banner Tests

**File**: `__tests__/components/ImpersonationBanner.test.tsx`

```typescript
describe('ImpersonationBanner', () => {
  describe('rendering', () => {
    it('should display "Viewing as admin of:" text');
    it('should display organization name');
    it('should render "Return to Panel" button');
  });

  describe('styling', () => {
    it('should have sticky positioning');
    it('should have high z-index (above nav)');
    it('should have warning/distinct background color');
  });

  describe('Return to Panel action', () => {
    it('should call stop-impersonate API');
    it('should redirect to /superadmin/organizations');
    it('should show loading state while processing');
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
  });

  describe('non-super-admin', () => {
    it('should show access denied for regular users');
    it('should show access denied for org admins');
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
    it('should still render normal layout content');
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
  });

  describe('isImpersonating', () => {
    it('should return true when impersonatingOrganization exists');
    it('should return false when not impersonating');
  });

  describe('impersonatedOrg', () => {
    it('should return organization object when impersonating');
    it('should return undefined when not impersonating');
  });

  describe('startImpersonation', () => {
    it('should call impersonate API with orgId');
    it('should update user context on success');
    it('should handle API errors');
  });

  describe('stopImpersonation', () => {
    it('should call stop-impersonate API');
    it('should clear impersonation context on success');
    it('should handle API errors');
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
    it('should deny access to org-specific pages');
    it('should allow access to super admin pages');
  });

  describe('super admin while impersonating', () => {
    it('should grant admin access to impersonated org pages');
    it('should pass role checks as admin');
    it('should use impersonated org for data fetching');
  });

  describe('effective organization resolution', () => {
    it('should return impersonated orgId when impersonating');
    it('should return user orgId when not impersonating');
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
    it('should include user ID and timestamp');
    it('should include IP address');
  });

  describe('superadmin_login_failed event', () => {
    it('should log failed login attempts');
    it('should include attempted email');
    it('should include failure reason');
  });

  describe('superadmin_impersonation_start event', () => {
    it('should log impersonation start');
    it('should include super admin user ID');
    it('should include target organization ID');
  });

  describe('superadmin_impersonation_end event', () => {
    it('should log impersonation end');
    it('should include duration of impersonation');
  });

  describe('actions while impersonating', () => {
    it('should include impersonatedBy field in action logs');
    it('should track original super admin ID');
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
    it('should not allow forged isSuperAdmin flag');
  });

  describe('session security', () => {
    it('should invalidate impersonation on session expiry');
    it('should clear impersonation on logout');
    it('should not leak impersonation across sessions');
  });

  describe('API security', () => {
    it('should validate organizationId exists before impersonation');
    it('should not expose sensitive org data to non-super-admins');
  });
});
```

---

## Phase 8: E2E Tests

### 8.1 Super Admin Login Flow

**File**: `__tests__/e2e/superadmin/login.spec.ts`

```typescript
describe('Super Admin Login E2E', () => {
  it('should complete full login flow');
  it('should show error for invalid credentials');
  it('should redirect to organizations page after login');
  it('should persist session across page refresh');
  it('should logout and redirect to login page');
});
```

### 8.2 Impersonation Flow

**File**: `__tests__/e2e/superadmin/impersonation.spec.ts`

```typescript
describe('Impersonation E2E', () => {
  it('should complete full impersonation flow');

  describe('step by step', () => {
    it('should login as super admin');
    it('should view organizations list');
    it('should click Login As for an organization');
    it('should see impersonation banner');
    it('should have admin access to org dashboard');
    it('should navigate org pages with banner visible');
    it('should return to panel via banner button');
    it('should no longer see banner after return');
  });

  describe('impersonation persistence', () => {
    it('should maintain impersonation across page navigation');
    it('should maintain impersonation on page refresh');
    it('should clear impersonation on logout');
  });
});
```

### 8.3 Regular User Unaffected

**File**: `__tests__/e2e/superadmin/regularUser.spec.ts`

```typescript
describe('Regular User Not Affected E2E', () => {
  it('should not show impersonation banner for regular users');
  it('should not allow access to /superadmin routes');
  it('should maintain normal login flow');
  it('should maintain normal dashboard access');
  it('should not see super admin UI elements');
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
```

### Seed Data

**File**: `__tests__/fixtures/seeds/superAdmin.seed.ts`

```typescript
export async function seedSuperAdmin(): Promise<User>;
export async function seedOrganizations(count: number): Promise<Organization[]>;
export async function seedImpersonationLogs(): Promise<ImpersonationLog[]>;
```

---

## Test Coverage Requirements

| Category | Minimum Coverage |
|----------|-----------------|
| Database migrations | 100% |
| Backend endpoints | 95% |
| Session/Auth helpers | 95% |
| Frontend components | 90% |
| Hooks | 95% |
| Security-critical paths | 100% |
| E2E critical flows | 100% |

---

## TDD Implementation Order

For each phase, follow this TDD cycle:

1. **Write failing tests first** (Red)
2. **Implement minimum code to pass** (Green)
3. **Refactor while keeping tests green** (Refactor)

### Recommended Test-First Order

1. Schema validation tests → Database migrations
2. Session interface tests → Session type changes
3. Super admin helper tests → Helper functions
4. Login endpoint tests → Login endpoint
5. Organizations endpoint tests → Organizations endpoint
6. Impersonate endpoint tests → Impersonate endpoint
7. Stop-impersonate endpoint tests → Stop-impersonate endpoint
8. Component tests → React components
9. Hook tests → Custom hooks
10. Integration tests → Route protection
11. Security tests → Security hardening
12. E2E tests → Full flow validation

---

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- __tests__/integration/endpoints/superadmin/login.test.ts

# Run tests in watch mode
npm run test:watch
```

---

## CI/CD Integration

Tests should run in this order in CI pipeline:

1. **Lint** - Code style checks
2. **Unit Tests** - Fast, isolated tests
3. **Integration Tests** - API and database tests
4. **E2E Tests** - Full browser tests (after deployment to staging)

### Required CI Checks

- [ ] All tests pass
- [ ] Coverage thresholds met
- [ ] No security vulnerabilities detected
- [ ] No console errors in E2E tests
