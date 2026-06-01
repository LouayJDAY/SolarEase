package com.solarease.repository;

import com.solarease.entity.ConversationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<ConversationEntity, Long> {
    List<ConversationEntity> findByClientId(String clientId);
    List<ConversationEntity> findByClientIdAndProjectId(String clientId, Long projectId);
    List<ConversationEntity> findByProjectId(Long projectId);
    
    /**
     * Get or create the unique conversation for a project.
     * Due to migration V9 unique index, there can be at most one conversation per projectId.
     */
    Optional<ConversationEntity> findFirstByProjectId(Long projectId);
}
