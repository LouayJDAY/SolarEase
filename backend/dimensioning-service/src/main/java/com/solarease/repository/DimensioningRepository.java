package com.solarease.repository;

import com.solarease.entity.Dimensioning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DimensioningRepository extends JpaRepository<Dimensioning, Long> {
    List<Dimensioning> findByProjectId(Long projectId);
}
