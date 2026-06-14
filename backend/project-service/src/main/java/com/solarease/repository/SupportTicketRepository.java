package com.solarease.repository;

import com.solarease.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    List<SupportTicket> findByClientUserIdOrderByCreatedAtDesc(String clientUserId);

    List<SupportTicket> findAllByOrderByCreatedAtDesc();

    long countByStatus(com.solarease.enums.SupportTicketStatus status);

    Optional<SupportTicket> findByIdAndClientUserId(Long id, String clientUserId);

    void deleteByClientUserId(String clientUserId);
}
