/**
 * Extracts the body className and innerHTML from a full HTML string.
 * @param html - The full HTML string.
 * @returns An object with className and innerHTML for the body.
 */
export function getBodyProps(html: string): { className: string; innerHTML: string } {
  const bodyMatch = html.match(/<body[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const originalClass = bodyMatch[1];
    const innerHTML = bodyMatch[2];
    return { className: originalClass, innerHTML };
  }
  // Fallback: if no body tag found, return empty class and the whole html as innerHTML
  return { className: '', innerHTML: html };
}