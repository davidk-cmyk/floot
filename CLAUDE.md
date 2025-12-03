# CLAUDE.md — MyPolicyPortal Development Guidelines

## Project Overview

MyPolicyPortal is an enterprise policy management platform built with React 19, Hono server, and PostgreSQL. It enables organizations to publish, manage, distribute, and track acknowledgment of policies with AI-powered authoring capabilities.

## Tech Stack

- **Frontend**: React 19, React Router 6, TanStack Query v5, Radix UI, Lexical Editor
- **Backend**: Hono (Node.js), Kysely (SQL query builder)
- **Database**: PostgreSQL
- **Validation**: Zod
- **Styling**: CSS Modules, CSS variables
- **Build**: Vite, tsx

## Project Structure

```
/
├── components/          # React components (PascalCase.tsx)
├── pages/               # Route pages with pageLayout patterns
│   ├── <name>.tsx              # Page component
│   ├── <name>.pageLayout.tsx   # Layout wrapper
│   └── <name>.module.css       # Page styles
├── helpers/             # Utilities, hooks, and shared logic
├── endpoints/           # API route handlers
│   └── <resource>/
│       ├── <action>_<METHOD>.ts        # Handler
│       └── <action>_<METHOD>.schema.ts # Zod schemas
├── static/              # Static assets
├── App.tsx              # Root app with routing
├── server.ts            # Hono server with all API routes
└── env.json             # Environment configuration (not committed)
```

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm vite dev

# Build
pnpm vite build

# Run production server
pnpm tsx server.ts
```

## Conventions

### File Naming
- Components: `PascalCase.tsx` (e.g., `PolicyCard.tsx`)
- Pages: `route.name.tsx` with matching `.pageLayout.tsx` and `.module.css`
- Helpers: `camelCase.tsx` (e.g., `dateHelpers.tsx`)
- Endpoints: `<action>_<METHOD>.ts` with `.schema.ts` for validation
- Styles: `<ComponentName>.module.css`

### Route Parameters
- Dynamic routes use `$param` syntax (e.g., `$orgId.admin.policies.$policyId.tsx`)
- Maps to React Router `:param` (e.g., `/:orgId/admin/policies/:policyId`)

### API Endpoints
- Located in `endpoints/` directory
- Each endpoint exports a `handle(request: Request): Promise<Response>` function
- Use `.schema.ts` files for Zod request/response validation
- Route pattern: `_api/<resource>/<action>`

### Components
- One component per file
- Use CSS Modules for styling
- Colocate types within the component file when small
- Use Radix UI primitives for accessible UI patterns

### State Management
- TanStack Query for server state
- React Context for app-wide state (auth, organization)
- Local state with useState for UI-only state

## Key Patterns

### Page Layout Pattern
Every page has a corresponding `pageLayout.tsx` that wraps it:
```typescript
// pages/policies.tsx - The actual page content
// pages/policies.pageLayout.tsx - Layout wrapper (auth, navigation, etc.)
```

### Endpoint Handler Pattern
```typescript
// endpoints/policies/create_POST.ts
export async function handle(request: Request): Promise<Response> {
  const body = await request.json();
  const validated = CreatePolicySchema.parse(body);
  // ... business logic
  return Response.json({ data: result });
}
```

### Schema Pattern
```typescript
// endpoints/policies/create_POST.schema.ts
import { z } from 'zod';

export const CreatePolicySchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  organizationId: z.string().uuid(),
});
```

## Domain Concepts

- **Organization**: Multi-tenant container for policies, users, portals
- **Policy**: Document with versioning, metadata, acknowledgment tracking
- **Portal**: Public or private interface for policy access
- **Acknowledgment**: User confirmation of policy reading
- **User Roles**: Admin, Editor, Approver, Reader, Guest

## Security Requirements

- Validate all inputs at API boundary with Zod
- Check organization context on every request
- Never expose internal errors to clients
- Use parameterized queries (Kysely handles this)
- Hash passwords with bcrypt

## AI Features

The platform includes AI-powered features using Claude (Anthropic):
- Policy generation and rewriting
- Improvement suggestions
- Taxonomy suggestions
- Missing policy suggestions

When working with AI features, respect rate limits and handle API errors gracefully. The AI client is configured via environment variables and uses the `@anthropic-ai/sdk` package.

## Testing

Run tests with file pattern matching:
```bash
# Run specific test
pnpm vitest <filename>

# Watch mode
pnpm vitest --watch
```

## Environment Variables

Required environment variables (can be set in `env.json` or as process env):
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY`: For AI features (Claude)
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`: Anthropic API base URL
- `RESEND_API_KEY`: For email notifications

## Destructive Operations

Always confirm before:
- Database migrations or schema changes
- Bulk policy deletions
- Organization deletion
- User role changes affecting access
