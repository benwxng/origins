-- Fix user_context table to allow null user_id
-- Run this in Supabase SQL Editor

-- Remove the NOT NULL constraint from user_id
ALTER TABLE user_context ALTER COLUMN user_id DROP NOT NULL;

-- Test the fix by inserting a context entry without user_id
INSERT INTO user_context (
  family_member_id, 
  raw_text,
  source_type,
  source_id,
  metadata
) VALUES (
  (SELECT id FROM family_members WHERE full_name = 'David Johnson' LIMIT 1),
  'Test context for sample family member',
  'test',
  uuid_generate_v4(),
  '{}'::jsonb
);

-- Verify it worked
SELECT 'Fixed user_context table - test insert successful' as status;
SELECT COUNT(*) as total_context_entries FROM user_context; 