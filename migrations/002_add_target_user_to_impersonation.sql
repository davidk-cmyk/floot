-- Migration: Add target_user_id to super_admin_impersonation_logs
-- This enables user-level impersonation instead of organization-level

-- 1. Add target_user_id column
ALTER TABLE super_admin_impersonation_logs
ADD COLUMN IF NOT EXISTS target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 2. Create index for querying by target user
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_target_user
ON super_admin_impersonation_logs(target_user_id);

-- 3. Add comment for documentation
COMMENT ON COLUMN super_admin_impersonation_logs.target_user_id IS 'The specific user being impersonated (inherits their role and permissions)';
