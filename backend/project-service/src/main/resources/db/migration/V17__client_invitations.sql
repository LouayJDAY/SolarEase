CREATE TABLE IF NOT EXISTS client_invitations (
    id          BIGSERIAL PRIMARY KEY,
    token       VARCHAR(36)  NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL,
    client_id   BIGINT       NOT NULL,
    project_id  BIGINT,
    demand_id   BIGINT,
    expires_at  TIMESTAMP    NOT NULL,
    sent_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    used_at     TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON client_invitations(email);
CREATE INDEX IF NOT EXISTS idx_client_invitations_demand ON client_invitations(demand_id);
