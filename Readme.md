# Comprehensive Policy Management Platform
        
MyPolicyPortal is a comprehensive enterprise policy management platform that enables organizations to publish, manage, distribute, and track acknowledgment of internal or public-facing policies. The system features AI-powered authoring and search capabilities to streamline policy creation and make information easily accessible through natural language queries.

Core Purpose: To enable organizations to publish, manage, distribute, and track acknowledgment of internal or public-facing policies, enhanced with AI-powered authoring and search tools.

User Roles & Access Levels:
- **Admin**: Full control including policy management, user management, branding, domains, and analytics
- **Editor**: Create/edit policies, use AI authoring tools, request approval
- **Approver**: Approve or reject policy updates
- **Reader**: View assigned or public policies, confirm reading
- **Guest/Public**: View publicly available policies only (when enabled)

Key Feature Requirements:
- Policy management with WYSIWYG editor and/or file upload capabilities
- Policy metadata: effective date, expiration, tags
- Grouping by departments, compliance categories, or custom categories
- Version control with rollback and comparison
- Approval workflow with reviewer/approver history
- AI Policy Authoring Assistant to generate new policies, rewrite in plain English, suggest improvements, and provide contextual integration
- AI Chat-Based Search Assistant with natural language search, semantic matching, document linking, fallback handling, and privacy/safety filter
- Policy confirmation and acknowledgment with reader confirmation, timestamp and user identity tracking, required reading settings, reminder system, and export confirmations
- Public access, password-protected access, and SSO integration
- Notifications and updates with targeted emails, digest view, and AI-generated summary of changes
- Audit logs and analytics with policy views, confirmations, time on page, exportable audit logs, change history tracking, and confirmation status
- Branding and white labeling with custom domain support, SSL support, custom CSS, fonts, colors, logo, and favicon
- Admin panel features to manage users, roles, groups, monitor policy status, view confirmation and engagement data, configure SSO and custom domains, and branding and customization

Preferred communication style: Simple, everyday language.

External dependencies include OpenAI API for AI services.

Made with Floot.

# Instructions

For security reasons, the `env.json` file is not pre-populated — you will need to generate or retrieve the values yourself.  

For **JWT secrets**, generate a value with:  

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then paste the generated value into the appropriate field.  

For the **Floot Database**, download your database content as a pg_dump from the cog icon in the database view (right pane -> data -> floot data base -> cog icon on the left of the name), upload it to your own PostgreSQL database, and then fill in the connection string value.  

**Note:** Floot OAuth will not work in self-hosted environments.  

For other external services, retrieve your API keys and fill in the corresponding values.  

Once everything is configured, you can build and start the service with:  

```
npm install -g pnpm
pnpm install
pnpm vite build
pnpm tsx server.ts
```
