-- Drop existing tables if they exist
drop table if exists public.user_workspace_mapping cascade;
drop table if exists public.media_workspace_mapping cascade;
drop table if exists public.chunks cascade;
drop table if exists public.media cascade;
drop table if exists public.workspaces cascade;
drop table if exists public.users cascade;

-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create users table
create table public.users (
    id text not null primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    email text not null,
    full_name text
);

-- Create workspaces table
create table public.workspaces (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    description text,
    owner_id text references public.users(id) on delete cascade not null
);

-- Create media table
create table public.media (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    media_type text not null check (media_type in ('file', 'image')),
    owner_id text references public.users(id) on delete cascade not null
);

-- Create chunks table
create table public.chunks (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    chunk_text text not null,
    media_id uuid references public.media(id) on delete cascade not null,
    page_number integer,
    embedding vector(1536)
);

-- Create media-workspace mapping table
create table public.media_workspace_mapping (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    media_id uuid references public.media(id) on delete cascade not null,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    added_by text references public.users(id) on delete cascade not null
);

-- Create user-workspace mapping table
create table public.user_workspace_mapping (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id text references public.users(id) on delete cascade not null,
    workspace_id uuid references public.workspaces(id) on delete cascade not null
);

-- Create indexes for better query performance
create index if not exists media_owner_id_idx on public.media(owner_id);
create index if not exists chunks_media_id_idx on public.chunks(media_id);
create index if not exists chunks_embedding_idx on public.chunks using ivfflat (embedding vector_cosine_ops);
create index if not exists media_workspace_mapping_media_id_idx on public.media_workspace_mapping(media_id);
create index if not exists media_workspace_mapping_workspace_id_idx on public.media_workspace_mapping(workspace_id);
create index if not exists user_workspace_mapping_user_id_idx on public.user_workspace_mapping(user_id);
create index if not exists user_workspace_mapping_workspace_id_idx on public.user_workspace_mapping(workspace_id);

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.media enable row level security;
alter table public.chunks enable row level security;
alter table public.workspaces enable row level security;
alter table public.media_workspace_mapping enable row level security;
alter table public.user_workspace_mapping enable row level security;

-- Create a function to get the current user ID
create or replace function public.get_current_user_id()
returns text
language plpgsql
security definer
as $$
begin
  return coalesce(
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('request.jwt.claims')::json->>'sub'
  );
end;
$$;

-- Create policies
create policy "Users can view their own data"
    on public.users for select
    using (id = public.get_current_user_id());

create policy "Users can update their own data"
    on public.users for update
    using (id = public.get_current_user_id());

create policy "Users can view their own media"
    on public.media for select
    using (owner_id = public.get_current_user_id());

create policy "Users can insert their own media"
    on public.media for insert
    with check (owner_id = public.get_current_user_id());

create policy "Users can delete their own media"
    on public.media for delete
    using (owner_id = public.get_current_user_id());

create policy "Users can view chunks of their media"
    on public.chunks for select
    using (
        exists (
            select 1 from public.media
            where media.id = chunks.media_id
            and media.owner_id = public.get_current_user_id()
        )
    );

create policy "Users can insert chunks for their media"
    on public.chunks for insert
    with check (
        exists (
            select 1 from public.media
            where media.id = chunks.media_id
            and media.owner_id = public.get_current_user_id()
        )
    );

create policy "Users can delete chunks of their media"
    on public.chunks for delete
    using (
        exists (
            select 1 from public.media
            where media.id = chunks.media_id
            and media.owner_id = public.get_current_user_id()
        )
    );

create policy "Users can view their own workspaces"
    on public.workspaces for select
    using (owner_id = public.get_current_user_id());

create policy "Users can create their own workspaces"
    on public.workspaces for insert
    with check (owner_id = public.get_current_user_id());

create policy "Users can update their own workspaces"
    on public.workspaces for update
    using (owner_id = public.get_current_user_id());

create policy "Users can delete their own workspaces"
    on public.workspaces for delete
    using (owner_id = public.get_current_user_id());

create policy "Users can view media in their workspaces"
    on public.media_workspace_mapping for select
    using (
        exists (
            select 1 from public.workspaces
            where workspaces.id = media_workspace_mapping.workspace_id
            and workspaces.owner_id = public.get_current_user_id()
        )
    );

create policy "Users can create media mappings in their workspaces"
    on public.media_workspace_mapping for insert
    with check (
        exists (
            select 1 from public.workspaces
            where workspaces.id = media_workspace_mapping.workspace_id
            and workspaces.owner_id = public.get_current_user_id()
        )
    );

create policy "Users can view their workspace memberships"
    on public.user_workspace_mapping for select
    using (
        user_id = public.get_current_user_id()
    );

create policy "Users can create workspace memberships"
    on public.user_workspace_mapping for insert
    with check (
        user_id = public.get_current_user_id()
    ); 