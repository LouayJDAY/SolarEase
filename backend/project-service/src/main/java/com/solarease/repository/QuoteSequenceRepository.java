package com.solarease.repository;

import com.solarease.entity.QuoteSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface QuoteSequenceRepository extends JpaRepository<QuoteSequence, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM QuoteSequence s WHERE s.year = :year")
    Optional<QuoteSequence> findByYearForUpdate(@Param("year") Integer year);
}
