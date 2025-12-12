import React, { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Sparkles, Check, RefreshCw, Loader2 } from 'lucide-react';
import { usePolicyPrompt } from '../helpers/useAIPolicyApi';
import { Button } from './Button';
import { Textarea } from './Textarea';
import styles from './AIEditorAssistant.module.css';

type AIEditorAssistantProps = {
  /** The currently selected text. If empty, the assistant will target the full text. */
  selectedText: string;
  /** The complete document text, used when no text is selected. */
  fullText: string;
  /** Callback to apply changes to the selected text. */
  onApplyToSelection: (newText: string) => void;
  /** Callback to apply changes to the entire document. */
  onApplyToFullText: (newText: string) => void;
  /** Optional callback to close the dialog/popover. */
  onClose?: () => void;
  /** Optional class name for custom styling. */
  className?: string;
};

export const AIEditorAssistant = ({
  selectedText,
  fullText,
  onApplyToSelection,
  onApplyToFullText,
  onClose,
  className,
}: AIEditorAssistantProps) => {
  const [modifiedText, setModifiedText] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const outputWrapperRef = useRef<HTMLDivElement>(null);
  const { mutate: processPrompt, isPending, data: stream, error, reset } = usePolicyPrompt();

  const isSelectionMode = !!selectedText;
  const targetText = isSelectionMode ? selectedText : fullText;

  useEffect(() => {
    // Reset state when the target text changes
    reset();
    setModifiedText('');
  }, [targetText, reset]);

  // Auto-scroll to bottom as new text is streamed in
  useEffect(() => {
    if (outputWrapperRef.current && modifiedText) {
      outputWrapperRef.current.scrollTop = outputWrapperRef.current.scrollHeight;
    }
  }, [modifiedText]);

  const handleApplyPrompt = () => {
    if (!targetText || !userPrompt.trim()) return;
    setModifiedText('');
    processPrompt({ 
      policyText: targetText, 
      prompt: userPrompt.trim() 
    });
  };

  const readStream = useCallback(async () => {
    if (!stream) return;

    const reader = stream.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (typeof value === 'string') {
          flushSync(() => {
            setModifiedText(prev => prev + value);
          });
        }
      }
    } catch (e) {
      console.error('Error reading AI stream:', e);
    } finally {
      reader.releaseLock();
    }
  }, [stream]);

  useEffect(() => {
    if (stream) {
      readStream();
    }
  }, [stream, readStream]);

  const handleApply = () => {
    if (isSelectionMode) {
      onApplyToSelection(modifiedText);
    } else {
      onApplyToFullText(modifiedText);
    }
    onClose?.();
  };

  const handleReset = () => {
    reset();
    setModifiedText('');
  };

  const handleDiscard = () => {
    reset();
    setModifiedText('');
    onClose?.();
  };

  const hasModifiedText = modifiedText.length > 0;
  const isStreaming = isPending && hasModifiedText;
  const isThinking = isPending && !hasModifiedText;

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <h4 className={styles.title}>What do you want to change?</h4>
        <p className={styles.subtitle}>
          Instructions (give your instructions here and AI will make amendments accordingly)
        </p>
      </div>

      <div className={styles.promptWrapper}>
        <Textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="Enter your instructions here..."
          rows={3}
          className={styles.promptTextarea}
        />
      </div>

      <div className={styles.outputWrapper} ref={outputWrapperRef}>
        {isThinking ? (
          <div className={styles.thinkingContainer}>
            <div className={styles.thinkingText}>
              <Loader2 size={16} className={styles.spinIcon} />
              <span>AI is thinking</span>
              <span className={styles.thinkingDots}>
                <span className={styles.thinkingDot}></span>
                <span className={styles.thinkingDot}></span>
                <span className={styles.thinkingDot}></span>
              </span>
            </div>
          </div>
        ) : hasModifiedText ? (
          <p className={`${styles.modifiedText} ${isStreaming ? styles.streamingText : ''}`}>
            {modifiedText}
          </p>
        ) : (
          <p className={`${styles.modifiedText} ${styles.placeholder}`}>
            AI modifications will appear here...
          </p>
        )}
        {error && <div className={styles.error}>Error: {error.message}</div>}
        {(isStreaming || (hasModifiedText && !isPending)) && (
          <div className={styles.streamingIndicator}>
            <span className={styles.charCount}>
              {isStreaming ? 'Generating...' : 'Complete'} ({modifiedText.length} chars)
            </span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {hasModifiedText && !isPending ? (
          <>
            <Button onClick={handleApply} size="sm">
              <Check size={16} />
              Apply Changes
            </Button>
            <Button onClick={handleReset} variant="ghost" size="sm">
              <RefreshCw size={16} />
              Discard & Retry
            </Button>
          </>
        ) : (
          <Button
            onClick={handleApplyPrompt}
            disabled={isPending || !targetText || !userPrompt.trim()}
            size="sm"
            className={styles.applyButton}
          >
            <Sparkles size={16} />
            {isPending ? 'Processing...' : 'Apply'}
          </Button>
        )}
      </div>
    </div>
  );
};