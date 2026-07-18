import { NextResponse } from 'next/server';
import { LLMError } from '@/lib/llm-providers';

export function handleAPIError(error: unknown) {
  console.error('API error:', error);
  if (error instanceof LLMError) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (error.retryAfter != null) headers['Retry-After'] = String(error.retryAfter);
    return NextResponse.json(
      { error: error.message },
      { status: error.status, headers }
    );
  }
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
