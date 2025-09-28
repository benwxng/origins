-- Test context table insertion
-- Run this in Supabase SQL Editor

-- 1. Check if context tables exist
SELECT 'user_context table exists:' as info;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_context'
) as table_exists;

-- 2. Check table structure
SELECT 'user_context table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_context'
ORDER BY ordinal_position;

-- 3. Check current data
SELECT 'Current user_context count:' as info;
SELECT COUNT(*) as count FROM user_context;

-- 4. Try a simple insert test
INSERT INTO user_context (
  user_id,
  family_member_id, 
  raw_text,
  source_type,
  source_id,
  metadata
) VALUES (
  (SELECT user_id FROM family_members LIMIT 1),
  (SELECT id FROM family_members LIMIT 1),
  'Test context entry',
  'test',
  uuid_generate_v4(),
  '{}'::jsonb
);

-- 5. Check if insert worked
SELECT 'After test insert:' as info;
SELECT COUNT(*) as count FROM user_context; 