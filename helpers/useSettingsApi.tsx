import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMemo, useCallback } from "react";
import { getSettings } from "../endpoints/settings/get_GET.schema";
import { getManySettings } from "../endpoints/settings/getMany_GET.schema";
import {
  postUpdateSettings,
  InputType as UpdateSettingsInput,
} from "../endpoints/settings/update_POST.schema";
import { useOrganization } from "./useOrganization";
import { 
  POLICY_TAXONOMIES_SETTING_KEY,
  CustomTaxonomies,
  STANDARD_POLICY_CATEGORIES,
  STANDARD_DEPARTMENTS, 
  STANDARD_POLICY_TAGS,
  getStandardCategories,
  getStandardDepartments,
  getStandardTags,
  usePolicyTaxonomies 
} from "./globalPolicyTaxonomies";
import { isStringArray } from "./jsonTypeGuards";

export const SETTINGS_QUERY_KEY = "settings";

/**
 * Hook to fetch a specific setting by its key.
 * @param settingKey The key of the setting to fetch.
 * @param enabled Whether the query should be enabled.
 * @param organizationIdOverride Optional organization ID to fetch settings for a specific organization (useful for public branding settings).
 */
export const useSettings = (
  settingKey: string, 
  enabled: boolean = true,
  organizationIdOverride?: number | null
) => {
  const { organizationState } = useOrganization();
  
  const resolvedOrgId = organizationIdOverride !== undefined
    ? organizationIdOverride
    : (organizationState.type === 'active' ? organizationState.currentOrganization.id : null);

  const isBrandingSetting = settingKey.startsWith("branding.");

  const shouldEnable = isBrandingSetting
    ? !!resolvedOrgId && !!settingKey && enabled
    : organizationState.type === 'active' && !!settingKey && enabled;
  
  return useQuery({
    queryKey: [SETTINGS_QUERY_KEY, resolvedOrgId ?? "no-org", settingKey] as const,
    queryFn: () => getSettings({ 
      settingKey,
      organizationId: resolvedOrgId ?? undefined,
    }),
    enabled: shouldEnable,
    retry: false,
  });
};

/**
 * Hook to fetch multiple settings by their keys in a single request.
 * @param settingKeys Array of setting keys to fetch.
 * @param enabled Whether the query should be enabled.
 * @param organizationIdOverride Optional organization ID to fetch settings for a specific organization (useful for public branding settings).
 */
export const useSettingsMany = (
  settingKeys: string[], 
  enabled: boolean = true,
  organizationIdOverride?: number | null
) => {
  const { organizationState } = useOrganization();
  
  const resolvedOrgId = organizationIdOverride !== undefined
    ? organizationIdOverride
    : (organizationState.type === 'active' ? organizationState.currentOrganization.id : null);

  const allBrandingSettings = settingKeys.length > 0 && settingKeys.every(key => key.startsWith("branding."));

  const shouldEnable = allBrandingSettings
    ? !!resolvedOrgId && settingKeys.length > 0 && enabled
    : organizationState.type === 'active' && settingKeys.length > 0 && enabled;
  
  return useQuery({
    queryKey: [SETTINGS_QUERY_KEY, resolvedOrgId ?? "no-org", ...settingKeys.sort()] as const,
    queryFn: () => getManySettings({ 
      settingKeys,
      organizationId: resolvedOrgId ?? undefined,
    }),
    enabled: shouldEnable,
    retry: false,
  });
};

/**
 * Hook to update a setting.
 */
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;
  
  return useMutation({
    mutationFn: (data: UpdateSettingsInput) => postUpdateSettings(data),
    onSuccess: (data) => {
      toast.success(`Setting '${data.settingKey}' updated successfully!`);
            // Invalidate all settings queries to ensure branding changes are immediately visible
      queryClient.invalidateQueries({
        queryKey: [SETTINGS_QUERY_KEY, organizationId ?? "no-org"],
      });
    },
    onError: (error: Error) => {
      console.error(`Failed to update setting '${error.message}':`, error);
      toast.error(`Failed to update setting: ${error.message}`);
    },
  });
};

// --- Taxonomy-specific hooks and functions ---

/**
 * Hook to get combined (global standard + org custom) taxonomy lists for UI display.
 * This is a wrapper around the existing usePolicyTaxonomies hook for better discoverability.
 */
export const useCombinedTaxonomies = () => {
  return usePolicyTaxonomies();
};

/**
 * Hook to get only the custom taxonomy items that an organization has added.
 */
