package com.solarease.repository;

import com.solarease.entity.InvoiceEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<InvoiceEntity, Long> {

    List<InvoiceEntity> findByClientId(String clientId);

    List<InvoiceEntity> findByClientIdIn(List<String> clientIds);

    Page<InvoiceEntity> findByClientId(String clientId, Pageable pageable);

    Page<InvoiceEntity> findByClientIdIn(List<String> clientIds, Pageable pageable);

    List<InvoiceEntity> findByProject_Id(Long projectId);

    Page<InvoiceEntity> findByInstallerId(String installerId, Pageable pageable);

    Optional<InvoiceEntity> findByNumber(String number);

    Optional<InvoiceEntity> findByQuoteId(Long quoteId);

    @Query("SELECT i FROM InvoiceEntity i WHERE i.clientId = :clientId AND i.status = :status")
    Page<InvoiceEntity> findByClientIdAndStatus(
        @Param("clientId") String clientId,
        @Param("status") InvoiceEntity.InvoiceStatus status,
        Pageable pageable
    );

    @Query("SELECT i FROM InvoiceEntity i WHERE i.installerId = :installerId AND i.status = :status")
    Page<InvoiceEntity> findByInstallerIdAndStatus(
        @Param("installerId") String installerId,
        @Param("status") InvoiceEntity.InvoiceStatus status,
        Pageable pageable
    );

    @Query("SELECT i FROM InvoiceEntity i WHERE i.clientId = :clientId AND i.dueDate < CURRENT_DATE AND i.status != 'PAID'")
    List<InvoiceEntity> findOverdueInvoicesByClientId(@Param("clientId") String clientId);

    @Query("SELECT i FROM InvoiceEntity i WHERE i.project.id = :projectId AND i.status = :status")
    List<InvoiceEntity> findByProjectIdAndStatus(
        @Param("projectId") Long projectId,
        @Param("status") InvoiceEntity.InvoiceStatus status
    );

    long countByInstallerIdAndStatus(String installerId, InvoiceEntity.InvoiceStatus status);
}
