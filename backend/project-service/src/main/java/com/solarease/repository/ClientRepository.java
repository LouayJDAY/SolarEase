package com.solarease.repository;

import com.solarease.entity.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    Optional<Client> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<Client> findByInstallerId(String installerId, Pageable pageable);

    @Query("SELECT c FROM Client c WHERE c.installerId = :installerId " +
           "AND (:search IS NULL OR LOWER(CAST(c.firstName AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "     OR LOWER(CAST(c.lastName AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "     OR LOWER(CAST(c.email AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Client> findByInstallerIdWithSearch(
            @Param("installerId") String installerId,
            @Param("search") String search,
            Pageable pageable);

    long countByInstallerId(String installerId);
}
