package com.solarease.repository;

import com.solarease.entity.QuoteEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuoteRepository extends JpaRepository<QuoteEntity, Long> {

    /**
     * Find a quote by its unique quote number
     */
    Optional<QuoteEntity> findByQuoteNumber(String quoteNumber);

    /**
     * Find all quotes for a specific project
     */
    List<QuoteEntity> findByProject_Id(Long projectId);

    /**
     * Find all quotes for a specific client (paginated)
     */
    Page<QuoteEntity> findByClientId(Long clientId, Pageable pageable);

    /**
     * Find all quotes for a specific installer (paginated)
     */
    Page<QuoteEntity> findByInstallerId(String installerId, Pageable pageable);

    /**
     * Find all quotes for a project with a specific status
     */
    List<QuoteEntity> findByProject_IdAndStatus(Long projectId, QuoteEntity.QuoteStatus status);

    /**
     * Find all quotes for an installer with a specific status (paginated)
     */
    @Query("SELECT q FROM QuoteEntity q WHERE q.installerId = :installerId AND q.status = :status")
    Page<QuoteEntity> findByInstallerIdAndStatus(
        @Param("installerId") String installerId,
        @Param("status") QuoteEntity.QuoteStatus status,
        Pageable pageable
    );

    /**
     * Find all quotes for a client with a specific status (paginated)
     */
    @Query("SELECT q FROM QuoteEntity q WHERE q.clientId = :clientId AND q.status = :status")
    Page<QuoteEntity> findByClientIdAndStatus(
        @Param("clientId") Long clientId,
        @Param("status") QuoteEntity.QuoteStatus status,
        Pageable pageable
    );

    /**
     * Find all quotes created by an installer for a specific client (paginated)
     */
    @Query("SELECT q FROM QuoteEntity q WHERE q.installerId = :installerId AND q.clientId = :clientId ORDER BY q.createdAt DESC")
    Page<QuoteEntity> findByInstallerIdAndClientId(
        @Param("installerId") String installerId,
        @Param("clientId") Long clientId,
        Pageable pageable
    );

    /**
     * Find all active quotes (SENT or ACCEPTED) for a project
     */
    @Query("SELECT q FROM QuoteEntity q WHERE q.project.id = :projectId AND q.status IN ('SENT', 'ACCEPTED') ORDER BY q.createdAt DESC")
    List<QuoteEntity> findActiveQuotesByProjectId(@Param("projectId") Long projectId);

    /**
     * Count quotes by status
     */
    long countByInstallerIdAndStatus(String installerId, QuoteEntity.QuoteStatus status);
}
