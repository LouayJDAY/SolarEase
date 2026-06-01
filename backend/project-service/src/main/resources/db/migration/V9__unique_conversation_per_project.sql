-- V9: Enforce one conversation per project.
-- Step 1: Re-point messages from duplicate conversations to the oldest one.
-- Step 2: Delete the duplicate conversations.
-- Step 3: Add a unique partial index to prevent future duplicates.

DO $$
DECLARE
    dup RECORD;
    keep_id BIGINT;
BEGIN
    -- Find each project that has more than one conversation
    FOR dup IN
        SELECT project_id
        FROM conversation_entity
        WHERE project_id IS NOT NULL
        GROUP BY project_id
        HAVING COUNT(*) > 1
    LOOP
        -- Identify the conversation to keep (oldest = lowest id)
        SELECT MIN(id) INTO keep_id
        FROM conversation_entity
        WHERE project_id = dup.project_id;

        -- Re-point all messages from other conversations to the keeper
        UPDATE message_entity
        SET conversation_id = keep_id
        WHERE conversation_id IN (
            SELECT id FROM conversation_entity
            WHERE project_id = dup.project_id AND id <> keep_id
        );

        -- Delete the now-empty duplicate conversations
        DELETE FROM conversation_entity
        WHERE project_id = dup.project_id AND id <> keep_id;
    END LOOP;
END $$;

-- Prevent future duplicates: one conversation per project (NULLs excluded)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_unique_project
    ON conversation_entity(project_id)
    WHERE project_id IS NOT NULL;
