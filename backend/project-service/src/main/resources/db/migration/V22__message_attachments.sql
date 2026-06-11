ALTER TABLE message_entity
    ADD COLUMN IF NOT EXISTS attachment_file_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS attachment_original_name VARCHAR(512),
    ADD COLUMN IF NOT EXISTS attachment_content_type VARCHAR(128),
    ADD COLUMN IF NOT EXISTS attachment_size_bytes BIGINT;
