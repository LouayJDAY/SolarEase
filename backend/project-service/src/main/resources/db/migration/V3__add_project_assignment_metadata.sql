-- V3: store installer and assigning-admin metadata on projects

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS installer_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS assigned_by_admin_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS assigned_by_admin_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_projects_assigned_by_admin_id ON projects(assigned_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_by_admin_email ON projects(assigned_by_admin_email);