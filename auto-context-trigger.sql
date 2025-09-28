-- Automatic context extraction triggers
-- Run this in Supabase SQL Editor

-- Function to extract context from a new post
CREATE OR REPLACE FUNCTION extract_post_context_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert context for the new post
  INSERT INTO user_context (
    user_id,
    family_member_id,
    raw_text,
    source_type,
    source_id,
    metadata
  )
  SELECT 
    fm.user_id,
    NEW.author_id,
    'Title: ' || SPLIT_PART(NEW.content, E'\n\n', 1) || E'\n' ||
    'Description: ' || ARRAY_TO_STRING(STRING_TO_ARRAY(NEW.content, E'\n\n')[2:], E'\n\n') || E'\n' ||
    'Author: ' || fm.full_name || ' (' || fm.relationship || ')' || E'\n' ||
    'Post Type: ' || NEW.post_type || E'\n' ||
    'Date: ' || NEW.created_at::date,
    'post',
    NEW.id,
    jsonb_build_object(
      'title', SPLIT_PART(NEW.content, E'\n\n', 1),
      'post_type', NEW.post_type,
      'date', NEW.created_at::date,
      'author', fm.full_name,
      'author_relationship', fm.relationship,
      'has_images', CASE WHEN NEW.image_urls IS NOT NULL THEN true ELSE false END,
      'image_count', COALESCE(array_length(NEW.image_urls, 1), 0)
    )
  FROM family_members fm
  WHERE fm.id = NEW.author_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to extract context from a new memory
CREATE OR REPLACE FUNCTION extract_memory_context_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert context for the new memory
  INSERT INTO user_context (
    user_id,
    family_member_id,
    raw_text,
    source_type,
    source_id,
    metadata
  )
  SELECT 
    fm.user_id,
    NEW.family_member_id,
    'Memory: ' || NEW.title || E'\n' ||
    'Description: ' || COALESCE(NEW.description, 'No description provided') || E'\n' ||
    'Subject: ' || fm.full_name || ' (' || fm.relationship || ')' || E'\n' ||
    'Date of Memory: ' || COALESCE(NEW.memory_date::text, 'Date not specified') || E'\n' ||
    'Tags: ' || COALESCE(array_to_string(NEW.tags, ', '), 'No tags'),
    'memory',
    NEW.id,
    jsonb_build_object(
      'title', NEW.title,
      'memory_date', NEW.memory_date,
      'subject', fm.full_name,
      'subject_relationship', fm.relationship,
      'tags', COALESCE(NEW.tags, '{}'),
      'is_favorite', NEW.is_favorite,
      'type', 'memory'
    )
  FROM family_members fm
  WHERE fm.id = NEW.family_member_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS auto_extract_post_context ON family_posts;
CREATE TRIGGER auto_extract_post_context
  AFTER INSERT ON family_posts
  FOR EACH ROW
  EXECUTE FUNCTION extract_post_context_trigger();

DROP TRIGGER IF EXISTS auto_extract_memory_context ON memories;
CREATE TRIGGER auto_extract_memory_context
  AFTER INSERT ON memories
  FOR EACH ROW
  EXECUTE FUNCTION extract_memory_context_trigger();

-- Test message
SELECT 'Auto context extraction triggers created successfully!' as status; 