# Super Admin Feature Requirements

## Overview

Add a super admin role that can access any organization's dashboard as if they were that organization's admin.

---

## 1. Super Admin Role

- New role type: `superAdmin` (distinct from organization `admin`)
- Super admins are **not** tied to any specific organization
- Stored with a special flag in the users table (`isSuperAdmin`)
- Credentials: email + password (standard auth)
- Super admins cannot also be regular organization users

---

## 2. Super Admin Login Page

**Route:** `/superadmin/login`

- Standalone login form (email + password)
- No access to regular user login flow
- No "forgot password" link (super admin password reset is manual/out-of-band)
- On success: redirect to Super Admin Panel
- On failure: show generic error message (do not reveal if email exists)

### Error Messages

| Scenario | User-Facing Message |
|----------|---------------------|
| Invalid credentials | "Invalid email or password" |
| Account locked | "Account temporarily locked. Try again later." |
| Rate limited | "Too many attempts. Please wait before trying again." |

---

## 3. Super Admin Panel

**Route:** `/superadmin/organizations`

### Organizations Table

| Column | Description |
|--------|-------------|
| ID | Organization ID (internal, numeric) |
| Name | Organization name |
| Slug | Organization URL slug |
| Admin Email | Primary admin's email (or "No admin") |
| Users | Count of users in organization |
| Created Date | When the org was created |
| Actions | "Login As" button |

### Table Features

- Sortable columns (Name, Created Date, Users)
- Search/filter by name
- **Pagination**: 25 organizations per page, with page navigation
- Empty state when no organizations exist

---

## 4. Super Admin Logout

**Route:** `POST /_api/superadmin/logout`

- Clears super admin session completely
- If impersonating, ends impersonation first
- Redirects to `/superadmin/login`
- Logs `superadmin_logout` security event

---

## 5. "Login As" Functionality

When super admin clicks "Login As" for an organization:

### Confirmation Step

Display confirmation modal:
```
+--------------------------------------------------+
| Impersonate Organization                          |
|                                                   |
| You are about to view as admin of:                |
| [Organization Name]                               |
|                                                   |
| All actions will be logged.                       |
|                                                   |
| [Cancel]                    [Confirm & Continue]  |
+--------------------------------------------------+
```

### Impersonation Behavior

1. Create an impersonation record in database that includes:
   - Super admin's user ID
   - Target organization ID
   - Timestamp of impersonation start
   - IP address and user agent

2. Update session with impersonation context

3. Redirect to the organization's admin dashboard

4. Super admin now has **full admin permissions** for that organization:
   - View all pages
   - Perform all actions
   - No restrictions

### Constraints

- Only ONE active impersonation per super admin at a time
- Switching organizations ends current impersonation, starts new one
- Maximum impersonation duration: 8 hours (auto-expires)

---

## 6. Impersonation Sticky Header

While impersonating, display a persistent header on **all pages**:

```
+------------------------------------------------------------------+
| ⚠ IMPERSONATING: [Org Name]    [2h 15m]    [Return to Panel]     |
+------------------------------------------------------------------+
```

- Always visible (sticky/fixed position, highest z-index)
- Shows organization name being impersonated
- Shows elapsed time since impersonation started
- "Return to Panel" button ends impersonation and returns to `/superadmin/organizations`
- Warning color scheme (yellow/amber background)

---

## 7. Session Behavior

- Impersonation session persists across page navigation
- Impersonation session persists across page refresh
- Clicking "Return to Panel" clears impersonation context
- Logging out ends both impersonation and super admin session
- Super admin session timeout: 24 hours (standard)
- Impersonation auto-expires after 8 hours
- If target organization is deleted while impersonating:
  - Display error message
  - Automatically return to super admin panel
  - Log the incident

### Concurrent Session Handling

- Super admin can only have one active session at a time
- New login invalidates previous session
- Impersonation state is tied to session (not shared across sessions)

---

## 8. Security Requirements

### Authentication

- Super admin login endpoint has separate rate limiting (stricter)
- Failed login attempts: max 5 per 15 minutes, then 30-minute lockout
- All super admin endpoints require valid session
- CSRF protection on all POST/PUT/DELETE endpoints

### Audit Logging

All super admin actions must be logged with:

| Field | Description |
|-------|-------------|
| `eventType` | Type of action performed |
| `superAdminUserId` | ID of the super admin |
| `targetOrganizationId` | Organization being impersonated (if applicable) |
| `ipAddress` | IP address of request |
| `userAgent` | Browser/client user agent |
| `timestamp` | When the action occurred |
| `metadata` | Additional context (action-specific) |

### Event Types to Log

- `superadmin_login` - Successful login
- `superadmin_login_failed` - Failed login attempt
- `superadmin_logout` - Logout
- `superadmin_impersonation_start` - Started impersonating
- `superadmin_impersonation_end` - Stopped impersonating
- `superadmin_impersonation_expired` - Auto-expired impersonation
- `superadmin_action` - Any action taken while impersonating

