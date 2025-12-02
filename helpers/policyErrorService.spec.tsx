import { handlePolicyError, PolicyNotFoundError, UnauthorizedPolicyActionError } from './policyErrorService';
import { ZodError } from 'zod';
import superjson from 'superjson';

describe('policyErrorService', () => {
  beforeEach(() => {
    spyOn(console, 'error').and.stub();
  });



  describe('PolicyNotFoundError', () => {
    it('should create error with default message', () => {
      const error = new PolicyNotFoundError();
      expect(error.message).toBe('Policy not found.');
      expect(error.name).toBe('PolicyNotFoundError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error with custom message', () => {
      const error = new PolicyNotFoundError('Custom policy not found message');
      expect(error.message).toBe('Custom policy not found message');
      expect(error.name).toBe('PolicyNotFoundError');
    });
  });

  describe('UnauthorizedPolicyActionError', () => {
    it('should create error with default message', () => {
      const error = new UnauthorizedPolicyActionError();
      expect(error.message).toBe('You do not have permission to perform this action.');
      expect(error.name).toBe('UnauthorizedPolicyActionError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error with custom message', () => {
      const error = new UnauthorizedPolicyActionError('Custom authorization message');
      expect(error.message).toBe('Custom authorization message');
      expect(error.name).toBe('UnauthorizedPolicyActionError');
    });
  });

  describe('handlePolicyError', () => {
    it('should handle ZodError with proper formatting and 400 status', async () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['title'],
          message: 'Expected string, received number'
        },
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          path: ['content'],
          message: 'String must contain at least 1 character(s)'
        }
      ]);

      const response = handlePolicyError(zodError);

      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      const bodyText = await response.text();
      const body = superjson.parse(bodyText) as { error: string };
      expect(body.error).toBe('title: Expected string, received number, content: String must contain at least 1 character(s)');
    });

    it('should handle PolicyNotFoundError with 404 status', async () => {
      const error = new PolicyNotFoundError('The requested policy does not exist');
      const response = handlePolicyError(error);

      expect(response.status).toBe(404);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      const bodyText = await response.text();
      const body = superjson.parse(bodyText) as { error: string };
      expect(body.error).toBe('The requested policy does not exist');
    });

    it('should handle UnauthorizedPolicyActionError with 403 status', async () => {
      const error = new UnauthorizedPolicyActionError('Insufficient permissions');
      const response = handlePolicyError(error);

      expect(response.status).toBe(403);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      const bodyText = await response.text();
      const body = superjson.parse(bodyText) as { error: string };
      expect(body.error).toBe('Insufficient permissions');
    });

    it('should handle generic Error with 500 status', async () => {
      const error = new Error('Database connection failed');
      const response = handlePolicyError(error);

      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      const bodyText = await response.text();
      const body = superjson.parse(bodyText) as { error: string };
      expect(body.error).toBe('Database connection failed');
    });

    it('should handle unknown error types with 500 status', async () => {
      const error = 'String error';
      const response = handlePolicyError(error);

      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      const bodyText = await response.text();
      const body = superjson.parse(bodyText) as { error: string };
      expect(body.error).toBe('An unexpected error occurred.');
    });

    it('should log error with context', () => {
      const error = new Error('Test error');
      const context = { endpoint: 'policies/create', userId: 123 };
      
      handlePolicyError(error, context);

      expect(console.error).toHaveBeenCalledWith('Policy endpoint error:', {
        context: { endpoint: 'policies/create', userId: 123 },
        error: error
      });
    });

    it('should log error without context', () => {
      const error = new Error('Test error');
      
      handlePolicyError(error);

      expect(console.error).toHaveBeenCalledWith('Policy endpoint error:', {
        context: undefined,
        error: error
      });
    });

    it('should handle nested ZodError paths', async () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['nested', 'field', 'value'],
          message: 'Required'
        }
      ]);

      const response = handlePolicyError(zodError);
      const bodyText = await response.text();
      const body = superjson.parse(bodyText) as { error: string };
      expect(body.error).toBe('nested.field.value: Required');
    });

    it('should handle empty ZodError paths', async () => {
      const zodError = new ZodError([
        {
          code: 'custom',
          path: [],
          message: 'Root level validation error'
        }
      ]);

      const response = handlePolicyError(zodError);
      const bodyText = await response.text();
      const body = superjson.parse(bodyText) as { error: string };
      expect(body.error).toBe(': Root level validation error');
    });
  });
});