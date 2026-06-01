-- Backfill client_id on conversation_entity rows where it is NULL but the linked project has a known client user.
-- Joins: conversation_entity -> projects -> clients to resolve the user_id (which is the identity-service userId).

UPDATE conversation_entity c
SET client_id = cl.user_id
FROM projects p
JOIN items_client cl ON cl.id = p.client_id
WHERE c.project_id = p.id
  AND c.client_id IS NULL
  AND cl.user_id IS NOT NULL
  AND cl.user_id <> '';
