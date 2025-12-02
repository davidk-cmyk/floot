import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useRewritePlainEnglish } from '../helpers/useAIPolicyApi';
import { Button } from './Button';
import { Textarea } from './Textarea';
import { Skeleton } from './Skeleton';
import styles from './AIRewriteAssistant.module.css';

type AIRewriteAssistantProps = {
  originalText: string;
  onAccept: (rewrittenText: string) => void;
  className?: string;
};

export const AIRewriteAssistant = ({ originalText, onAccept, className }: AIRewriteAssistantProps) => {
  const [rewrittenText, setRewrittenText] = useState('');
  const { mutate: rewrite, isPending, data: stream, error, reset } = useRewritePlainEnglish();

  useEffect(() => {
    // Reset when the original text changes
    reset();
    setRewrittenText('');
  }, [originalText, reset]);

  const handleRewrite = () => {
    if (!originalText) return;
    setRewrittenText('');
    rewrite({ policyText: originalText });
  };

  const readStream = useCallback(async () => {
    if (!stream) return;

    const reader = stream.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (typeof value === 'string') {
          setRewrittenText(prev => prev + value);
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

  const handleAccept = () => {
    onAccept(rewrittenText);
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.textAreas}>
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Original Text</h3>
          <Textarea
            value={originalText}
            readOnly
            className={styles.textarea}
            disableResize
          />
        </div>
        <div className={styles.arrow}>
          <ArrowRight size={24} color="var(--muted-foreground)" />
        </div>
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Plain English Version</h3>
          <div className={styles.outputWrapper}>
            {isPending && !rewrittenText && (
              <div className={styles.skeletonContainer}>
                <Skeleton style={{ height: '1rem', width: '90%' }} />
                <Skeleton style={{ height: '1rem', width: '85%' }} />
                <Skeleton style={{ height: '1rem', width: '95%' }} />
              </div>
            )}
            <Textarea
              value={rewrittenText}
              readOnly
              className={`${styles.textarea} ${styles.output}`}
              placeholder="Rewritten text will appear here..."
              disableResize
            />
            {error && <div className={styles.error}>Error: {error.message}</div>}
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          onClick={handleRewrite}
          disabled={isPending || !originalText}
          variant="secondary"
        >
          <Sparkles size={16} />
          {isPending ? 'Rewriting...' : 'Rewrite in Plain English'}
        </Button>
        <Button
          onClick={handleAccept}
          disabled={isPending || !rewrittenText}
        >
          Accept Changes
        </Button>
      </div>
    </div>
  );
};