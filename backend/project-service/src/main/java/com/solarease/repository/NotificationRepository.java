package com.solarease.repository;

import com.solarease.entity.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findByClientIdOrderByCreatedAtDesc(String clientId);

    void deleteByClientId(String clientId);
}
