import { NextResponse } from 'next/server';
import { requireAuth, AuthError, unauthorizedResponse } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await requireAuth();
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (data.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ project: data });
  } catch (e) {
    if (e instanceof AuthError) return unauthorizedResponse();
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await requireAuth();
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { nodes, edges, title } = await request.json();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (nodes !== undefined) updateData.nodes = nodes;
    if (edges !== undefined) updateData.edges = edges;
    if (title !== undefined) updateData.title = title;

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, title, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project: data });
  } catch (e) {
    if (e instanceof AuthError) return unauthorizedResponse();
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await requireAuth();
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return unauthorizedResponse();
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
