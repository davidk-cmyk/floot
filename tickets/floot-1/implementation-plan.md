# FLOOT-1: Super Admin Implementation Plan

## Codebase Analysis Summary

### Current Authentication System
- **JWT-based sessions** stored in PostgreSQL `sessions` table
- **Cookie**: `floot_built_app_session` (HttpOnly, Secure, SameSite=Strict)
- **Session expiry**: 7 days
- **Key files**:
  - `helpers/getSetServerSession.tsx` - JWT cookie management
  - `helpers/getServerUserSession.tsx` - Session + user retrieval
  - `endpoints/auth/login_with_password_POST.ts` - Login handler

### Current Role System
- Roles: `admin | approver | editor | user` (defined in `helpers/schema.tsx:26`)
- Users tied to single organization via `organizationId`
- Role enforcement: `components/ProtectedRoute.tsx` (frontend), direct checks (backend)

### Current Layout System
- Page layouts defined in `*.pageLayout.tsx` files as arrays
- `DashboardLayout.tsx` - sidebar + main content area
- Sticky headers use `position: sticky; top: 0; z-index: var(--z-nav)`
- Organization context via `helpers/useOrganization.tsx`

---

## Implementation Approach

### Option Selected: Extend Users Table + Session Metadata

Rather than a separate super admin table, we'll:
1. Add `isSuperAdmin` boolean to `users` table
2. Store impersonation state in session metadata
3. Super admins have no `organizationId` (nullable for super admins)

This approach:
- Reuses existing auth infrastructure
- Minimal database changes
- Clean session-based impersonation tracking

---

## Phase 1: Database Changes

### 1.1 Modify Users Table

**File**: New migration

```sql
-- Allow organizationId to be nullable for super admins
ALTER TABLE users ALTER COLUMN organizationId DROP NOT NULL;

-- Add super admin flag
ALTER TABLE users ADD COLUMN isSuperAdmin BOOLEAN DEFAULT FALSE;

-- Add index for super admin lookups
CREATE INDEX idx_users_is_super_admin ON users(isSuperAdmin) WHERE isSuperAdmin = TRUE;
```

### 1.2 Update Schema Types

**File**: `helpers/schema.tsx`

```typescript
interface Users {
  // ... existing fields
  organizationId: number | null;  // Change from number
  isSuperAdmin: Generated<boolean>;
}
```

### 1.3 Create Super Admin Impersonation Log Table

```sql
CREATE TABLE superAdminImpersonationLogs (
  id SERIAL PRIMARY KEY,
  superAdminUserId INTEGER NOT NULL REFERENCES users(id),
  targetOrganizationId INTEGER NOT NULL REFERENCES organizations(id),
  startedAt TIMESTAMP DEFAULT NOW(),
  endedAt TIMESTAMP,
  ipAddress VARCHAR(45),
  userAgent TEXT
);
```

---

## Phase 2: Session & Auth Changes

### 2.1 Extend Session Interface

**File**: `helpers/getSetServerSession.tsx`

```typescript
interface Session {
  id: string;
  createdAt: number;
  lastAccessed: number;
  passwordChangeRequired?: boolean;
  // New fields for impersonation
  impersonation?: {
    organizationId: number;
    organizationName: string;
    startedAt: number;
  };
}
```

### 2.2 Create Super Admin Session Helper

**File**: `helpers/getSuperAdminSession.tsx` (new)

Functions:
- `isSuperAdmin(user)` - Check if user has super admin flag
- `getImpersonationContext(session)` - Get current impersonation state
- `isImpersonating(session)` - Boolean check

### 2.3 Update User Type

**File**: `helpers/User.tsx`

```typescript
interface User {
  // ... existing fields
  isSuperAdmin: boolean;
  impersonatingOrganization?: {
    id: number;
    name: string;
  };
}
```

---

## Phase 3: Backend Endpoints

### 3.1 Super Admin Login

**File**: `endpoints/superadmin/login_POST.ts`

- Validate email/password
- Check `isSuperAdmin === true`
- Create session (no organizationId required)
- Return user with `isSuperAdmin: true`

**File**: `endpoints/superadmin/login_POST.schema.ts`

```typescript
export const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
```

### 3.2 List Organizations

**File**: `endpoints/superadmin/organizations_GET.ts`

- Require super admin session
- Return all organizations with: `id`, `name`, `slug`, `createdAt`, `userCount`

