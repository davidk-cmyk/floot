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

### Option Selected: Extend Users Table + Database Impersonation Tracking

Rather than a separate super admin table, we'll:
1. Add `isSuperAdmin` boolean to `users` table
2. Store impersonation state in **database** (not JWT) for better control
3. Super admins have no `organizationId` (nullable for super admins)
4. Session references active impersonation record by ID

This approach:
- Reuses existing auth infrastructure
- Enables concurrent impersonation prevention via DB constraints
- Allows impersonation timeout enforcement server-side
- Clean audit trail with foreign keys

---

## Phase 1: Database Changes

### 1.1 Modify Users Table

**File**: `migrations/XXXXXX_add_super_admin.sql`

```sql
-- Allow organizationId to be nullable for super admins
ALTER TABLE users ALTER COLUMN organizationId DROP NOT NULL;

-- Add super admin flag
ALTER TABLE users ADD COLUMN isSuperAdmin BOOLEAN DEFAULT FALSE;

-- Add index for super admin lookups
CREATE INDEX idx_users_is_super_admin ON users(isSuperAdmin) WHERE isSuperAdmin = TRUE;

-- Add constraint: super admins should not have organizationId
ALTER TABLE users ADD CONSTRAINT chk_super_admin_no_org
  CHECK (NOT (isSuperAdmin = TRUE AND organizationId IS NOT NULL));
```

### 1.2 Create Impersonation Logs Table

**File**: `migrations/XXXXXX_add_impersonation_logs.sql`

```sql
CREATE TABLE superAdminImpersonationLogs (
  id SERIAL PRIMARY KEY,
  superAdminUserId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  targetOrganizationId INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  startedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  endedAt TIMESTAMP WITH TIME ZONE,
  endReason VARCHAR(50), -- 'manual', 'logout', 'expired', 'org_deleted', 'session_expired'
  ipAddress VARCHAR(45),
  userAgent TEXT
);

-- Index for super admin's impersonation history
CREATE INDEX idx_impersonation_super_admin
  ON superAdminImpersonationLogs(superAdminUserId, startedAt DESC);

-- Index for finding active impersonation
CREATE INDEX idx_impersonation_active
  ON superAdminImpersonationLogs(superAdminUserId)
  WHERE endedAt IS NULL;

-- Index for organization audit trail
CREATE INDEX idx_impersonation_org
  ON superAdminImpersonationLogs(targetOrganizationId, startedAt DESC);

-- Ensure only one active impersonation per super admin
CREATE UNIQUE INDEX idx_one_active_impersonation
  ON superAdminImpersonationLogs(superAdminUserId)
  WHERE endedAt IS NULL;
```

### 1.3 Migration Rollback Script

**File**: `migrations/XXXXXX_add_super_admin_DOWN.sql`

```sql
-- WARNING: Ensure no super admins exist before rollback
-- This will fail if any users have isSuperAdmin=true or null organizationId

-- Remove impersonation logs table
DROP TABLE IF EXISTS superAdminImpersonationLogs;

-- Remove constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_super_admin_no_org;

-- Remove index
DROP INDEX IF EXISTS idx_users_is_super_admin;

-- Remove column
ALTER TABLE users DROP COLUMN IF EXISTS isSuperAdmin;

-- Restore NOT NULL (requires backfill first!)
-- ALTER TABLE users ALTER COLUMN organizationId SET NOT NULL;
```

### 1.4 Update Schema Types

**File**: `helpers/schema.tsx`

```typescript
// Update Users interface
interface Users {
  id: Generated<number>;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'approver' | 'editor' | 'user';
  organizationId: number | null;  // Changed: nullable for super admins
  isSuperAdmin: Generated<boolean>;  // New field
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

// New table interface
interface SuperAdminImpersonationLogs {
  id: Generated<number>;
  superAdminUserId: number;
  targetOrganizationId: number;
  startedAt: Generated<Date>;
  endedAt: Date | null;
  endReason: 'manual' | 'logout' | 'expired' | 'org_deleted' | 'session_expired' | null;
  ipAddress: string | null;
  userAgent: string | null;
}

// Add to Database interface
interface Database {
  // ... existing tables
  superAdminImpersonationLogs: SuperAdminImpersonationLogs;
}
```

---

## Phase 2: Session & Auth Changes

### 2.1 Extend Session Interface

**File**: `helpers/getSetServerSession.tsx`

```typescript
interface Session {
  id: string;
  userId: number;
  createdAt: number;
  lastAccessed: number;
  passwordChangeRequired?: boolean;
  // New: reference to active impersonation (stored in DB, not JWT)
  activeImpersonationId?: number;
}
```

### 2.2 Create Super Admin Helpers

**File**: `helpers/superAdmin.ts` (new - note: .ts not .tsx)

