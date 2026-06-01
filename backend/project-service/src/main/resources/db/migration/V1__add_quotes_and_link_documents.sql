-- Migration SQL for Quote/Devis System Implementation
-- This migration adds the quotes table and links invoices & documents to projects

-- 1. Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id BIGSERIAL PRIMARY KEY,
    quote_number VARCHAR(255) UNIQUE NOT NULL,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    client_id BIGINT NOT NULL,
    installer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    description TEXT,
    labor_cost NUMERIC(10, 2) NOT NULL,
    materials_cost NUMERIC(10, 2) NOT NULL,
    tax NUMERIC(10, 2),
    total_amount NUMERIC(10, 2) NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_installer_id ON quotes(installer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- 2. Alter invoices table to add project_id and installer_id
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS project_id BIGINT,
ADD COLUMN IF NOT EXISTS installer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_date DATE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS quote_id BIGINT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'DRAFT';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_project'
    ) THEN
        ALTER TABLE invoices
            ADD CONSTRAINT fk_invoices_project
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_installer_id ON invoices(installer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- 3. Alter documents table to add project_id, installer_id, and versioning
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS project_id BIGINT,
ADD COLUMN IF NOT EXISTS installer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS type VARCHAR(50);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_project'
    ) THEN
        ALTER TABLE documents
            ADD CONSTRAINT fk_documents_project
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_installer_id ON documents(installer_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- 4. Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_quotes_installer_status ON quotes(installer_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_client_status ON quotes(client_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_installer_status ON invoices(installer_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_status ON invoices(client_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_type_project ON documents(type, project_id);
