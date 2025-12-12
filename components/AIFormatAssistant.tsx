import React, { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Wand2, Check, RefreshCw, Loader2 } from 'lucide-react';
import { usePolicyPrompt } from '../helpers/useAIPolicyApi';
import { Button } from './Button';
import styles from './AIFormatAssistant.module.css';

type AIFormatAssistantProps = {
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

const FORMATTING_PROMPT = `Reformat the following text to improve its structure and readability for a professional policy document. Use markdown for headings, subheadings, lists (bulleted or numbered), bold for emphasis on key terms, and italics for definitions or citations. Ensure consistent and logical structure. Do not change the wording, meaning, or substance of the content. Only apply formatting improvements.`;

export const AIFormatAssistant = ({
  selectedText,
  fullText,
  onApplyToSelection,
  onApplyToFullText,
  onClose,
  className,
}: AIFormatAssistantProps) => {
  const [formattedText, setFormattedText] = useState('');
  const outputWrapperRef = useRef<HTMLDivElement>(null);
  const { mutate: processPrompt, isPending, data: stream, error, reset } = usePolicyPrompt();

  const isSelectionMode = !!selectedText;
  const targetText = isSelectionMode ? selectedText : fullText;

  useEffect(() => {
    // Reset state when the target text changes, to avoid showing old results for new text.
    reset();
    setFormattedText('');
  }, [targetText, reset]);

  const handleFormat = () => {
    if (!targetText) return;
    setFormattedText('');
    processPrompt({
      policyText: targetText,
      prompt: FORMATTING_PROMPT,
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
            setFormattedText(prev => prev + value);
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

  // Auto-scroll to bottom as new text is streamed in
  useEffect(() => {
    if (outputWrapperRef.current && formattedText) {
      outputWrapperRef.current.scrollTop = outputWrapperRef.current.scrollHeight;
    }
  }, [formattedText]);

  const handleApply = () => {
    if (isSelectionMode) {
      onApplyToSelection(formattedText);
    } else {
      onApplyToFullText(formattedText);
    }
    onClose?.();
  };

  const handleDiscard = () => {
    reset();
    setFormattedText('');
    onClose?.();
  };

  const hasFormattedText = formattedText.length > 0;
  const isStreaming = isPending && hasFormattedText;
  const isThinking = isPending && !hasFormattedText;

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <h4 className={styles.title}>AI Auto-Format</h4>
        <p className={styles.subtitle}>
          Improve structure and readability with one click.
        </p>
      </div>

      <div className={styles.infoMessage}>
        <p>Don't worry about the symbols you see below (like # or *). When you click Apply, they'll automatically turn into proper headings, bold text, and lists.</p>
      </div>

      <div className={styles.outputWrapper} ref={outputWrapperRef}>
        {isThinking ? (
          <div className={styles.thinkingContainer}>
            <div className={styles.thinkingText}>
              <Loader2 size={16} className={styles.spinIcon} />
              <span>AI is formatting</span>
              <span className={styles.thinkingDots}>
                <span className={styles.thinkingDot}></span>
                <span className={styles.thinkingDot}></span>
                <span className={styles.thinkingDot}></span>
              </span>
            </div>
          </div>
        ) : hasFormattedText ? (
          <p className={`${styles.formattedText} ${isStreaming ? styles.streamingText : ''}`}>
            {formattedText}
          </p>
        ) : (
          <p className={`${styles.formattedText} ${styles.placeholder}`}>
            Formatting suggestions will appear here...
          </p>
        )}
        {error && <div className={styles.error}>Error: {error.message}</div>}
        {(isStreaming || (hasFormattedText && !isPending)) && (
          <div className={styles.streamingIndicator}>
            <span className={styles.charCount}>
              {isStreaming ? 'Generating...' : 'Complete'} ({formattedText.length} chars)
            </span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {hasFormattedText && !isPending ? (
          <>
            <Button onClick={handleApply} size="sm">
              <Check size={16} />
              Apply
            </Button>
            <Button onClick={handleDiscard} variant="ghost" size="sm">
              <RefreshCw size={16} />
              Discard
            </Button>
          </>
        ) : (
          <Button
            onClick={handleFormat}
            disabled={isPending || !targetText}
            size="sm"
            className={styles.formatButton}
          >
            <Wand2 size={16} />
            {isPending ? 'Formatting...' : 'Auto-Format Text'}
          </Button>
        )}
      </div>
    </div>
  );
};