```typescript
import { db } from './db';
import { User, Session } from './types';

/**
 * Check if user has super admin privileges
 */
export function isSuperAdmin(user: User | null | undefined): boolean {
  return user?.isSuperAdmin === true;
}

/**
 * Get active impersonation for a super admin
 */
export async function getActiveImpersonation(superAdminUserId: number) {
  return db
    .selectFrom('superAdminImpersonationLogs')
    .innerJoin('organizations', 'organizations.id', 'superAdminImpersonationLogs.targetOrganizationId')
    .select([
      'superAdminImpersonationLogs.id',
      'superAdminImpersonationLogs.targetOrganizationId',
      'organizations.name as organizationName',
      'superAdminImpersonationLogs.startedAt',
    ])
    .where('superAdminUserId', '=', superAdminUserId)
    .where('endedAt', 'is', null)
    .executeTakeFirst();
}

/**
 * Check if impersonation has expired (8 hour limit)
 */
export function isImpersonationExpired(startedAt: Date): boolean {
  const IMPERSONATION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours
  return Date.now() - startedAt.getTime() > IMPERSONATION_TIMEOUT_MS;
}

/**
 * Get effective organization ID for a user/session
 * Returns null if super admin is not impersonating
 * Throws if org context is required but not available
 */
export async function getEffectiveOrganizationId(
  user: User,
  session: Session
): Promise<number | null> {
  if (!user.isSuperAdmin) {
    return user.organizationId;
  }

  if (!session.activeImpersonationId) {
    return null;
  }

  const impersonation = await getActiveImpersonation(user.id);

  if (!impersonation) {
    return null;
  }

  // Check for expiration
  if (isImpersonationExpired(impersonation.startedAt)) {
    await endImpersonation(user.id, 'expired');
    return null;
  }

  return impersonation.targetOrganizationId;
}

/**
 * Require organization context - throws if not available
 */
export async function requireOrganizationId(
  user: User,
  session: Session
): Promise<number> {
  const orgId = await getEffectiveOrganizationId(user, session);

  if (orgId === null) {
    throw new ForbiddenError(
      user.isSuperAdmin
        ? 'Please select an organization to impersonate first'
        : 'Organization context required'
    );
  }

  return orgId;
}

/**
 * Start impersonation - ends any existing impersonation first
 */
export async function startImpersonation(
  superAdminUserId: number,
  targetOrganizationId: number,
  ipAddress: string,
  userAgent: string
): Promise<number> {
  // End any existing impersonation
  await endImpersonation(superAdminUserId, 'manual');

  // Verify organization exists
  const org = await db
    .selectFrom('organizations')
    .select(['id', 'name'])
    .where('id', '=', targetOrganizationId)
    .executeTakeFirst();

  if (!org) {
    throw new NotFoundError('Organization not found');
  }

  // Create new impersonation record
  const result = await db
    .insertInto('superAdminImpersonationLogs')
    .values({
      superAdminUserId,
      targetOrganizationId,
      ipAddress,
      userAgent,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return result.id;
}

/**
 * End active impersonation
 */
export async function endImpersonation(
  superAdminUserId: number,
  reason: 'manual' | 'logout' | 'expired' | 'org_deleted' | 'session_expired'
): Promise<void> {
  await db
    .updateTable('superAdminImpersonationLogs')
    .set({
      endedAt: new Date(),
      endReason: reason,
    })
    .where('superAdminUserId', '=', superAdminUserId)
    .where('endedAt', 'is', null)
    .execute();
}
```

### 2.3 Update User Type

**File**: `helpers/User.tsx`

```typescript
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'approver' | 'editor' | 'user';
  organizationId: number | null;
  isSuperAdmin: boolean;
}

// Extended user with impersonation context (for frontend)
export interface UserWithImpersonation extends User {
  impersonating?: {
    organizationId: number;
    organizationName: string;
    startedAt: string;
  };
}
```

---

## Phase 3: Backend Endpoints

### 3.1 Super Admin Login

**File**: `endpoints/superadmin/login_POST.ts`

