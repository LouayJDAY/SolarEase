package com.solarease.repository;

import com.solarease.entity.ClientInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClientInvitationRepository extends JpaRepository<ClientInvitation, Long> {

    Optional<ClientInvitation> findByToken(String token);

    Optional<ClientInvitation> findTopByDemandIdOrderBySentAtDesc(Long demandId);

    List<ClientInvitation> findByEmailAndUsedAtIsNullOrderBySentAtDesc(String email);
}
