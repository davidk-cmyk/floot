/**
 * @jest-environment node
 */
// Note: This file uses Jasmine syntax for testing as requested.
// It is designed to be run in a Node.js environment with a Jasmine test runner.

import { withPolicyTransaction } from './policyTransactionService';
import { auditPolicyCreation, auditPolicyUpdate } from './policyAuditService';
import { recordPolicyVersion } from './policyVersionService';
import { updateDepartmentSetting, updateCategorySetting } from './policyTaxonomyService';
import { sendPolicyCreationNotifications } from './policyNotificationService';
import { handlePolicyError, PolicyNotFoundError, UnauthorizedPolicyActionError } from './policyErrorService';

// Dependencies to be mocked
import * as db from './db';
import * as policyAuditLogger from './policyAuditLogger';
import * as policyVersionHelper from './policyVersionHelper';
import * as notificationHelpers from './notificationHelpers';

import { Selectable } from 'kysely';
import { Policies, Users } from './schema';
import { ZodError, ZodIssueCode } from 'zod';

// --- MOCK DATA ---

const mockAdminUser: Selectable<Users> = {
  id: 1,
  organizationId: 101,
  role: 'admin',
  displayName: 'Test Admin',
  email: 'admin@test.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  avatarUrl: null,
  firstName: 'Test',
  lastName: 'Admin',
  firstLoginAt: new Date(),
  hasLoggedIn: true,
  isActive: true,
};

const mockEditorUser: Selectable<Users> = {
  id: 2,
  organizationId: 101,
  role: 'editor',
  displayName: 'Test Editor',
  email: 'editor@test.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  avatarUrl: null,
  firstName: 'Test',
  lastName: 'Editor',
  firstLoginAt: new Date(),
  hasLoggedIn: true,
  isActive: true,
};

const mockPolicyInput = {
  title: 'New Test Policy',
  content: 'This is the content.',
  department: 'Engineering',
  category: 'Security',
  tags: ['test', 'security'],
  requiresAcknowledgment: true,
  effectiveDate: new Date(),
  expirationDate: null,
  reviewDate: null,
  authorId: 1,
  organizationId: 101,
};