```typescript
import { z } from 'zod';
import { compare } from 'bcrypt';
import { db } from '../../helpers/db';
import { createSession, setSessionCookie } from '../../helpers/getSetServerSession';
import { logSecurityEvent } from '../../helpers/securityAuditLogger';
import { validateCsrfToken } from '../../helpers/csrf';

export const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function handler(req: Request, res: Response) {
  // CSRF validation
  validateCsrfToken(req);

  const { email, password } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'] || '';

  // Check rate limit (stricter for super admin)
  const isRateLimited = await checkSuperAdminRateLimit(ipAddress, email);
  if (isRateLimited) {
    await logSecurityEvent('superadmin_login_failed', {
      email,
      reason: 'rate_limited',
      ipAddress,
    });
    return res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait before trying again.' }
    });
  }

  // Find user
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email.toLowerCase())
    .executeTakeFirst();

  // Validate credentials (timing-safe)
  const isValidPassword = user ? await compare(password, user.passwordHash) : false;
  const isSuperAdmin = user?.isSuperAdmin === true;

  if (!user || !isValidPassword || !isSuperAdmin) {
    await incrementRateLimit(ipAddress, email);
    await logSecurityEvent('superadmin_login_failed', {
      email,
      reason: !user ? 'user_not_found' : !isValidPassword ? 'invalid_password' : 'not_super_admin',
      ipAddress,
      userAgent,
    });
    // Generic message to prevent user enumeration
    return res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    });
  }

  // Invalidate any existing sessions for this super admin
  await invalidateUserSessions(user.id);

  // Create session
  const session = await createSession(user.id);
  setSessionCookie(res, session);

  await logSecurityEvent('superadmin_login', {
    userId: user.id,
    ipAddress,
    userAgent,
  });

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: true,
    },
  });
}
```

### 3.2 Super Admin Logout

**File**: `endpoints/superadmin/logout_POST.ts`

```typescript
import { requireSuperAdminSession } from '../../helpers/auth';
import { endImpersonation } from '../../helpers/superAdmin';
import { clearSessionCookie, invalidateSession } from '../../helpers/getSetServerSession';
import { logSecurityEvent } from '../../helpers/securityAuditLogger';

export async function handler(req: Request, res: Response) {
  const { user, session } = await requireSuperAdminSession(req);

  // End any active impersonation
  await endImpersonation(user.id, 'logout');

  // Invalidate session
  await invalidateSession(session.id);
  clearSessionCookie(res);

  await logSecurityEvent('superadmin_logout', {
    userId: user.id,
    ipAddress: req.ip,
  });

  return res.status(200).json({ success: true });
}
```

### 3.3 List Organizations

**File**: `endpoints/superadmin/organizations_GET.ts`

```typescript
import { z } from 'zod';
import { requireSuperAdminSession } from '../../helpers/auth';
import { db } from '../../helpers/db';

export const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'userCount']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export async function handler(req: Request, res: Response) {
  await requireSuperAdminSession(req);

  const { page, pageSize, search, sortBy, sortOrder } = querySchema.parse(req.query);
  const offset = (page - 1) * pageSize;

  // Build query
  let query = db
    .selectFrom('organizations')
    .leftJoin('users', (join) =>
      join
        .onRef('users.organizationId', '=', 'organizations.id')
        .on('users.role', '=', 'admin')
    )
    .select([
      'organizations.id',
      'organizations.name',
      'organizations.slug',
      'organizations.createdAt',
      db.fn.count('users.id').as('userCount'),
      db.fn.min('users.email').as('adminEmail'),
    ])
    .groupBy('organizations.id');

  // Apply search filter
  if (search) {
    query = query.where('organizations.name', 'ilike', `%${search}%`);
  }

  // Get total count
  const countQuery = db
    .selectFrom('organizations')
    .select(db.fn.count('id').as('total'));

  if (search) {
    countQuery.where('name', 'ilike', `%${search}%`);
  }

  const { total } = await countQuery.executeTakeFirstOrThrow();

  // Apply sorting and pagination
  const organizations = await query
    .orderBy(sortBy, sortOrder)
    .limit(pageSize)
    .offset(offset)
    .execute();

  return res.status(200).json({
    organizations: organizations.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt.toISOString(),
      userCount: Number(org.userCount),
      adminEmail: org.adminEmail || null,
    })),
    pagination: {
      page,
      pageSize,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / pageSize),
    },
  });
}
```

### 3.4 Get Organization Details

**File**: `endpoints/superadmin/organizations/[id]_GET.ts`

```typescript
import { z } from 'zod';
import { requireSuperAdminSession } from '../../../helpers/auth';
import { db } from '../../../helpers/db';

export const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function handler(req: Request, res: Response) {
  await requireSuperAdminSession(req);

  const { id } = paramsSchema.parse(req.params);

  const organization = await db
    .selectFrom('organizations')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();

  if (!organization) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Organization not found' }
    });
  }

  // Get user count and admin info
  const stats = await db
    .selectFrom('users')
    .select([
      db.fn.count('id').as('userCount'),
    ])
    .where('organizationId', '=', id)
    .executeTakeFirst();

  const admin = await db
    .selectFrom('users')
    .select(['email', 'name'])
    .where('organizationId', '=', id)
    .where('role', '=', 'admin')
    .executeTakeFirst();

  return res.status(200).json({
    organization: {
      ...organization,
      createdAt: organization.createdAt.toISOString(),
      userCount: Number(stats?.userCount || 0),
      admin: admin || null,
    },
  });
}
```

