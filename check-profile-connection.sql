-- Check the connection between family_members and profiles
-- Run this in Supabase SQL Editor

-- 1. See if profiles has a user_id field
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 2. Check if profiles.user_id matches family_members.user_id  
SELECT 'Checking profile connections:' as info;
SELECT p.id, p.full_name, p.user_id, p.avatar_url
FROM profiles p 
WHERE p.user_id IS NOT NULL
LIMIT 5;

-- 3. Try to match family_members with profiles by user_id
SELECT 'Matching family_members with profiles:' as info;
SELECT fm.full_name as family_name, fm.user_id, p.full_name as profile_name, p.avatar_url
FROM family_members fm
LEFT JOIN profiles p ON fm.user_id = p.user_id
WHERE fm.user_id IS NOT NULL
LIMIT 5; 