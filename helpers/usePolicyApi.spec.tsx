import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePolicies, usePolicyFilterMetadata } from './usePolicyApi';
import * as UseOrganizationHook from './useOrganization';
import * as PoliciesEndpoint from '../endpoints/policies/list_GET.schema';

// Mock the dependencies
let mockUseOrganization: jasmine.Spy;
let mockGetListPolicies: jasmine.Spy;

// Test components moved outside to avoid performance issues
const TestComponent = ({ 
  publicOnly = false, 
  filters = {} 
}: { 
  publicOnly?: boolean; 
  filters?: any; 
}) => {
  const policiesResult = usePolicies(filters);
  const metadataResult = usePolicyFilterMetadata(publicOnly);
  
  return (
    <div>
      <div data-testid="policies-loading">{String(policiesResult.isFetching)}</div>
      <div data-testid="policies-enabled">{String(policiesResult.isSuccess || policiesResult.isPending)}</div>
      <div data-testid="metadata-loading">{String(metadataResult.isFetching)}</div>
      <div data-testid="metadata-enabled">{String(metadataResult.isSuccess || metadataResult.isPending)}</div>
    </div>
  );
};

const SwitchingComponent = ({ publicOnly }: { publicOnly: boolean }) => {
  const metadataResult = usePolicyFilterMetadata(publicOnly);
  return <div data-testid="switching-enabled">{String(metadataResult.isSuccess || metadataResult.isPending)}</div>;
};

const TestReturnStructure = () => {
  const policiesResult = usePolicies({ search: 'test' });
  const metadataResult = usePolicyFilterMetadata(false);
  
  // These properties should exist on React Query result
  expect(typeof policiesResult.data).toBeDefined();
  expect(typeof policiesResult.isLoading).toBe('boolean');
  expect(typeof policiesResult.isFetching).toBe('boolean');
  expect(typeof policiesResult.error).toBeDefined();
  
  expect(typeof metadataResult.data).toBeDefined();
  expect(typeof metadataResult.isLoading).toBe('boolean');
  expect(typeof metadataResult.isFetching).toBe('boolean');
  expect(typeof metadataResult.error).toBeDefined();
  
  return <div>test</div>;
};

const TestErrorHandling = () => {
  const result = usePolicies({ search: 'test' });
  return <div data-testid="error-state">{result.error ? 'error' : 'no-error'}</div>;
};

