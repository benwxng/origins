-- Check database structure and identify issues
-- Run this in Supabase SQL Editor

-- 1. Check if family_relationships table exists and its structure
SELECT 'family_relationships table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'family_relationships'
ORDER BY ordinal_position;

-- 2. Check if family_tree_connections still exists
SELECT 'Checking for family_tree_connections:' as info;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'family_tree_connections'
) as table_exists;

-- 3. Check family_members table structure
SELECT 'family_members table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'family_members'
ORDER BY ordinal_position;

-- 4. Check current data in tables
SELECT 'Current family_members count:' as info;
SELECT COUNT(*) as count FROM family_members;

SELECT 'Current family_relationships count:' as info;
SELECT COUNT(*) as count FROM family_relationships;

-- 5. Show sample data
SELECT 'Sample family_members:' as info;
SELECT id, full_name, relationship, user_id FROM family_members LIMIT 5;

SELECT 'Sample family_relationships:' as info;
SELECT * FROM family_relationships LIMIT 5; 