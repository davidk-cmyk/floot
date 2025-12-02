import { recordPolicyVersion } from './policyVersionService';
import * as policyVersionHelperModule from './policyVersionHelper';

describe('policyVersionService', () => {
  let mockCreateVersionSnapshot: jasmine.Spy;

  beforeEach(() => {
    mockCreateVersionSnapshot = jasmine.createSpy('createVersionSnapshot').and.resolveTo();
    spyOn(policyVersionHelperModule, 'createVersionSnapshot').and.callFake(mockCreateVersionSnapshot);
    spyOn(console, 'error').and.stub();
  });



  describe('recordPolicyVersion', () => {
    const mockPolicy = {
      id: 123,
      title: 'Test Policy',
      content: 'Policy content',
      status: 'published' as const,
      organizationId: 789,
      authorId: 456,
      createdAt: new Date('2023-01-15T10:00:00Z'),
      updatedAt: new Date('2023-01-15T12:00:00Z'),
      currentVersion: 3,
      department: 'Engineering',
      category: 'Security',
      effectiveDate: new Date('2023-01-20T00:00:00Z'),
      expirationDate: new Date('2023-12-31T23:59:59Z'),
      reviewDate: new Date('2023-06-15T00:00:00Z'),
      tags: ['important', 'security'],
      approvedAt: new Date('2023-01-15T11:00:00Z'),
      approvedBy: 789,
      publishedAt: new Date('2023-01-15T11:30:00Z'),
      reviewedAt: null,
      reviewedBy: null
    };

    const mockUser = {
      id: 456,
      email: 'user@example.com',
      displayName: 'Test User',
      avatarUrl: null,
      organizationId: 789,
      role: 'admin' as const,
      hasLoggedIn: true,
      firstName: null,
      lastName: null,
      isActive: true,
      oauthProvider: null,
    };

    it('should call createVersionSnapshot with correct parameters', async () => {
      mockCreateVersionSnapshot.and.resolveTo();

      await recordPolicyVersion(mockPolicy, mockUser, 'Updated security requirements');

      expect(policyVersionHelperModule.createVersionSnapshot).toHaveBeenCalledWith({
        policyId: 123,
        organizationId: 789,
        versionNumber: 3,
        createdBy: 456,
        title: 'Test Policy',
        content: 'Policy content',
        status: 'published',
        changeSummary: 'Updated security requirements',
        effectiveDate: mockPolicy.effectiveDate,
        expirationDate: mockPolicy.expirationDate,
        reviewDate: mockPolicy.reviewDate,
        tags: ['important', 'security'],
        department: 'Engineering',
        category: 'Security'
      });
    });

    it('should handle null changeSummary', async () => {
      mockCreateVersionSnapshot.and.resolveTo();

      await recordPolicyVersion(mockPolicy, mockUser, null);

      expect(policyVersionHelperModule.createVersionSnapshot).toHaveBeenCalledWith({
        policyId: 123,
        organizationId: 789,
        versionNumber: 3,
        createdBy: 456,
        title: 'Test Policy',
        content: 'Policy content',
        status: 'published',
        changeSummary: null,
        effectiveDate: mockPolicy.effectiveDate,
        expirationDate: mockPolicy.expirationDate,
        reviewDate: mockPolicy.reviewDate,
        tags: ['important', 'security'],
        department: 'Engineering',
        category: 'Security'
      });
    });

    it('should handle undefined changeSummary', async () => {
      mockCreateVersionSnapshot.and.resolveTo();

      await recordPolicyVersion(mockPolicy, mockUser);

      expect(policyVersionHelperModule.createVersionSnapshot).toHaveBeenCalledWith({
        policyId: 123,
        organizationId: 789,
        versionNumber: 3,
        createdBy: 456,
        title: 'Test Policy',
        content: 'Policy content',
        status: 'published',
        changeSummary: null,
        effectiveDate: mockPolicy.effectiveDate,
        expirationDate: mockPolicy.expirationDate,
        reviewDate: mockPolicy.reviewDate,
        tags: ['important', 'security'],
        department: 'Engineering',
        category: 'Security'
      });
    });

    it('should handle null currentVersion by defaulting to 1', async () => {
      const policyWithNullVersion = {
        ...mockPolicy,
        currentVersion: null
      };
      mockCreateVersionSnapshot.and.resolveTo();

      await recordPolicyVersion(policyWithNullVersion, mockUser, 'First version');

      expect(policyVersionHelperModule.createVersionSnapshot).toHaveBeenCalledWith(jasmine.objectContaining({
        versionNumber: 1
      }));
    });

    it('should handle null policy fields gracefully', async () => {
      const policyWithNulls = {
        ...mockPolicy,
        department: null,
        category: null,
        effectiveDate: null,
        expirationDate: null,
        reviewDate: null,
        tags: null
      };
      mockCreateVersionSnapshot.and.resolveTo();

      await recordPolicyVersion(policyWithNulls, mockUser, 'Version with nulls');

      expect(policyVersionHelperModule.createVersionSnapshot).toHaveBeenCalledWith({
        policyId: 123,
        organizationId: 789,
        versionNumber: 3,
        createdBy: 456,
        title: 'Test Policy',
        content: 'Policy content',
        status: 'published',
        changeSummary: 'Version with nulls',
        effectiveDate: null,
        expirationDate: null,
        reviewDate: null,
        tags: null,
        department: null,
        category: null
      });
    });

    it('should log errors and not throw when createVersionSnapshot fails', async () => {
      const mockError = new Error('Version snapshot creation failed');
      mockCreateVersionSnapshot.and.rejectWith(mockError);

      await expectAsync(recordPolicyVersion(mockPolicy, mockUser, 'Test version')).toBeResolved();

      expect(console.error).toHaveBeenCalledWith('Failed to record policy version snapshot:', {
        policyId: 123,
        version: 3,
        error: 'Version snapshot creation failed'
      });
    });

    it('should handle non-Error exceptions gracefully', async () => {
      mockCreateVersionSnapshot.and.rejectWith('String error');

      await expectAsync(recordPolicyVersion(mockPolicy, mockUser, 'Test version')).toBeResolved();

      expect(console.error).toHaveBeenCalledWith('Failed to record policy version snapshot:', {
        policyId: 123,
        version: 3,
        error: 'String error'
      });
    });

    it('should log error with null version correctly', async () => {
      const policyWithNullVersion = {
        ...mockPolicy,
        currentVersion: null
      };
      const mockError = new Error('Snapshot failed');
      mockCreateVersionSnapshot.and.rejectWith(mockError);

      await expectAsync(recordPolicyVersion(policyWithNullVersion, mockUser)).toBeResolved();

      expect(console.error).toHaveBeenCalledWith('Failed to record policy version snapshot:', {
        policyId: 123,
        version: null,
        error: 'Snapshot failed'
      });
    });

    it('should not throw when successful', async () => {
      mockCreateVersionSnapshot.and.resolveTo();

      await expectAsync(recordPolicyVersion(mockPolicy, mockUser, 'Success test')).toBeResolved();

      expect(console.error).not.toHaveBeenCalled();
    });
  });
});