**Response**:
```typescript
{
  organizations: Array<{
    id: number;
    name: string;
    slug: string;
    createdAt: string;
    userCount: number;
    adminEmail: string | null;
  }>;
}
```

### 3.3 Start Impersonation

**File**: `endpoints/superadmin/impersonate_POST.ts`

- Require super admin session
- Validate target `organizationId` exists
- Update session with impersonation context
- Log impersonation start
- Return updated user object with org context

**Schema**:
```typescript
export const schema = z.object({
  organizationId: z.number(),
});
```

### 3.4 Stop Impersonation

**File**: `endpoints/superadmin/stop-impersonate_POST.ts`

- Require super admin session with active impersonation
- Clear impersonation from session
- Log impersonation end
- Return to super admin state

### 3.5 Get Super Admin Session

**File**: `endpoints/superadmin/session_GET.ts`

- Return current super admin session state
- Include impersonation context if active

---

## Phase 4: Frontend - Super Admin Pages

### 4.1 Super Admin Login Page

**File**: `pages/superadmin.login.tsx`

- Standalone login form (email + password)
- POST to `/_api/superadmin/login`
- On success: redirect to `/superadmin/organizations`
- Styling: similar to regular login but with "Super Admin" branding

**File**: `pages/superadmin.login.pageLayout.tsx`

```typescript
export default [PublicLayout];
```

### 4.2 Super Admin Organizations Page

**File**: `pages/superadmin.organizations.tsx`

Components:
- Organizations table with columns: ID, Name, Created, Actions
- "Login As" button per row
- Search/filter input (optional v1)

**File**: `pages/superadmin.organizations.pageLayout.tsx`

```typescript
export default [SuperAdminProtectedRoute, SuperAdminLayout];
```

### 4.3 Super Admin Layout

**File**: `components/SuperAdminLayout.tsx`

- Simple header with "Super Admin Panel" title
- Logout button
- Clean, minimal design (no sidebar needed for v1)

**File**: `components/SuperAdminLayout.module.css`

---

## Phase 5: Frontend - Impersonation UI

### 5.1 Impersonation Banner Component

**File**: `components/ImpersonationBanner.tsx`

```tsx
// Sticky banner shown when super admin is impersonating
<div className={styles.banner}>
  <span>Viewing as admin of: <strong>{orgName}</strong></span>
  <Button onClick={stopImpersonation}>Return to Super Admin Panel</Button>
</div>
```

**Styling** (`ImpersonationBanner.module.css`):
```css
.banner {
  position: sticky;
  top: 0;
  z-index: var(--z-nav-sticky);  /* 300 - above normal nav */
  background: var(--warning-9);
  color: white;
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

### 5.2 Integrate Banner into DashboardLayout

**File**: `components/DashboardLayout.tsx`

```tsx
function DashboardLayout({ children }) {
  const { user } = useAuth();

  return (
    <>
      {user?.impersonatingOrganization && <ImpersonationBanner />}
      <div className={styles.layout}>
        {/* existing sidebar + content */}
      </div>
    </>
  );
}
```

### 5.3 Super Admin Auth Hook

**File**: `helpers/useSuperAdmin.tsx`

```typescript
export function useSuperAdmin() {
  const { user } = useAuth();

  return {
    isSuperAdmin: user?.isSuperAdmin ?? false,
    isImpersonating: !!user?.impersonatingOrganization,
    impersonatedOrg: user?.impersonatingOrganization,
    startImpersonation: (orgId: number) => { /* mutation */ },
    stopImpersonation: () => { /* mutation */ },
  };
}
```

---

## Phase 6: Route Protection

### 6.1 Super Admin Protected Route

**File**: `components/SuperAdminProtectedRoute.tsx`

```typescript
export function SuperAdminProtectedRoute({ children }) {
  const { authState } = useAuth();

  if (authState.type === "loading") return <LoadingSpinner />;
  if (authState.type === "unauthenticated") return <Navigate to="/superadmin/login" />;
  if (!authState.user.isSuperAdmin) return <AccessDenied />;

  return children;
}
```

### 6.2 Update Existing Route Guards

**File**: `components/ProtectedRoute.tsx`

Modify `MakeProtectedRoute` to handle super admin impersonation:
- If user is super admin AND impersonating → treat as admin of that org
- Existing role checks work normally

---

## Phase 7: Server Routes Registration

### 7.1 Add Routes to Server

**File**: `server.ts`

```typescript
// Super Admin routes
app.post("/_api/superadmin/login", handleSuperAdminLogin);
app.get("/_api/superadmin/session", handleSuperAdminSession);
app.get("/_api/superadmin/organizations", handleSuperAdminOrganizations);
app.post("/_api/superadmin/impersonate", handleSuperAdminImpersonate);
app.post("/_api/superadmin/stop-impersonate", handleSuperAdminStopImpersonate);
```

### 7.2 Add Frontend Routes

**File**: `App.tsx`

Add to route definitions:
- `/superadmin/login` → `superadmin.login.tsx`
- `/superadmin/organizations` → `superadmin.organizations.tsx`

---

## Phase 8: Security Considerations

### 8.1 Audit Logging

Extend `helpers/securityAuditLogger.tsx`:

```typescript
type SecurityEventType =
  | 'superadmin_login'
  | 'superadmin_login_failed'
  | 'superadmin_impersonation_start'
  | 'superadmin_impersonation_end'
  | /* existing events */;
