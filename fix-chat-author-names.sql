-- Update existing chat_messages with author_name and author_avatar from users table
-- Run this once to populate missing author data

UPDATE chat_messages cm
SET 
    author_name = u.name,
    author_avatar = u.avatar
FROM users u
WHERE cm.user_id = u.id
    AND (cm.author_name IS NULL OR cm.author_name = '');

-- Verify the update
SELECT 
    COUNT(*) as total_messages,
    COUNT(author_name) as messages_with_names,
    COUNT(*) - COUNT(author_name) as messages_without_names
FROM chat_messages;
