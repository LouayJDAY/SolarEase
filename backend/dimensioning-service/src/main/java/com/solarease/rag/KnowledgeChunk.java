package com.solarease.rag;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * In-memory representation of a row from the {@code knowledge_chunks} table.
 *
 * Each chunk is a piece of indexable text (an equipment description, a sizing
 * rule, a regulation snippet) with optional metadata used to filter retrieval
 * (phase, power range, brand, ...).
 *
 * The {@code embedding} is the pgvector representation produced by the
 * configured embedding model. It is intentionally not exposed as a Java type
 * outside of {@link KnowledgeChunkRepository}; only the textual content and
 * metadata are needed by the rest of the pipeline.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeChunk {

    private Long id;

    /** EQUIPMENT, SIZING_RULE, REGULATION, BEST_PRACTICE. */
    private String sourceType;

    /** Optional FK to {@code equipments.id} when the chunk describes a product. */
    private Long equipmentId;

    /** Plain text content used both for embedding and prompt augmentation. */
    private String content;

    /** Free-form filtering metadata stored as JSONB (phase, min_kw, max_kw, ...). */
    private Map<String, Object> metadata;

    /**
     * Cosine distance returned by pgvector during similarity search.
     * Only populated by {@link KnowledgeChunkRepository#search(float[], int, Map)}.
     */
    private Double distance;
}
