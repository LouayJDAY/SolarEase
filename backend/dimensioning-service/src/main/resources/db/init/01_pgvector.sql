-- Auto-executed on first PostgreSQL boot by docker-entrypoint-initdb.d.
-- Enables pgvector (required by knowledge_chunks.embedding) before Hibernate
-- runs ddl-auto, otherwise the column type `vector(768)` cannot be created.
CREATE EXTENSION IF NOT EXISTS vector;
