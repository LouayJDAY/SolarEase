-- =============================================================================
-- Align the demands table with the entity & enable the admin Inbox features:
--   - client_phone column (was added at runtime via ddl-auto, formalised here)
--   - source           : PUBLIC (anonymous contact form) | CLIENT (portal)
--   - priority         : HAUTE | NORMALE | BASSE
--   - assigned_admin_id: admin who self-assigned the demand
--   - FK to projects(id) (soft via ON DELETE SET NULL — no cascade delete)
--   - indexes for the admin Inbox list view (sort by created_at, filter by source)
-- =============================================================================

ALTER TABLE demands
    ADD COLUMN IF NOT EXISTS client_phone     VARCHAR(30),
    ADD COLUMN IF NOT EXISTS source           VARCHAR(20) NOT NULL DEFAULT 'CLIENT',
    ADD COLUMN IF NOT EXISTS priority         VARCHAR(10) NOT NULL DEFAULT 'NORMALE',
    ADD COLUMN IF NOT EXISTS assigned_admin_id VARCHAR(255);

-- Backfill historic public submissions (clientUserId prefix is the only marker we have)
UPDATE demands
SET source = 'PUBLIC'
WHERE source = 'CLIENT' AND client_user_id LIKE 'PUBLIC:%';

-- Soft FK -- a project can survive its source demand being deleted
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_demands_project'
          AND table_name = 'demands'
    ) THEN
        ALTER TABLE demands
            ADD CONSTRAINT fk_demands_project
            FOREIGN KEY (project_id) REFERENCES projects(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_demands_created_at ON demands(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demands_source     ON demands(source);
CREATE INDEX IF NOT EXISTS idx_demands_assigned   ON demands(assigned_admin_id);
