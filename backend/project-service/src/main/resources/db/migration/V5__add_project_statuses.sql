-- Add new project status values for the admin-client process workflow
-- EN_PREPARATION: quote accepted, project ready to start
-- INSTALLATEUR_AFFECTE: installer has been assigned to the project

-- Postgres uses VARCHAR for enum stored as STRING in JPA — no ALTER TYPE needed.
-- The new values (EN_PREPARATION, INSTALLATEUR_AFFECTE) are handled purely by JPA/Java enum.
-- This migration is a no-op SQL but documents the intent and keeps Flyway versioning consistent.

-- If the project table used a native DB enum type, we would run:
--   ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'EN_PREPARATION';
--   ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'INSTALLATEUR_AFFECTE';
-- Since status is stored as VARCHAR (EnumType.STRING), no DDL change is required.

SELECT 1; -- no-op placeholder
