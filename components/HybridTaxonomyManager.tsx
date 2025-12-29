import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Lightbulb, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  useCustomTaxonomies,
  useUpdateCustomTaxonomies,
  isStandardCategory,
  isStandardDepartment,
  isStandardTag,
} from '../helpers/useSettingsApi';
import { getStandardCategories, getStandardDepartments, getStandardTags } from '../helpers/globalPolicyTaxonomies';
import { Input } from './Input';
import { Button } from './Button';
import { Badge } from './Badge';
import { Skeleton } from './Skeleton';
import styles from './HybridTaxonomyManager.module.css';

type TaxonomyType = 'categories' | 'departments' | 'tags';

interface HybridTaxonomyManagerProps {
  title: string;
  description: string;
  taxonomyType: TaxonomyType;
  className?: string;
}

const SkeletonLoader: React.FC = () => (
  <div className={styles.skeletonContainer}>
    <Skeleton style={{ height: '2.5rem', width: '60%' }} />
    <div className={styles.badgeContainer}>
      <Skeleton style={{ height: '1.75rem', width: '120px', borderRadius: 'var(--radius-full)' }} />
      <Skeleton style={{ height: '1.75rem', width: '150px', borderRadius: 'var(--radius-full)' }} />
      <Skeleton style={{ height: '1.75rem', width: '100px', borderRadius: 'var(--radius-full)' }} />
      <Skeleton style={{ height: '1.75rem', width: '180px', borderRadius: 'var(--radius-full)' }} />
      <Skeleton style={{ height: '1.75rem', width: '90px', borderRadius: 'var(--radius-full)' }} />
    </div>
  </div>
);

export const HybridTaxonomyManager: React.FC<HybridTaxonomyManagerProps> = ({
  title,
  description,
  taxonomyType,
  className,
}) => {
  const [newItem, setNewItem] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const { isLoading: isLoadingCustom, customTaxonomies } = useCustomTaxonomies();
  const {
    addCustomCategory,
    addCustomDepartment,
    addCustomTag,
    removeCustomCategory,
    removeCustomDepartment,
    removeCustomTag,
    isLoading: isUpdating,
  } = useUpdateCustomTaxonomies();

  const { standardItems, customItems, isStandard, addAction, removeAction } = useMemo(() => {
    switch (taxonomyType) {
      case 'categories':
        return {
          standardItems: getStandardCategories(),
          customItems: customTaxonomies.categories ?? [],
          isStandard: isStandardCategory,
          addAction: addCustomCategory,
          removeAction: removeCustomCategory,
        };
      case 'departments':
        return {
          standardItems: getStandardDepartments(),
          customItems: customTaxonomies.departments ?? [],
          isStandard: isStandardDepartment,
          addAction: addCustomDepartment,
          removeAction: removeCustomDepartment,
        };
      case 'tags':
        return {
          standardItems: getStandardTags(),
          customItems: customTaxonomies.tags ?? [],
          isStandard: isStandardTag,
          addAction: addCustomTag,
          removeAction: removeCustomTag,
        };
      default:
        return {
          standardItems: [],
          customItems: [],
          isStandard: () => false,
          addAction: () => Promise.resolve(),
          removeAction: () => Promise.resolve(),
        };
    }
  }, [
    taxonomyType,
    customTaxonomies,
    addCustomCategory,
    addCustomDepartment,
    addCustomTag,
    removeCustomCategory,
    removeCustomDepartment,
    removeCustomTag,
  ]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedItem = newItem.trim();
    if (trimmedItem && !isStandard(trimmedItem) && !customItems.includes(trimmedItem)) {
      await addAction(trimmedItem);
      setNewItem('');
    }
  };

  const handleRemoveItem = async (item: string) => {
    if (!isStandard(item)) {
      await removeAction(item);
    }
  };

  if (isLoadingCustom) {
    return <SkeletonLoader />;
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.quickGuideBox}>
        <button 
          className={styles.quickGuideHeader}
          onClick={() => setShowGuide(!showGuide)}
        >
          <Lightbulb size={18} className={styles.guideIcon} />
          <span className={styles.guideTitle}>💡 Understanding {taxonomyType.charAt(0).toUpperCase() + taxonomyType.slice(1)}</span>
          {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showGuide && (
          <div className={styles.guideContent}>
            <p>
              <Badge variant="default" className={styles.standardBadge}>Standard</Badge>
              <span> items (blue badges) are provided by the platform and available to all organizations. These cannot be edited or removed, ensuring consistent analytics across all users. They're automatically available for use when creating policies.</span>
            </p>
            <p>
              <Badge variant="outline" className={styles.customGuideBadge}>Custom</Badge>
              <span> items (purple badges) are specific to your organization. You can create, edit, or remove these as needed to match your unique policy structure.</span>
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleAddItem} className={styles.addForm}>
        <Input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={`Add a new custom ${taxonomyType.slice(0, -1)}...`}
          disabled={isUpdating}
        />
        <Button type="submit" disabled={!newItem.trim() || isUpdating}>
          {isUpdating ? <Loader2 size={16} className={styles.spinner} /> : <Plus size={16} />}
          Add
        </Button>
      </form>

      <div className={styles.badgeContainer}>
        {standardItems.map((item) => (
          <Badge key={item} variant="default" className={styles.standardBadge}>
            {item}
          </Badge>
        ))}
        {customItems.map((item) => (
          <Badge key={item} variant="secondary" className={styles.customBadge}>
            {item}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleRemoveItem(item)}
              className={styles.removeButton}
              aria-label={`Remove ${item}`}
              disabled={isUpdating}
            >
              <Trash2 size={12} />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
};