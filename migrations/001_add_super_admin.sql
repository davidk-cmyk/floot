-- Migration: Add Super Admin Support
-- Run this migration to add super admin functionality

-- 1. Add isSuperAdmin column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. Make organization_id nullable for super admins
ALTER TABLE users
ALTER COLUMN organization_id DROP NOT NULL;

-- 3. Create super_admin_impersonation_logs table
CREATE TABLE IF NOT EXISTS super_admin_impersonation_logs (
  id SERIAL PRIMARY KEY,
  super_admin_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  end_reason VARCHAR(20) CHECK (end_reason IN ('manual', 'logout', 'expired', 'org_deleted', 'session_expired')),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_super_admin_impersonation_logs_user_id
ON super_admin_impersonation_logs(super_admin_user_id);

CREATE INDEX IF NOT EXISTS idx_super_admin_impersonation_logs_active
ON super_admin_impersonation_logs(super_admin_user_id, ended_at)
WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_is_super_admin
ON users(is_super_admin)
WHERE is_super_admin = true;

-- 5. Add comment for documentation
COMMENT ON TABLE super_admin_impersonation_logs IS 'Audit log for super admin organization impersonation sessions';
COMMENT ON COLUMN users.is_super_admin IS 'Indicates if user has super admin privileges to access all organizations';
