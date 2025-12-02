import { toJsonValue, buildJsonSafeCopy } from './policyJsonService';

describe('policyJsonService', () => {
  describe('toJsonValue', () => {
    it('should handle null values', () => {
      const result: any = toJsonValue(null);
      expect(result).toEqual(null);
    });

    it('should handle undefined values', () => {
      const result: any = toJsonValue(undefined);
      expect(result).toEqual(null);
    });

    it('should handle string values', () => {
      const result1: any = toJsonValue('hello');
      const result2: any = toJsonValue('');
      expect(result1).toBe('hello');
      expect(result2).toBe('');
    });

    it('should handle number values', () => {
      const result1: any = toJsonValue(42);
      const result2: any = toJsonValue(0);
      const result3: any = toJsonValue(-1);
      const result4: any = toJsonValue(3.14);
      expect(result1).toBe(42);
      expect(result2).toBe(0);
      expect(result3).toBe(-1);
      expect(result4).toBe(3.14);
    });

    it('should handle boolean values', () => {
      const result1: any = toJsonValue(true);
      const result2: any = toJsonValue(false);
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should convert Date objects to ISO strings', () => {
      const date = new Date('2023-01-15T10:30:00.000Z');
      const result: any = toJsonValue(date);
      expect(result).toBe('2023-01-15T10:30:00.000Z');
    });

    it('should handle arrays', () => {
      const array = [1, 'hello', true, null];
      const result: any = toJsonValue(array);
      expect(result).toEqual([1, 'hello', true, null]);
    });

    it('should handle nested arrays', () => {
      const nestedArray = [1, [2, 3], ['a', 'b']];
      const result: any = toJsonValue(nestedArray);
      expect(result).toEqual([1, [2, 3], ['a', 'b']]);
    });

    it('should handle empty arrays', () => {
      const result: any = toJsonValue([]);
      expect(result).toEqual([]);
    });

    it('should handle simple objects', () => {
      const obj = { name: 'John', age: 30 };
      const result: any = toJsonValue(obj);
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should handle nested objects', () => {
      const nestedObj = {
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark', notifications: true }
      };
      const result: any = toJsonValue(nestedObj);
      expect(result).toEqual({
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark', notifications: true }
      });
    });

    it('should handle objects with Date properties', () => {
      const objWithDate = {
        name: 'Event',
        date: new Date('2023-01-15T10:30:00.000Z')
      };
      const result: any = toJsonValue(objWithDate);
      expect(result).toEqual({
        name: 'Event',
        date: '2023-01-15T10:30:00.000Z'
      });
    });

    it('should handle objects with array properties', () => {
      const objWithArray = {
        tags: ['tag1', 'tag2'],
        numbers: [1, 2, 3]
      };
      const result: any = toJsonValue(objWithArray);
      expect(result).toEqual({
        tags: ['tag1', 'tag2'],
        numbers: [1, 2, 3]
      });
    });

    it('should handle complex nested structures', () => {
      const complex = {
        user: {
          id: 1,
          profile: {
            name: 'John',
            createdAt: new Date('2023-01-15T10:30:00.000Z'),
            tags: ['admin', 'active'],
            settings: {
              theme: 'dark',
              enabled: true
            }
          }
        }
      };
      const result: any = toJsonValue(complex);
      expect(result).toEqual({
        user: {
          id: 1,
          profile: {
            name: 'John',
            createdAt: '2023-01-15T10:30:00.000Z',
            tags: ['admin', 'active'],
            settings: {
              theme: 'dark',
              enabled: true
            }
          }
        }
      });
    });

    it('should convert functions to strings', () => {
      const func = function() { return 'test'; };
      const result: any = toJsonValue(func);
      expect(result).toBe(func.toString());
    });

    it('should convert symbols to strings', () => {
      const symbol = Symbol('test');
      const result: any = toJsonValue(symbol);
      expect(result).toBe(symbol.toString());
    });

    it('should handle BigInt by converting to string', () => {
      const bigint = BigInt(123456789012345678901234567890n);
      const result: any = toJsonValue(bigint);
      expect(result).toBe(bigint.toString());
    });

    it('should handle RegExp by converting to string', () => {
      const regex = /test/gi;
      const result: any = toJsonValue(regex);
      expect(result).toBe(regex.toString());
    });

    it('should handle empty objects', () => {
      const result: any = toJsonValue({});
      expect(result).toEqual({});
    });
  });

  describe('buildJsonSafeCopy', () => {
    it('should create a JSON-safe copy of a simple object', () => {
      const obj = {
        name: 'John',
        age: 30,
        active: true
      };
      const result: any = buildJsonSafeCopy(obj);
      expect(result).toEqual({
        name: 'John',
        age: 30,
        active: true
      });
    });

    it('should convert Date objects in the copy', () => {
      const obj = {
        name: 'Event',
        createdAt: new Date('2023-01-15T10:30:00.000Z'),
        updatedAt: new Date('2023-01-16T15:45:30.000Z')
      };
      const result: any = buildJsonSafeCopy(obj);
      expect(result).toEqual({
        name: 'Event',
        createdAt: '2023-01-15T10:30:00.000Z',
        updatedAt: '2023-01-16T15:45:30.000Z'
      });
    });

    it('should handle nested objects in the copy', () => {
      const obj = {
        user: {
          name: 'John',
          settings: {
            theme: 'dark'
          }
        },
        metadata: {
          version: 1
        }
      };
      const result: any = buildJsonSafeCopy(obj);
      expect(result).toEqual({
        user: {
          name: 'John',
          settings: {
            theme: 'dark'
          }
        },
        metadata: {
          version: 1
        }
      });
    });

    it('should handle arrays in the copy', () => {
      const obj = {
        tags: ['tag1', 'tag2'],
        numbers: [1, 2, 3],
        mixed: ['text', 42, true, null]
      };
      const result: any = buildJsonSafeCopy(obj);
      expect(result).toEqual({
        tags: ['tag1', 'tag2'],
        numbers: [1, 2, 3],
        mixed: ['text', 42, true, null]
      });
    });

    it('should handle null and undefined values', () => {
      const obj = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: ''
      };
      const result: any = buildJsonSafeCopy(obj);
      expect(result).toEqual({
        nullValue: null,
        undefinedValue: null,
        emptyString: ''
      });
    });

    it('should handle empty objects', () => {
      const result: any = buildJsonSafeCopy({});
      expect(result).toEqual({});
    });

    it('should convert non-standard types to strings', () => {
      const func = () => 'test';
      const symbol = Symbol('test');
      const obj = {
        func: func,
        symbol: symbol,
        regex: /test/g
      };
      const result: any = buildJsonSafeCopy(obj);
      expect(result).toEqual({
        func: func.toString(),
        symbol: symbol.toString(),
        regex: '/test/g'
      });
    });
  });
});