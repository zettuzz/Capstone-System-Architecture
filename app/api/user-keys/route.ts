import { NextResponse } from 'next/server';
import { requireAuth, AuthError, unauthorizedResponse } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/encryption';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('provider, encrypted_key')
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const keys: Record<string, string> = {};
    for (const row of data ?? []) {
      try {
        keys[row.provider] = decrypt(row.encrypted_key);
      } catch {
        keys[row.provider] = '';
      }
    }

    return NextResponse.json({ keys });
  } catch (e) {
    if (e instanceof AuthError) return unauthorizedResponse();
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { provider, apiKey } = await request.json();

    if (!provider || !['openrouter', 'nvidia'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const encrypted = encrypt(apiKey);
    const { error } = await supabase
      .from('user_api_keys')
      .upsert(
        { user_id: userId, provider, encrypted_key: encrypted, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,provider' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return unauthorizedResponse();
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await requireAuth();
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { provider } = await request.json();

    if (!provider || !['openrouter', 'nvidia'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return unauthorizedResponse();
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
