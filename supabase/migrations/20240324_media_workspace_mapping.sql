-- Create media_workspace_mapping table for many-to-many relationship
create table if not exists public.media_workspace_mapping (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    media_id uuid references public.media(id) on delete cascade not null,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    added_by uuid references public.users(id) on delete cascade not null,
    unique(media_id, workspace_id)
);

-- Create indexes for better query performance
create index if not exists media_workspace_mapping_media_id_idx on public.media_workspace_mapping(media_id);
create index if not exists media_workspace_mapping_workspace_id_idx on public.media_workspace_mapping(workspace_id);
create index if not exists media_workspace_mapping_added_by_idx on public.media_workspace_mapping(added_by);

-- Set up Row Level Security (RLS) for media_workspace_mapping
alter table public.media_workspace_mapping enable row level security;

-- Create policies for media_workspace_mapping
create policy "Users can view mappings for their workspaces"
    on public.media_workspace_mapping for select
    using (
        exists (
            select 1 from public.workspaces
            where workspaces.id = media_workspace_mapping.workspace_id
            and workspaces.owner_id = auth.uid()
        )
    );

create policy "Users can create mappings for their workspaces"
    on public.media_workspace_mapping for insert
    with check (
        exists (
            select 1 from public.workspaces
            where workspaces.id = media_workspace_mapping.workspace_id
            and workspaces.owner_id = auth.uid()
        )
    );

create policy "Users can delete mappings for their workspaces"
    on public.media_workspace_mapping for delete
    using (
        exists (
            select 1 from public.workspaces
            where workspaces.id = media_workspace_mapping.workspace_id
            and workspaces.owner_id = auth.uid()
        )
    );

-- Update media policies to check for workspace membership
drop policy if exists "Users can view media in their workspaces" on public.media;
drop policy if exists "Users can insert media in their workspaces" on public.media;
drop policy if exists "Users can delete media in their workspaces" on public.media;

create policy "Users can view media in their workspaces"
    on public.media for select
    using (
        exists (
            select 1 from public.media_workspace_mapping
            join public.workspaces on workspaces.id = media_workspace_mapping.workspace_id
            where media_workspace_mapping.media_id = media.id
            and workspaces.owner_id = auth.uid()
        )
    );

create policy "Users can insert media in their workspaces"
    on public.media for insert
    with check (
        exists (
            select 1 from public.media_workspace_mapping
            join public.workspaces on workspaces.id = media_workspace_mapping.workspace_id
            where media_workspace_mapping.media_id = media.id
            and workspaces.owner_id = auth.uid()
        )
    );

create policy "Users can delete media in their workspaces"
    on public.media for delete
    using (
        exists (
            select 1 from public.media_workspace_mapping
            join public.workspaces on workspaces.id = media_workspace_mapping.workspace_id
            where media_workspace_mapping.media_id = media.id
            and workspaces.owner_id = auth.uid()
        )
    );

-- Migrate existing media records to the mapping table
insert into public.media_workspace_mapping (media_id, workspace_id, added_by)
select id, workspace_id, owner_id
from public.media
where workspace_id is not null;

-- Drop the dependent policy before dropping the column
drop policy if exists "Users can insert media in their workspaces" on public.media;

-- Remove the workspace_id column from media table since we now use the mapping table
alter table public.media
    drop column workspace_id; 