### 3.5 Start Impersonation

**File**: `endpoints/superadmin/impersonate_POST.ts`

```typescript
import { z } from 'zod';
import { requireSuperAdminSession } from '../../helpers/auth';
import { startImpersonation, getActiveImpersonation } from '../../helpers/superAdmin';
import { updateSession } from '../../helpers/getSetServerSession';
import { logSecurityEvent } from '../../helpers/securityAuditLogger';
import { validateCsrfToken } from '../../helpers/csrf';
import { db } from '../../helpers/db';

export const schema = z.object({
  organizationId: z.number().int().positive(),
});

export async function handler(req: Request, res: Response) {
  validateCsrfToken(req);

  const { user, session } = await requireSuperAdminSession(req);
  const { organizationId } = schema.parse(req.body);
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'] || '';

  // Verify organization exists
  const org = await db
    .selectFrom('organizations')
    .select(['id', 'name'])
    .where('id', '=', organizationId)
    .executeTakeFirst();

  if (!org) {
    return res.status(404).json({
      error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' }
    });
  }

  // Start impersonation (ends any existing one)
  const impersonationId = await startImpersonation(
    user.id,
    organizationId,
    ipAddress,
    userAgent
  );

  // Update session with impersonation reference
  await updateSession(session.id, { activeImpersonationId: impersonationId });

  await logSecurityEvent('superadmin_impersonation_start', {
    superAdminUserId: user.id,
    targetOrganizationId: organizationId,
    organizationName: org.name,
    ipAddress,
    userAgent,
  });

  return res.status(200).json({
    user: {
      ...user,
      impersonating: {
        organizationId: org.id,
        organizationName: org.name,
        startedAt: new Date().toISOString(),
      },
    },
  });
}
```

### 3.6 Stop Impersonation

**File**: `endpoints/superadmin/stop-impersonate_POST.ts`

```typescript
import { requireSuperAdminSession } from '../../helpers/auth';
import { endImpersonation, getActiveImpersonation } from '../../helpers/superAdmin';
import { updateSession } from '../../helpers/getSetServerSession';
import { logSecurityEvent } from '../../helpers/securityAuditLogger';
import { validateCsrfToken } from '../../helpers/csrf';

export async function handler(req: Request, res: Response) {
  validateCsrfToken(req);

  const { user, session } = await requireSuperAdminSession(req);

  // Get current impersonation for logging
  const impersonation = await getActiveImpersonation(user.id);

  if (!impersonation) {
    return res.status(400).json({
      error: { code: 'NOT_IMPERSONATING', message: 'No active impersonation' }
    });
  }

  // End impersonation
  await endImpersonation(user.id, 'manual');

  // Clear from session
  await updateSession(session.id, { activeImpersonationId: null });

  await logSecurityEvent('superadmin_impersonation_end', {
    superAdminUserId: user.id,
    targetOrganizationId: impersonation.targetOrganizationId,
    organizationName: impersonation.organizationName,
    duration: Date.now() - impersonation.startedAt.getTime(),
    ipAddress: req.ip,
  });

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: true,
    },
  });
}
```

### 3.7 Get Session Status

**File**: `endpoints/superadmin/session_GET.ts`

```typescript
import { requireSuperAdminSession } from '../../helpers/auth';
import { getActiveImpersonation, isImpersonationExpired, endImpersonation } from '../../helpers/superAdmin';

export async function handler(req: Request, res: Response) {
  const { user, session } = await requireSuperAdminSession(req);

  // Check for active impersonation
  const impersonation = await getActiveImpersonation(user.id);

  // Handle expired impersonation
  if (impersonation && isImpersonationExpired(impersonation.startedAt)) {
    await endImpersonation(user.id, 'expired');
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSuperAdmin: true,
      },
      impersonationExpired: true,
    });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: true,
      impersonating: impersonation ? {
        organizationId: impersonation.targetOrganizationId,
        organizationName: impersonation.organizationName,
        startedAt: impersonation.startedAt.toISOString(),
      } : undefined,
    },
  });
}
```

---

## Phase 4: CSRF Protection

### 4.1 CSRF Helper

**File**: `helpers/csrf.ts` (new)

```typescript
import { Request, Response } from 'express';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'floot_csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function validateCsrfToken(req: Request): void {
  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new ForbiddenError('Invalid CSRF token');
  }
}
```

---

## Phase 5: Frontend - Super Admin Pages

### 5.1 Super Admin Login Page

**File**: `pages/superadmin.login.tsx`

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import styles from './superadmin.login.module.css';

