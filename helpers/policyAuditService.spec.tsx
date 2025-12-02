import { auditPolicyCreation, auditPolicyUpdate } from './policyAuditService';
import * as policyAuditLoggerModule from './policyAuditLogger';
import * as policyJsonServiceModule from './policyJsonService';

describe('policyAuditService', () => {
  let mockLogPolicyAction: jasmine.Spy;
  let mockBuildJsonSafeCopy: jasmine.Spy;

  beforeEach(() => {
    mockLogPolicyAction = jasmine.createSpy('logPolicyAction').and.resolveTo();
    mockBuildJsonSafeCopy = jasmine.createSpy('buildJsonSafeCopy');
    
    spyOn(policyAuditLoggerModule, 'logPolicyAction').and.callFake(mockLogPolicyAction);
    spyOn(policyJsonServiceModule, 'buildJsonSafeCopy').and.callFake(mockBuildJsonSafeCopy);
  });



  describe('auditPolicyCreation', () => {
    const mockPolicy = {
      id: 123,
      title: 'Test Policy',
      department: 'Engineering',
      category: 'Security',
      requiresAcknowledgment: true
    };

    const mockUser = {
      id: 456,
      email: 'user@example.com',
      displayName: 'Test User',
      avatarUrl: null,
      organizationId: 789,
      role: 'admin' as const,
      oauthProvider: null,
      hasLoggedIn: true
    };

    const mockRequest = new Request('https://example.com/policies');

    it('should call logPolicyAction with correct parameters', async () => {
      mockLogPolicyAction.and.resolveTo();

      await auditPolicyCreation(mockPolicy, mockUser, mockRequest);

      expect(policyAuditLoggerModule.logPolicyAction).toHaveBeenCalledWith(jasmine.objectContaining({
        policyId: 123,
        policyName: 'Test Policy',
        organizationId: 789,
        action: 'create',
        actionBy: 456,
        request: mockRequest
      }));
    });

    it('should handle null department and category', async () => {
      const policyWithNulls = {
        ...mockPolicy,
        department: null,
        category: null,
        requiresAcknowledgment: null
      };

      await auditPolicyCreation(policyWithNulls, mockUser, mockRequest);

      expect(policyAuditLoggerModule.logPolicyAction).toHaveBeenCalledWith(jasmine.objectContaining({
        policyId: 123,
        policyName: 'Test Policy',
        organizationId: 789,
        action: 'create',
        actionBy: 456,
        request: mockRequest
      }));
    });

    it('should propagate errors from logPolicyAction', async () => {
      const mockError = new Error('Audit logging failed');
      mockLogPolicyAction.and.rejectWith(mockError);

      await expectAsync(auditPolicyCreation(mockPolicy, mockUser, mockRequest)).toBeRejectedWith(mockError);
    });
  });

  describe('auditPolicyUpdate', () => {
    const mockUpdatedPolicy = {
      id: 123,
      title: 'Updated Policy Title',
      currentVersion: 2
    };

    const mockUser = {
      id: 456,
      email: 'user@example.com',
      displayName: 'Test User',
      avatarUrl: null,
      organizationId: 789,
      role: 'admin' as const,
      oauthProvider: null,
      hasLoggedIn: true
    };

    const mockUpdateData = {
      title: 'Updated Policy Title',
      content: 'New content',
      department: 'HR'
    };

    const mockRequest = new Request('https://example.com/policies/123');

    it('should call logPolicyAction with correct parameters including JSON-safe changes', async () => {
      const mockJsonSafeChanges = {
        title: 'Updated Policy Title',
        content: 'New content',
        department: 'HR'
      };

      mockBuildJsonSafeCopy.and.returnValue(mockJsonSafeChanges);
      mockLogPolicyAction.and.resolveTo();

      await auditPolicyUpdate(mockUpdatedPolicy, mockUpdateData, 'Updated title and content', mockUser, mockRequest);

      expect(policyJsonServiceModule.buildJsonSafeCopy).toHaveBeenCalledWith(mockUpdateData);
      expect(policyAuditLoggerModule.logPolicyAction).toHaveBeenCalledWith(jasmine.objectContaining({
        policyId: 123,
        policyName: 'Updated Policy Title',
        organizationId: 789,
        action: 'edit',
        actionBy: 456,
        request: mockRequest
      }));
    });

    it('should handle null changeSummary', async () => {
      const mockJsonSafeChanges = { title: 'Updated' };
      mockBuildJsonSafeCopy.and.returnValue(mockJsonSafeChanges);
      mockLogPolicyAction.and.resolveTo();

      await auditPolicyUpdate(mockUpdatedPolicy, { title: 'Updated' }, null, mockUser, mockRequest);

      expect(policyAuditLoggerModule.logPolicyAction).toHaveBeenCalledWith(jasmine.objectContaining({
        policyId: 123,
        policyName: 'Updated Policy Title',
        organizationId: 789,
        action: 'edit',
        actionBy: 456,
        request: mockRequest
      }));
    });

    it('should handle undefined changeSummary', async () => {
      const mockJsonSafeChanges = { content: 'New content' };
      mockBuildJsonSafeCopy.and.returnValue(mockJsonSafeChanges);
      mockLogPolicyAction.and.resolveTo();

      await auditPolicyUpdate(mockUpdatedPolicy, { content: 'New content' }, undefined, mockUser, mockRequest);

      expect(policyAuditLoggerModule.logPolicyAction).toHaveBeenCalledWith(jasmine.objectContaining({
        policyId: 123,
        policyName: 'Updated Policy Title',
        organizationId: 789,
        action: 'edit',
        actionBy: 456,
        request: mockRequest
      }));
    });

    it('should handle empty updateData', async () => {
      const mockJsonSafeChanges = {};
      mockBuildJsonSafeCopy.and.returnValue(mockJsonSafeChanges);
      mockLogPolicyAction.and.resolveTo();

      await auditPolicyUpdate(mockUpdatedPolicy, {}, 'No changes', mockUser, mockRequest);

      expect(policyAuditLoggerModule.logPolicyAction).toHaveBeenCalledWith(jasmine.objectContaining({
        policyId: 123,
        policyName: 'Updated Policy Title',
        organizationId: 789,
        action: 'edit',
        actionBy: 456,
        request: mockRequest
      }));
    });

    it('should handle null currentVersion', async () => {
      const policyWithNullVersion = {
        ...mockUpdatedPolicy,
        currentVersion: null
      };
      const mockJsonSafeChanges = { status: 'published' };
      mockBuildJsonSafeCopy.and.returnValue(mockJsonSafeChanges);
      mockLogPolicyAction.and.resolveTo();

      await auditPolicyUpdate(policyWithNullVersion, { status: 'published' }, 'Published', mockUser, mockRequest);

      expect(policyAuditLoggerModule.logPolicyAction).toHaveBeenCalledWith(jasmine.objectContaining({
        policyId: 123,
        policyName: 'Updated Policy Title',
        organizationId: 789,
        action: 'edit',
        actionBy: 456,
        request: mockRequest
      }));
    });

    it('should propagate errors from logPolicyAction', async () => {
      const mockError = new Error('Audit logging failed');
      mockBuildJsonSafeCopy.and.returnValue({});
      mockLogPolicyAction.and.rejectWith(mockError);

      await expectAsync(auditPolicyUpdate(mockUpdatedPolicy, {}, null, mockUser, mockRequest)).toBeRejectedWith(mockError);
    });

    it('should propagate errors from buildJsonSafeCopy', async () => {
      const mockError = new Error('JSON conversion failed');
      mockBuildJsonSafeCopy.and.throwError(mockError);

      await expectAsync(auditPolicyUpdate(mockUpdatedPolicy, mockUpdateData, null, mockUser, mockRequest)).toBeRejectedWith(mockError);
    });
  });
});