-- Live Stream Database Migration
-- Purpose: Add optional is_answered column for question marking
-- This allows instructors to mark student questions as answered

BEGIN;

-- Add is_answered column to chat_messages table
-- Used by QuestionsPanel to filter and display answered/unanswered questions
ALTER TABLE chat_messages 
ADD COLUMN is_answered BOOLEAN DEFAULT FALSE;

-- Add index for faster filtering on questions tab
CREATE INDEX idx_chat_messages_is_answered 
ON chat_messages(live_stream_id, type, is_answered);

-- Verify the migration
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'chat_messages' AND column_name = 'is_answered';

COMMIT;

-- If you need to rollback:
-- BEGIN;
-- DROP INDEX idx_chat_messages_is_answered;
-- ALTER TABLE chat_messages DROP COLUMN is_answered;
-- COMMIT;
