package com.solarease.repository;

import com.solarease.entity.OtpToken;
import com.solarease.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findByOtpCode(String otpCode);

    Optional<OtpToken> findTopByUserAndIsUsedFalseOrderByCreatedAtDesc(User user);

    @Modifying
    @Query("UPDATE OtpToken o SET o.isUsed = true WHERE o.user = :user AND o.isUsed = false")
    int invalidateUnusedOtpsForUser(@Param("user") User user);
}
