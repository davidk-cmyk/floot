import React, { useMemo, useState } from 'react';
import { Tag, ChevronDown } from 'lucide-react';
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage } from './Form';
import { PolicyTagInput } from './PolicyTagInput';
import { PolicyTagsInput } from './PolicyTagsInput';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './Command';
import { STANDARD_POLICY_CATEGORIES, STANDARD_DEPARTMENTS, STANDARD_POLICY_TAGS, usePolicyTaxonomies } from '../helpers/globalPolicyTaxonomies';
import styles from './PolicyTaxonomyGroup.module.css';

interface PolicyTaxonomyGroupProps {
  department?: string;
  onDepartmentChange: (value: string) => void;
  category?: string;
  onCategoryChange: (value: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export const PolicyTaxonomyGroup: React.FC<PolicyTaxonomyGroupProps> = ({
  department = '',
  onDepartmentChange,
  category = '',
  onCategoryChange,
  tags,
  onTagsChange,
  disabled = false,
  className,
}) => {
  const { combinedDepartments, combinedCategories, combinedTags, customTaxonomies } = usePolicyTaxonomies();
  const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);

  // Create sorted lists of 5 items each from the combined taxonomies
  const topDepartments = useMemo(() => {
    return [...combinedDepartments].sort().slice(0, 5);
  }, [combinedDepartments]);

  const topCategories = useMemo(() => {
    return [...combinedCategories].sort().slice(0, 5);
  }, [combinedCategories]);

  const topTags = useMemo(() => {
    return [...combinedTags].sort().slice(0, 5);
  }, [combinedTags]);

  // Calculate remaining counts
  const remainingDepartmentsCount = Math.max(0, combinedDepartments.length - 5);
  const remainingCategoriesCount = Math.max(0, combinedCategories.length - 5);
  const remainingTagsCount = Math.max(0, combinedTags.length - 5);

  // Group items for the expanded view
  const getDepartmentGroups = useMemo(() => {
    const globalItems = STANDARD_DEPARTMENTS.slice().sort();
    const customItems = customTaxonomies.departments?.slice().sort() || [];
    return { global: globalItems, custom: customItems };
  }, [customTaxonomies.departments]);

  const getCategoryGroups = useMemo(() => {
    const globalItems = STANDARD_POLICY_CATEGORIES.slice().sort();
    const customItems = customTaxonomies.categories?.slice().sort() || [];
    return { global: globalItems, custom: customItems };
  }, [customTaxonomies.categories]);

  const getTagGroups = useMemo(() => {
    const globalItems = STANDARD_POLICY_TAGS.slice().sort();
    const customItems = customTaxonomies.tags?.slice().sort() || [];
    return { global: globalItems, custom: customItems };
  }, [customTaxonomies.tags]);

  const handleDepartmentClick = (selectedDepartment: string) => {
    onDepartmentChange(selectedDepartment);
    setDepartmentPopoverOpen(false);
  };

  const handleCategoryClick = (selectedCategory: string) => {
    onCategoryChange(selectedCategory);
    setCategoryPopoverOpen(false);
  };

  const handleTagClick = (selectedTag: string) => {
    const currentTags = tags || [];
    if (!currentTags.includes(selectedTag)) {
      onTagsChange([...currentTags, selectedTag]);
    }
    setTagsPopoverOpen(false);
  };

  const renderExpandableSection = (
    items: string[],
    remainingCount: number,
    groups: { global: string[]; custom: string[] },
    onItemClick: (item: string) => void,
    selectedValue: string | string[],
    popoverOpen: boolean,
    setPopoverOpen: (open: boolean) => void,
    type: 'department' | 'category' | 'tags'
  ) => (
    <>
      <div className={styles.suggestionTags}>
        {items.map((item) => {
          const isSelected = Array.isArray(selectedValue) 
            ? selectedValue.includes(item)
            : selectedValue === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onItemClick(item)}
              className={`${styles.suggestionTag} ${isSelected ? styles.suggestionTagSelected : ''}`}
              disabled={disabled}
            >
              {item}
            </button>
          );
        })}
        {remainingCount > 0 && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={styles.expandButton}
                disabled={disabled}
              >
                ... and {remainingCount} more
                <ChevronDown size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent removeBackgroundAndPadding className={styles.popoverContent}>
              <Command>
                <CommandInput placeholder={`Search ${type}...`} />
                <CommandList>
                  <CommandEmpty>No {type} found.</CommandEmpty>
                  <CommandGroup heading="Global">
                    {groups.global.map((item) => (
                      <CommandItem
                        key={`global-${item}`}
                        onSelect={() => onItemClick(item)}
                      >
                        {item}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {groups.custom.length > 0 && (
                    <CommandGroup heading="Organization">
                      {groups.custom.map((item) => (
                        <CommandItem
                          key={`custom-${item}`}
                          onSelect={() => onItemClick(item)}
                        >
                          {item}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </>
  );

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <h3 className={styles.title}>
        <Tag size={18} />
        Classification & Tags
      </h3>
      <div className={styles.grid}>
        <FormItem name="department">
          <FormLabel>Department</FormLabel>
          <FormControl>
            <PolicyTagInput
              value={department}
              onChange={onDepartmentChange}
              settingKey="departments"
              placeholder="e.g. Human Resources"
              disabled={disabled}
            />
          </FormControl>
          <div className={styles.suggestionsContainer}>
            {renderExpandableSection(
              topDepartments,
              remainingDepartmentsCount,
              getDepartmentGroups,
              handleDepartmentClick,
              department,
              departmentPopoverOpen,
              setDepartmentPopoverOpen,
              'department'
            )}
          </div>
          <FormDescription id="department-description">
            The department responsible for this policy.
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem name="category">
          <FormLabel>Category</FormLabel>
          <FormControl>
            <PolicyTagInput
              value={category}
              onChange={onCategoryChange}
              settingKey="categories"
              placeholder="e.g. Compliance"
              disabled={disabled}
            />
          </FormControl>
          <div className={styles.suggestionsContainer}>
            {renderExpandableSection(
              topCategories,
              remainingCategoriesCount,
              getCategoryGroups,
              handleCategoryClick,
              category,
              categoryPopoverOpen,
              setCategoryPopoverOpen,
              'category'
            )}
          </div>
          <FormDescription id="category-description">
            Policy category for organization and filtering.
          </FormDescription>
          <FormMessage />
        </FormItem>
      </div>

      <FormItem name="tags">
        <FormLabel>Tags</FormLabel>
        <FormControl>
          <PolicyTagsInput
            value={tags}
            onChange={onTagsChange}
            taxonomyType="tags"
            placeholder="Add tags..."
            disabled={disabled}
          />
        </FormControl>
        <div className={styles.suggestionsContainer}>
          {renderExpandableSection(
            topTags,
            remainingTagsCount,
            getTagGroups,
            handleTagClick,
            tags,
            tagsPopoverOpen,
            setTagsPopoverOpen,
            'tags'
          )}
        </div>
        <FormDescription>
          Add tags to improve searchability and organization.
        </FormDescription>
        <FormMessage />
      </FormItem>
    </div>
  );
};