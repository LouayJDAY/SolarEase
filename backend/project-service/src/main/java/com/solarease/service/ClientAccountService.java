package com.solarease.service;

import com.solarease.dto.LinkAccountRequest;
import com.solarease.entity.Client;
import com.solarease.entity.ClientInvitation;
import com.solarease.entity.DemandEntity;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientInvitationRepository;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.DemandRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClientAccountService {

    private final ClientRepository clientRepository;
    private final ClientInvitationRepository invitationRepository;
    private final DemandRepository demandRepository;

    @Transactional
    public void linkAccount(LinkAccountRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        String userId = request.getUserId().trim();

        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client profile not found for email: " + email));

        if (client.getUserId() != null && !client.getUserId().isBlank()
                && !client.getUserId().equals(userId)) {
            throw new IllegalArgumentException("This client profile is already linked to another account");
        }

        client.setUserId(userId);
        clientRepository.save(client);

        if (request.getInvitationToken() != null && !request.getInvitationToken().isBlank()) {
            ClientInvitation invitation = invitationRepository.findByToken(request.getInvitationToken())
                    .orElseThrow(() -> new ResourceNotFoundException("Invitation token not found"));
            if (!invitation.getEmail().equalsIgnoreCase(email)) {
                throw new IllegalArgumentException("Invitation token does not match email");
            }
            if (invitation.isExpired()) {
                throw new IllegalArgumentException("Invitation token has expired");
            }
            if (!invitation.isUsed()) {
                invitation.setUsedAt(LocalDateTime.now());
                invitationRepository.save(invitation);
            }
        } else {
            invitationRepository.findByEmailAndUsedAtIsNullOrderBySentAtDesc(email).stream()
                    .findFirst()
                    .ifPresent(inv -> {
                        inv.setUsedAt(LocalDateTime.now());
                        invitationRepository.save(inv);
                    });
        }

        List<DemandEntity> demands = demandRepository.findByClientEmailIgnoreCase(email);
        for (DemandEntity demand : demands) {
            if (demand.getClientUserId() != null && demand.getClientUserId().startsWith("PUBLIC:")) {
                demand.setClientUserId(userId);
            }
        }
        demandRepository.saveAll(demands);

        log.info("Linked client {} to user {} ({} demand rows updated)", client.getId(), userId, demands.size());
    }
}
