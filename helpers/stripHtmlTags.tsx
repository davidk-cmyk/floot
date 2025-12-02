/**
 * Strips HTML tags from a string and converts HTML entities to their text equivalents.
 * Normalizes whitespace and line breaks for clean, readable output.
 * @param htmlString - The HTML string to clean
 * @returns Plain text without HTML markup
 */
export const stripHtmlTags = (htmlString: string): string => {
  if (!htmlString) return '';

  // Create a temporary element to parse HTML safely
  const temp = document.createElement('div');
  temp.innerHTML = htmlString;
  
  // Get the text content (strips all HTML tags)
  let text = temp.textContent || temp.innerText || '';

  // Decode common HTML entities
  const htmlEntities: Record<string, string> = {
    '&nbsp;': ' ',
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };

  Object.entries(htmlEntities).forEach(([entity, replacement]) => {
    text = text.replace(new RegExp(entity, 'g'), replacement);
  });

  // Normalize whitespace: collapse multiple spaces, tabs, and normalize line breaks
  text = text
    .replace(/\s+/g, ' ') // Replace multiple whitespace characters with single space
    .replace(/\n\s*\n/g, '\n\n') // Preserve paragraph breaks (double newlines)
    .trim();

  return text;
};