```

### 8.2 Backend Permission Checks

All admin endpoints should check impersonation context:

```typescript
// In admin endpoints, get effective organization
function getEffectiveOrganizationId(user: User, session: Session): number {
  if (user.isSuperAdmin && session.impersonation) {
    return session.impersonation.organizationId;
  }
  return user.organizationId;
}
```

### 8.3 Rate Limiting

Apply existing rate limiting to super admin login endpoint.

---

## File Changes Summary

### New Files (17 files)

| File | Purpose |
|------|---------|
| `endpoints/superadmin/login_POST.ts` | Super admin login handler |
| `endpoints/superadmin/login_POST.schema.ts` | Login validation schema |
| `endpoints/superadmin/session_GET.ts` | Session status endpoint |
| `endpoints/superadmin/organizations_GET.ts` | List organizations |
| `endpoints/superadmin/impersonate_POST.ts` | Start impersonation |
| `endpoints/superadmin/impersonate_POST.schema.ts` | Impersonate schema |
| `endpoints/superadmin/stop-impersonate_POST.ts` | End impersonation |
| `pages/superadmin.login.tsx` | Login page |
| `pages/superadmin.login.pageLayout.tsx` | Login layout |
| `pages/superadmin.organizations.tsx` | Organizations list page |
| `pages/superadmin.organizations.pageLayout.tsx` | Organizations layout |
| `components/SuperAdminLayout.tsx` | Super admin page layout |
| `components/SuperAdminLayout.module.css` | Layout styles |
| `components/SuperAdminProtectedRoute.tsx` | Route guard |
| `components/ImpersonationBanner.tsx` | Impersonation indicator |
| `components/ImpersonationBanner.module.css` | Banner styles |
| `helpers/useSuperAdmin.tsx` | Super admin hooks |

### Modified Files (8 files)

| File | Changes |
|------|---------|
| `helpers/schema.tsx` | Add `isSuperAdmin`, nullable `organizationId`, new table |
| `helpers/getSetServerSession.tsx` | Extend Session interface |
| `helpers/User.tsx` | Add super admin fields |
| `helpers/securityAuditLogger.tsx` | Add new event types |
| `components/DashboardLayout.tsx` | Integrate impersonation banner |
| `components/ProtectedRoute.tsx` | Handle super admin impersonation |
| `server.ts` | Register new API routes |
| `App.tsx` | Add frontend routes |

---

## Implementation Order

1. **Database migration** - Schema changes first
2. **Backend auth** - Login + session endpoints
3. **Frontend auth** - Login page + route guard
4. **Organizations list** - Backend + frontend
5. **Impersonation flow** - Start/stop + session updates
6. **Impersonation banner** - UI integration
7. **Security hardening** - Audit logging, rate limits
8. **Testing** - Manual + automated tests

---

## Testing Checklist

- [ ] Super admin can log in at `/superadmin`
- [ ] Non-super-admin users cannot access super admin pages
- [ ] Organizations list shows all orgs with correct data
- [ ] "Login As" creates impersonation session
- [ ] Impersonation banner appears on all dashboard pages
- [ ] Super admin has full admin access while impersonating
- [ ] "Return to Panel" clears impersonation
- [ ] Audit logs capture all super admin actions
- [ ] Rate limiting works on super admin login
- [ ] Session expiry works correctly
- [ ] Regular users unaffected by changes