export const useCustomTaxonomies = (): {
  isLoading: boolean;
  customCategories: string[];
  customDepartments: string[];
  customTags: string[];
  customTaxonomies: CustomTaxonomies;
} => {
  const { data: settings, isFetching } = useSettings(POLICY_TAXONOMIES_SETTING_KEY);

  const customTaxonomies = useMemo<CustomTaxonomies>(() => {
    if (!settings?.settingValue) {
      return { categories: [], departments: [], tags: [] };
    }

    let parsedValue: any;
    
    // Handle case where settingValue is a string that needs parsing
    if (typeof settings.settingValue === 'string') {
      try {
        parsedValue = JSON.parse(settings.settingValue);
      } catch (error) {
        console.error('Failed to parse custom taxonomies setting value:', error);
        return { categories: [], departments: [], tags: [] };
      }
    } else {
      parsedValue = settings.settingValue;
    }

    // Validate that the parsed value has the expected structure
    if (
      typeof parsedValue === 'object' &&
      parsedValue !== null &&
      !Array.isArray(parsedValue)
    ) {
      return {
        categories: Array.isArray(parsedValue.categories) ? parsedValue.categories : [],
        departments: Array.isArray(parsedValue.departments) ? parsedValue.departments : [],
        tags: Array.isArray(parsedValue.tags) ? parsedValue.tags : [],
      };
    }

    console.error('Invalid custom taxonomies data structure:', parsedValue);
    return { categories: [], departments: [], tags: [] };
  }, [settings]);

  return {
    isLoading: isFetching,
    customCategories: customTaxonomies.categories,
    customDepartments: customTaxonomies.departments, 
    customTags: customTaxonomies.tags,
    customTaxonomies,
  };
};

/**
 * Sanitizes custom taxonomies data to ensure it's a proper object and not a corrupted string
 */
const sanitizeCustomTaxonomies = (customTaxonomies: CustomTaxonomies): CustomTaxonomies => {
  // If somehow the customTaxonomies is not a proper object, return a safe default
  if (
    typeof customTaxonomies !== 'object' ||
    customTaxonomies === null ||
    Array.isArray(customTaxonomies)
  ) {
    console.error('Corrupted custom taxonomies data detected, using safe defaults:', customTaxonomies);
    return { categories: [], departments: [], tags: [] };
  }

  return {
    categories: Array.isArray(customTaxonomies.categories) ? customTaxonomies.categories : [],
    departments: Array.isArray(customTaxonomies.departments) ? customTaxonomies.departments : [],
    tags: Array.isArray(customTaxonomies.tags) ? customTaxonomies.tags : [],
  };
};

/**
 * Hook for managing custom taxonomy additions while preserving global standards.
 */
