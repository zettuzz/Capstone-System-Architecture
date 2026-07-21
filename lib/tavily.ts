export async function searchWeb(query: string, maxResults: number = 5) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not configured');
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: "advanced",
      include_answer: true,
      exclude_domains: [
        "youtube.com",
        "youtu.be",
        "scribd.com",
        "facebook.com",
        "twitter.com",
        "x.com",
        "tiktok.com",
        "instagram.com",
        "reddit.com",
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.status}`);
  }

  return response.json();
}
