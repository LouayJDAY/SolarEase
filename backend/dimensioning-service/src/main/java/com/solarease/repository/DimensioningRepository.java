package com.solarease.repository;

import com.solarease.entity.Dimensioning;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DimensioningRepository extends JpaRepository<Dimensioning, Long> {
    @EntityGraph(attributePaths = {"panel", "inverter", "solarInstallation", "roofCharacteristic"})
    List<Dimensioning> findByProjectIdOrderByCreatedAtDesc(Long projectId);
}
