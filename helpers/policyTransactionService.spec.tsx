import { withPolicyTransaction } from './policyTransactionService';
import * as dbModule from './db';

describe('policyTransactionService', () => {
  let mockTransaction: jasmine.Spy;
  let mockExecute: jasmine.Spy;

  beforeEach(() => {
    mockExecute = jasmine.createSpy('execute');
    mockTransaction = jasmine.createSpy('transaction').and.returnValue({ execute: mockExecute });
    
    spyOnProperty(dbModule, 'db', 'get').and.returnValue({
      transaction: mockTransaction
    } as any);
  });



  describe('withPolicyTransaction', () => {
    it('should execute callback within a transaction', async () => {
      const mockCallback = jasmine.createSpy('callback').and.resolveTo('success');
      mockExecute.and.resolveTo('success');

      const result = await withPolicyTransaction(mockCallback);

      expect(mockTransaction).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalledWith(mockCallback);
      expect(result).toBe('success');
    });

    it('should return the result of the callback', async () => {
      const expectedResult = { id: 123, title: 'New Policy' };
      const mockCallback = jasmine.createSpy('callback').and.resolveTo(expectedResult);
      mockExecute.and.resolveTo(expectedResult);

      const result = await withPolicyTransaction(mockCallback);

      expect(result).toEqual(expectedResult);
    });

    it('should pass the transaction object to the callback', async () => {
      const mockTrx = { insertInto: jasmine.createSpy('insertInto') };
      const mockCallback = jasmine.createSpy('callback').and.resolveTo();
      
      // Mock the execute method to call the callback with the transaction
      mockExecute.and.callFake(async (callback) => {
        return await callback(mockTrx);
      });

      await withPolicyTransaction(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(mockTrx);
    });

    it('should handle callback that performs database operations', async () => {
      const mockTrx = {
        insertInto: jasmine.createSpy('insertInto').and.returnValue({
          values: jasmine.createSpy('values').and.returnValue({
            returningAll: jasmine.createSpy('returningAll').and.returnValue({
              executeTakeFirstOrThrow: jasmine.createSpy('executeTakeFirstOrThrow').and.resolveTo({ id: 1, title: 'Test Policy' })
            })
          })
        }),
        updateTable: jasmine.createSpy('updateTable')
      };

      const mockCallback = jasmine.createSpy('callback').and.callFake(async (trx) => {
        // Simulate database operations within transaction
        const policy = await trx.insertInto('policies').values({}).returningAll().executeTakeFirstOrThrow();
        return policy;
      });

      mockExecute.and.callFake(async (callback) => {
        return await callback(mockTrx);
      });

      const result = await withPolicyTransaction(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(mockTrx);
      expect(mockTrx.insertInto).toHaveBeenCalledWith('policies');
      expect(result).toEqual({ id: 1, title: 'Test Policy' });
    });

    it('should propagate errors from the callback', async () => {
      const mockError = new Error('Database operation failed');
      const mockCallback = jasmine.createSpy('callback').and.rejectWith(mockError);
      mockExecute.and.rejectWith(mockError);

      await expectAsync(withPolicyTransaction(mockCallback)).toBeRejectedWith(mockError);

      expect(mockTransaction).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalledWith(mockCallback);
    });

    it('should handle synchronous errors in callback', async () => {
      const mockError = new Error('Synchronous error');
      const mockCallback = jasmine.createSpy('callback').and.throwError(mockError);
      mockExecute.and.callFake((callback) => {
        try {
          return callback({});
        } catch (error) {
          return Promise.reject(error);
        }
      });

      await expectAsync(withPolicyTransaction(mockCallback)).toBeRejectedWith(mockError);
    });

    it('should handle transaction rollback on error', async () => {
      const mockError = new Error('Transaction should rollback');
      const mockCallback = jasmine.createSpy('callback').and.rejectWith(mockError);
      
      // Kysely automatically handles rollback, so we just need to ensure the error propagates
      mockExecute.and.rejectWith(mockError);

      await expectAsync(withPolicyTransaction(mockCallback)).toBeRejectedWith(mockError);

      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should work with different return types', async () => {
      // Test with number return
      const numberCallback = jasmine.createSpy('numberCallback').and.resolveTo(42);
      mockExecute.and.resolveTo(42);
      
      const numberResult = await withPolicyTransaction(numberCallback);
      expect(numberResult).toBe(42);

      // Test with boolean return
      const booleanCallback = jasmine.createSpy('booleanCallback').and.resolveTo(true);
      mockExecute.and.resolveTo(true);
      
      const booleanResult = await withPolicyTransaction(booleanCallback);
      expect(booleanResult).toBe(true);

      // Test with void return
      const voidCallback = jasmine.createSpy('voidCallback').and.resolveTo();
      mockExecute.and.resolveTo(undefined);
      
      const voidResult = await withPolicyTransaction(voidCallback);
      expect(voidResult).toBeUndefined();
    });

    it('should handle complex transaction scenarios', async () => {
      const mockTrx = {
        insertInto: jasmine.createSpy('insertInto').and.returnValue({
          values: () => ({ execute: jasmine.createSpy('execute').and.resolveTo({ id: 1 }) })
        }),
        updateTable: jasmine.createSpy('updateTable').and.returnValue({
          set: () => ({ where: () => ({ execute: jasmine.createSpy('execute').and.resolveTo() }) })
        })
      };

      const complexCallback = jasmine.createSpy('complexCallback').and.callFake(async (trx) => {
        // Multiple operations in a single transaction
        const newPolicy = await trx.insertInto('policies').values({}).execute();
        await trx.updateTable('settings').set({}).where('id', '=', 1).execute();
        return newPolicy;
      });

      mockExecute.and.callFake(async (callback) => {
        return await callback(mockTrx);
      });

      const result = await withPolicyTransaction(complexCallback);

      expect(mockTrx.insertInto).toHaveBeenCalledWith('policies');
      expect(mockTrx.updateTable).toHaveBeenCalledWith('settings');
      expect(result).toEqual({ id: 1 });
    });
  });
});