-- Populate family_context and generate embeddings
-- Run this in Supabase SQL Editor

-- 1. Copy all user_context entries to family_context (preserves existing embeddings)
INSERT INTO family_context (
  raw_text,
  embedding,
  source_type,
  source_id,
  metadata,
  created_by
)
SELECT 
  uc.raw_text,
  uc.embedding,
  uc.source_type,
  uc.source_id,
  uc.metadata,
  uc.family_member_id
FROM user_context uc
WHERE NOT EXISTS (
  SELECT 1 FROM family_context fc 
  WHERE fc.source_type = uc.source_type 
  AND fc.source_id = uc.source_id
);

-- 2. Add all existing posts directly to family_context (embeddings will be NULL initially)
INSERT INTO family_context (
  raw_text,
  source_type,
  source_id,
  metadata,
  created_by
)
SELECT 
  'Title: ' || SPLIT_PART(fp.content, E'\n\n', 1) || E'\n' ||
  'Description: ' || COALESCE(ARRAY_TO_STRING(STRING_TO_ARRAY(fp.content, E'\n\n')[2:], E'\n\n'), '') || E'\n' ||
  'Author: ' || fm.full_name || ' (' || fm.relationship || ')' || E'\n' ||
  'Post Type: ' || fp.post_type || E'\n' ||
  'Date: ' || fp.created_at::date || E'\n' ||
  CASE 
    WHEN fp.image_urls IS NOT NULL THEN 'Images: ' || array_length(fp.image_urls, 1) || ' photos attached'
    ELSE ''
  END,
  'post',
  fp.id,
  jsonb_build_object(
    'title', SPLIT_PART(fp.content, E'\n\n', 1),
    'post_type', fp.post_type,
    'date', fp.created_at::date,
    'author', fm.full_name,
    'author_relationship', fm.relationship,
    'has_images', CASE WHEN fp.image_urls IS NOT NULL THEN true ELSE false END,
    'image_count', COALESCE(array_length(fp.image_urls, 1), 0)
  ),
  fp.author_id
FROM family_posts fp
JOIN family_members fm ON fp.author_id = fm.id
WHERE NOT EXISTS (
  SELECT 1 FROM family_context fc 
  WHERE fc.source_type = 'post' 
  AND fc.source_id = fp.id
);

-- 3. Show what was added
SELECT 'Family context populated!' as status;
SELECT 
  source_type,
  COUNT(*) as count,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings,
  COUNT(CASE WHEN embedding IS NULL THEN 1 END) as without_embeddings
FROM family_context 
GROUP BY source_type;

-- 4. Note about embeddings
SELECT 'Note: Use the admin panel to generate embeddings for entries with NULL embeddings' as next_step; 