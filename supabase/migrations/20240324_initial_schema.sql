-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create users table
create table if not exists public.users (
    id uuid references auth.users on delete cascade not null primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    email text not null,
    full_name text
);

-- Create media table
create table if not exists public.media (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    media_type text not null check (media_type in ('file', 'image')),
    owner_id uuid references public.users(id) on delete cascade not null,
    vector_id text
);

-- Create chunks table
create table if not exists public.chunks (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    chunk_text text not null,
    media_id uuid references public.media(id) on delete cascade not null,
    page_number integer,
    embedding vector(1536)
);

-- Create indexes for better query performance
create index if not exists media_owner_id_idx on public.media(owner_id);
create index if not exists chunks_media_id_idx on public.chunks(media_id);
create index if not exists chunks_embedding_idx on public.chunks using ivfflat (embedding vector_cosine_ops);

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.media enable row level security;
alter table public.chunks enable row level security;

-- Create policies
create policy "Users can view their own data"
    on public.users for select
    using (auth.uid() = id);

create policy "Users can update their own data"
    on public.users for update
    using (auth.uid() = id);

create policy "Users can view their own media"
    on public.media for select
    using (auth.uid() = owner_id);

create policy "Users can insert their own media"
    on public.media for insert
    with check (auth.uid() = owner_id);

create policy "Users can delete their own media"
    on public.media for delete
    using (auth.uid() = owner_id);

create policy "Users can view chunks of their media"
    on public.chunks for select
    using (
        exists (
            select 1 from public.media
            where media.id = chunks.media_id
            and media.owner_id = auth.uid()
        )
    );

create policy "Users can insert chunks for their media"
    on public.chunks for insert
    with check (
        exists (
            select 1 from public.media
            where media.id = chunks.media_id
            and media.owner_id = auth.uid()
        )
    );

create policy "Users can delete chunks of their media"
    on public.chunks for delete
    using (
        exists (
            select 1 from public.media
            where media.id = chunks.media_id
            and media.owner_id = auth.uid()
        )
    ); 