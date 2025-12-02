import React, { useState, useEffect, useCallback } from 'react';
import { Lightbulb } from 'lucide-react';
import { useSuggestImprovements } from '../helpers/useAIPolicyApi';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import styles from './AIImprovementSuggestions.module.css';

type AIImprovementSuggestionsProps = {
  policyText: string;
  className?: string;
};

export const AIImprovementSuggestions = ({ policyText, className }: AIImprovementSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState('');
  const { mutate: getSuggestions, isPending, data: stream, error, reset } = useSuggestImprovements();

  useEffect(() => {
    reset();
    setSuggestions('');
  }, [policyText, reset]);

  const handleGetSuggestions = () => {
    if (!policyText) return;
    setSuggestions('');
    getSuggestions({ policyText });
  };

  const readStream = useCallback(async () => {
    if (!stream) return;

    const reader = stream.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (typeof value === 'string') {
          setSuggestions(prev => prev + value);
        }
      }
    } catch (e) {
      console.error('Error reading stream:', e);
    } finally {
      reader.releaseLock();
    }
  }, [stream]);

  useEffect(() => {
    if (stream) {
      readStream();
    }
  }, [stream, readStream]);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <p className={styles.description}>
          Get AI-powered suggestions to improve the clarity, compliance, and completeness of your policy.
        </p>
        <Button
          onClick={handleGetSuggestions}
          disabled={isPending || !policyText}
        >
          <Lightbulb size={16} />
          {isPending ? 'Analyzing...' : 'Get Suggestions'}
        </Button>
      </div>

      <div className={styles.suggestionsWrapper}>
        {isPending && !suggestions && (
          <div className={styles.skeletonContainer}>
            <Skeleton style={{ height: '1.25rem', width: '30%' }} />
            <Skeleton style={{ height: '1rem', width: '80%', marginTop: 'var(--spacing-2)' }} />
            <Skeleton style={{ height: '1rem', width: '70%' }} />
            <Skeleton style={{ height: '1.25rem', width: '35%', marginTop: 'var(--spacing-4)' }} />
            <Skeleton style={{ height: '1rem', width: '85%' }} />
          </div>
        )}
        {suggestions && (
          <pre className={styles.suggestionsContent}>{suggestions}</pre>
        )}
        {!isPending && !suggestions && !error && (
          <div className={styles.placeholder}>
            <p>Improvement suggestions will appear here.</p>
          </div>
        )}
        {error && <div className={styles.error}>Error: {error.message}</div>}
      </div>
    </div>
  );
};