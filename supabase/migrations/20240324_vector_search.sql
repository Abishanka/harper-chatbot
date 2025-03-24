-- Create a function to match chunks using vector similarity
create or replace function match_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  chunk_text text,
  media_id uuid,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    chunks.id,
    chunks.chunk_text,
    chunks.media_id,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where 1 - (chunks.embedding <=> query_embedding) > match_threshold
  order by chunks.embedding <=> query_embedding
  limit match_count;
end;
$$; 