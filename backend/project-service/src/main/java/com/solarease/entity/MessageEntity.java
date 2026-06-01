package com.solarease.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MessageEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    private ConversationEntity conversation;

    private String senderId;
    private String senderName;
    private String senderRole;
    @ElementCollection
    @CollectionTable(name = "message_entity_recipient_roles", joinColumns = @JoinColumn(name = "message_id"))
    @Column(name = "recipient_role")
    private List<String> recipientRoles = new ArrayList<>();
    @Lob
    private String content;
    private Instant timestamp;
}
