-- Create demands table for the client → admin request workflow
-- Status: NOUVELLE | A_COMPLETER | VALIDEE | REJETEE

CREATE TABLE IF NOT EXISTS demands (
    id                BIGSERIAL PRIMARY KEY,
    client_user_id    VARCHAR(255) NOT NULL,
    client_email      VARCHAR(255),
    client_first_name VARCHAR(100),
    client_last_name  VARCHAR(100),
    status            VARCHAR(30)  NOT NULL DEFAULT 'NOUVELLE',
    name              VARCHAR(255),
    description       TEXT,
    location          VARCHAR(255),
    latitude          DOUBLE PRECISION,
    longitude         DOUBLE PRECISION,
    peak_power        DOUBLE PRECISION,
    available_area    DOUBLE PRECISION,
    inclination       DOUBLE PRECISION,
    orientation       DOUBLE PRECISION,
    budget            DOUBLE PRECISION,
    rejection_reason  TEXT,
    admin_note        TEXT,
    project_id        BIGINT,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demands_client_user_id ON demands(client_user_id);
CREATE INDEX IF NOT EXISTS idx_demands_status ON demands(status);
