package com.solarease.service;

import com.solarease.dto.DimensioningResponse;
import com.solarease.dto.FinancialMetrics;
import com.solarease.entity.SolarInstallation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class DecisionSupportService {

    private final OllamaService ollamaService;

    /**
     * This method performs a RAG (Retrieval-Augmented Generation) process using Ollama.
     * 1. RETRIEVAL: Fetches relevant regulatory/technical context based on the project size.
     * 2. AUGMENTATION: Combines the context with the calculation data.
     * 3. GENERATION: Calls Ollama (Mistral) to generate an expert recommendation.
     */
    public String generateAiRecommendation(DimensioningResponse dimensioning) {
        SolarInstallation installation = dimensioning.getInstallation();
        if (installation == null) return "Aucune installation calculée.";

        // 1. RETRIEVAL STEP (Reading from Knowledge Base)
        List<String> contextDocuments = retrieveContext(installation.getTotalCapacityKw());

        // 2. GENERATION STEP (Real LLM Call via Ollama)
        return generateAdviceFromLlm(installation, dimensioning.getFinancials(), contextDocuments);
    }

    private List<String> retrieveContext(Double capacityKw) {
        List<String> docs = new ArrayList<>();
        
        try {
            ClassPathResource resource = new ClassPathResource("knowledge-base.txt");
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String fullText = reader.lines().collect(Collectors.joining("\n"));
                
                // Simple Keyword Search Simulation (Retrieval)
                if (capacityKw < 5.0) {
                    docs.add(extractSection(fullText, "## RESIDENTIEL"));
                    docs.add(extractSection(fullText, "## SUBVENTIONS"));
                } else if (capacityKw < 100.0) {
                    docs.add(extractSection(fullText, "## COMMERCIAL"));
                    docs.add(extractSection(fullText, "## SUBVENTIONS"));
                } else {
                    docs.add(extractSection(fullText, "## INDUSTRIEL"));
                }
                docs.add(extractSection(fullText, "## PRIX DU MARCHÉ"));
            }
        } catch (IOException e) {
            log.error("Failed to read knowledge base", e);
            docs.add("Erreur lors de la récupération des connaissances.");
        }
        
        return docs;
    }

    private String extractSection(String text, String header) {
        int start = text.indexOf(header);
        if (start == -1) return "";
        int end = text.indexOf("##", start + 2); // Find next header
        if (end == -1) end = text.length();
        return text.substring(start, end).trim();
    }

    private String generateAdviceFromLlm(SolarInstallation installation, FinancialMetrics financials, List<String> context) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Tu es un expert en énergie solaire en Tunisie. Analyse ce projet et donne des conseils techniques et financiers concis.\n\n");
        prompt.append("DONNÉES DU PROJET :\n");
        prompt.append(String.format("- Puissance: %.2f kWc\n", installation.getTotalCapacityKw()));
        prompt.append(String.format("- Production estimée: %.2f kWh/an\n", installation.getEstimatedAnnualProductionKwh()));
        
        if (financials != null) {
            prompt.append(String.format("- Investissement Initial: %.2f TND\n", financials.getTotalInvestmentCost()));
            prompt.append(String.format("- Retour sur Investissement (ROI): %.2f%%\n", financials.getRoiPercentage()));
            prompt.append(String.format("- Temps de Retour: %.1f ans\n", financials.getPaybackPeriodYears()));
            prompt.append(String.format("- Économies sur 25 ans: %.2f TND\n", financials.getNetSavings25Years()));
        } else {
            prompt.append(String.format("- Économie estimée: %.2f TND/mois\n", installation.getMonthlySavings()));
        }
        
        prompt.append("\nCONTEXTE RÉGLEMENTAIRE (RAG) :\n");
        for (String doc : context) {
            prompt.append("- ").append(doc).append("\n");
        }
        
        prompt.append("\nTA RÉPONSE (max 3 phrases, ton professionnel) :");

        try {
            log.info("Appel à Ollama...");
            String response = ollamaService.generate(prompt.toString());
            log.info("Réponse Ollama reçue.");
            return response;
        } catch (Exception e) {
            log.error("Échec de l'appel à Ollama", e);
            return "Le service d'IA expert est temporairement indisponible. Veuillez vérifier les données chiffrées ci-dessus.";
        }
    }
}
