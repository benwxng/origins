-- Check recent posts to see how they're being created
SELECT 
  id,
  content,
  post_type,
  created_at,
  author_id
FROM family_posts 
ORDER BY created_at DESC 
LIMIT 5; 