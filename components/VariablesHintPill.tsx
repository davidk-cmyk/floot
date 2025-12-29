import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
} from 'lexical';
import { Keyboard } from 'lucide-react';
import styles from './VariablesHintPill.module.css';

interface HintState {
  isVisible: boolean;
  position: { top: number; left: number } | null;
}

const getDOMPosition = (): { top: number; left: number } | null => {
  const domSelection = window.getSelection();
  if (!domSelection || domSelection.rangeCount === 0) {
    return null;
  }
  const domRange = domSelection.getRangeAt(0);
  const rect = domRange.getBoundingClientRect();

  return {
    top: rect.bottom + 8, // Offset below cursor
    left: rect.left,
  };
};

export const VariablesHintPill = () => {
  const [editor] = useLexicalComposerContext();
  const [hintState, setHintState] = useState<HintState>({
    isVisible: false,
    position: null,
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownRef = useRef(false);

  const hideHint = useCallback(() => {
    setHintState({ isVisible: false, position: null });
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const showHint = useCallback(() => {
    if (hasShownRef.current) return;

    const position = getDOMPosition();
    if (!position) return;

    hasShownRef.current = true;
    setHintState({ isVisible: true, position });

    // Auto-hide after 4 seconds
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      hideHint();
      hasShownRef.current = false;
    }, 4000);
  }, [hideHint]);

  // Listen for typing and show hint
  useEffect(() => {
    const updateListener = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          hideHint();
          return;
        }

        // Check if user has content in editor
        const textContent = selection.getTextContent();
        if (textContent.length > 0 && !hintState.isVisible && !hasShownRef.current) {
          // Show hint on first typing
          showHint();
        }
      });
    };

    return editor.registerUpdateListener(updateListener);
  }, [editor, hideHint, showHint, hintState.isVisible]);

  // Listen for "/" key press to hide hint
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): boolean => {
      if (event.key === '/') {
        hideHint();
        hasShownRef.current = false;
      }
      return false;
    };

    return editor.registerCommand(KEY_DOWN_COMMAND, handleKeyDown, COMMAND_PRIORITY_LOW);
  }, [editor, hideHint]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!hintState.isVisible || !hintState.position) {
    return null;
  }

  return createPortal(
    <div
      className={styles.hintPill}
      style={{
        top: hintState.position.top,
        left: hintState.position.left,
      }}
    >
      <Keyboard size={14} />
      <span>Press <kbd>/</kbd> for variables</span>
    </div>,
    document.body
  );
};
