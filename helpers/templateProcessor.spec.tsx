import { renderHook } from '@testing-library/react';
import { 
  processTemplateContent, 
  processCompanyNamePlaceholders,
  validateTemplateVariables,
  extractTemplateVariables,
  useProcessedTemplate,
  useProcessedContent,
  OrganizationVariables 
} from './templateProcessor';
import { Organization } from './Organization';
import * as OrganizationHook from './useOrganization';
import * as SettingsHook from './useSettingsApi';
// Import the proper types
type OrganizationContextType = {
  organizationState: {
    type: 'active';
    currentOrganization: Organization;
    availableOrganizations: Organization[];
  } | {
    type: 'loading';
  } | {
    type: 'no-organization';
    availableOrganizations: Organization[];
  } | {
    type: 'switching';
    currentOrganization?: Organization;
    availableOrganizations: Organization[];
  };
  switchOrganization: (organizationId: number) => void;
  refetchOrganizations: () => void;
};

// Mock data for testing
const mockOrganizationState = {
  type: 'active' as const,
  currentOrganization: {
    id: 1,
    name: 'Test Company',
    slug: 'test-company',
    domain: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Organization,
  availableOrganizations: [],
};

const mockOrganizationContext: OrganizationContextType = {
  organizationState: mockOrganizationState,
  switchOrganization: jasmine.createSpy('switchOrganization'),
  refetchOrganizations: jasmine.createSpy('refetchOrganizations'),
};

// Simple mock for useSettings hook return value
const mockSettingsData = {
  data: {
    id: 1,
    organizationId: 1,
    settingKey: 'organization_variables',
    settingValue: {
      company: { name: 'Test Company', email: 'test@company.com', phone: '123-456-7890' },
      leadership: { ceo: 'John Doe' },
      contact: { hrEmail: 'hr@company.com' },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    description: 'Organization variables for template processing',
  },
  isFetching: false,
  isLoading: false,
  isError: false,
  error: null,
} as any; // Use 'as any' for complex React Query types in tests

describe('templateProcessor', () => {
  const testOrganization: Organization = {
    id: 1,
    name: 'Test Company',
    slug: 'test-company',
    domain: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const testVariables: OrganizationVariables = {
    company: {
      name: 'Test Company',
      email: 'test@company.com',
      address: '123 Main St',
      phone: '123-456-7890',
    },
    leadership: {
      ceo: 'John Doe',
      hrDirector: 'Jane Smith',
      dpo: 'Bob Johnson',
    },
    departments: {
      hr: 'Human Resources',
      it: 'Information Technology',
      legal: 'Legal Department',
      finance: 'Finance Team',
    },
    policies: {
      workingHours: '9 AM - 5 PM',
      probationPeriod: '90 days',
      annualLeave: '20 days',
    },
    contact: {
      hrEmail: 'hr@company.com',
      supportPhone: '1-800-SUPPORT',
    },
  };

  beforeEach(() => {
    // Set up spies for the imported hooks
    spyOn(OrganizationHook, 'useOrganization').and.returnValue(mockOrganizationContext);
    spyOn(SettingsHook, 'useSettings').and.returnValue(mockSettingsData);
  });

  describe('processCompanyNamePlaceholders', () => {
    it('should replace company name placeholders with organization name', () => {
      const content = 'Welcome to [Company Name] and {{Company Name}}';
      const result = processCompanyNamePlaceholders(content, testOrganization);
      expect(result).toBe('Welcome to Test Company and Test Company');
    });

    it('should handle null/undefined content', () => {
      expect(processCompanyNamePlaceholders(null, testOrganization)).toBe('');
      expect(processCompanyNamePlaceholders(undefined, testOrganization)).toBe('');
    });

    it('should return original content if no organization', () => {
      const content = 'Welcome to [Company Name]';
      expect(processCompanyNamePlaceholders(content, undefined)).toBe(content);
    });
  });

  describe('processTemplateContent', () => {
    it('should process dynamic variables with basic paths', () => {
      const content = 'Welcome to /company.name/! Contact us at /company.email/.';
      const result = processTemplateContent(content, testOrganization, testVariables);
      expect(result).toBe('Welcome to Test Company! Contact us at test@company.com.');
    });

    it('should handle nested object paths', () => {
      const content = 'Our CEO is /leadership.ceo/ and our HR Director is /leadership.hrDirector/.';
      const result = processTemplateContent(content, testOrganization, testVariables);
      expect(result).toBe('Our CEO is John Doe and our HR Director is Jane Smith.');
    });

    it('should handle fallback values', () => {
      const content = 'Contact /leadership.cto|the CTO/ for technical issues.';
      const result = processTemplateContent(content, testOrganization, testVariables);
      expect(result).toBe('Contact the CTO for technical issues.');
    });

    it('should apply formatting options', () => {
      const content = '/company.name||uppercase/ and /company.name||lowercase/';
      const result = processTemplateContent(content, testOrganization, testVariables);
      expect(result).toBe('TEST COMPANY and test company');
    });

    it('should maintain backward compatibility with legacy placeholders', () => {
      const content = 'Welcome to [Company Name] and /company.email/!';
      const result = processTemplateContent(content, testOrganization, testVariables);
      expect(result).toBe('Welcome to Test Company and test@company.com!');
    });

    it('should handle undefined variables gracefully', () => {
      const content = 'Contact /company.fax/ or /leadership.cfo|the CFO/.';
      const result = processTemplateContent(content, testOrganization, testVariables);
      expect(result).toBe('Contact /company.fax/ or the CFO.');
    });
  });

  describe('validateTemplateVariables', () => {
    it('should identify undefined variables', () => {
      const content = 'Contact /company.fax/ and /leadership.cto/.';
      const result = validateTemplateVariables(content, testVariables);
      expect(result.isValid).toBe(false);
      expect(result.undefinedVariables).toEqual(['company.fax', 'leadership.cto']);
    });

    it('should pass validation with all defined variables', () => {
      const content = 'Welcome to /company.name/! Our CEO is /leadership.ceo/.';
      const result = validateTemplateVariables(content, testVariables);
      expect(result.isValid).toBe(true);
      expect(result.undefinedVariables).toEqual([]);
    });

    it('should handle fallback values in validation', () => {
      const content = 'Contact /company.fax|our fax/ for documents.';
      const result = validateTemplateVariables(content, testVariables);
      expect(result.isValid).toBe(true);
    });
  });

  describe('extractTemplateVariables', () => {
    it('should extract all variable paths from content', () => {
      const content = 'Welcome to /company.name/! Contact /company.email/ or /leadership.ceo|CEO/.';
      const result = extractTemplateVariables(content);
      expect(result).toEqual(['company.name', 'company.email', 'leadership.ceo']);
    });

    it('should handle empty content', () => {
      expect(extractTemplateVariables('')).toEqual([]);
      expect(extractTemplateVariables(null)).toEqual([]);
      expect(extractTemplateVariables(undefined)).toEqual([]);
    });

    it('should deduplicate repeated variables', () => {
      const content = '/company.name/ welcomes you to /company.name/!';
      const result = extractTemplateVariables(content);
      expect(result).toEqual(['company.name']);
    });
  });

  describe('useProcessedTemplate', () => {
    it('should return processed content with loading state', () => {
      const { result } = renderHook(() => 
        useProcessedTemplate('Welcome to /company.name/!')
      );

      expect(result.current.processedContent).toBe('Welcome to Test Company!');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.variables).toBeDefined();
    });
  });

  describe('useProcessedContent', () => {
    it('should maintain backward compatibility', () => {
      const { result } = renderHook(() => 
        useProcessedContent('Welcome to [Company Name]!')
      );

      expect(result.current).toBe('Welcome to Test Company!');
    });
  });
});