import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  LexicalEditor,
  TextNode,
} from 'lexical';
import { useOrganizationVariables } from '../helpers/useOrganizationVariables';
import { Skeleton } from './Skeleton';
import styles from './VariableSlashCommandPlugin.module.css';

const SLASH_TRIGGER = '/';

interface SlashCommandState {
  isOpen: boolean;
  searchText: string;
  anchorNode: TextNode | null;
  anchorOffset: number;
}

const initialSlashState: SlashCommandState = {
  isOpen: false,
  searchText: '',
  anchorNode: null,
  anchorOffset: 0,
};

const getDOMPosition = (editor: LexicalEditor): { top: number; left: number } | null => {
  const domSelection = window.getSelection();
  if (!domSelection || domSelection.rangeCount === 0) {
    return null;
  }
  const domRange = domSelection.getRangeAt(0);
  const rect = domRange.getBoundingClientRect();

  // Adjust for editor's scroll position if it's a scrollable container
  let scrollX = 0;
  let scrollY = 0;
  const editorElement = editor.getRootElement();
  if (editorElement) {
    scrollX = editorElement.scrollLeft;
    scrollY = editorElement.scrollTop;
  }

  return {
    top: rect.bottom + scrollY,
    left: rect.left + scrollX,
  };
};

export const VariableSlashCommandPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const { data: orgVariables, isLoading } = useOrganizationVariables();
  const [slashState, setSlashState] = useState<SlashCommandState>(initialSlashState);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const allVariables = useMemo(() => {
    if (!orgVariables) return [];
    return orgVariables.map(v => ({
      path: v.variableName,
      value: v.variableValue || 'Not set',
    }));
  }, [orgVariables]);

  const filteredVariables = useMemo(() => {
    if (!slashState.isOpen) return [];
    const searchLower = slashState.searchText.toLowerCase();
    if (!searchLower) return allVariables;
    return allVariables.filter(
      v =>
        v.path.toLowerCase().includes(searchLower) ||
        v.value.toLowerCase().includes(searchLower)
    );
  }, [allVariables, slashState.searchText, slashState.isOpen]);

  const resetState = useCallback(() => {
    setSlashState(initialSlashState);
    setSelectedIndex(0);
    setPopupPosition(null);
  }, []);

  const handleSelectVariable = useCallback((variablePath: string, variableValue: string) => {
    editor.update(() => {
      const { anchorNode, anchorOffset } = slashState;
      if (!anchorNode) {
        resetState();
        return;
      }

      const startPosition = anchorOffset - (slashState.searchText.length + 1);
      anchorNode.spliceText(startPosition, slashState.searchText.length + 1, variableValue);
      
      const newOffset = startPosition + variableValue.length;
      anchorNode.select(newOffset, newOffset);
    });
    resetState();
  }, [editor, slashState, resetState]);

  useEffect(() => {
    if (!slashState.isOpen || filteredVariables.length === 0) {
      setSelectedIndex(0);
      return;
    }
    if (selectedIndex >= filteredVariables.length) {
      setSelectedIndex(filteredVariables.length - 1);
    }
  }, [filteredVariables, selectedIndex, slashState.isOpen]);

  useEffect(() => {
    const updateListener = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          if (slashState.isOpen) resetState();
          return;
        }

        const anchor = selection.anchor;
        const node = anchor.getNode();
        if (!$isTextNode(node)) {
          if (slashState.isOpen) resetState();
          return;
        }

        const textContent = node.getTextContent().substring(0, anchor.offset);
        const match = textContent.match(/\/([a-zA-Z0-9_.]*)$/);

        if (match) {
          const searchText = match[1];
          setSlashState({
            isOpen: true,
            searchText,
            anchorNode: node,
            anchorOffset: anchor.offset,
          });
          const position = getDOMPosition(editor);
          setPopupPosition(position);
        } else {
          if (slashState.isOpen) resetState();
        }
      });
    };

    return editor.registerUpdateListener(updateListener);
  }, [editor, slashState.isOpen, resetState]);

  useEffect(() => {
    if (!slashState.isOpen) return;

    const handleKeyDown = (event: KeyboardEvent): boolean => {
      if (filteredVariables.length === 0 && !isLoading) return false;

      if (event.key === 'ArrowDown') {
        setSelectedIndex(prev => (prev + 1) % filteredVariables.length);
        event.preventDefault();
        return true;
      }
      if (event.key === 'ArrowUp') {
        setSelectedIndex(prev => (prev - 1 + filteredVariables.length) % filteredVariables.length);
        event.preventDefault();
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        if (selectedIndex < filteredVariables.length) {
          const selected = filteredVariables[selectedIndex];
          handleSelectVariable(selected.path, selected.value);
        }
        event.preventDefault();
        return true;
      }
      if (event.key === 'Escape') {
        resetState();
        event.preventDefault();
        return true;
      }
      return false;
    };

    return editor.registerCommand(KEY_DOWN_COMMAND, handleKeyDown, COMMAND_PRIORITY_LOW);
  }, [editor, slashState.isOpen, selectedIndex, filteredVariables, isLoading, handleSelectVariable, resetState]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        resetState();
      }
    };

    if (slashState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [slashState.isOpen, resetState]);

  if (!slashState.isOpen || !popupPosition) {
    return null;
  }

  return createPortal(
    <div
      ref={popupRef}
      className={styles.popup}
      style={{ top: popupPosition.top, left: popupPosition.left }}
    >
      {isLoading ? (
        <div className={styles.loadingState}>
          <Skeleton style={{ height: '2rem', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ height: '2rem' }} />
        </div>
      ) : filteredVariables.length > 0 ? (
        filteredVariables.map((variable, index) => (
          <div
            key={variable.path}
            className={`${styles.item} ${index === selectedIndex ? styles.selected : ''}`}
            onClick={() => handleSelectVariable(variable.path, variable.value)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className={styles.variablePath}>{variable.path}</span>
            <span className={styles.variableValue}>{variable.value}</span>
          </div>
        ))
      ) : (
        <div className={styles.emptyState}>No variables found.</div>
      )}
    </div>,
    document.body
  );
};