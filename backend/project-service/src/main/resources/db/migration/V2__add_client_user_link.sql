-- V2: Link Client (project-service) to User (identity-service) via userId UUID
-- This allows authenticated CLIENT users to find their projects using their JWT sub/uuid

ALTER TABLE items_client
    ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) UNIQUE;

-- Ensure notifications table uses LocalDateTime (not timestamp with tz issues)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE notifications
            ALTER COLUMN created_at TYPE TIMESTAMP;
    END IF;
END $$;

-- Add index to speed up userId lookups
CREATE INDEX IF NOT EXISTS idx_client_user_id ON items_client(user_id);

-- Add project_id to notifications for better filtering (guarded)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE notifications
            ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL;

        -- Add installer_id to notifications so installers can also receive notifications
        ALTER TABLE notifications
            ADD COLUMN IF NOT EXISTS installer_id VARCHAR(255);

        CREATE INDEX IF NOT EXISTS idx_notifications_installer_id ON notifications(installer_id);
    END IF;
END $$;
