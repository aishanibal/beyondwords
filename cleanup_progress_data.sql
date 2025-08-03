-- Clean up corrupted progress_data entries
-- This script removes progress_data that contains "[object Object]" or other invalid JSON

UPDATE conversations 
SET progress_data = NULL 
WHERE progress_data = '[object Object]' 
   OR progress_data = 'null' 
   OR progress_data = 'undefined'
   OR progress_data = '';

-- Also clean up any progress_data that doesn't start with '{' (not valid JSON)
UPDATE conversations 
SET progress_data = NULL 
WHERE progress_data IS NOT NULL 
   AND progress_data != '' 
   AND progress_data NOT LIKE '{%';

-- Show the cleanup results
SELECT 
  id,
  title,
  progress_data,
  CASE 
    WHEN progress_data IS NULL THEN 'NULL'
    WHEN progress_data = '' THEN 'EMPTY'
    WHEN progress_data = '[object Object]' THEN 'CORRUPTED'
    WHEN progress_data LIKE '{%' THEN 'VALID_JSON'
    ELSE 'INVALID_FORMAT'
  END as status
FROM conversations 
ORDER BY updated_at DESC; 