### Actions While Impersonating

- All data modifications must include `impersonatedBy: superAdminUserId`
- Original action author should reflect the super admin, not "admin"
- Audit trail must clearly show impersonated actions

### Data Retention

- Impersonation logs retained for: **2 years**
- Security audit logs retained for: **2 years**
- Consider GDPR/compliance requirements for log data

---

## 9. Error Handling

### User-Facing Errors

| Scenario | Message | Action |
|----------|---------|--------|
| Session expired | "Your session has expired" | Redirect to login |
| Impersonation expired | "Impersonation session expired" | Return to panel |
| Organization not found | "Organization no longer exists" | Return to panel |
| Organization deleted mid-session | "Organization was deleted" | Return to panel |
| Rate limited | "Too many requests" | Show retry timer |
| Server error | "Something went wrong" | Show retry option |

### Error Response Format

```json
{
  "error": {
    "code": "IMPERSONATION_EXPIRED",
    "message": "Your impersonation session has expired",
    "retryable": false
  }
}
```

---

## 10. Performance Requirements

| Metric | Requirement |
|--------|-------------|
| Organizations list load | < 500ms for 1000 orgs |
| Impersonation start | < 200ms |
| Impersonation end | < 200ms |
| Session validation | < 50ms |

---

## Database Changes

### Users Table Modification

```sql
-- Add super admin flag
ALTER TABLE users ADD COLUMN isSuperAdmin BOOLEAN DEFAULT FALSE;

-- Allow null organizationId for super admins
ALTER TABLE users ALTER COLUMN organizationId DROP NOT NULL;

-- Partial index for super admin lookups
CREATE INDEX idx_users_is_super_admin ON users(isSuperAdmin) WHERE isSuperAdmin = TRUE;
```

### Impersonation Logs Table

```sql
CREATE TABLE superAdminImpersonationLogs (
  id SERIAL PRIMARY KEY,
  superAdminUserId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  targetOrganizationId INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  startedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  endedAt TIMESTAMP WITH TIME ZONE,
  endReason VARCHAR(50), -- 'manual', 'logout', 'expired', 'org_deleted', 'session_expired'
  ipAddress VARCHAR(45),
  userAgent TEXT,

  -- Ensure only one active impersonation per super admin
  CONSTRAINT one_active_impersonation UNIQUE (superAdminUserId)
    WHERE (endedAt IS NULL)
);

-- Indexes for common queries
CREATE INDEX idx_impersonation_super_admin ON superAdminImpersonationLogs(superAdminUserId, startedAt DESC);
CREATE INDEX idx_impersonation_active ON superAdminImpersonationLogs(superAdminUserId) WHERE endedAt IS NULL;
CREATE INDEX idx_impersonation_org ON superAdminImpersonationLogs(targetOrganizationId, startedAt DESC);
```

---

## Routes Summary

| Route | Method | Description |
|-------|--------|-------------|
| `/superadmin/login` | GET | Login page |
| `/superadmin/organizations` | GET | Organization list panel |
| `/_api/superadmin/login` | POST | Login endpoint |
| `/_api/superadmin/logout` | POST | Logout endpoint |
| `/_api/superadmin/session` | GET | Get current session |
| `/_api/superadmin/organizations` | GET | List organizations |
| `/_api/superadmin/organizations/:id` | GET | Get organization details |
| `/_api/superadmin/impersonate` | POST | Start impersonation |
| `/_api/superadmin/stop-impersonate` | POST | End impersonation |

---

## Acceptance Criteria

### Login Flow
- [ ] Super admin can access `/superadmin/login`
- [ ] Invalid credentials show generic error
- [ ] Successful login redirects to organizations page
- [ ] Rate limiting blocks after 5 failed attempts

### Organizations Panel
- [ ] Displays all organizations with correct data
- [ ] Pagination works with 25 items per page
- [ ] Search filters by organization name
- [ ] Columns are sortable

### Impersonation
- [ ] Confirmation modal appears before impersonation
- [ ] Impersonation banner visible on all org pages
- [ ] Super admin has full admin access while impersonating
- [ ] "Return to Panel" ends impersonation cleanly
- [ ] Impersonation auto-expires after 8 hours

### Security
- [ ] All actions logged with super admin ID
- [ ] Rate limiting enforced on login
- [ ] CSRF protection active on all mutations
- [ ] Session invalidated on logout

### Edge Cases
- [ ] Deleted organization handled gracefully
- [ ] Concurrent session handled (old session invalidated)
- [ ] Impersonation switch works correctly

---

## Out of Scope (v1)

- Super admin user management (add/remove super admins)
- Audit log viewer in UI
- Organization creation/deletion from super admin panel
- Multi-factor authentication
- IP allowlisting for super admin access
- Email notifications for impersonation events
