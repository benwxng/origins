-- Test the connection between family_members and profiles
-- Run this in Supabase SQL Editor

-- Check if family_members.user_id matches profiles.id
SELECT 'Testing family_members → profiles connection:' as info;
SELECT 
  fm.full_name as family_name,
  fm.user_id,
  p.id as profile_id,
  p.full_name as profile_name,
  p.username,
  p.avatar_url,
  CASE 
    WHEN fm.user_id = p.id THEN 'MATCH' 
    ELSE 'NO MATCH' 
  END as connection_status
FROM family_members fm
FULL OUTER JOIN profiles p ON fm.user_id = p.id
WHERE fm.user_id IS NOT NULL OR p.id IS NOT NULL
ORDER BY connection_status DESC; 