-- Populate family_context with all user context and posts
-- Run this in Supabase SQL Editor

-- 1. Copy all user_context entries to family_context
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

-- 2. Add all existing posts directly to family_context (if not already there)
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

-- 3. Add all existing memories to family_context (if not already there)
INSERT INTO family_context (
  raw_text,
  source_type,
  source_id,
  metadata,
  created_by
)
SELECT 
  'Memory: ' || m.title || E'\n' ||
  'Description: ' || COALESCE(m.description, 'No description provided') || E'\n' ||
  'Subject: ' || fm.full_name || ' (' || fm.relationship || ')' || E'\n' ||
  'Date of Memory: ' || COALESCE(m.memory_date::text, 'Date not specified') || E'\n' ||
  'Tags: ' || COALESCE(array_to_string(m.tags, ', '), 'No tags') || E'\n' ||
  'Created by: ' || COALESCE(creator.full_name, 'Unknown'),
  'memory',
  m.id,
  jsonb_build_object(
    'title', m.title,
    'memory_date', m.memory_date,
    'subject', fm.full_name,
    'subject_relationship', fm.relationship,
    'tags', COALESCE(m.tags, '{}'),
    'is_favorite', m.is_favorite,
    'type', 'memory'
  ),
  m.created_by
FROM memories m
JOIN family_members fm ON m.family_member_id = fm.id
LEFT JOIN family_members creator ON m.created_by = creator.id
WHERE NOT EXISTS (
  SELECT 1 FROM family_context fc 
  WHERE fc.source_type = 'memory' 
  AND fc.source_id = m.id
);

-- 4. Show results
SELECT 'Family context populated successfully!' as status;
SELECT 
  'Total family_context entries:' as info,
  COUNT(*) as count 
FROM family_context;

SELECT 
  'Entries by source type:' as info,
  source_type,
  COUNT(*) as count
FROM family_context 
GROUP BY source_type; 