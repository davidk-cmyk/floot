# MyPolicyPortal

## Overview
MyPolicyPortal is an AI-powered policy management platform designed to streamline policy creation, distribution, and acknowledgment. It aims to provide a comprehensive solution for organizations to manage their internal and external policies efficiently, leveraging AI for content generation and enhancement. The platform supports multi-tenancy, per-user Google Drive integration, and robust notification systems for policy acknowledgment and reminders.

## User Preferences
I prefer clear and concise explanations. When implementing new features or making significant changes, please propose the approach first and wait for my approval. I value iterative development and prefer to see progress in small, testable increments. Ensure that the core architectural patterns are maintained.

## System Architecture
The application uses a modern web stack: React 19 with Vite and TypeScript for the frontend, and Hono (Node.js) for the backend. PostgreSQL is the database, accessed via the Kysely ORM.

**UI/UX Decisions:**
- **Branding:** Portal hero background and page elements dynamically adapt to organization branding colors.
- **Layout:** Responsive 3-column grid for policy cards, consistent `PortalLayout` for all rendering paths.
- **Interactivity:** Animated "AI is thinking/formatting" states with real-time character counts and auto-scroll for streaming AI features.
- **Navigation:** Reorganized sidebar with Audit Trail, Settings, and dynamic Portals section.

**Technical Implementations:**
- **AI Integration:** Uses Replit AI Integrations with Anthropic's `claude-sonnet-4-5` model for policy generation, improvements, and rephrasing.
- **Email System:** Transactional emails (policy acknowledgments, reminders) are handled via Replit's Resend connector.
- **File Uploads:** Supports multi-document uploads (up to 50 files) from local system and per-user Google Drive accounts.
- **Google Drive Integration:** PKCE-secured OAuth flow with state validation for per-user Google Drive connections, storing tokens in `user_google_drive_connections` table with auto-refresh.
- **Policy Management:** Features bulk policy selection, bulk portal assignment with pre-populated checkboxes showing existing assignments (supports indeterminate/mixed state for partial assignments), and a requirement to assign portals before publishing policies.
- **Database Schema:** PostgreSQL schema includes 27 tables, 1 view (`unacknowledged_required_policies`), 2 triggers (auto-create policy versions), 101 indexes, and a `user_role` enum. Portal slugs are unique per organization.

**Feature Specifications:**
- **Policy Templates:** "Legally Required" filter added to the Policy Template Library for quick access to legally mandated templates.
- **Policy Acknowledgment:** Fully enabled email acknowledgment and reminder system with 6-digit confirmation codes.
- **Dynamic Portal Labels:** Portals have a configurable `label` field for customizable badge text.
- **AI Edit/Format:** AI-generated content correctly renders markdown to HTML.
- **Document Editor Toolbar:** Enhanced with improved AI feature discoverability - organized into Basic Formatting and AI-Powered Features groups with all four AI buttons styled consistently (secondary variant with gradient backgrounds and shadows).
- **AI-Powered Features Styling:**
  - AI Edit: Sparkles icon + "AI Edit" label with (i) tooltip inside button
  - Format Document: Sparkles icon + "Format Document" label with (i) tooltip inside button
  - Clear Format: Eraser icon + "Clear Format" label with (i) tooltip inside button
  - Variables: Variable icon + "Variables" label with (i) tooltip inside button
- **Tooltip Descriptions:** All AI buttons have descriptive (i) icons with tooltips:
  - AI Edit: "Select text and use AI to rewrite, expand, or modify it"
  - Format Document: "Apply consistent formatting across entire document"
  - Clear Format: "Remove all text formatting and return to plain text"
  - Variables: "Insert dynamic fields that auto-populate (press /)"
- **Variables Hint Pill:** Added floating hint pill that appears near the cursor when user starts typing, showing "Press / for variables" tip. Auto-hides after 4 seconds or when "/" is pressed.
- **Organization Variables Page Enhancements:**
  - Added "How Variables Work" section with explanation and 9 common examples (company.name, dpo_email, hr_contact, etc.)
  - Improved "Add Custom Variable" form with better placeholder text and helper instructions (use lowercase with underscores)
  - Quick Start suggestions (CEO Name, Company Address, DPO Contact, HR Email, Emergency Number, Head Office Location)
  - Suggestion buttons show existing variables as disabled to prevent duplicates
  - Animated gradient guide section with clear visual hierarchy
- **Date Selection UI:**
  - Replaced calendar date pickers with three-dropdown selectors (Day, Month, Year) via DateDropdownSelector component
  - Effective Date: Uses simple Day/Month/Year dropdown selection
  - Expiration Date: Preset duration options (1-5 years from effective date) with "Custom Date" fallback to dropdown selectors
  - Review Date: Same preset duration approach as Expiration Date
  - Dynamic year range based on existing date value (default: current year -10 to +20)
  - Clear button (X) to unset optional date fields

## External Dependencies
- **Database:** PostgreSQL
- **AI Integration:** Anthropic (Claude `claude-sonnet-4-5` model) via Replit AI Integrations
- **Email Service:** Resend (via Replit Connectors)
- **File Storage/Management:** Google Drive (per-user OAuth integration)
- **Runtime:** Node.js 20
- **Frameworks/Libraries:** React 19, Vite, Hono, Kysely ORM