export default function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await fetch('/_api/superadmin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Login failed');
      }

      return res.json();
    },
    onSuccess: () => {
      navigate('/superadmin/organizations');
    },
    onError: (err: Error) => {
      setError(err.message);
      setPassword(''); // Clear password on failure
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate({ email, password });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Super Admin</h1>
        <p className={styles.subtitle}>Administrative Access Portal</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**File**: `pages/superadmin.login.pageLayout.tsx`

```typescript
import { PublicLayout } from '../components/PublicLayout';
export default [PublicLayout];
```

### 5.2 Super Admin Organizations Page

**File**: `pages/superadmin.organizations.tsx`

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../components/ConfirmModal';
import styles from './superadmin.organizations.module.css';

interface Organization {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  userCount: number;
  adminEmail: string | null;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function SuperAdminOrganizationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'userCount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [confirmOrg, setConfirmOrg] = useState<Organization | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['superadmin', 'organizations', { page, search, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        search,
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/_api/superadmin/organizations?${params}`);
      if (!res.ok) throw new Error('Failed to load organizations');
      return res.json() as Promise<{
        organizations: Organization[];
        pagination: PaginationInfo;
      }>;
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (orgId: number) => {
      const res = await fetch('/_api/superadmin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({ organizationId: orgId }),
      });
      if (!res.ok) throw new Error('Failed to impersonate');
      return res.json();
    },
    onSuccess: () => {
      navigate('/dashboard');
    },
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleImpersonate = (org: Organization) => {
    setConfirmOrg(org);
  };

  const confirmImpersonate = () => {
    if (confirmOrg) {
      impersonateMutation.mutate(confirmOrg.id);
      setConfirmOrg(null);
    }
  };

  if (isLoading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>Failed to load organizations</div>;

  const { organizations, pagination } = data!;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Organizations</h1>
        <input
          type="search"
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className={styles.search}
        />
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th onClick={() => handleSort('name')} className={styles.sortable}>
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th>Slug</th>
            <th>Admin</th>
            <th onClick={() => handleSort('userCount')} className={styles.sortable}>
              Users {sortBy === 'userCount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('createdAt')} className={styles.sortable}>
              Created {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {organizations.length === 0 ? (
            <tr>
              <td colSpan={7} className={styles.empty}>
                No organizations found
              </td>
            </tr>
          ) : (
            organizations.map((org) => (
              <tr key={org.id}>
                <td>{org.id}</td>
                <td>{org.name}</td>
                <td>{org.slug}</td>
                <td>{org.adminEmail || <em>No admin</em>}</td>
                <td>{org.userCount}</td>
                <td>{new Date(org.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleImpersonate(org)}
                    className={styles.loginAsButton}
                    disabled={impersonateMutation.isPending}
                  >
                    Login As
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {pagination.totalPages}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page === pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}

      {confirmOrg && (
        <ConfirmModal
          title="Impersonate Organization"
          message={`You are about to view as admin of "${confirmOrg.name}". All actions will be logged.`}
          confirmLabel="Confirm & Continue"
          onConfirm={confirmImpersonate}
          onCancel={() => setConfirmOrg(null)}
        />
      )}
    </div>
  );
}
```

**File**: `pages/superadmin.organizations.pageLayout.tsx`

```typescript
import { SuperAdminProtectedRoute } from '../components/SuperAdminProtectedRoute';
import { SuperAdminLayout } from '../components/SuperAdminLayout';
export default [SuperAdminProtectedRoute, SuperAdminLayout];
```

### 5.3 Super Admin Layout

**File**: `components/SuperAdminLayout.tsx`

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import styles from './SuperAdminLayout.module.css';

interface Props {
  children: React.ReactNode;
}

export function SuperAdminLayout({ children }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/_api/superadmin/logout', {
        method: 'POST',
        headers: { 'X-CSRF-Token': getCsrfToken() },
      });
      if (!res.ok) throw new Error('Logout failed');
    },
    onSuccess: () => {
      queryClient.clear();
      navigate('/superadmin/login');
    },
  });

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>Super Admin Panel</h1>
        <button
          onClick={() => logoutMutation.mutate()}
          className={styles.logoutButton}
          disabled={logoutMutation.isPending}
        >
          Logout
        </button>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
