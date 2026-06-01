-- V4: backfill demo project assignment metadata for existing rows

UPDATE projects
SET installer_email = 'installer.test@solarease.com'
WHERE installer_id = '00000000-0000-4000-8000-000000000002'
  AND installer_email IS NULL;

UPDATE projects
SET assigned_by_admin_id = '00000000-0000-4000-8000-000000000001',
    assigned_by_admin_email = 'admin@solarease.demo'
WHERE name = 'Démo admin — centrale bâtiment 10 kWc';