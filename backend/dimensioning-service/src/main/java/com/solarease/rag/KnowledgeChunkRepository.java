package com.solarease.rag;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pgvector.PGvector;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Direct JDBC access layer for the {@code knowledge_chunks} pgvector table.
 *
 * <p>JDBC is preferred over JPA here because pgvector's column type
 * ({@code vector(N)}) requires the {@link PGvector} binding registered through
 * {@link PGvector#addVectorType(java.sql.Connection)}, which is awkward to
 * surface through Hibernate.</p>
 *
 * <p>Schema is created idempotently at startup so the service stays compatible
 * with the existing {@code spring.jpa.hibernate.ddl-auto=update} setup.</p>
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class KnowledgeChunkRepository {

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ollama.embedding-dimension:768}")
    private int embeddingDimension;

    @PostConstruct
    public void initSchema() {
        // Extension is normally created by docker-entrypoint-initdb.d but we
        // run it again so that running outside Docker (CI, local Postgres)
        // also works as long as the role has CREATE EXTENSION privilege.
        try {
            jdbc.execute("CREATE EXTENSION IF NOT EXISTS vector");
        } catch (Exception e) {
            log.warn("Could not ensure pgvector extension (may already exist or "
                    + "lack privilege): {}", e.getMessage());
        }

        jdbc.execute(String.format(
                "CREATE TABLE IF NOT EXISTS knowledge_chunks ("
                        + "  id BIGSERIAL PRIMARY KEY,"
                        + "  source_type VARCHAR(32) NOT NULL,"
                        + "  equipment_id BIGINT,"
                        + "  content TEXT NOT NULL,"
                        + "  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,"
                        + "  embedding vector(%d),"
                        + "  created_at TIMESTAMP NOT NULL DEFAULT now()"
                        + ")", embeddingDimension));

        jdbc.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_metadata "
                + "ON knowledge_chunks USING GIN (metadata)");

        // Cosine-distance IVFFLAT index. Only created when there is some data to
        // train on; pgvector requires `lists` and a non-empty table for ANALYZE
        // to be useful, so we attempt it but ignore errors on empty tables.
        try {
            jdbc.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding "
                    + "ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) "
                    + "WITH (lists = 100)");
        } catch (Exception e) {
            log.warn("Could not create ivfflat index (will be retried later): {}",
                    e.getMessage());
        }
    }

    /** Removes every chunk; used by the indexer before a full rebuild. */
    public void deleteAll() {
        jdbc.update("DELETE FROM knowledge_chunks");
    }

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM knowledge_chunks", Long.class);
        return c != null ? c : 0L;
    }

    /** Inserts a chunk together with its precomputed embedding. */
    public void insert(KnowledgeChunk chunk, float[] embedding) {
        PGobject metadataJson = toJsonb(chunk.getMetadata());
        PGvector vector = new PGvector(embedding);
        jdbc.update(
                "INSERT INTO knowledge_chunks "
                        + "(source_type, equipment_id, content, metadata, embedding) "
                        + "VALUES (?, ?, ?, ?, ?)",
                chunk.getSourceType(),
                chunk.getEquipmentId(),
                chunk.getContent(),
                metadataJson,
                vector);
    }

    /**
     * Cosine-similarity search.
     *
     * @param queryEmbedding query vector (must match {@link #embeddingDimension})
     * @param topK          number of chunks to return
     * @param filters       optional metadata filters (string equality on JSONB keys)
     */
    public List<KnowledgeChunk> search(float[] queryEmbedding, int topK,
                                       Map<String, String> filters) {
        StringBuilder sql = new StringBuilder(
                "SELECT id, source_type, equipment_id, content, metadata, "
                        + "       embedding <=> ? AS distance "
                        + "FROM knowledge_chunks WHERE TRUE");

        List<Object> params = new ArrayList<>();
        params.add(new PGvector(queryEmbedding));

        if (filters != null) {
            for (Map.Entry<String, String> entry : filters.entrySet()) {
                if (entry.getValue() == null) {
                    continue;
                }
                sql.append(" AND metadata->>? = ?");
                params.add(entry.getKey());
                params.add(entry.getValue());
            }
        }

        sql.append(" ORDER BY embedding <=> ? LIMIT ?");
        params.add(new PGvector(queryEmbedding));
        params.add(topK);

        return jdbc.query(sql.toString(), chunkRowMapper(), params.toArray());
    }

    private RowMapper<KnowledgeChunk> chunkRowMapper() {
        return (rs, rowNum) -> KnowledgeChunk.builder()
                .id(rs.getLong("id"))
                .sourceType(rs.getString("source_type"))
                .equipmentId((Long) rs.getObject("equipment_id"))
                .content(rs.getString("content"))
                .metadata(parseJsonb(rs.getString("metadata")))
                .distance(rs.getObject("distance") == null ? null : rs.getDouble("distance"))
                .build();
    }

    private PGobject toJsonb(Map<String, Object> metadata) {
        try {
            PGobject obj = new PGobject();
            obj.setType("jsonb");
            obj.setValue(objectMapper.writeValueAsString(
                    metadata != null ? metadata : Map.of()));
            return obj;
        } catch (SQLException | JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize chunk metadata", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonb(String raw) {
        if (raw == null || raw.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(raw, Map.class);
        } catch (JsonProcessingException e) {
            log.warn("Could not parse chunk metadata: {}", raw, e);
            return Map.of();
        }
    }
}
