-- Debug and fix family_relationships table
-- Run this in Supabase SQL Editor

-- Check current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'family_relationships'
ORDER BY ordinal_position;

-- Check if there are any existing relationships
SELECT COUNT(*) as relationship_count FROM family_relationships;

-- Drop and recreate the table if there are issues
DROP TABLE IF EXISTS family_relationships CASCADE;

-- Recreate with correct structure
CREATE TABLE family_relationships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  person_1_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  person_2_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  relationship_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(person_1_id, person_2_id, relationship_type)
);

-- Add indexes
CREATE INDEX idx_family_relationships_person1 ON family_relationships(person_1_id);
CREATE INDEX idx_family_relationships_person2 ON family_relationships(person_2_id);

-- Enable RLS
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Users can access all family relationships" ON family_relationships 
FOR ALL TO authenticated USING (true);

-- Clean up the old redundant table
DROP TABLE IF EXISTS family_tree_connections CASCADE;

-- Verify the fix
SELECT 'family_relationships table recreated successfully' as status; 