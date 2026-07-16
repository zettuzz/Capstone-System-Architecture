import { NextResponse } from 'next/server';
import { getOrSet } from '@/lib/cache';

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
  updated_at: string;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export async function POST(request: Request) {
  try {
    const { title, description } = await request.json();

    const query = `${title} ${description || ''} capstone thesis`.trim();
    const cacheKey = `gh:${simpleHash(query)}`;

    const repos = await getOrSet(
      cacheKey,
      async () => {
        const searchQuery = encodeURIComponent(query);
        const url = `https://api.github.com/search/repositories?q=${searchQuery}&sort=stars&order=desc&per_page=8`;

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CapstoneAI/1.0',
          },
        });

        if (!response.ok) {
          console.warn(`GitHub API returned ${response.status}`);
          return [];
        }

        const data = await response.json();
        return (data.items || []).map((repo: GitHubRepo) => ({
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || 'No description',
          url: repo.html_url,
          stars: repo.stargazers_count,
          language: repo.language || 'Unknown',
          updatedAt: repo.updated_at,
        }));
      },
      3600 // 1 hour cache
    );

    return NextResponse.json({ repos });
  } catch (error) {
    console.error('Error in github-search API:', error);
    return NextResponse.json({ repos: [] });
  }
}
