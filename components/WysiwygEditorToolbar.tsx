import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $isTextNode,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $setBlocksType } from '@lexical/selection';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { markdownToHtml } from '../helpers/markdownToHtml';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Quote,
  Undo,
  Redo,
  Sparkles,
  Variable,
  Eraser,
  Info
} from 'lucide-react';
import { Button } from './Button';
import { Dialog, DialogContent, DialogTrigger } from './Dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';
import { AIEditorAssistant } from './AIEditorAssistant';

import { AIFormatAssistant } from './AIFormatAssistant';
import styles from './WysiwygEditorToolbar.module.css';

interface WysiwygEditorToolbarProps {
  // Props can be added here in the future if needed
}

export const WysiwygEditorToolbar = ({}: WysiwygEditorToolbarProps = {}) => {
  const [editor] = useLexicalComposerContext();
  
  // Helper function to normalize nodes - wrap any text nodes in paragraph nodes
  const normalizeNodesForRoot = useCallback((nodes: any[]) => {
    const normalizedNodes = [];
    
    for (const node of nodes) {
      if ($isTextNode(node)) {
        // Wrap text nodes in paragraph nodes since root can't accept text nodes directly
        const paragraph = $createParagraphNode();
        paragraph.append(node);
        normalizedNodes.push(paragraph);
      } else {
        normalizedNodes.push(node);
      }
    }
    
    return normalizedNodes;
  }, []);
  const [selectedText, setSelectedText] = useState('');
  const [isAIPopoverOpen, setIsAIPopoverOpen] = useState(false);
  const [isFormatPopoverOpen, setIsFormatPopoverOpen] = useState(false);
  const [isVariablesHelpOpen, setIsVariablesHelpOpen] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Use refs to track throttling
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSelectedTextRef = useRef('');

  // Helper function to get full text on-demand
  const getFullText = useCallback((): string => {
    return editor.getEditorState().read(() => {
      const root = $getRoot();
      return root.getTextContent();
    });
  }, [editor]);

  // Helper function to get current selected text
  const getCurrentSelectedText = useCallback((): string => {
    return editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        return selection.getTextContent();
      }
      return '';
    });
  }, [editor]);

  // Throttled function to update selected text
  const updateSelectedText = useCallback(() => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    throttleTimeoutRef.current = setTimeout(() => {
      const currentSelectedText = getCurrentSelectedText();
      
      // Only update state if the selected text actually changed
      if (currentSelectedText !== lastSelectedTextRef.current) {
        console.log('Selected text changed:', { 
          from: lastSelectedTextRef.current, 
          to: currentSelectedText 
        });
        lastSelectedTextRef.current = currentSelectedText;
        setSelectedText(currentSelectedText);
      }
    }, 100); // 100ms throttle
  }, [getCurrentSelectedText]);

  // Track selection changes with throttling
  useEffect(() => {
    // Initial update
    updateSelectedText();

    // Listen for selection changes with throttling
    const unregister = editor.registerUpdateListener(() => {
      updateSelectedText();
    });

    return () => {
      unregister();
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [editor]); // Removed updateSelectedText from dependencies to prevent infinite loop

  // Track undo/redo availability
  useEffect(() => {
    const unregisterUndo = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      1
    );

    const unregisterRedo = editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      1
    );

    return () => {
      unregisterUndo();
      unregisterRedo();
    };
  }, [editor]);

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const handleUndo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  };

  const handleRedo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  };

  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const insertUnorderedList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const insertOrderedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  const convertMarkdown = useCallback(async () => {
    try {
      // Get the current content as text (treating it as markdown)
      const currentContent = getFullText();

      if (!currentContent.trim()) {
        return; // Nothing to convert
      }

      // Convert markdown to HTML
      const html = await markdownToHtml(currentContent);

      // Update the editor with the converted HTML
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        
        // Parse the HTML and create nodes
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        
        if (nodes.length > 0) {
          const normalizedNodes = normalizeNodesForRoot(nodes);
          root.append(...normalizedNodes);
        } else {
          // Fallback to paragraph with original text
          const paragraph = $createParagraphNode();
          const textNode = $createTextNode(currentContent);
          paragraph.append(textNode);
          root.append(paragraph);
        }
      });
    } catch (error) {
      console.error('Error converting markdown:', error);
      // Could add a toast notification here in the future
    }
  }, [editor, getFullText]);

  const clearFormatting = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Clear all text formatting
        selection.getNodes().forEach((node) => {
          if ($isTextNode(node)) {
            node.setFormat(0); // Clear all formatting
          }
        });
      }
    });
  }, [editor]);

  // Handle applying AI changes to selected text
  const handleApplyToSelection = useCallback((newText: string) => {
    // Use IIFE to handle async markdown conversion while keeping handler synchronous
    (async () => {
      try {
        // Convert markdown to HTML (async, must be outside editor.update)
        const html = await markdownToHtml(newText);
        
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            // Parse the HTML and create nodes
            const parser = new DOMParser();
            const dom = parser.parseFromString(html, 'text/html');
            const nodes = $generateNodesFromDOM(editor, dom);
            
            if (nodes.length > 0) {
              selection.insertNodes(nodes);
            } else {
              // Fallback to plain text
              const textNode = $createTextNode(newText);
              selection.insertNodes([textNode]);
            }
          }
        });
      } catch (error) {
        console.error('Error converting markdown to HTML for AI selection:', error);
        // Fallback to treating as plain text
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const textNode = $createTextNode(newText);
            selection.insertNodes([textNode]);
          }
        });
      }
    })();
    setIsAIPopoverOpen(false);
  }, [editor]);

  // Handle applying format changes to selected text
  const handleFormatApplyToSelection = useCallback(async (newText: string) => {
    try {
      // Convert markdown to HTML (async, must be outside editor.update)
      const html = await markdownToHtml(newText);
      
      // Single synchronous editor.update() call with all Lexical API calls inside
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Parse the HTML and create nodes INSIDE editor.update()
          const parser = new DOMParser();
          const dom = parser.parseFromString(html, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          
          if (nodes.length > 0) {
            selection.insertNodes(nodes);
          } else {
            // Fallback to plain text
            const textNode = $createTextNode(newText);
            selection.insertNodes([textNode]);
          }
        }
      });
      
      console.log('Format applied to selection successfully');
    } catch (error) {
      console.error('Error converting markdown to HTML for selection:', error);
      // Fallback to treating as plain text in a single synchronous update
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const textNode = $createTextNode(newText);
          selection.insertNodes([textNode]);
        }
      });
    }
    setIsFormatPopoverOpen(false);
  }, [editor]);

  // Handle applying format changes to full document
  const handleFormatApplyToFullText = useCallback(async (newText: string) => {
    try {
      // Convert markdown to HTML (async, must be outside editor.update)
      const html = await markdownToHtml(newText);
      
      // Single synchronous editor.update() call with all Lexical API calls inside
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        
        // Parse the HTML and create nodes INSIDE editor.update()
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        
        if (nodes.length > 0) {
          const normalizedNodes = normalizeNodesForRoot(nodes);
          root.append(...normalizedNodes);
        } else {
          // Fallback to paragraph with text
          const paragraph = $createParagraphNode();
          const textNode = $createTextNode(newText);
          paragraph.append(textNode);
          root.append(paragraph);
        }
      });
      
      console.log('Format applied to full text successfully');
    } catch (error) {
      console.error('Error converting markdown to HTML for full text:', error);
      // Fallback to treating as plain text in a single synchronous update
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode(newText);
        paragraph.append(textNode);
        root.append(paragraph);
      });
    }
    setIsFormatPopoverOpen(false);
  }, [editor, normalizeNodesForRoot]);


  // Handle applying AI changes to full document
  const handleApplyToFullText = useCallback((newText: string) => {
    // Use IIFE to handle async markdown conversion while keeping handler synchronous
    (async () => {
      try {
        // Convert markdown to HTML (async, must be outside editor.update)
        const html = await markdownToHtml(newText);
        
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          
          // Parse the HTML and create nodes
          const parser = new DOMParser();
          const dom = parser.parseFromString(html, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          
          if (nodes.length > 0) {
            const normalizedNodes = normalizeNodesForRoot(nodes);
            root.append(...normalizedNodes);
          } else {
            // Fallback to paragraph with text
            const paragraph = $createParagraphNode();
            const textNode = $createTextNode(newText);
            paragraph.append(textNode);
            root.append(paragraph);
          }
        });
      } catch (error) {
        console.error('Error converting markdown to HTML for AI full text:', error);
        // Fallback to treating as plain text
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          const textNode = $createTextNode(newText);
          paragraph.append(textNode);
          root.append(paragraph);
        });
      }
    })();
    setIsAIPopoverOpen(false);
  }, [editor, normalizeNodesForRoot]);

  const hasSelectedText = selectedText.length > 0;

  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  };

  const formatAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  return (
    <div className={styles.toolbar}>
      {/* Row 1: Basic Formatting */}
      <div className={styles.toolbarRow}>
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <Redo size={16} />
        </Button>

        <div className={styles.toolbarDivider} />

        {/* Headings */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => formatHeading('h1')}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => formatHeading('h2')}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => formatHeading('h3')}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={formatParagraph}
          title="Paragraph"
        >
          <Type size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={formatQuote}
          title="Quote"
        >
          <Quote size={16} />
        </Button>

        <div className={styles.toolbarDivider} />

        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={formatBold}
          title="Bold"
        >
          <Bold size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={formatItalic}
          title="Italic"
        >
          <Italic size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={formatUnderline}
          title="Underline"
        >
          <Underline size={16} />
        </Button>

        {/* Alignment */}
        <div className={styles.toolbarDivider} />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => formatAlign('left')}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => formatAlign('center')}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => formatAlign('right')}
          title="Align Right"
        >
          <AlignRight size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => formatAlign('justify')}
          title="Justify"
        >
          <AlignJustify size={16} />
        </Button>

        {/* Lists & Links */}
        <div className={styles.toolbarDivider} />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={insertUnorderedList}
          title="Bullet List"
        >
          <List size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={insertOrderedList}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={insertLink}
          title="Insert Link"
        >
          <LinkIcon size={16} />
        </Button>
      </div>

      {/* Row 2: AI-Powered Features */}
      <div className={styles.toolbarRow}>
        <div className={styles.aiGroupContainer}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Dialog open={isAIPopoverOpen} onOpenChange={setIsAIPopoverOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className={styles.aiFeatureButton}
                >
                  <Sparkles size={16} />
                  AI Edit
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className={styles.buttonInfoIcon} />
                    </TooltipTrigger>
                    <TooltipContent side="top">Select text and use AI to rewrite, expand, or modify it</TooltipContent>
                  </Tooltip>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <AIEditorAssistant
                  selectedText={selectedText}
                  fullText={getFullText()}
                  onApplyToSelection={handleApplyToSelection}
                  onApplyToFullText={handleApplyToFullText}
                  onClose={() => setIsAIPopoverOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </TooltipTrigger>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Dialog open={isFormatPopoverOpen} onOpenChange={setIsFormatPopoverOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className={styles.aiFeatureButton}
                >
                  <Sparkles size={16} />
                  Format Document
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className={styles.buttonInfoIcon} />
                    </TooltipTrigger>
                    <TooltipContent side="top">Apply consistent formatting across entire document</TooltipContent>
                  </Tooltip>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <AIFormatAssistant
                  selectedText={selectedText}
                  fullText={getFullText()}
                  onApplyToSelection={handleFormatApplyToSelection}
                  onApplyToFullText={handleFormatApplyToFullText}
                  onClose={() => setIsFormatPopoverOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </TooltipTrigger>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={clearFormatting}
              className={styles.clearFormatButton}
            >
              <Eraser size={16} />
              Clear Format
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className={styles.buttonInfoIcon} />
                </TooltipTrigger>
                <TooltipContent side="top">Remove all text formatting and return to plain text</TooltipContent>
              </Tooltip>
            </Button>
          </TooltipTrigger>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsVariablesHelpOpen(!isVariablesHelpOpen)}
              className={styles.variablesButton}
            >
              <Variable size={16} />
              Variables
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className={styles.buttonInfoIcon} />
                </TooltipTrigger>
                <TooltipContent side="top">Insert dynamic fields that auto-populate (press /)</TooltipContent>
              </Tooltip>
            </Button>
          </TooltipTrigger>
        </Tooltip>
        </div>
      </div>
    </div>
  );
};