-- Replace the legacy `projects_status_check` CHECK constraint (which only allows the 4 original
-- status values) with one that accepts all 6 values defined in ProjectStatus enum.
-- V5 intended this change but was authored as a no-op assuming no CHECK existed; Hibernate's
-- ddl-auto=update had implicitly created one from the original enum at first run.

ALTER TABLE projects
    DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects
    ADD CONSTRAINT projects_status_check
    CHECK (status IN (
        'CREATED',
        'EN_PREPARATION',
        'INSTALLATEUR_AFFECTE',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED'
    ));
