import { NextResponse } from 'next/server';
import { requireAuth, AuthError, unauthorizedResponse } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ projects: data });
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
    const { title } = await request.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({ title: title.trim(), user_id: userId })
      .select('id, title, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return unauthorizedResponse();
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
