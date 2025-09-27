-- Vector search functions for FamilyGPT
-- Run this in Supabase SQL Editor

-- Function to search user context by vector similarity
CREATE OR REPLACE FUNCTION search_user_context(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  raw_text text,
  metadata jsonb,
  source_type text,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT 
    uc.id,
    uc.raw_text,
    uc.metadata,
    uc.source_type,
    1 - (uc.embedding <=> query_embedding) as similarity
  FROM user_context uc
  WHERE uc.embedding IS NOT NULL
    AND 1 - (uc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY uc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Function to search family context by vector similarity
CREATE OR REPLACE FUNCTION search_family_context(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  raw_text text,
  metadata jsonb,
  source_type text,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT 
    fc.id,
    fc.raw_text,
    fc.metadata,
    fc.source_type,
    1 - (fc.embedding <=> query_embedding) as similarity
  FROM family_context fc
  WHERE fc.embedding IS NOT NULL
    AND 1 - (fc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY fc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Function to search all context (both user and family)
CREATE OR REPLACE FUNCTION search_all_context(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  raw_text text,
  metadata jsonb,
  source_type text,
  context_type text,
  similarity float
)
LANGUAGE sql
AS $$
  WITH user_results AS (
    SELECT 
      uc.id,
      uc.raw_text,
      uc.metadata,
      uc.source_type,
      'user_context'::text as context_type,
      1 - (uc.embedding <=> query_embedding) as similarity
    FROM user_context uc
    WHERE uc.embedding IS NOT NULL
      AND 1 - (uc.embedding <=> query_embedding) > similarity_threshold
  ),
  family_results AS (
    SELECT 
      fc.id,
      fc.raw_text,
      fc.metadata,
      fc.source_type,
      'family_context'::text as context_type,
      1 - (fc.embedding <=> query_embedding) as similarity
    FROM family_context fc
    WHERE fc.embedding IS NOT NULL
      AND 1 - (fc.embedding <=> query_embedding) > similarity_threshold
  )
  SELECT * FROM (
    SELECT * FROM user_results
    UNION ALL
    SELECT * FROM family_results
  ) combined_results
  ORDER BY similarity DESC
  LIMIT match_count;
$$; 