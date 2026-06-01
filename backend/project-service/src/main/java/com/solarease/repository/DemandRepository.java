package com.solarease.repository;

import com.solarease.entity.DemandEntity;
import com.solarease.enums.DemandSource;
import com.solarease.enums.DemandStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface DemandRepository extends JpaRepository<DemandEntity, Long> {

    Page<DemandEntity> findByClientUserId(String clientUserId, Pageable pageable);

    Page<DemandEntity> findByStatus(DemandStatus status, Pageable pageable);

    long countByStatus(DemandStatus status);

    long countByCreatedAtAfter(LocalDateTime since);

    /**
     * Combined search for the admin Inbox. All filters are optional and applied
     * conjunctively. The text search is case-insensitive and matches against
     * name, description, client email and phone.
     */
    @Query("""
        SELECT d FROM DemandEntity d
        WHERE (:status IS NULL OR d.status = :status)
          AND (:source IS NULL OR d.source = :source)
          AND (
                :q IS NULL
             OR LOWER(CAST(d.name           AS string)) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))
             OR LOWER(CAST(d.description    AS string)) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))
             OR LOWER(CAST(d.clientEmail    AS string)) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))
             OR LOWER(CAST(d.clientPhone    AS string)) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))
             OR LOWER(CAST(d.clientFirstName AS string)) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))
             OR LOWER(CAST(d.clientLastName AS string)) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))
          )
        """)
    Page<DemandEntity> search(
            @Param("status") DemandStatus status,
            @Param("source") DemandSource source,
            @Param("q") String q,
            Pageable pageable);
}
