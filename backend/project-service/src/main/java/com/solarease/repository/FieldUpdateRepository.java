package com.solarease.repository;

import com.solarease.entity.FieldUpdateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FieldUpdateRepository extends JpaRepository<FieldUpdateEntity, Long> {

    List<FieldUpdateEntity> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    Optional<FieldUpdateEntity> findFirstByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<FieldUpdateEntity> findByProjectIdAndRequiresAdminValidationTrue(Long projectId);
}
