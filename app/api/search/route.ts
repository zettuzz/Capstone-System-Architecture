import { NextResponse } from 'next/server';
import { searchWeb } from '@/lib/tavily';
import { getOrSet } from '@/lib/cache';

export async function POST(request: Request) {
  try {
    const { query, maxResults } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
    const cacheKey = `search:${normalizedQuery}:${maxResults || 5}`;

    const results = await getOrSet(
      cacheKey,
      () => searchWeb(query, maxResults),
      86400 // 24 hours
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
