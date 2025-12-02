import { updateDepartmentSetting, updateCategorySetting } from './policyTaxonomyService';
import * as dbModule from './db';

describe('policyTaxonomyService', () => {
  beforeEach(() => {
    spyOn(console, 'error').and.stub();
  });



  describe('updateDepartmentSetting', () => {
    let mockSelectFrom: jasmine.Spy;
    let mockWhere: jasmine.Spy;
    let mockSelect: jasmine.Spy;
    let mockExecuteTakeFirst: jasmine.Spy;
    let mockInsertInto: jasmine.Spy;
    let mockValues: jasmine.Spy;
    let mockOnConflict: jasmine.Spy;
    let mockExecute: jasmine.Spy;

    beforeEach(() => {
      mockExecuteTakeFirst = jasmine.createSpy('executeTakeFirst');
      mockSelect = jasmine.createSpy('select').and.returnValue({ executeTakeFirst: mockExecuteTakeFirst });
      mockWhere = jasmine.createSpy('where').and.returnValue({ select: mockSelect });
      mockSelectFrom = jasmine.createSpy('selectFrom').and.returnValue({ where: mockWhere });

      mockExecute = jasmine.createSpy('execute');
      mockOnConflict = jasmine.createSpy('onConflict').and.returnValue({ execute: mockExecute });
      mockValues = jasmine.createSpy('values').and.returnValue({ onConflict: mockOnConflict });
      mockInsertInto = jasmine.createSpy('insertInto').and.returnValue({ values: mockValues });

      spyOnProperty(dbModule, 'db', 'get').and.returnValue({
        selectFrom: mockSelectFrom,
        insertInto: mockInsertInto
      } as any);
    });

    it('should return early if newDepartment is empty', async () => {
      await updateDepartmentSetting('', 123);
      expect(mockSelectFrom).not.toHaveBeenCalled();
    });

    it('should return early if newDepartment is null', async () => {
      await updateDepartmentSetting(null as any, 123);
      expect(mockSelectFrom).not.toHaveBeenCalled();
    });

    it('should add new department when no existing setting exists', async () => {
      mockExecuteTakeFirst.and.resolveTo(undefined);
      mockOnConflict.and.returnValue({
        execute: mockExecute.and.resolveTo()
      });

      await updateDepartmentSetting('Engineering', 123);

      expect(mockSelectFrom).toHaveBeenCalledWith('settings');
      expect(mockWhere).toHaveBeenCalledWith('settingKey', '=', 'departments');
      expect(mockWhere).toHaveBeenCalledWith('organizationId', '=', 123);
      expect(mockInsertInto).toHaveBeenCalledWith('settings');
      expect(mockValues).toHaveBeenCalledWith({
        settingKey: 'departments',
        settingValue: ['Engineering'],
        organizationId: 123
      });
    });

    it('should add new department when existing departments do not include it', async () => {
      mockExecuteTakeFirst.and.resolveTo({
        settingValue: ['HR', 'Finance']
      });

      await updateDepartmentSetting('Engineering', 123);

      expect(mockValues).toHaveBeenCalledWith({
        settingKey: 'departments',
        settingValue: ['HR', 'Finance', 'Engineering'],
        organizationId: 123
      });
    });

    it('should not add department if it already exists', async () => {
      mockExecuteTakeFirst.and.resolveTo({
        settingValue: ['HR', 'Engineering', 'Finance']
      });

      await updateDepartmentSetting('Engineering', 123);

      expect(mockInsertInto).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully without throwing', async () => {
      const mockError = new Error('Database connection failed');
      mockExecuteTakeFirst.and.rejectWith(mockError);

      await expectAsync(updateDepartmentSetting('Engineering', 123)).toBeResolved();

      expect(console.error).toHaveBeenCalledWith('Error updating departments setting:', {
        department: 'Engineering',
        organizationId: 123,
        error: 'Database connection failed'
      });
    });

    it('should handle non-Error exceptions gracefully', async () => {
      mockExecuteTakeFirst.and.rejectWith('String error');

      await expectAsync(updateDepartmentSetting('Engineering', 123)).toBeResolved();

      expect(console.error).toHaveBeenCalledWith('Error updating departments setting:', {
        department: 'Engineering',
        organizationId: 123,
        error: 'String error'
      });
    });
  });

  describe('updateCategorySetting', () => {
    let mockSelectFrom: jasmine.Spy;
    let mockWhere: jasmine.Spy;
    let mockSelect: jasmine.Spy;
    let mockExecuteTakeFirst: jasmine.Spy;
    let mockInsertInto: jasmine.Spy;
    let mockValues: jasmine.Spy;
    let mockOnConflict: jasmine.Spy;
    let mockExecute: jasmine.Spy;

    beforeEach(() => {
      mockExecuteTakeFirst = jasmine.createSpy('executeTakeFirst');
      mockSelect = jasmine.createSpy('select').and.returnValue({ executeTakeFirst: mockExecuteTakeFirst });
      mockWhere = jasmine.createSpy('where').and.returnValue({ select: mockSelect });
      mockSelectFrom = jasmine.createSpy('selectFrom').and.returnValue({ where: mockWhere });

      mockExecute = jasmine.createSpy('execute');
      mockOnConflict = jasmine.createSpy('onConflict').and.returnValue({ execute: mockExecute });
      mockValues = jasmine.createSpy('values').and.returnValue({ onConflict: mockOnConflict });
      mockInsertInto = jasmine.createSpy('insertInto').and.returnValue({ values: mockValues });

      spyOnProperty(dbModule, 'db', 'get').and.returnValue({
        selectFrom: mockSelectFrom,
        insertInto: mockInsertInto
      } as any);
    });

    it('should return early if newCategory is empty', async () => {
      await updateCategorySetting('', 123);
      expect(mockSelectFrom).not.toHaveBeenCalled();
    });

    it('should add new category when no existing setting exists', async () => {
      mockExecuteTakeFirst.and.resolveTo(undefined);

      await updateCategorySetting('Security', 123);

      expect(mockSelectFrom).toHaveBeenCalledWith('settings');
      expect(mockWhere).toHaveBeenCalledWith('settingKey', '=', 'categories');
      expect(mockValues).toHaveBeenCalledWith({
        settingKey: 'categories',
        settingValue: ['Security'],
        organizationId: 123
      });
    });

    it('should add new category when existing categories do not include it', async () => {
      mockExecuteTakeFirst.and.resolveTo({
        settingValue: ['Compliance', 'Training']
      });

      await updateCategorySetting('Security', 123);

      expect(mockValues).toHaveBeenCalledWith({
        settingKey: 'categories',
        settingValue: ['Compliance', 'Training', 'Security'],
        organizationId: 123
      });
    });

    it('should not add category if it already exists', async () => {
      mockExecuteTakeFirst.and.resolveTo({
        settingValue: ['Compliance', 'Security', 'Training']
      });

      await updateCategorySetting('Security', 123);

      expect(mockInsertInto).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully without throwing', async () => {
      const mockError = new Error('Database timeout');
      mockExecuteTakeFirst.and.rejectWith(mockError);

      await expectAsync(updateCategorySetting('Security', 123)).toBeResolved();

      expect(console.error).toHaveBeenCalledWith('Error updating categories setting:', {
        category: 'Security',
        organizationId: 123,
        error: 'Database timeout'
      });
    });
  });
});