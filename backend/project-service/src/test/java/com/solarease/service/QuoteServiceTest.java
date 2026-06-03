package com.solarease.service;

import com.solarease.dto.QuoteDTO;
import com.solarease.entity.Project;
import com.solarease.entity.QuoteEntity;
import com.solarease.entity.QuoteSequence;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuoteServiceTest {

    @Mock private QuoteRepository quoteRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationWebSocketService notificationWebSocketService;
    @Mock private N8nInvoiceWebhookService n8nInvoiceWebhookService;
    @Mock private ClientRepository clientRepository;
    @Mock private QuoteSequenceRepository quoteSequenceRepository;
    @Mock private AccessControlService accessControlService;

    @InjectMocks private QuoteService quoteService;

    private Project project;
    private QuoteEntity draftQuote;

    @BeforeEach
    void setUp() {
        project = Project.builder().id(10L).clientId(5L).installerId("inst-1").name("Projet test").build();
        draftQuote = QuoteEntity.builder()
                .id(1L)
                .quoteNumber("DEV-2026-00001")
                .project(project)
                .clientId(5L)
                .installerId("inst-1")
                .status(QuoteEntity.QuoteStatus.DRAFT)
                .laborCost(BigDecimal.valueOf(1000))
                .materialsCost(BigDecimal.valueOf(2000))
                .tax(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(3000))
                .validUntil(LocalDateTime.now().plusDays(30))
                .build();
    }

    @Test
    void updateQuote_updatesDraftFields() {
        when(quoteRepository.findById(1L)).thenReturn(Optional.of(draftQuote));
        when(quoteRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        QuoteDTO patch = QuoteDTO.builder()
                .description("Updated")
                .laborCost(BigDecimal.valueOf(1200))
                .materialsCost(BigDecimal.valueOf(2000))
                .tax(BigDecimal.valueOf(100))
                .build();

        QuoteDTO result = quoteService.updateQuote(1L, "inst-1", "INSTALLER", patch);

        assertEquals("Updated", result.getDescription());
        assertEquals(0, BigDecimal.valueOf(3300).compareTo(result.getTotalAmount()));
    }

    @Test
    void acceptQuote_marksExpiredWhenPastValidUntil() {
        draftQuote.setStatus(QuoteEntity.QuoteStatus.SENT);
        draftQuote.setValidUntil(LocalDateTime.now().minusDays(1));
        when(quoteRepository.findById(1L)).thenReturn(Optional.of(draftQuote));
        when(quoteRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThrows(IllegalStateException.class, () -> quoteService.acceptQuote(1L, "5"));
        assertEquals(QuoteEntity.QuoteStatus.EXPIRED, draftQuote.getStatus());
    }

    @Test
    void generateQuoteNumber_usesSequence() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(quoteSequenceRepository.findByYearForUpdate(anyInt()))
                .thenReturn(Optional.of(QuoteSequence.builder().year(2026).lastNumber(41).build()));
        when(quoteRepository.save(any())).thenAnswer(inv -> {
            QuoteEntity q = inv.getArgument(0);
            q.setId(99L);
            return q;
        });

        QuoteDTO req = QuoteDTO.builder()
                .laborCost(BigDecimal.valueOf(500))
                .materialsCost(BigDecimal.valueOf(500))
                .tax(BigDecimal.ZERO)
                .build();

        QuoteDTO created = quoteService.createQuote(10L, "inst-1", "INSTALLER", req);
        assertTrue(created.getQuoteNumber().startsWith("DEV-"));
    }

    @Test
    void getQuoteById_throwsWhenMissing() {
        when(quoteRepository.findById(404L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> quoteService.getQuoteById(404L, "ADMIN", null, null));
    }
}
