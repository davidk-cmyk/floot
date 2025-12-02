import * as htmlparser2 from "htmlparser2";

// -----------------------------------------------------------------------------
// TYPE DEFINITIONS for the Document AST
// -----------------------------------------------------------------------------

/** Represents a piece of text with specific formatting. */
export type TextSpan = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
};

/** Represents a single item within a list. */
export type ListItem = {
  children: TextSpan[];
};

/** Represents a block-level heading element. */
export type HeadingBlock = {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: TextSpan[];
};

/** Represents a block-level paragraph element. */
export type ParagraphBlock = {
  type: "paragraph";
  children: TextSpan[];
};

/** Represents an ordered or unordered list. */
export type ListBlock = {
  type: "list";
  listType: "ordered" | "unordered";
  items: ListItem[];
};

/** A union of all possible block-level content types. */
export type ContentBlock = HeadingBlock | ParagraphBlock | ListBlock;

// -----------------------------------------------------------------------------
// HTML to AST PARSER
// -----------------------------------------------------------------------------

type FormatType = "bold" | "italic" | "underline" | "strikethrough";

/**
 * Parses an HTML string, specifically from a Lexical editor, into a structured
 * Abstract Syntax Tree (AST). This intermediate format can be consistently
 * consumed by various document generators (e.g., PDF, DOCX, Markdown).
 *
 * @param html The HTML string to parse.
 * @returns An array of `ContentBlock` objects representing the document structure.
 */
/**
 * Removes markdown formatting characters from text content.
 * This ensures HTML-based formatting takes precedence over literal markdown.
 */
function cleanMarkdownFromText(text: string): string {
  let cleaned = text;
  
  // Remove strikethrough markers: ~~text~~ → text
  cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');
  
  // Remove bold markers: **text** → text
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  
  // Remove italic markers: *text* → text (but avoid conflicts with bold)
  // Only match single asterisks that aren't part of double asterisks
  cleaned = cleaned.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1');
  
  // Also handle underscore variants
  // Remove bold: __text__ → text
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  
  // Remove italic: _text_ → text (but avoid conflicts with bold)
  cleaned = cleaned.replace(/(?<!_)_([^_]+)_(?!_)/g, '$1');
  
  return cleaned;
}

export function parseLexicalHtml(html: string): ContentBlock[] {
  const results: ContentBlock[] = [];
  let currentBlock: HeadingBlock | ParagraphBlock | null = null;
  let currentList: ListBlock | null = null;
  let currentListItem: ListItem | null = null;
  const formatStack: FormatType[] = [];

  const parser = new htmlparser2.Parser({
    onopentag(name, attribs) {
      // --- Handle Block Elements ---
      const headingMatch = name.match(/^h([1-6])$/);
      if (headingMatch) {
        flushBlock();
        const level = parseInt(headingMatch[1], 10) as HeadingBlock["level"];
        currentBlock = { type: "heading", level, children: [] };
        return;
      }

      if (name === "p") {
        flushBlock();
        currentBlock = { type: "paragraph", children: [] };
        return;
      }

      if (name === "ul" || name === "ol") {
        flushBlock();
        currentList = {
          type: "list",
          listType: name === "ol" ? "ordered" : "unordered",
          items: [],
        };
        return;
      }

      if (name === "li") {
        currentListItem = { children: [] };
        return;
      }

      // --- Handle Inline Formatting Elements ---
      if (name === "strong" || name === "b") {
        formatStack.push("bold");
      } else if (name === "em" || name === "i") {
        formatStack.push("italic");
      } else if (name === "u") {
        formatStack.push("underline");
      } else if (name === "s") {
        formatStack.push("strikethrough");
      }
    },

    ontext(text) {
      const trimmedText = text.trim();
      if (!trimmedText && text.includes("\n")) {
        // Ignore whitespace-only text nodes that are likely just for formatting
        return;
      }
      
      if (!currentBlock && !currentListItem) {
        // Text outside of a known block, create a paragraph for it
        currentBlock = { type: "paragraph", children: [] };
      }

      // Clean markdown formatting characters from text since HTML formatting takes precedence
      const cleanedText = cleanMarkdownFromText(text);
      const span: TextSpan = { text: cleanedText };
      if (formatStack.includes("bold")) span.bold = true;
      if (formatStack.includes("italic")) span.italic = true;
      if (formatStack.includes("underline")) span.underline = true;
      if (formatStack.includes("strikethrough")) span.strikethrough = true;

      if (currentListItem) {
        currentListItem.children.push(span);
      } else if (currentBlock) {
        currentBlock.children.push(span);
      }
    },

    onclosetag(name) {
      // --- Handle Block Elements ---
      if (name.match(/^h[1-6]$/) || name === "p") {
        flushBlock();
        return;
      }

      if (name === "ul" || name === "ol") {
        flushBlock(); // Flushes any list that might be open
        return;
      }

      if (name === "li") {
        if (currentListItem && currentList) {
          currentList.items.push(currentListItem);
        }
        currentListItem = null;
        return;
      }

      // --- Handle Inline Formatting Elements ---
      if (name === "strong" || name === "b") {
        popFromStack("bold");
      } else if (name === "em" || name === "i") {
        popFromStack("italic");
      } else if (name === "u") {
        popFromStack("underline");
      } else if (name === "s") {
        popFromStack("strikethrough");
      }
    },
  });

  /**
   * Finalizes the current block (paragraph, heading, or list) and adds it
   * to the results array, then resets the state.
   */
  const flushBlock = () => {
    if (currentBlock) {
      results.push(currentBlock);
      currentBlock = null;
    } else if (currentList) {
      results.push(currentList);
      currentList = null;
    }
  };

  /**
   * Safely removes the last occurrence of a format type from the stack.
   * This handles nested tags of the same type correctly.
   */
  const popFromStack = (format: FormatType) => {
    const index = formatStack.lastIndexOf(format);
    if (index > -1) {
      formatStack.splice(index, 1);
    }
  };

  parser.write(html);
  parser.end();

  // Final flush to catch any unclosed elements at the end of the document
  flushBlock();

  return results;
}