-- Simple test to see if user_context table works
-- Run this in Supabase SQL Editor

-- Check if table exists
SELECT 'user_context table exists:' as test;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_context'
) as exists;

-- Try simple insert
INSERT INTO user_context (
  family_member_id,
  raw_text,
  source_type,
  source_id,
  metadata
) VALUES (
  (SELECT id FROM family_members LIMIT 1),
  'Simple test context',
  'test',
  uuid_generate_v4(),
  '{}'
);

-- Check if it worked
SELECT COUNT(*) as count FROM user_context; 