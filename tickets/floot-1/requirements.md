# Super Admin Feature Requirements

## Overview

Add a super admin role that can access any organization's dashboard as if they were that organization's admin.

---

## 1. Super Admin Role

- New role type: `superAdmin` (distinct from organization `admin`)
- Super admins are **not** tied to any specific organization
- Stored in a separate table or with a special flag in the users table
- Credentials: email + password (standard auth)

---

## 2. Super Admin Login Page

**Route:** `/superadmin`

- Standalone login form (email + password)
- No access to regular user login flow
- On success: redirect to Super Admin Panel
- On failure: show error message

---

## 3. Super Admin Panel

**Route:** `/superadmin/organizations`

### Organizations Table

| Column | Description |
|--------|-------------|
| ID | Organization UUID |
| Name | Organization name |
| Created Date | When the org was created |
| Actions | "Login As" button |

- Sortable columns
- Basic search/filter by name (optional)

---

## 4. "Login As" Functionality

When super admin clicks "Login As" for an organization:

1. Create an impersonation session that includes:
   - Super admin's original identity
   - Target organization ID
   - Timestamp of impersonation start

2. Redirect to the organization's admin dashboard

3. Super admin now has **full admin permissions** for that organization:
   - View all pages
   - Perform all actions
   - No restrictions

---

## 5. Impersonation Sticky Header

While impersonating, display a persistent header on **all pages**:

```
+------------------------------------------------------------------+
| You are viewing as admin of: [Org Name]     [Return to Panel]    |
+------------------------------------------------------------------+
```

- Always visible (sticky/fixed position)
- Shows organization name being impersonated
- "Return to Panel" button ends impersonation and returns to `/superadmin/organizations`

---

## 6. Session Behavior

- Impersonation session persists across page navigation
- Clicking "Return to Panel" clears impersonation context
- Logging out ends both impersonation and super admin session
- Super admin session timeout follows standard rules

---

## 7. Security Considerations

- Super admin actions should be logged with `impersonatedBy` field
- Rate limit login attempts on `/superadmin`
- Consider: require 2FA for super admin accounts (future enhancement)

---

## Database Changes

### Option A: Flag on users table
```sql
ALTER TABLE users ADD COLUMN isSuperAdmin BOOLEAN DEFAULT FALSE;
```

### Option B: Separate table
```sql
CREATE TABLE superAdmins (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  passwordHash VARCHAR NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## New Routes Summary

| Route | Description |
|-------|-------------|
| `/superadmin` | Login page |
| `/superadmin/organizations` | Organization list panel |

---

## Out of Scope (v1)

- Super admin user management (add/remove super admins)
- Audit log viewer in UI
- Organization creation/deletion from super admin panel
- Multi-factor authentication
