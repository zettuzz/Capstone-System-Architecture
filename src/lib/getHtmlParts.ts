export function getHtmlParts(html: string) {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return {
    head: headMatch ? headMatch[1] : '',
    body: bodyMatch ? bodyMatch[1] : html,
  };
}