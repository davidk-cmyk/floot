import { marked } from 'marked';

/**
 * Converts a markdown string to an HTML string.
 * This function handles both synchronous and asynchronous returns from the `marked` library
 * and always returns a Promise that resolves to the HTML string.
 *
 * @param markdown The markdown content to convert.
 * @returns A promise that resolves to the HTML string.
 */
export const markdownToHtml = (markdown: string): Promise<string> => {
  // marked() can return a string or a Promise<string> depending on its configuration.
  // Promise.resolve() handles both cases gracefully.
  // If it's a string, it wraps it in a resolved promise.
  // If it's a promise, it returns a new promise that follows the state of the original.
  return Promise.resolve(marked(markdown));
};