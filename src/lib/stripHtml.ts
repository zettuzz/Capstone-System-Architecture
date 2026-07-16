/**
 * Utility to convert raw HTML string to an object suitable for dangerouslySetInnerHTML.
 * @param html - The raw HTML string.
 * @returns An object with __html property containing the HTML string.
 */
export function stripHtml(html: string): { __html: string } {
  return { __html: html };
}