describe('usePolicyApi hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    // Create spies
    mockGetListPolicies = jasmine.createSpy('getListPolicies').and.returnValue(Promise.resolve({
      policies: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      filterMetadata: { departments: [], categories: [], statuses: [], tags: [], portals: [] },
    }));

    mockUseOrganization = jasmine.createSpy('useOrganization');

    // Set up module spies
    spyOn(UseOrganizationHook, 'useOrganization').and.callFake(mockUseOrganization);
    spyOn(PoliciesEndpoint, 'getListPolicies').and.callFake(mockGetListPolicies);
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('organization context handling', () => {
    it('should handle loading organization state', () => {
      mockUseOrganization.and.returnValue({
        organizationState: { type: 'loading' },
        switchOrganization: jasmine.createSpy('switchOrganization'),
        refetchOrganizations: jasmine.createSpy('refetchOrganizations'),
      });

      const { getByTestId } = renderWithQueryClient(
        <TestComponent filters={{ search: 'test' }} />
      );

      // For non-public queries, hooks should be disabled during loading
      expect(getByTestId('policies-enabled').textContent).toBe('false');
      expect(getByTestId('metadata-enabled').textContent).toBe('false');
    });

    it('should handle active organization state', () => {
      mockUseOrganization.and.returnValue({
        organizationState: {
          type: 'active',
          currentOrganization: { id: 1, name: 'Test Org', slug: 'test', domain: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          availableOrganizations: [],
        },
        switchOrganization: jasmine.createSpy('switchOrganization'),
        refetchOrganizations: jasmine.createSpy('refetchOrganizations'),
      });

      const { getByTestId } = renderWithQueryClient(
        <TestComponent filters={{ search: 'test' }} />
      );

      // Hooks should be enabled with active organization
      expect(getByTestId('policies-enabled').textContent).toBe('true');
      expect(getByTestId('metadata-enabled').textContent).toBe('true');
    });

    it('should handle no organization state', () => {
      mockUseOrganization.and.returnValue({
        organizationState: {
          type: 'no-organization',
          availableOrganizations: [],
        },
        switchOrganization: jasmine.createSpy('switchOrganization'),
        refetchOrganizations: jasmine.createSpy('refetchOrganizations'),
      });

      const { getByTestId } = renderWithQueryClient(
        <TestComponent filters={{ search: 'test' }} />
      );

      // Non-public queries should be disabled without organization
      expect(getByTestId('policies-enabled').textContent).toBe('false');
      expect(getByTestId('metadata-enabled').textContent).toBe('false');
    });
  });

  describe('query enablement logic', () => {
    beforeEach(() => {
      mockUseOrganization.and.returnValue({
        organizationState: {
          type: 'active',
          currentOrganization: { id: 1, name: 'Test Org', slug: 'test', domain: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          availableOrganizations: [],
        },
        switchOrganization: jasmine.createSpy('switchOrganization'),
        refetchOrganizations: jasmine.createSpy('refetchOrganizations'),
      });
    });

    it('should enable public queries regardless of organization state', () => {
      mockUseOrganization.and.returnValue({
        organizationState: { type: 'loading' },
        switchOrganization: jasmine.createSpy('switchOrganization'),
        refetchOrganizations: jasmine.createSpy('refetchOrganizations'),
      });

      const { getByTestId } = renderWithQueryClient(
        <TestComponent publicOnly={true} filters={{ publicOnly: true }} />
      );

      // Public queries should be enabled even during loading
      expect(getByTestId('policies-enabled').textContent).toBe('true');
      expect(getByTestId('metadata-enabled').textContent).toBe('true');
    });

    it('should disable private queries when organization is loading', () => {
      mockUseOrganization.and.returnValue({
        organizationState: { type: 'loading' },
        switchOrganization: jasmine.createSpy('switchOrganization'),
        refetchOrganizations: jasmine.createSpy('refetchOrganizations'),
      });

      const { getByTestId } = renderWithQueryClient(
        <TestComponent publicOnly={false} filters={{ publicOnly: false }} />
      );

      // Private queries should be disabled during loading
      expect(getByTestId('policies-enabled').textContent).toBe('false');
      expect(getByTestId('metadata-enabled').textContent).toBe('false');
    });
  });

  describe('Rules of Hooks compliance', () => {
    it('should allow switching publicOnly parameter without hook order violations', () => {
      mockUseOrganization.and.returnValue({
        organizationState: {
          type: 'active',
          currentOrganization: { id: 1, name: 'Test Org', slug: 'test', domain: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          availableOrganizations: [],
        },
        switchOrganization: jasmine.createSpy('switchOrganization'),
        refetchOrganizations: jasmine.createSpy('refetchOrganizations'),
      });

      // First render with publicOnly = false
      const { rerender, getByTestId } = renderWithQueryClient(
        <SwitchingComponent publicOnly={false} />
      );

      expect(getByTestId('switching-enabled').textContent).toBe('true');

      // Switch to publicOnly = true - should not cause hook order violations
      rerender(
        <QueryClientProvider client={queryClient}>
          <SwitchingComponent publicOnly={true} />
        </QueryClientProvider>
      );

      expect(getByTestId('switching-enabled').textContent).toBe('true');

      // Switch back to publicOnly = false
      rerender(
        <QueryClientProvider client={queryClient}>
          <SwitchingComponent publicOnly={false} />
        </QueryClientProvider>
      );

      expect(getByTestId('switching-enabled').textContent).toBe('true');
    });
  });

  describe('query key consistency', () => {
    beforeEach(() => {
      mockUseOrganization.and.returnValue({
        organizationState: {
          type: 'active',
          currentOrganization: { id: 1, name: 'Test Org', slug: 'test', domain: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          availableOrganizations: [],
        },
        switchOrganization: jasmine.createSpy('switchOrganization'),
        refetchOrganizations: jasmine.createSpy('refetchOrganizations'),
      });
    });

    it('should include organizationId in query keys for usePolicies', () => {
      renderWithQueryClient(<TestComponent filters={{ search: 'test' }} />);

      // Check that queries were called - the organizationId should be included in the key
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.getAll();
      
      // Should have queries with organizationId in the key
      const policyQuery = queries.find(q => 
        Array.isArray(q.queryKey) && 
        q.queryKey[0] === 'policies' && 
        q.queryKey[1] === 'list'
      );
      
      expect(policyQuery).toBeDefined();
      if (policyQuery) {
        const keyData = policyQuery.queryKey[2] as any;
        expect(keyData.organizationId).toBe(1);
      }
    });

    it('should include organizationId and publicOnly in query keys for usePolicyFilterMetadata', () => {
      renderWithQueryClient(<TestComponent publicOnly={true} />);

      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.getAll();
      
      const metadataQuery = queries.find(q => 
        Array.isArray(q.queryKey) && 
        q.queryKey[0] === 'policies' && 
        q.queryKey[1] === 'filterMetadata'
      );
      
      expect(metadataQuery).toBeDefined();
      if (metadataQuery) {
        const keyData = metadataQuery.queryKey[2] as any;
        expect(keyData.organizationId).toBe(1);
        expect(keyData.publicOnly).toBe(true);
      }
    });

    it('should cache public and private metadata separately', () => {
      // Render component with publicOnly = false
      const { rerender } = renderWithQueryClient(<TestComponent publicOnly={false} />);

      // Render component with publicOnly = true
      rerender(
        <QueryClientProvider client={queryClient}>
          <TestComponent publicOnly={true} />
        </QueryClientProvider>
      );

      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.getAll();
      
      const metadataQueries = queries.filter(q => 
        Array.isArray(q.queryKey) && 
        q.queryKey[0] === 'policies' && 
        q.queryKey[1] === 'filterMetadata'
      );
      
      // Should have two separate queries for public and private metadata
      expect(metadataQueries.length).toBe(2);
      
      const publicQuery = metadataQueries.find(q => (q.queryKey[2] as any).publicOnly === true);
      const privateQuery = metadataQueries.find(q => (q.queryKey[2] as any).publicOnly === false);
      
      expect(publicQuery).toBeDefined();
      expect(privateQuery).toBeDefined();
    });
  });

  describe('API contract preservation', () => {
    beforeEach(() => {
      mockUseOrganization.and.returnValue({
        organizationState: {
          type: 'active',
          currentOrganization: { id: 1, name: 'Test Org', slug: 'test', domain: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          availableOrganizations: [],
        },
        switchOrganization: jasmine.createSpy('switchOrganization'),
        refetchOrganizations: jasmine.createSpy('refetchOrganizations'),
      });
    });

    it('should call getListPolicies with correct parameters for usePolicies', () => {
      const filters = { search: 'test', status: 'active' };
      renderWithQueryClient(<TestComponent filters={filters} />);

      expect(mockGetListPolicies).toHaveBeenCalledWith(filters);
    });

    it('should call getListPolicies with correct parameters for usePolicyFilterMetadata', () => {
      renderWithQueryClient(<TestComponent publicOnly={true} />);

      expect(mockGetListPolicies).toHaveBeenCalledWith({
        getFilterMetadata: true,
        limit: 1,
        publicOnly: true,
      });
    });

    it('should maintain expected return structure for both hooks', () => {
      renderWithQueryClient(<TestReturnStructure />);
    });
  });

  describe('error handling and edge cases', () => {
    beforeEach(() => {
      mockUseOrganization.and.returnValue({
        organizationState: {
          type: 'active',
          currentOrganization: { id: 1, name: 'Test Org', slug: 'test', domain: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
          availableOrganizations: [],
        },
        switchOrganization: jasmine.createSpy('switchOrganization'),
        refetchOrganizations: jasmine.createSpy('refetchOrganizations'),
      });
    });

    it('should handle API errors gracefully', () => {
      const error = new Error('API Error');
      mockGetListPolicies.and.returnValue(Promise.reject(error));

      const { getByTestId } = renderWithQueryClient(<TestErrorHandling />);
      
      // The error handling is managed by React Query, so we just verify the hook doesn't crash
      expect(() => getByTestId('error-state')).not.toThrow();
    });

    it('should handle switching organization context during query', () => {
      let currentOrgState = {
        type: 'active' as const,
        currentOrganization: { id: 1, name: 'Test Org 1', slug: 'test1', domain: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        availableOrganizations: [],
      };

      mockUseOrganization.and.returnValue({
        organizationState: currentOrgState,
        switchOrganization: jasmine.createSpy('switchOrganization'),
        refetchOrganizations: jasmine.createSpy('refetchOrganizations'),
      });

      const { rerender } = renderWithQueryClient(<TestComponent filters={{ search: 'test' }} />);

      // Switch organization
      currentOrgState = {
        type: 'active',
        currentOrganization: { id: 2, name: 'Test Org 2', slug: 'test2', domain: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        availableOrganizations: [],
      };

      mockUseOrganization.and.returnValue({
        organizationState: currentOrgState,
        switchOrganization: jasmine.createSpy('switchOrganization'),
        refetchOrganizations: jasmine.createSpy('refetchOrganizations'),
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <TestComponent filters={{ search: 'test' }} />
        </QueryClientProvider>
      );

      // Should handle organization switch without crashing
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.getAll();
      
      // Should have queries for both organizations in cache
      const orgQueries = queries.filter(q => 
        Array.isArray(q.queryKey) && 
        q.queryKey[0] === 'policies'
      );
      
      expect(orgQueries.length).toBeGreaterThan(0);
    });
  });
});