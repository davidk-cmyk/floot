import { sendPolicyCreationNotifications } from './policyNotificationService';
import * as dbModule from './db';
import * as notificationHelpersModule from './notificationHelpers';

describe('policyNotificationService', () => {
  let mockCreateNotification: jasmine.Spy;
  let mockCreatePolicyAssignmentNotification: jasmine.Spy;

  beforeEach(() => {
    mockCreateNotification = jasmine.createSpy('createNotification').and.resolveTo({});
    mockCreatePolicyAssignmentNotification = jasmine.createSpy('createPolicyAssignmentNotification');
    
    spyOn(notificationHelpersModule, 'createNotification').and.callFake(mockCreateNotification);
    spyOn(notificationHelpersModule, 'createPolicyAssignmentNotification').and.callFake(mockCreatePolicyAssignmentNotification);
    
    spyOn(console, 'error').and.stub();
  });



  describe('sendPolicyCreationNotifications', () => {
    const mockPolicy = {
      id: 1,
      title: 'Test Policy',
      content: 'Policy content',
      status: 'draft' as const,
      organizationId: 123,
      authorId: 456,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentVersion: 1,
      department: 'HR',
      category: 'Security',
      effectiveDate: null,
      expirationDate: null,
      reviewDate: null,
      tags: null,
      approvedAt: null,
      approvedBy: null,
      publishedAt: null,
      reviewedAt: null,
      reviewedBy: null
    };

    describe('when creator is an editor', () => {
      const editorUser = {
        id: 456,
        email: 'editor@example.com',
        displayName: 'Editor User',
        avatarUrl: null,
        organizationId: 123,
        role: 'editor' as const,
        hasLoggedIn: true,
        firstName: null,
        lastName: null,
        isActive: true,
        oauthProvider: null,
      };

      it('should notify all admins for approval', async () => {
        const mockAdmins = [{ id: 789 }, { id: 790 }];
        
        const mockExecute = jasmine.createSpy('execute').and.resolveTo(mockAdmins);
        const mockWhere = jasmine.createSpy('where').and.returnValue({ execute: mockExecute });
        const mockSelect = jasmine.createSpy('select').and.returnValue({ where: mockWhere });
        const mockSelectFrom = jasmine.createSpy('selectFrom').and.returnValue({ select: mockSelect });
        
        spyOnProperty(dbModule, 'db', 'get').and.returnValue({
          selectFrom: mockSelectFrom
        } as any);
        
        mockCreateNotification.and.resolveTo({});

        await sendPolicyCreationNotifications(mockPolicy, editorUser);

        expect(mockSelectFrom).toHaveBeenCalledWith('users');
        expect(mockSelect).toHaveBeenCalledWith(['id']);
        expect(mockWhere).toHaveBeenCalledWith('role', '=', 'admin');
        expect(mockWhere).toHaveBeenCalledWith('organizationId', '=', 123);

        expect(notificationHelpersModule.createNotification).toHaveBeenCalledTimes(2);
        expect(notificationHelpersModule.createNotification).toHaveBeenCalledWith(jasmine.objectContaining({
          userId: 789,
          organizationId: 123,
          type: 'approval_request',
          title: 'Policy Approval Required',
          message: 'Editor User has created a new policy "Test Policy" that requires your approval.',
          relatedPolicyId: 1
        }));
        expect(notificationHelpersModule.createNotification).toHaveBeenCalledWith(jasmine.objectContaining({
          userId: 790,
          organizationId: 123,
          type: 'approval_request',
          title: 'Policy Approval Required',
          message: 'Editor User has created a new policy "Test Policy" that requires your approval.',
          relatedPolicyId: 1
        }));
      });

      it('should handle empty admins list gracefully', async () => {
        const mockExecute = jasmine.createSpy('execute').and.resolveTo([]);
        const mockWhere = jasmine.createSpy('where').and.returnValue({ execute: mockExecute });
        const mockSelect = jasmine.createSpy('select').and.returnValue({ where: mockWhere });
        const mockSelectFrom = jasmine.createSpy('selectFrom').and.returnValue({ select: mockSelect });
        
        spyOnProperty(dbModule, 'db', 'get').and.returnValue({
          selectFrom: mockSelectFrom
        } as any);

        await sendPolicyCreationNotifications(mockPolicy, editorUser);

        expect(notificationHelpersModule.createNotification).not.toHaveBeenCalled();
      });
    });

    describe('when creator is an admin', () => {
      const adminUser = {
        id: 456,
        email: 'admin@example.com',
        displayName: 'Admin User',
        avatarUrl: null,
        organizationId: 123,
        role: 'admin' as const,
        hasLoggedIn: true,
        firstName: null,
        lastName: null,
        isActive: true,
        oauthProvider: null,
      };

      it('should notify other users about new policy', async () => {
        const mockOtherUsers = [{ id: 789 }, { id: 790 }];
        const mockNotification = { userId: 789, type: 'policy_assignment' };
        
        const mockExecute = jasmine.createSpy('execute').and.resolveTo(mockOtherUsers);
        const mockWhere = jasmine.createSpy('where').and.returnValue({ execute: mockExecute });
        const mockSelect = jasmine.createSpy('select').and.returnValue({ where: mockWhere });
        const mockSelectFrom = jasmine.createSpy('selectFrom').and.returnValue({ select: mockSelect });
        
        spyOnProperty(dbModule, 'db', 'get').and.returnValue({
          selectFrom: mockSelectFrom
        } as any);
        
        mockCreatePolicyAssignmentNotification.and.returnValue(mockNotification);
        mockCreateNotification.and.resolveTo({});

        await sendPolicyCreationNotifications(mockPolicy, adminUser);

        expect(mockSelectFrom).toHaveBeenCalledWith('users');
        expect(mockSelect).toHaveBeenCalledWith(['id']);
        expect(mockWhere).toHaveBeenCalledWith('organizationId', '=', 123);
        expect(mockWhere).toHaveBeenCalledWith('id', '!=', 456);

        expect(notificationHelpersModule.createPolicyAssignmentNotification).toHaveBeenCalledTimes(2);
        expect(notificationHelpersModule.createPolicyAssignmentNotification).toHaveBeenCalledWith(789, 123, 1, 'Test Policy');
        expect(notificationHelpersModule.createPolicyAssignmentNotification).toHaveBeenCalledWith(790, 123, 1, 'Test Policy');

        expect(notificationHelpersModule.createNotification).toHaveBeenCalledTimes(2);
      });

      it('should handle empty users list gracefully', async () => {
        const mockExecute = jasmine.createSpy('execute').and.resolveTo([]);
        const mockWhere = jasmine.createSpy('where').and.returnValue({ execute: mockExecute });
        const mockSelect = jasmine.createSpy('select').and.returnValue({ where: mockWhere });
        const mockSelectFrom = jasmine.createSpy('selectFrom').and.returnValue({ select: mockSelect });
        
        spyOnProperty(dbModule, 'db', 'get').and.returnValue({
          selectFrom: mockSelectFrom
        } as any);

        await sendPolicyCreationNotifications(mockPolicy, adminUser);

        expect(notificationHelpersModule.createPolicyAssignmentNotification).not.toHaveBeenCalled();
        expect(notificationHelpersModule.createNotification).not.toHaveBeenCalled();
      });
    });

    describe('when creator has other roles', () => {
            const regularUser = {
        id: 456,
        email: 'user@example.com',
        displayName: 'Regular User',
        avatarUrl: null,
        organizationId: 123,
        role: 'user' as const,
        hasLoggedIn: true,
        firstName: null,
        lastName: null,
        isActive: true,
        oauthProvider: null,
      };

      it('should not send any notifications', async () => {
                await sendPolicyCreationNotifications(mockPolicy, regularUser);

        expect(notificationHelpersModule.createNotification).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      const editorUser = {
        id: 456,
        email: 'editor@example.com',
        displayName: 'Editor User',
        avatarUrl: null,
        organizationId: 123,
        role: 'editor' as const,
        hasLoggedIn: true,
        firstName: null,
        lastName: null,
        isActive: true,
        oauthProvider: null,
      };

      it('should log errors and not throw when database query fails', async () => {
        const mockError = new Error('Database connection failed');
        const mockWhere = jasmine.createSpy('where').and.throwError(mockError);
        const mockSelect = jasmine.createSpy('select').and.returnValue({ where: mockWhere });
        const mockSelectFrom = jasmine.createSpy('selectFrom').and.returnValue({ select: mockSelect });
        
        spyOnProperty(dbModule, 'db', 'get').and.returnValue({
          selectFrom: mockSelectFrom
        } as any);

        await expectAsync(sendPolicyCreationNotifications(mockPolicy, editorUser)).toBeResolved();

        expect(console.error).toHaveBeenCalledWith('Error sending policy creation notifications:', {
          policyId: 1,
          creatorId: 456,
          error: 'Database connection failed'
        });
      });

      it('should log errors and not throw when notification creation fails', async () => {
        const mockAdmins = [{ id: 789 }];
        const mockError = new Error('Notification service unavailable');
        
        const mockExecute = jasmine.createSpy('execute').and.resolveTo(mockAdmins);
        const mockWhere = jasmine.createSpy('where').and.returnValue({ execute: mockExecute });
        const mockSelect = jasmine.createSpy('select').and.returnValue({ where: mockWhere });
        const mockSelectFrom = jasmine.createSpy('selectFrom').and.returnValue({ select: mockSelect });
        
        spyOnProperty(dbModule, 'db', 'get').and.returnValue({
          selectFrom: mockSelectFrom
        } as any);
        
        mockCreateNotification.and.rejectWith(mockError);

        await expectAsync(sendPolicyCreationNotifications(mockPolicy, editorUser)).toBeResolved();

        expect(console.error).toHaveBeenCalledWith('Error sending policy creation notifications:', {
          policyId: 1,
          creatorId: 456,
          error: 'Notification service unavailable'
        });
      });

      it('should handle non-Error exceptions gracefully', async () => {
        const mockWhere = jasmine.createSpy('where').and.throwError('String error');
        const mockSelect = jasmine.createSpy('select').and.returnValue({ where: mockWhere });
        const mockSelectFrom = jasmine.createSpy('selectFrom').and.returnValue({ select: mockSelect });
        
        spyOnProperty(dbModule, 'db', 'get').and.returnValue({
          selectFrom: mockSelectFrom
        } as any);

        await expectAsync(sendPolicyCreationNotifications(mockPolicy, editorUser)).toBeResolved();

        expect(console.error).toHaveBeenCalledWith('Error sending policy creation notifications:', {
          policyId: 1,
          creatorId: 456,
          error: 'String error'
        });
      });
    });
  });
});