```

**File**: `components/SuperAdminLayout.module.css`

```css
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--gray-12);
  color: white;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.logoutButton {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid white;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.logoutButton:hover {
  background: rgba(255, 255, 255, 0.1);
}

.main {
  flex: 1;
  padding: 24px;
  background: var(--gray-1);
}
```

---

## Phase 6: Frontend - Impersonation UI

### 6.1 Impersonation Banner Component

**File**: `components/ImpersonationBanner.tsx`

```tsx
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '../helpers/useSuperAdmin';
import styles from './ImpersonationBanner.module.css';

export function ImpersonationBanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { impersonatedOrg, stopImpersonation } = useSuperAdmin();
  const [elapsed, setElapsed] = useState('');

  // Update elapsed time every minute
  useEffect(() => {
    if (!impersonatedOrg?.startedAt) return;

    const updateElapsed = () => {
      const start = new Date(impersonatedOrg.startedAt).getTime();
      const diff = Date.now() - start;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setElapsed(`${hours}h ${minutes}m`);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [impersonatedOrg?.startedAt]);

  const stopMutation = useMutation({
    mutationFn: stopImpersonation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      navigate('/superadmin/organizations');
    },
  });

  if (!impersonatedOrg) return null;

  return (
    <div className={styles.banner} role="alert">
      <div className={styles.content}>
        <span className={styles.icon}>⚠</span>
        <span className={styles.text}>
          IMPERSONATING: <strong>{impersonatedOrg.organizationName}</strong>
        </span>
        <span className={styles.elapsed}>{elapsed}</span>
      </div>
      <button
        onClick={() => stopMutation.mutate()}
        className={styles.returnButton}
        disabled={stopMutation.isPending}
      >
        {stopMutation.isPending ? 'Returning...' : 'Return to Panel'}
      </button>
    </div>
  );
}
```

**File**: `components/ImpersonationBanner.module.css`

```css
.banner {
  position: sticky;
  top: 0;
  z-index: 9999; /* Highest z-index */
  background: var(--warning-9, #f59e0b);
  color: var(--gray-12, #1a1a1a);
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon {
  font-size: 1.25rem;
}

.text {
  font-size: 0.9rem;
}

.elapsed {
  font-size: 0.85rem;
  opacity: 0.8;
  font-family: monospace;
}

.returnButton {
  padding: 6px 16px;
  background: var(--gray-12, #1a1a1a);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
}

.returnButton:hover:not(:disabled) {
  background: var(--gray-11);
}

.returnButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

### 6.2 Integrate Banner into DashboardLayout

**File**: `components/DashboardLayout.tsx` (modifications)

```tsx
import { ImpersonationBanner } from './ImpersonationBanner';
import { useSuperAdmin } from '../helpers/useSuperAdmin';

export function DashboardLayout({ children }: Props) {
  const { isImpersonating } = useSuperAdmin();

  return (
    <>
      {isImpersonating && <ImpersonationBanner />}
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>{children}</main>
      </div>
    </>
  );
}
```

### 6.3 Super Admin Auth Hook

**File**: `helpers/useSuperAdmin.ts` (note: .ts not .tsx)

```typescript
import { useAuth } from './useAuth';

export function useSuperAdmin() {
  const { user } = useAuth();

  const isSuperAdmin = user?.isSuperAdmin ?? false;
  const isImpersonating = !!user?.impersonating;
  const impersonatedOrg = user?.impersonating;

  const startImpersonation = async (orgId: number) => {
    const res = await fetch('/_api/superadmin/impersonate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
      },
      body: JSON.stringify({ organizationId: orgId }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to start impersonation');
    }

    return res.json();
  };

  const stopImpersonation = async () => {
    const res = await fetch('/_api/superadmin/stop-impersonate', {
      method: 'POST',
      headers: { 'X-CSRF-Token': getCsrfToken() },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to stop impersonation');
    }

    return res.json();
  };

  return {
    isSuperAdmin,
    isImpersonating,
    impersonatedOrg,
    startImpersonation,
    stopImpersonation,
  };
}
```

---

## Phase 7: Route Protection

### 7.1 Super Admin Protected Route

**File**: `components/SuperAdminProtectedRoute.tsx`

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../helpers/useAuth';
import { LoadingSpinner } from './LoadingSpinner';
import { AccessDenied } from './AccessDenied';

interface Props {
  children: React.ReactNode;
}

export function SuperAdminProtectedRoute({ children }: Props) {
  const { authState } = useAuth();

  if (authState.type === 'loading') {
    return <LoadingSpinner />;
  }

  if (authState.type === 'unauthenticated') {
    return <Navigate to="/superadmin/login" replace />;
  }

  if (!authState.user.isSuperAdmin) {
    return <AccessDenied message="Super admin access required" />;
  }

  return <>{children}</>;
}
```

### 7.2 Update Existing Route Guards

**File**: `components/ProtectedRoute.tsx` (modifications)

```typescript
import { getEffectiveOrganizationId } from '../helpers/superAdmin';

export function MakeProtectedRoute(allowedRoles: string[]) {
  return function ProtectedRoute({ children }: Props) {
    const { authState } = useAuth();

    if (authState.type === 'loading') {
      return <LoadingSpinner />;
    }

    if (authState.type === 'unauthenticated') {
      return <Navigate to="/login" replace />;
    }

    const user = authState.user;

    // Super admin while impersonating has admin access
    if (user.isSuperAdmin && user.impersonating) {
      if (allowedRoles.includes('admin')) {
        return <>{children}</>;
      }
    }

    // Super admin without impersonation cannot access org pages
    if (user.isSuperAdmin && !user.impersonating) {
      return <Navigate to="/superadmin/organizations" replace />;
    }

    // Regular role check
    if (!allowedRoles.includes(user.role)) {
      return <AccessDenied />;
    }

    return <>{children}</>;
  };
}
```

---

## Phase 8: Server Routes Registration

### 8.1 Add Routes to Server

**File**: `server.ts` (additions)

```typescript
import { handler as superAdminLogin } from './endpoints/superadmin/login_POST';
import { handler as superAdminLogout } from './endpoints/superadmin/logout_POST';
import { handler as superAdminSession } from './endpoints/superadmin/session_GET';
import { handler as superAdminOrganizations } from './endpoints/superadmin/organizations_GET';
import { handler as superAdminOrganizationDetail } from './endpoints/superadmin/organizations/[id]_GET';
import { handler as superAdminImpersonate } from './endpoints/superadmin/impersonate_POST';
import { handler as superAdminStopImpersonate } from './endpoints/superadmin/stop-impersonate_POST';

// Super Admin API routes
app.post('/_api/superadmin/login', superAdminLogin);
app.post('/_api/superadmin/logout', superAdminLogout);
app.get('/_api/superadmin/session', superAdminSession);
app.get('/_api/superadmin/organizations', superAdminOrganizations);
app.get('/_api/superadmin/organizations/:id', superAdminOrganizationDetail);
app.post('/_api/superadmin/impersonate', superAdminImpersonate);
app.post('/_api/superadmin/stop-impersonate', superAdminStopImpersonate);
```

### 8.2 Add Frontend Routes

**File**: `App.tsx` (additions)

```typescript
// Add to route definitions
<Route path="/superadmin/login" element={<SuperAdminLoginPage />} />
<Route path="/superadmin/organizations" element={<SuperAdminOrganizationsPage />} />
```

---

## Phase 9: Security Hardening

### 9.1 Audit Logging Extension

**File**: `helpers/securityAuditLogger.ts` (modifications)

```typescript
type SecurityEventType =
  | 'superadmin_login'
  | 'superadmin_login_failed'
  | 'superadmin_logout'
  | 'superadmin_impersonation_start'
  | 'superadmin_impersonation_end'
  | 'superadmin_impersonation_expired'
  | 'superadmin_action'
  // ... existing events
  ;

interface SuperAdminEventMetadata {
  superAdminUserId?: number;
  targetOrganizationId?: number;
  organizationName?: string;
  duration?: number;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logSecurityEvent(
  eventType: SecurityEventType,
  metadata: SuperAdminEventMetadata & Record<string, unknown>
): Promise<void> {
  await db.insertInto('securityAuditLogs').values({
    eventType,
    metadata: JSON.stringify(metadata),
    createdAt: new Date(),
  }).execute();
}
```

### 9.2 Rate Limiting for Super Admin

**File**: `helpers/rateLimiter.ts` (additions)

```typescript
const SUPER_ADMIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutMs: 30 * 60 * 1000, // 30 minutes
};

export async function checkSuperAdminRateLimit(
  ipAddress: string,
  email: string
): Promise<boolean> {
  const key = `superadmin_login:${ipAddress}:${email}`;
  const attempts = await redis.get(key);

  if (attempts && parseInt(attempts) >= SUPER_ADMIN_RATE_LIMIT.maxAttempts) {
    return true; // Rate limited
  }

  return false;
}

export async function incrementRateLimit(
  ipAddress: string,
  email: string
): Promise<void> {
  const key = `superadmin_login:${ipAddress}:${email}`;
  await redis.incr(key);
  await redis.expire(key, SUPER_ADMIN_RATE_LIMIT.windowMs / 1000);
}
```

### 9.3 Organization Deletion Handler

**File**: `helpers/organizationCleanup.ts` (new)

```typescript
/**
 * Called when an organization is deleted
 * Ends any active impersonation sessions for that org
 */
export async function handleOrganizationDeletion(orgId: number): Promise<void> {
  // End all active impersonations for this org
  const activeImpersonations = await db
    .selectFrom('superAdminImpersonationLogs')
    .select(['id', 'superAdminUserId'])
    .where('targetOrganizationId', '=', orgId)
    .where('endedAt', 'is', null)
    .execute();

  for (const impersonation of activeImpersonations) {
    await db
      .updateTable('superAdminImpersonationLogs')
      .set({
        endedAt: new Date(),
        endReason: 'org_deleted',
      })
      .where('id', '=', impersonation.id)
      .execute();

    await logSecurityEvent('superadmin_impersonation_end', {
      superAdminUserId: impersonation.superAdminUserId,
      targetOrganizationId: orgId,
      reason: 'org_deleted',
    });
  }
}
```

---

## File Changes Summary

### New Files (21 files)

| File | Purpose |
|------|---------|
| `migrations/XXXXXX_add_super_admin.sql` | Database migration |
| `migrations/XXXXXX_add_super_admin_DOWN.sql` | Migration rollback |
| `migrations/XXXXXX_add_impersonation_logs.sql` | Impersonation logs table |
| `helpers/superAdmin.ts` | Super admin helper functions |
| `helpers/csrf.ts` | CSRF protection |
| `helpers/organizationCleanup.ts` | Org deletion handler |
| `endpoints/superadmin/login_POST.ts` | Login handler |
| `endpoints/superadmin/logout_POST.ts` | Logout handler |
| `endpoints/superadmin/session_GET.ts` | Session status |
| `endpoints/superadmin/organizations_GET.ts` | List organizations |
| `endpoints/superadmin/organizations/[id]_GET.ts` | Organization details |
| `endpoints/superadmin/impersonate_POST.ts` | Start impersonation |
| `endpoints/superadmin/stop-impersonate_POST.ts` | End impersonation |
| `pages/superadmin.login.tsx` | Login page |
| `pages/superadmin.login.module.css` | Login page styles |
| `pages/superadmin.login.pageLayout.tsx` | Login layout |
| `pages/superadmin.organizations.tsx` | Organizations page |
| `pages/superadmin.organizations.module.css` | Organizations page styles |
| `pages/superadmin.organizations.pageLayout.tsx` | Organizations layout |
| `components/SuperAdminLayout.tsx` | Layout component |
| `components/SuperAdminLayout.module.css` | Layout styles |
| `components/SuperAdminProtectedRoute.tsx` | Route guard |
| `components/ImpersonationBanner.tsx` | Banner component |
| `components/ImpersonationBanner.module.css` | Banner styles |
| `helpers/useSuperAdmin.ts` | Frontend hook |

### Modified Files (9 files)

| File | Changes |
|------|---------|
| `helpers/schema.tsx` | Add types for new tables/columns |
| `helpers/getSetServerSession.tsx` | Add activeImpersonationId to session |
| `helpers/User.tsx` | Add super admin fields to User type |
| `helpers/securityAuditLogger.ts` | Add new event types |
| `helpers/rateLimiter.ts` | Add super admin rate limiting |
| `components/DashboardLayout.tsx` | Integrate impersonation banner |
| `components/ProtectedRoute.tsx` | Handle super admin impersonation |
| `server.ts` | Register new API routes |
| `App.tsx` | Add frontend routes |

---

## Implementation Order

1. **Database migrations** - Schema changes first, test rollback
2. **CSRF protection** - Security foundation
3. **Super admin helpers** - Core business logic
4. **Backend auth endpoints** - Login, logout, session
5. **Frontend auth pages** - Login page + route guard
6. **Organizations endpoints** - List + detail
7. **Organizations UI** - Table with pagination
8. **Impersonation backend** - Start/stop endpoints
9. **Impersonation frontend** - Banner + integration
10. **Security hardening** - Rate limiting, audit logging
11. **Edge case handling** - Org deletion, expiration
12. **Testing** - Full test suite

---

## Testing Checklist

### Core Functionality
- [ ] Super admin can log in at `/superadmin/login`
- [ ] Super admin can log out
- [ ] Non-super-admin users cannot access super admin pages
- [ ] Organizations list shows all orgs with correct data
- [ ] Pagination works correctly
- [ ] Search filters organizations
- [ ] Sorting works on all columns

### Impersonation
- [ ] Confirmation modal appears before impersonation
- [ ] "Login As" creates impersonation session
- [ ] Impersonation banner appears on all dashboard pages
- [ ] Elapsed time updates in banner
- [ ] Super admin has full admin access while impersonating
- [ ] "Return to Panel" clears impersonation
- [ ] Impersonation auto-expires after 8 hours
- [ ] Only one active impersonation per super admin

### Security
- [ ] CSRF protection on all POST endpoints
- [ ] Audit logs capture all super admin actions
- [ ] Rate limiting works on super admin login
- [ ] Failed logins don't reveal user existence
- [ ] Session invalidated on new login

### Edge Cases
- [ ] Org deletion while impersonating handled gracefully
- [ ] Session expiry handled correctly
- [ ] Concurrent session handled (old invalidated)
- [ ] Regular users unaffected by changes
