package com.solarease.repository;

import com.solarease.entity.OtpToken;
import com.solarease.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findByOtpCode(String otpCode);
    Optional<OtpToken> findByUserAndIsUsedFalse(User user);
}
