-- Enrich field_updates for the improved installer tracking workflow:
-- checklist of installation phases (auto-computed progress), structured
-- blockage typing, and an optional photo per update.

ALTER TABLE field_updates
    ADD COLUMN IF NOT EXISTS completed_steps  TEXT,
    ADD COLUMN IF NOT EXISTS current_phase    VARCHAR(30),
    ADD COLUMN IF NOT EXISTS blockage_type    VARCHAR(30),
    ADD COLUMN IF NOT EXISTS blockage_impact  VARCHAR(20),
    ADD COLUMN IF NOT EXISTS photo_url        TEXT;

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS current_phase VARCHAR(30);
