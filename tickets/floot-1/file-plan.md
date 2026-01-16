# FLOOT-1: File Plan

## New Files

### Database Migration
```
migrations/XXXXXX_add_super_admin.sql
```

### Backend - Endpoints
```
endpoints/superadmin/login_POST.ts
endpoints/superadmin/login_POST.schema.ts
endpoints/superadmin/session_GET.ts
endpoints/superadmin/organizations_GET.ts
endpoints/superadmin/impersonate_POST.ts
endpoints/superadmin/impersonate_POST.schema.ts
endpoints/superadmin/stop-impersonate_POST.ts
```

### Frontend - Pages
```
pages/superadmin.login.tsx
pages/superadmin.login.pageLayout.tsx
pages/superadmin.organizations.tsx
pages/superadmin.organizations.pageLayout.tsx
```

### Frontend - Components
```
components/SuperAdminLayout.tsx
components/SuperAdminLayout.module.css
components/SuperAdminProtectedRoute.tsx
components/ImpersonationBanner.tsx
components/ImpersonationBanner.module.css
```

### Frontend - Helpers
```
helpers/useSuperAdmin.tsx
```

---

## Modified Files

### Database Schema
```
helpers/schema.tsx
  - Add isSuperAdmin field to Users interface
  - Make organizationId nullable
  - Add SuperAdminImpersonationLogs interface
```

### Session Management
```
helpers/getSetServerSession.tsx
  - Extend Session interface with impersonation fields
```

### User Types
```
helpers/User.tsx
  - Add isSuperAdmin boolean
  - Add impersonatingOrganization optional field
```

### Security
```
helpers/securityAuditLogger.tsx
  - Add super admin event types
```

### Layouts
```
components/DashboardLayout.tsx
  - Import and render ImpersonationBanner
```

### Route Protection
```
components/ProtectedRoute.tsx
  - Handle super admin impersonation in role checks
```

### Server
```
server.ts
  - Register 5 new super admin API routes
```

### App Routing
```
App.tsx
  - Add superadmin.login and superadmin.organizations routes
```

---

## File Tree

```
floot/
├── migrations/
│   └── XXXXXX_add_super_admin.sql        [NEW]
│
├── endpoints/
│   └── superadmin/                        [NEW DIR]
│       ├── login_POST.ts                  [NEW]
│       ├── login_POST.schema.ts           [NEW]
│       ├── session_GET.ts                 [NEW]
│       ├── organizations_GET.ts           [NEW]
│       ├── impersonate_POST.ts            [NEW]
│       ├── impersonate_POST.schema.ts     [NEW]
│       └── stop-impersonate_POST.ts       [NEW]
│
├── pages/
│   ├── superadmin.login.tsx               [NEW]
│   ├── superadmin.login.pageLayout.tsx    [NEW]
│   ├── superadmin.organizations.tsx       [NEW]
│   └── superadmin.organizations.pageLayout.tsx [NEW]
│
├── components/
│   ├── SuperAdminLayout.tsx               [NEW]
│   ├── SuperAdminLayout.module.css        [NEW]
│   ├── SuperAdminProtectedRoute.tsx       [NEW]
│   ├── ImpersonationBanner.tsx            [NEW]
│   ├── ImpersonationBanner.module.css     [NEW]
│   ├── DashboardLayout.tsx                [MODIFY]
│   └── ProtectedRoute.tsx                 [MODIFY]
│
├── helpers/
│   ├── useSuperAdmin.tsx                  [NEW]
│   ├── schema.tsx                         [MODIFY]
│   ├── getSetServerSession.tsx            [MODIFY]
│   ├── User.tsx                           [MODIFY]
│   └── securityAuditLogger.tsx            [MODIFY]
│
├── server.ts                              [MODIFY]
└── App.tsx                                [MODIFY]
```

---

## Summary

| Category | New | Modified |
|----------|-----|----------|
| Migration | 1 | - |
| Endpoints | 7 | - |
| Pages | 4 | - |
| Components | 5 | 2 |
| Helpers | 1 | 4 |
| Config | - | 2 |
| **Total** | **18** | **8** |
