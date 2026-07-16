-- Full schema: sessions, evaluations, study_cards
-- Migration: 20260716000000_create_full_schema.sql

-- Sessions table
create table if not exists public.sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    title text not null,
    conversation jsonb default '[]'::jsonb,
    blueprint text,
    workspace_nodes jsonb default '[]'::jsonb,
    workspace_edges jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Evaluations table
create table if not exists public.evaluations (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references public.sessions(id) on delete cascade not null,
    user_id uuid references auth.users not null,
    title text not null,
    score smallint check (score >= 1 and score <= 10),
    feasibility text check (feasibility in ('High', 'Medium', 'Low')),
    timeframe text,
    team_size smallint,
    suggested_stack jsonb default '[]'::jsonb,
    improvements jsonb default '[]'::jsonb,
    research_gap text,
    research_questions jsonb default '[]'::jsonb,
    existing_systems jsonb default '[]'::jsonb,
    github_repos jsonb default '[]'::jsonb,
    schedule jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Study cards table
create table if not exists public.study_cards (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    question text not null,
    answer text not null,
    ease_factor real default 2.5,
    interval integer default 0,
    repetitions integer default 0,
    next_review bigint,
    last_review bigint,
    deck text default 'default',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.sessions enable row level security;
alter table public.evaluations enable row level security;
alter table public.study_cards enable row level security;

-- Sessions policies
create policy "Users can view their own sessions"
    on public.sessions for select
    using (auth.uid() = user_id);
create policy "Users can create their own sessions"
    on public.sessions for insert
    with check (auth.uid() = user_id);
create policy "Users can update their own sessions"
    on public.sessions for update
    using (auth.uid() = user_id);
create policy "Users can delete their own sessions"
    on public.sessions for delete
    using (auth.uid() = user_id);

-- Evaluations policies
create policy "Users can view their own evaluations"
    on public.evaluations for select
    using (auth.uid() = user_id);
create policy "Users can create their own evaluations"
    on public.evaluations for insert
    with check (auth.uid() = user_id);
create policy "Users can delete their own evaluations"
    on public.evaluations for delete
    using (auth.uid() = user_id);

-- Study cards policies
create policy "Users can view their own study cards"
    on public.study_cards for select
    using (auth.uid() = user_id);
create policy "Users can create their own study cards"
    on public.study_cards for insert
    with check (auth.uid() = user_id);
create policy "Users can update their own study cards"
    on public.study_cards for update
    using (auth.uid() = user_id);
create policy "Users can delete their own study cards"
    on public.study_cards for delete
    using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_sessions_user_id on public.sessions(user_id);
create index if not exists idx_sessions_created_at on public.sessions(created_at desc);
create index if not exists idx_evaluations_session_id on public.evaluations(session_id);
create index if not exists idx_evaluations_user_id on public.evaluations(user_id);
create index if not exists idx_study_cards_user_id on public.study_cards(user_id);
create index if not exists idx_study_cards_next_review on public.study_cards(user_id, next_review);
