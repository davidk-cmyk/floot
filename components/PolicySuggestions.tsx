import React from 'react';
import { Lightbulb, PlusCircle, LoaderCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { usePolicySuggestions } from '../helpers/usePolicySuggestions';
import { useOrgNavigation } from '../helpers/useOrgNavigation';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import styles from './PolicySuggestions.module.css';

interface PolicySuggestionsProps {
  className?: string;
}

export const PolicySuggestions: React.FC<PolicySuggestionsProps> = ({ className }) => {
  const { navigateToAdmin } = useOrgNavigation();
  const { suggestions, generateSuggestions, isGenerating, error } = usePolicySuggestions();

  const handleGenerateClick = () => {
    generateSuggestions();
  };

  const handleCreatePolicy = (suggestion: any) => {
    const params = new URLSearchParams();
    params.set('title', suggestion.title);
    params.set('category', suggestion.category);
    params.set('description', suggestion.description);
    if (suggestion.department) params.set('department', suggestion.department);
    params.set('switchToAI', 'true');
    
    navigateToAdmin(`/policies/create?${params.toString()}`);
  };

  const renderContent = () => {
    if (isGenerating) {
      return (
        <div className={styles.grid}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={styles.cardSkeleton}>
              <Skeleton style={{ height: '1.5rem', width: '70%' }} />
              <Skeleton style={{ height: '1rem', width: '90%', marginTop: 'var(--spacing-2)' }} />
              <Skeleton style={{ height: '1rem', width: '80%' }} />
              <Skeleton style={{ height: '2.25rem', width: '120px', marginTop: 'var(--spacing-4)' }} />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.stateContainer}>
          <p className={styles.errorText}>Error generating suggestions: {error}</p>
          <Button onClick={handleGenerateClick}>Try Again</Button>
        </div>
      );
    }

    if (suggestions && suggestions.length > 0) {
      return (
        <div className={styles.suggestionsSection}>
          <div className={styles.suggestionsHeader}>
            <div className={styles.suggestionsHeaderContent}>
              <CheckCircle size={24} className={styles.successIcon} />
              <div>
                <h3 className={styles.suggestionsTitle}>
                  {suggestions.length} Policy Suggestion{suggestions.length !== 1 ? 's' : ''} Found
                </h3>
                <p className={styles.suggestionsSubtitle}>
                  Our AI has identified policies that could strengthen your organization
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className={styles.regenerateButton}
            >
              <RefreshCw size={16} />
              Generate New Suggestions
            </Button>
          </div>
          <div className={styles.grid}>
            {suggestions.map((suggestion, index) => (
              <div key={index} className={styles.card}>
                <div className={styles.cardHeader}>
                  <Lightbulb size={20} className={styles.cardIcon} />
                  <h4 className={styles.cardTitle}>{suggestion.title}</h4>
                </div>
                <p className={styles.cardDescription}>{suggestion.description}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={styles.cardButton}
                  onClick={() => handleCreatePolicy(suggestion)}
                >
                  <PlusCircle size={16} />
                  Create Policy
                </Button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={styles.stateContainer}>
        <Lightbulb size={40} className={styles.placeholderIcon} />
        <h3 className={styles.placeholderTitle}>Need inspiration?</h3>
        <p className={styles.placeholderText}>
          Let our AI analyze your existing policies and suggest important ones you might be missing.
        </p>
        <Button onClick={handleGenerateClick} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <LoaderCircle size={18} className={styles.animateSpin} />
              Generating...
            </>
          ) : (
            'Suggest Missing Policies'
          )}
        </Button>
      </div>
    );
  };

  return (
    <section className={`${styles.container} ${className || ''}`}>
      <h2 className={styles.title}>AI Policy Suggestions</h2>
      <div className={styles.content}>
        {renderContent()}
      </div>
    </section>
  );
};