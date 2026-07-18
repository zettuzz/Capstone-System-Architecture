import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export interface AuthContext {
  userId: string;
}

export async function requireAuth(): Promise<AuthContext> {
  const { userId } = await auth();
  if (!userId) {
    throw new AuthError();
  }
  return { userId };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export class AuthError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'AuthError';
  }
}
