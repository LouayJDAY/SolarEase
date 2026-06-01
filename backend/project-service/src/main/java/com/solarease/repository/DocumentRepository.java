package com.solarease.repository;

import com.solarease.entity.DocumentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentEntity, Long> {

    List<DocumentEntity> findByClientId(String clientId);

    List<DocumentEntity> findByProject_Id(Long projectId);

    Page<DocumentEntity> findByClientId(String clientId, Pageable pageable);

    Page<DocumentEntity> findByInstallerId(String installerId, Pageable pageable);

    @Query("SELECT d FROM DocumentEntity d WHERE d.project.id = :projectId AND d.type = :type ORDER BY d.createdAt DESC")
    List<DocumentEntity> findByProjectIdAndType(
        @Param("projectId") Long projectId,
        @Param("type") DocumentEntity.DocumentType type
    );

    @Query("SELECT d FROM DocumentEntity d WHERE d.clientId = :clientId AND d.type = :type ORDER BY d.createdAt DESC")
    Page<DocumentEntity> findByClientIdAndType(
        @Param("clientId") String clientId,
        @Param("type") DocumentEntity.DocumentType type,
        Pageable pageable
    );

    @Query("SELECT d FROM DocumentEntity d WHERE d.installerId = :installerId AND d.type = :type ORDER BY d.createdAt DESC")
    Page<DocumentEntity> findByInstallerIdAndType(
        @Param("installerId") String installerId,
        @Param("type") DocumentEntity.DocumentType type,
        Pageable pageable
    );

    @Query("SELECT d FROM DocumentEntity d WHERE d.project.id = :projectId AND d.clientId = :clientId ORDER BY d.createdAt DESC")
    Page<DocumentEntity> findByProjectIdAndClientId(
        @Param("projectId") Long projectId,
        @Param("clientId") String clientId,
        Pageable pageable
    );

    long countByInstallerIdAndType(String installerId, DocumentEntity.DocumentType type);

    @Query("SELECT d FROM DocumentEntity d WHERE d.name LIKE %:name% ORDER BY d.createdAt DESC")
    Page<DocumentEntity> searchByName(@Param("name") String name, Pageable pageable);
}
