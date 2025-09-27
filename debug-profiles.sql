-- Debug profile pictures issue
-- Run this in Supabase SQL Editor

-- 1. Check if profiles table exists
SELECT 'Profiles table exists:' as info;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'profiles'
) as table_exists;

-- 2. Check profiles table structure
SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check current data in profiles table
SELECT 'Current profiles count:' as info;
SELECT COUNT(*) as count FROM profiles;

-- 4. Show sample profile data
SELECT 'Sample profiles data:' as info;
SELECT id, full_name, username, avatar_url FROM profiles LIMIT 5;

-- 5. Check family_members vs profiles relationship
SELECT 'Family members with user_id:' as info;
SELECT fm.id, fm.full_name, fm.user_id, p.avatar_url, p.username
FROM family_members fm
LEFT JOIN profiles p ON fm.user_id = p.id
LIMIT 5; 