/**
 * Extracts the head content, title, body className, innerHTML, and style content from a full HTML string.
 * @param html - The full HTML string.
 * @returns An object with headContent, title, className, innerHTML, and styleContent.
 */
export function getHtmlContents(html: string): { headContent: string; title: string; className: string; innerHTML: string; styleContent: string } {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/body>/i);
  const headContent = headMatch ? headMatch[1] : '';
  const className = bodyMatch ? bodyMatch[1] : '';
  const innerHTML = bodyMatch ? bodyMatch[2] : html;
  // Extract title from headContent
  const titleMatch = headContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : '';
  // Extract style tags from headContent
  const styleMatches = headContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  const styleContent = styleMatches
    ? styleMatches
        .map(match => match.replace(/<\/?style[^>]*>/g, ''))
        .join('\n')
    : '';
  return { headContent, title, className, innerHTML, styleContent };
}