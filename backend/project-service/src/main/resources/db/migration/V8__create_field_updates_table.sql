CREATE TABLE IF NOT EXISTS field_updates (
    id                        BIGSERIAL PRIMARY KEY,
    project_id                BIGINT       NOT NULL,
    installer_id              VARCHAR(255) NOT NULL,
    installer_email           VARCHAR(255),
    field_status              VARCHAR(30)  NOT NULL,
    progress_percent          INTEGER      DEFAULT 0,
    note                      TEXT,
    is_blockage               BOOLEAN      DEFAULT FALSE,
    blockage_reason           TEXT,
    requires_admin_validation BOOLEAN      DEFAULT FALSE,
    admin_validated           BOOLEAN,
    admin_note                TEXT,
    validated_by_admin_id     VARCHAR(255),
    validated_by_admin_email  VARCHAR(255),
    validated_at              TIMESTAMP,
    created_at                TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_updates_project_id   ON field_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_field_updates_installer_id ON field_updates(installer_id);

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS current_progress     INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS current_field_status VARCHAR(30);
