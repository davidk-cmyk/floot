import React, { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { markdownToHtml } from '../helpers/markdownToHtml';
import { useOrgNavigation } from '../helpers/useOrgNavigation';
import {
  POLICY_TEMPLATES,
  POLICY_TEMPLATE_CATEGORIES,
  PolicyTemplate,
  PolicyTemplateCategory,
} from '../helpers/policyTemplates';
import { Input } from './Input';
import { Button } from './Button';
import { Badge } from './Badge';
import { Checkbox } from './Checkbox';
import { Search, Clock, ArrowRight, CheckSquare, Loader, Scale } from 'lucide-react';
import styles from './PolicyTemplateLibrary.module.css';
import { useBulkCreatePolicies } from '../helpers/usePolicyApi';

export const PolicyTemplateLibrary: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { navigateToAdmin } = useOrgNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] =
    useState<PolicyTemplateCategory | 'All'>('All');
  const [filterByLegallyRequired, setFilterByLegallyRequired] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(
    new Set(),
  );

  const bulkCreateMutation = useBulkCreatePolicies();
  const isSelectionMode = selectedTemplateIds.size > 0;

  const handleSelectTemplate = (template: PolicyTemplate) => {
    const params = new URLSearchParams();
    params.set('title', template.title);
    params.set('content', template.content);
    params.set('category', template.category);
    params.set('fromSuggestion', 'true');

    toast.success(`Loading "${template.title}" template...`);
    navigateToAdmin(`/policies/create?${params.toString()}`);
  };

  const toggleTemplateSelection = useCallback((templateId: string) => {
    setSelectedTemplateIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedTemplateIds(new Set());
  }, []);

  const handleAdoptSelected = useCallback(async () => {
    const selectedTemplates = POLICY_TEMPLATES.filter((template) =>
      selectedTemplateIds.has(template.id),
    );

    if (selectedTemplates.length === 0) {
      toast.error('No templates selected');
      return;
    }

    // Convert markdown content to HTML for each template
    const policiesToCreate = await Promise.all(
      selectedTemplates.map(async (template) => ({
        title: template.title,
        content: await markdownToHtml(template.content),
        category: template.category,
        requiresAcknowledgment: false,
      })),
    );

    bulkCreateMutation.mutate(
      { policies: policiesToCreate },
      {
        onSuccess: () => {
          handleClearSelection();
          toast.success(
            `${selectedTemplates.length} ${
              selectedTemplates.length === 1 ? 'policy' : 'policies'
            } created successfully!`,
          );
        },
      },
    );
  }, [selectedTemplateIds, bulkCreateMutation, handleClearSelection]);

  const filteredTemplates = useMemo(() => {
    return POLICY_TEMPLATES.filter((template) => {
      const matchesCategory =
        activeCategory === 'All' || template.category === activeCategory;
      const matchesSearch =
        !searchTerm ||
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLegallyRequired =
        !filterByLegallyRequired || template.type === 'required';
      return matchesCategory && matchesSearch && matchesLegallyRequired;
    });
  }, [searchTerm, activeCategory, filterByLegallyRequired]);

  const groupedTemplates = useMemo(() => {
    if (activeCategory !== 'All') {
      return { [activeCategory]: filteredTemplates };
    }
    return filteredTemplates.reduce(
      (acc, template) => {
        if (!acc[template.category]) {
          acc[template.category] = [];
        }
        acc[template.category].push(template);
        return acc;
      },
      {} as Record<PolicyTemplateCategory, PolicyTemplate[]>,
    );
  }, [filteredTemplates, activeCategory]);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <Input
            type="search"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.categoryFilters}>
          <Button
            variant={activeCategory === 'All' && !filterByLegallyRequired ? 'primary' : 'ghost'}
            onClick={() => {
              setActiveCategory('All');
              setFilterByLegallyRequired(false);
            }}
            className={styles.categoryButton}
          >
            All
          </Button>
          <Button
            variant={filterByLegallyRequired ? 'primary' : 'ghost'}
            onClick={() => {
              setFilterByLegallyRequired(!filterByLegallyRequired);
              setActiveCategory('All');
            }}
            className={styles.categoryButton}
          >
            <Scale size={16} />
            Legally Required
          </Button>
          {POLICY_TEMPLATE_CATEGORIES.map((cat) => (
            <Button
              key={cat.name}
              variant={activeCategory === cat.name && !filterByLegallyRequired ? 'primary' : 'ghost'}
              onClick={() => {
                setActiveCategory(cat.name);
                setFilterByLegallyRequired(false);
              }}
              className={styles.categoryButton}
            >
              <cat.icon size={16} />
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <div className={styles.library}>
        {Object.entries(groupedTemplates).length > 0 ? (
          Object.entries(groupedTemplates).map(([category, templates]) => (
            <section key={category} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{category}</h2>
              <div className={styles.grid}>
                {templates.map((template) => {
                  const isSelected = selectedTemplateIds.has(template.id);
                  return (
                    <div
                      key={template.id}
                      className={`${styles.templateCard} ${
                        isSelected ? styles.templateCardSelected : ''
                      }`}
                      onClick={() => toggleTemplateSelection(template.id)}
                    >
                      <div className={styles.selectionCheckbox}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleTemplateSelection(template.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{template.title}</h3>
                      {template.type === 'required' ? (
                        <Badge variant="destructive">Legally Required</Badge>
                      ) : (
                        <Badge variant="secondary">Recommended</Badge>
                      )}
                    </div>
                    <p className={styles.cardDescription}>
                      {template.description}
                    </p>
                      <div className={styles.cardFooter}>
                        <div className={styles.timeEstimate}>
                          <Clock size={14} />
                          <span>{template.estimatedTime} min setup</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTemplate(template);
                          }}
                          disabled={isSelectionMode}
                        >
                          Start with Template <ArrowRight size={14} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className={styles.emptyState}>
            <h3>No Templates Found</h3>
            <p>
              No templates match your search criteria. Try a different search
              term or filter.
            </p>
          </div>
        )}
      </div>

      {isSelectionMode && (
        <div className={styles.stickyFooter}>
          <div className={styles.footerContent}>
            <div className={styles.selectionInfo}>
              <CheckSquare size={20} />
              <span>
                {selectedTemplateIds.size}{' '}
                {selectedTemplateIds.size === 1 ? 'template' : 'templates'}{' '}
                selected
              </span>
            </div>
            <div className={styles.footerActions}>
              <Button
                variant="secondary"
                onClick={handleClearSelection}
                disabled={bulkCreateMutation.isPending}
              >
                Clear Selection
              </Button>
              <Button
                variant="primary"
                onClick={handleAdoptSelected}
                disabled={bulkCreateMutation.isPending}
              >
                {bulkCreateMutation.isPending ? (
                  <>
                    <Loader className={styles.spinner} size={16} />
                    Creating...
                  </>
                ) : (
                  'Adopt Selected'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};