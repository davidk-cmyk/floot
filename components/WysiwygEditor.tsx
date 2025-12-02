import React, { forwardRef, useCallback, useRef, useEffect, useState } from 'react';
import { $getRoot, $createParagraphNode, $isElementNode, $isDecoratorNode, $isTextNode } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';

import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { VariableSlashCommandPlugin } from './VariableSlashCommandPlugin';
import { $generateHtmlFromNodes } from '@lexical/html';
import { WysiwygEditorToolbar } from './WysiwygEditorToolbar';

import { markdownToHtml } from '../helpers/markdownToHtml';
import { $generateNodesFromDOM } from '@lexical/html';
import styles from './WysiwygEditor.module.css';

export interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  onBlur?: () => void;
  documentVersion?: string | number; // Used to force remount when switching documents
}

// Function to create editor configuration with initial state
const createEditorConfig = (initialHtml: string) => ({
  namespace: 'wysiwyg-editor',
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    LinkNode,
    QuoteNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    CodeNode,
    CodeHighlightNode,
  ],
  onError: (error: Error) => {
    console.error('Lexical editor error:', error);
  },
  editorState: initialHtml ? (() => {
    // Create initial editor state from HTML
    const parser = new DOMParser();
    const dom = parser.parseFromString(initialHtml, 'text/html');
    
    return (editor: any) => {
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      
      // Sanitize nodes: root can only accept element or decorator nodes
      const sanitizedNodes = [];
      
      for (const node of nodes) {
        if ($isElementNode(node) || $isDecoratorNode(node)) {
          // Element and decorator nodes can be added directly
          sanitizedNodes.push(node);
        } else if ($isTextNode(node)) {
          // Text nodes must be wrapped in a paragraph
          const textContent = node.getTextContent();
          if (textContent.trim().length > 0) {
            // Only wrap non-empty text nodes
            const paragraph = $createParagraphNode();
            paragraph.append(node);
            sanitizedNodes.push(paragraph);
          }
          // Drop whitespace-only text nodes
        }
      }
      
      if (sanitizedNodes.length === 0) {
        // Fallback to empty paragraph if nothing survived sanitization
        root.append($createParagraphNode());
      } else {
        root.append(...sanitizedNodes);
      }
    };
  })() : undefined,
  theme: {
    root: styles.editorRoot,
    paragraph: styles.editorParagraph,
    heading: {
      h1: styles.editorHeading1,
      h2: styles.editorHeading2,
      h3: styles.editorHeading3,
      h4: styles.editorHeading4,
      h5: styles.editorHeading5,
      h6: styles.editorHeading6,
    },
    list: {
      ul: styles.editorListUnordered,
      ol: styles.editorListOrdered,
      listitem: styles.editorListItem,
    },
    link: styles.editorLink,
    text: {
      bold: styles.editorTextBold,
      italic: styles.editorTextItalic,
      underline: styles.editorTextUnderline,
      strikethrough: styles.editorTextStrikethrough,
    },
    quote: styles.editorQuote,
    table: styles.editorTable,
    tableCell: styles.editorTableCell,
    tableCellHeader: styles.editorTableCellHeader,
    code: styles.editorCode,
    codeHighlight: {
      plain: styles.editorCodeHighlight,
      comment: styles.editorCodeComment,
      punctuation: styles.editorCodePunctuation,
      keyword: styles.editorCodeKeyword,
      string: styles.editorCodeString,
      function: styles.editorCodeFunction,
      number: styles.editorCodeNumber,
      operator: styles.editorCodeOperator,
      variable: styles.editorCodeVariable,
      property: styles.editorCodeProperty,
    },
  },
});

export const WysiwygEditor = forwardRef<HTMLDivElement, WysiwygEditorProps>(
  ({ value, onChange, placeholder, className, id, onBlur, documentVersion, ...props }, ref) => {
    // Refs for debouncing
    const lastHtmlValueRef = useRef<string>(value);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Refs for editor container
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // Handle content changes and convert to HTML using proper Lexical HTML serialization
    const handleChange = useCallback((editorState: any, editor: any) => {
      editorState.read(() => {
        try {
          // Use Lexical's HTML generator with proper API - pass editor and null for full content
          const htmlString = $generateHtmlFromNodes(editor, null);
          console.log('Generated HTML from editor:', htmlString.substring(0, 200) + '...');
          
          // Only proceed if the HTML actually changed
          if (htmlString === lastHtmlValueRef.current) {
            return;
          }
          
          // Clear existing timeout
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          
          // Set up debounced onChange call
          debounceTimeoutRef.current = setTimeout(() => {
            // Double-check the value hasn't changed again
            if (htmlString !== lastHtmlValueRef.current) {
              lastHtmlValueRef.current = htmlString;
              onChange(htmlString);
            }
          }, 300);
          
        } catch (error) {
          console.error('Error generating HTML from editor state:', error);
          // Fallback to text content if HTML generation fails
          const root = $getRoot();
          const textContent = root.getTextContent();
          const fallbackHtml = `<p>${textContent}</p>`;
          
          // Apply same debouncing logic to fallback
          if (fallbackHtml !== lastHtmlValueRef.current) {
            if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
            }
            
            debounceTimeoutRef.current = setTimeout(() => {
              if (fallbackHtml !== lastHtmlValueRef.current) {
                lastHtmlValueRef.current = fallbackHtml;
                onChange(fallbackHtml);
              }
            }, 300);
          }
        }
      });
    }, [onChange]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }, []);

    // Update lastHtmlValueRef when value prop changes (external updates)
    useEffect(() => {
      lastHtmlValueRef.current = value;
    }, [value]);



    // Handle focus and blur events for the editor
    const handleEditorFocus = useCallback(() => {
      // Focus handling can be added here if needed in the future
    }, []);

    const handleEditorBlur = useCallback(() => {
      onBlur?.();
    }, [onBlur]);



    // Create editor config with initial HTML content
    const editorConfig = React.useMemo(() => createEditorConfig(value), []);
    
    return (
      <div 
        className={`${styles.editorContainer} ${className || ''}`}
        id={id}
        ref={(node) => {
          editorContainerRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        {...props}
      >
        <LexicalComposer 
          key={documentVersion} // Force remount when documentVersion changes
          initialConfig={editorConfig}
        >
          <div className={styles.editorInner}>
            <WysiwygEditorToolbar />
            <div className={styles.editorContentContainer}>
              <RichTextPlugin
                contentEditable={
                  <ContentEditable 
                    className={styles.editorContent}
                    onFocus={handleEditorFocus}
                    onBlur={handleEditorBlur}
                  />
                }
                placeholder={
                  <div className={styles.editorPlaceholder}>
                    {placeholder || 'Enter content... (Markdown supported: # Heading, **bold**, *italic*, - list, > quote)'}
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
            <HistoryPlugin />
            <OnChangePlugin onChange={handleChange} />
            <ListPlugin />
            <LinkPlugin />
            <TablePlugin />

            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <VariableSlashCommandPlugin />
          </div>
        </LexicalComposer>
      </div>
    );
  },
);

WysiwygEditor.displayName = 'WysiwygEditor';