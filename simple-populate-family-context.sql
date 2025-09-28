-- Simple populate family_context script
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

-- 2. Add existing posts with simple text format
INSERT INTO family_context (
  raw_text,
  source_type,
  source_id,
  metadata,
  created_by
)
SELECT 
  fp.content,
  'post',
  fp.id,
  jsonb_build_object(
    'post_type', fp.post_type,
    'date', fp.created_at::date,
    'author', fm.full_name,
    'author_relationship', fm.relationship
  ),
  fp.author_id
FROM family_posts fp
JOIN family_members fm ON fp.author_id = fm.id
WHERE NOT EXISTS (
  SELECT 1 FROM family_context fc 
  WHERE fc.source_type = 'post' 
  AND fc.source_id = fp.id
);

-- 3. Show results
SELECT 'Family context populated!' as status;
SELECT COUNT(*) as total_entries FROM family_context;
SELECT source_type, COUNT(*) as count FROM family_context GROUP BY source_type; 