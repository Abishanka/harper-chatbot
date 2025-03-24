-- Create workspaces table
create table if not exists public.workspaces (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    description text,
    owner_id uuid references public.users(id) on delete cascade not null,
    is_shared boolean default false not null
);

-- Add workspace_id to media table
alter table public.media
    add column workspace_id uuid references public.workspaces(id) on delete cascade not null;

-- Create indexes for better query performance
create index if not exists workspaces_owner_id_idx on public.workspaces(owner_id);
create index if not exists media_workspace_id_idx on public.media(workspace_id);

-- Set up Row Level Security (RLS) for workspaces
alter table public.workspaces enable row level security;

-- Create policies for workspaces
create policy "Users can view their own workspaces"
    on public.workspaces for select
    using (auth.uid() = owner_id);

create policy "Users can create their own workspaces"
    on public.workspaces for insert
    with check (auth.uid() = owner_id);

create policy "Users can update their own workspaces"
    on public.workspaces for update
    using (auth.uid() = owner_id);

create policy "Users can delete their own workspaces"
    on public.workspaces for delete
    using (auth.uid() = owner_id);

-- Update media policies to include workspace ownership check
drop policy if exists "Users can view their own media" on public.media;
drop policy if exists "Users can insert their own media" on public.media;
drop policy if exists "Users can delete their own media" on public.media;

create policy "Users can view media in their workspaces"
    on public.media for select
    using (
        exists (
            select 1 from public.workspaces
            where workspaces.id = media.workspace_id
            and workspaces.owner_id = auth.uid()
        )
    );

create policy "Users can insert media in their workspaces"
    on public.media for insert
    with check (
        exists (
            select 1 from public.workspaces
            where workspaces.id = media.workspace_id
            and workspaces.owner_id = auth.uid()
        )
    );

create policy "Users can delete media in their workspaces"
    on public.media for delete
    using (
        exists (
            select 1 from public.workspaces
            where workspaces.id = media.workspace_id
            and workspaces.owner_id = auth.uid()
        )
    ); 