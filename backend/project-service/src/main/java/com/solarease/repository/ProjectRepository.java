package com.solarease.repository;

import com.solarease.entity.Project;
import com.solarease.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByClientId(Long clientId);

    Page<Project> findByInstallerId(String installerId, Pageable pageable);

    Page<Project> findByInstallerIdAndStatus(String installerId, ProjectStatus status, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE p.installerId = :installerId " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (:search IS NULL OR LOWER(CAST(p.name AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "     OR LOWER(CAST(p.description AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "     OR LOWER(CAST(p.location AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Project> findByInstallerIdWithFilters(
            @Param("installerId") String installerId,
            @Param("status") ProjectStatus status,
            @Param("search") String search,
            Pageable pageable);

    long countByInstallerIdAndStatus(String installerId, ProjectStatus status);

    long countByInstallerId(String installerId);

    @Query("SELECT COUNT(DISTINCT p.clientId) FROM Project p WHERE p.installerId = :installerId")
    long countDistinctClientsByInstallerId(@Param("installerId") String installerId);
}