export const useUpdateCustomTaxonomies = () => {
  const updateSettings = useUpdateSettings();
  const { customTaxonomies } = useCustomTaxonomies();

  const addCustomCategory = useCallback((category: string) => {
    if (isStandardCategory(category)) {
      console.warn(`Category "${category}" is already a standard category`);
      return Promise.resolve();
    }
    
    const sanitizedTaxonomies = sanitizeCustomTaxonomies(customTaxonomies);
    const updatedCategories = [...new Set([...(sanitizedTaxonomies.categories || []), category])];
    return updateSettings.mutateAsync({
      settingKey: POLICY_TAXONOMIES_SETTING_KEY,
      settingValue: {
        ...sanitizedTaxonomies,
        categories: updatedCategories,
      },
    });
  }, [customTaxonomies, updateSettings]);

  const addCustomDepartment = useCallback((department: string) => {
    if (isStandardDepartment(department)) {
      console.warn(`Department "${department}" is already a standard department`);
      return Promise.resolve();
    }
    
    const sanitizedTaxonomies = sanitizeCustomTaxonomies(customTaxonomies);
    const updatedDepartments = [...new Set([...(sanitizedTaxonomies.departments || []), department])];
    return updateSettings.mutateAsync({
      settingKey: POLICY_TAXONOMIES_SETTING_KEY,
      settingValue: {
        ...sanitizedTaxonomies,
        departments: updatedDepartments,
      },
    });
  }, [customTaxonomies, updateSettings]);

  const addCustomTag = useCallback((tag: string) => {
    if (isStandardTag(tag)) {
      console.warn(`Tag "${tag}" is already a standard tag`);
      return Promise.resolve();
    }
    
    const sanitizedTaxonomies = sanitizeCustomTaxonomies(customTaxonomies);
    const updatedTags = [...new Set([...(sanitizedTaxonomies.tags || []), tag])];
    return updateSettings.mutateAsync({
      settingKey: POLICY_TAXONOMIES_SETTING_KEY,
      settingValue: {
        ...sanitizedTaxonomies,
        tags: updatedTags,
      },
    });
  }, [customTaxonomies, updateSettings]);

  const removeCustomCategory = useCallback((category: string) => {
    if (isStandardCategory(category)) {
      console.warn(`Cannot remove standard category "${category}"`);
      return Promise.resolve();
    }
    
    const sanitizedTaxonomies = sanitizeCustomTaxonomies(customTaxonomies);
    const updatedCategories = (sanitizedTaxonomies.categories || []).filter(c => c !== category);
    return updateSettings.mutateAsync({
      settingKey: POLICY_TAXONOMIES_SETTING_KEY,
      settingValue: {
        ...sanitizedTaxonomies,
        categories: updatedCategories,
      },
    });
  }, [customTaxonomies, updateSettings]);

  const removeCustomDepartment = useCallback((department: string) => {
    if (isStandardDepartment(department)) {
      console.warn(`Cannot remove standard department "${department}"`);
      return Promise.resolve();
    }
    
    const sanitizedTaxonomies = sanitizeCustomTaxonomies(customTaxonomies);
    const updatedDepartments = (sanitizedTaxonomies.departments || []).filter(d => d !== department);
    return updateSettings.mutateAsync({
      settingKey: POLICY_TAXONOMIES_SETTING_KEY,
      settingValue: {
        ...sanitizedTaxonomies,
        departments: updatedDepartments,
      },
    });
  }, [customTaxonomies, updateSettings]);

  const removeCustomTag = useCallback((tag: string) => {
    if (isStandardTag(tag)) {
      console.warn(`Cannot remove standard tag "${tag}"`);
      return Promise.resolve();
    }
    
    const sanitizedTaxonomies = sanitizeCustomTaxonomies(customTaxonomies);
    const updatedTags = (sanitizedTaxonomies.tags || []).filter(t => t !== tag);
    return updateSettings.mutateAsync({
      settingKey: POLICY_TAXONOMIES_SETTING_KEY,
      settingValue: {
        ...sanitizedTaxonomies,
        tags: updatedTags,
      },
    });
  }, [customTaxonomies, updateSettings]);

  const bulkUpdateCustomTaxonomies = useCallback((newCustomTaxonomies: Partial<CustomTaxonomies>) => {
    const sanitizedTaxonomies = sanitizeCustomTaxonomies(customTaxonomies);
    const updated: CustomTaxonomies = {
      categories: newCustomTaxonomies.categories ?? (sanitizedTaxonomies.categories || []),
      departments: newCustomTaxonomies.departments ?? (sanitizedTaxonomies.departments || []),
      tags: newCustomTaxonomies.tags ?? (sanitizedTaxonomies.tags || []),
    };

    return updateSettings.mutateAsync({
      settingKey: POLICY_TAXONOMIES_SETTING_KEY,
      settingValue: updated,
    });
  }, [customTaxonomies, updateSettings]);

  return {
    addCustomCategory,
    addCustomDepartment,
    addCustomTag,
    removeCustomCategory,
    removeCustomDepartment,
    removeCustomTag,
    bulkUpdateCustomTaxonomies,
    isLoading: updateSettings.isPending,
  };
};

// --- Helper functions for checking standard vs custom ---

/**
 * Check if a category is a standard/global category.
 */
export const isStandardCategory = (category: string): boolean => {
  return STANDARD_POLICY_CATEGORIES.includes(category);
};

/**
 * Check if a department is a standard/global department.
 */
export const isStandardDepartment = (department: string): boolean => {
  return STANDARD_DEPARTMENTS.includes(department);
};

/**
 * Check if a tag is a standard/global tag.
 */
export const isStandardTag = (tag: string): boolean => {
  return STANDARD_POLICY_TAGS.includes(tag);
};

/**
 * Get only standard/global categories for analytics purposes.
 */
export const useStandardCategories = () => {
  return useMemo(() => getStandardCategories(), []);
};

/**
 * Get only standard/global departments for analytics purposes.
 */
export const useStandardDepartments = () => {
  return useMemo(() => getStandardDepartments(), []);
};

/**
 * Get only standard/global tags for analytics purposes.
 */
export const useStandardTags = () => {
  return useMemo(() => getStandardTags(), []);
};

/**
 * Filter a list of items to return only the custom (non-standard) ones.
 */
export const filterCustomCategories = (categories: string[]): string[] => {
  return categories.filter(category => !isStandardCategory(category));
};

/**
 * Filter a list of items to return only the custom (non-standard) ones.
 */
export const filterCustomDepartments = (departments: string[]): string[] => {
  return departments.filter(department => !isStandardDepartment(department));
};

/**
 * Filter a list of items to return only the custom (non-standard) ones.
 */
export const filterCustomTags = (tags: string[]): string[] => {
  return tags.filter(tag => !isStandardTag(tag));
};

/**
 * Filter a list of items to return only the standard (global) ones.
 */
export const filterStandardCategories = (categories: string[]): string[] => {
  return categories.filter(category => isStandardCategory(category));
};

/**
 * Filter a list of items to return only the standard (global) ones.
 */
export const filterStandardDepartments = (departments: string[]): string[] => {
  return departments.filter(department => isStandardDepartment(department));
};

/**
 * Filter a list of items to return only the standard (global) ones.
 */
export const filterStandardTags = (tags: string[]): string[] => {
  return tags.filter(tag => isStandardTag(tag));
};