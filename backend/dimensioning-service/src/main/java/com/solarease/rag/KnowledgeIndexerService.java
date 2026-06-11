package com.solarease.rag;

import com.solarease.entity.Equipment;
import com.solarease.enums.EquipmentType;
import com.solarease.enums.PanelCategory;
import com.solarease.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds the knowledge base used by the RAG pipeline.
 *
 * <p>Three families of chunks are produced:</p>
 * <ol>
 *   <li><b>EQUIPMENT</b> -- one chunk per inverter, panel, breaker, ... derived
 *       from the {@code equipments} table. Each chunk embeds power range,
 *       phase, brand, model and price so that semantic search retrieves the
 *       right products.</li>
 *   <li><b>SIZING_RULE</b> -- DC/AC cable sections by power bracket and
 *       Schneider breaker sizing rules. These are written as short, factual
 *       statements optimised for retrieval.</li>
 *   <li><b>REGULATION</b> -- STEG/ANME context (residential vs commercial vs
 *       industrial) for the Tunisian market.</li>
 * </ol>
 *
 * <p>Indexing is idempotent: every run wipes {@code knowledge_chunks} and
 * rebuilds it. This keeps the vector store in sync whenever the catalog or
 * the rules change.</p>
 *
 * <p>Runs after {@link com.solarease.config.DataLoader} (Order(2) vs Order(1))
 * so the catalog is already seeded.</p>
 */
@Service
@RequiredArgsConstructor
@Order(2)
@Slf4j
public class KnowledgeIndexerService implements CommandLineRunner {

    private final EquipmentRepository equipmentRepository;
    private final KnowledgeChunkRepository chunkRepository;
    private final EmbeddingService embeddingService;

    @Value("${solarease.rag.reindex-on-startup:true}")
    private boolean reindexOnStartup;

    @Override
    public void run(String... args) {
        if (!reindexOnStartup) {
            log.info("RAG reindex disabled via solarease.rag.reindex-on-startup=false.");
            return;
        }
        try {
            reindex();
        } catch (Exception e) {
            // Embeddings are optional: the deterministic pipeline still works
            // without them, so a startup failure must not crash the service.
            log.warn("RAG reindex skipped (embedding model unreachable?): {}",
                    e.getMessage());
        }
    }

    /**
     * Drops every chunk and rebuilds the knowledge base from scratch. Exposed
     * publicly so an admin endpoint can trigger a refresh after editing the
     * catalog.
     */
    public synchronized int reindex() {
        log.info("Reindexing knowledge_chunks...");
        chunkRepository.deleteAll();

        int indexed = 0;
        indexed += indexEquipments();
        indexed += indexSizingRules();
        indexed += indexRegulations();

        log.info("Knowledge base reindexed: {} chunks.", indexed);
        return indexed;
    }

    // ───────────────────────────────────────────────────────────────────
    // 1. Equipment chunks
    // ───────────────────────────────────────────────────────────────────

    private int indexEquipments() {
        List<Equipment> all = equipmentRepository.findAll();
        int count = 0;
        for (Equipment e : all) {
            KnowledgeChunk chunk = toEquipmentChunk(e);
            if (chunk != null && persist(chunk)) {
                count++;
            }
        }
        return count;
    }

    private KnowledgeChunk toEquipmentChunk(Equipment e) {
        EquipmentType type = e.getType();
        if (type == null) {
            return null;
        }

        Map<String, Object> meta = new HashMap<>();
        meta.put("source", "equipment");
        meta.put("equipmentType", type.name());
        if (e.getBrand() != null) meta.put("brand", e.getBrand());
        if (e.getNominalPower() != null) meta.put("nominalPowerW", e.getNominalPower());

        StringBuilder content = new StringBuilder();
        switch (type) {
            case INVERTER -> describeInverter(e, content, meta);
            case SOLAR_PANEL -> describePanel(e, content, meta, e.getPanelCategory());
            case NIGHT_PANEL -> describeNightPanel(e, content, meta);
            case CIRCUIT_BREAKER_DC, CIRCUIT_BREAKER_AC -> describeBreaker(e, content, meta);
            default -> content.append(e.getName()).append(' ').append(orDash(e.getBrand()));
        }

        return KnowledgeChunk.builder()
                .sourceType("EQUIPMENT")
                .equipmentId(e.getId())
                .content(content.toString())
                .metadata(meta)
                .build();
    }

    private void describeInverter(Equipment e, StringBuilder content,
                                  Map<String, Object> meta) {
        String phase = readJsonString(e.getSpecifications(), "phase");
        Double minKw = readJsonDouble(e.getSpecifications(), "minPowerKw");
        Double maxKw = readJsonDouble(e.getSpecifications(), "maxPowerKw");
        if (phase != null) meta.put("phase", phase);
        if (minKw != null) meta.put("minPowerKw", minKw);
        if (maxKw != null) meta.put("maxPowerKw", maxKw);

        content.append("Onduleur ").append(orDash(e.getBrand())).append(' ')
                .append(orDash(e.getModel()));
        if (e.getNominalPower() != null) {
            content.append(", puissance nominale ")
                    .append(String.format("%.1f kW", e.getNominalPower() / 1000.0));
        }
        if (phase != null) {
            content.append(", raccordement ")
                    .append("MONO".equalsIgnoreCase(phase) ? "monophasé 230V" : "triphasé 400V");
        }
        if (minKw != null && maxKw != null) {
            content.append(". Plage de dimensionnement recommandée : ")
                    .append(String.format("%.1f à %.1f kWc.", minKw, maxKw));
        }
        if (e.getPrice() != null) {
            content.append(" Prix indicatif : ")
                    .append(String.format("%.0f TND.", e.getPrice().doubleValue()));
        }
    }

    private void describePanel(Equipment e, StringBuilder content,
                               Map<String, Object> meta, PanelCategory category) {
        meta.put("category", "panel");
        String label = category != null ? category.getLabel() : "Monocristallin";
        if (category != null) {
            meta.put("panelCategory", category.name());
            meta.put("technology", category.name());
        }
        content.append("Panneau ").append(label).append(' ')
                .append(orDash(e.getBrand())).append(' ').append(orDash(e.getModel()));
        if (e.getNominalPower() != null) {
            content.append(", ").append(String.format("%.0f Wc", e.getNominalPower()));
        }
        if (e.getEfficiency() != null) {
            content.append(", rendement ")
                    .append(String.format("%.0f%%", e.getEfficiency() * 100));
        }
        if (category == PanelCategory.BIFACIAL) {
            content.append(", gain bifacial estimé +10% sur surface réfléchissante");
        }
        if (category == PanelCategory.GLASS_GLASS) {
            content.append(", encapsulation biverre pour durabilité accrue");
        }
        if (e.getWarrantyYears() != null) {
            content.append(", garantie ").append(e.getWarrantyYears()).append(" ans");
        }
        content.append('.');
    }

    private void describeNightPanel(Equipment e, StringBuilder content, Map<String, Object> meta) {
        meta.put("category", "night_panel");
        content.append("Panneau Night Panel ").append(orDash(e.getBrand())).append(' ')
                .append(orDash(e.getModel()));
        if (e.getNominalPower() != null) {
            content.append(", ").append(String.format("%.0f Wc", e.getNominalPower()));
        }
        if (e.getStorageCapacityKwh() != null) {
            content.append(", stockage intégré ")
                    .append(String.format("%.1f kWh/panneau", e.getStorageCapacityKwh()));
        }
        content.append(". Permet l'autoconsommation nocturne via stockage intégré.");
    }

    private void describeBreaker(Equipment e, StringBuilder content,
                                 Map<String, Object> meta) {
        Integer ratingA = readJsonInt(e.getSpecifications(), "ratingA");
        String phase = readJsonString(e.getSpecifications(), "phase");
        String ref = readJsonString(e.getSpecifications(), "schneiderRef");
        boolean isDc = e.getType() == EquipmentType.CIRCUIT_BREAKER_DC;

        if (ratingA != null) meta.put("ratingA", ratingA);
        if (phase != null) meta.put("phase", phase);
        if (ref != null) meta.put("schneiderRef", ref);

        content.append("Disjoncteur ").append(isDc ? "DC" : "AC").append(' ')
                .append("Schneider Electric");
        if (ref != null) {
            content.append(" référence ").append(ref);
        }
        if (ratingA != null) {
            content.append(", calibre ").append(ratingA).append(" A");
        }
        content.append(isDc
                ? ". Recommandé pour la protection des strings DC côté panneaux."
                : ". Recommandé pour la protection AC en sortie d'onduleur.");
    }

    // ───────────────────────────────────────────────────────────────────
    // 2. Sizing rules
    // ───────────────────────────────────────────────────────────────────

    private int indexSizingRules() {
        int count = 0;
        // Cable sections (Tunisian market, certified NFC 33-209 series).
        count += indexRule("CABLE_DC", 0.0, 3.0,
                "Câble solaire DC : pour une installation jusqu'à 3 kWc, "
                        + "utiliser une section de 4 mm² (câble photovoltaïque "
                        + "tunisien certifié NFC 33-209). Longueur typique : "
                        + "20 à 40 m entre les panneaux et l'onduleur.");
        count += indexRule("CABLE_DC", 3.0, 6.0,
                "Câble solaire DC : pour une installation entre 3 et 6 kWc, "
                        + "section recommandée 6 mm² (câble photovoltaïque "
                        + "tunisien certifié NFC 33-209) afin de limiter les "
                        + "pertes Joule.");
        count += indexRule("CABLE_DC", 6.0, 10.0,
                "Câble solaire DC : pour une installation entre 6 et 10 kWc, "
                        + "section 10 mm² obligatoire (câble photovoltaïque "
                        + "tunisien certifié NFC 33-209).");

        count += indexRule("CABLE_AC", 0.0, 3.0,
                "Câble AC sortie onduleur : 2,5 mm² jusqu'à 3 kWc, "
                        + "câble U-1000 R2V cuivre.");
        count += indexRule("CABLE_AC", 3.0, 6.0,
                "Câble AC sortie onduleur : 4 mm² entre 3 et 6 kWc, "
                        + "câble U-1000 R2V cuivre.");
        count += indexRule("CABLE_AC", 6.0, 10.0,
                "Câble AC sortie onduleur : 6 mm² entre 6 et 10 kWc, "
                        + "câble U-1000 R2V cuivre.");

        // Schneider breaker sizing rules.
        count += indexRule("BREAKER_DC", 0.0, 100.0,
                "Disjoncteur DC : règle de dimensionnement = 1,25 × Icc string. "
                        + "Pour un string standard 9-12 A, choisir un disjoncteur "
                        + "Schneider DC 16 A ; au-delà passer en 25 A ou 32 A. "
                        + "Toujours installer un parafoudre type 2 en amont.");
        count += indexRule("BREAKER_AC", 0.0, 100.0,
                "Disjoncteur AC : calibre = 1,25 × In onduleur. Pour un onduleur "
                        + "monophasé 5 kW (~22 A), prévoir un Schneider iC60N 25 A 1P. "
                        + "Pour un onduleur triphasé 10 kW, prévoir un Schneider "
                        + "iC60N 25 A 4P.");

        // Compatibility rule.
        count += indexRule("INVERTER_SIZING", 0.0, 100.0,
                "Règle de compatibilité onduleur/panneaux : la puissance de "
                        + "l'onduleur doit être comprise entre 90% et 110% de la "
                        + "puissance crête du champ photovoltaïque. Un onduleur "
                        + "sous-dimensionné écrête en été, un onduleur "
                        + "sur-dimensionné perd en rendement.");
        count += indexRule("PHASE_SELECTION", 0.0, 5.5,
                "Choix de phase : installation jusqu'à 5,5 kWc => raccordement "
                        + "monophasé 230 V autorisé par la STEG.");
        count += indexRule("PHASE_SELECTION", 5.5, 100.0,
                "Choix de phase : au-dessus de 5,5 kWc => raccordement triphasé "
                        + "400 V obligatoire par la STEG. Onduleur triphasé "
                        + "Sungrow recommandé.");
        return count;
    }

    private int indexRule(String category, double minKw, double maxKw, String text) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("source", "sizing_rule");
        meta.put("category", category);
        meta.put("minKw", minKw);
        meta.put("maxKw", maxKw);
        return persist(KnowledgeChunk.builder()
                .sourceType("SIZING_RULE")
                .content(text)
                .metadata(meta)
                .build()) ? 1 : 0;
    }

    // ───────────────────────────────────────────────────────────────────
    // 3. Regulations (Tunisia)
    // ───────────────────────────────────────────────────────────────────

    private int indexRegulations() {
        int count = 0;
        count += indexRegulation("RESIDENTIEL",
                "Réglementation résidentielle (< 5 kW) : raccordement monophasé "
                        + "230 V, revente du surplus à la STEG plafonnée à 30% de "
                        + "la consommation annuelle, onduleur conforme VDE-0126-1-1. "
                        + "Crédit d'impôt jusqu'à 2000 TND.");
        count += indexRegulation("COMMERCIAL",
                "Réglementation commerciale/PME (5 à 100 kW) : raccordement "
                        + "triphasé 400 V, étude de stabilité réseau requise au-delà "
                        + "de 20 kW. Subvention ANME de 20% sous validation par "
                        + "auditeur énergétique. ROI typique 3 à 5 ans.");
        count += indexRegulation("INDUSTRIEL",
                "Réglementation industrielle (> 100 kW) : poste HTA/BT obligatoire, "
                        + "autorisation Ministère de l'Industrie, onduleurs centraux "
                        + "recommandés pour la maintenance.");
        count += indexRegulation("PRIX_MARCHE_2025",
                "Prix de référence 2025 marché tunisien : panneau monocristallin "
                        + "≈ 0,8 TND/Wc, onduleur 3 kW ≈ 2500 TND, installation "
                        + "clés en main ≈ 1000 TND/kWc.");
        return count;
    }

    private int indexRegulation(String category, String text) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("source", "regulation");
        meta.put("category", category);
        return persist(KnowledgeChunk.builder()
                .sourceType("REGULATION")
                .content(text)
                .metadata(meta)
                .build()) ? 1 : 0;
    }

    // ───────────────────────────────────────────────────────────────────
    // Persistence helper
    // ───────────────────────────────────────────────────────────────────

    private boolean persist(KnowledgeChunk chunk) {
        try {
            float[] embedding = embeddingService.embed(chunk.getContent());
            chunkRepository.insert(chunk, embedding);
            return true;
        } catch (Exception e) {
            log.warn("Skipping chunk (embedding failed): {} -- {}",
                    truncate(chunk.getContent(), 60), e.getMessage());
            return false;
        }
    }

    // ───────────────────────────────────────────────────────────────────
    // Tiny JSON helpers (specifications is stored as a TEXT string)
    // ───────────────────────────────────────────────────────────────────

    private static String readJsonString(String json, String key) {
        if (json == null) return null;
        int idx = json.indexOf("\"" + key + "\"");
        if (idx < 0) return null;
        int colon = json.indexOf(':', idx);
        int quote = json.indexOf('"', colon + 1);
        if (quote < 0) return null;
        int end = json.indexOf('"', quote + 1);
        if (end < 0) return null;
        return json.substring(quote + 1, end);
    }

    private static Double readJsonDouble(String json, String key) {
        Number n = readJsonNumber(json, key);
        return n == null ? null : n.doubleValue();
    }

    private static Integer readJsonInt(String json, String key) {
        Number n = readJsonNumber(json, key);
        return n == null ? null : n.intValue();
    }

    private static Number readJsonNumber(String json, String key) {
        if (json == null) return null;
        int idx = json.indexOf("\"" + key + "\"");
        if (idx < 0) return null;
        int colon = json.indexOf(':', idx);
        if (colon < 0) return null;
        int i = colon + 1;
        while (i < json.length() && Character.isWhitespace(json.charAt(i))) i++;
        int start = i;
        while (i < json.length() && "-0123456789.eE".indexOf(json.charAt(i)) >= 0) i++;
        if (start == i) return null;
        try {
            return Double.parseDouble(json.substring(start, i));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String orDash(String s) {
        return (s == null || s.isBlank()) ? "-" : s;
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
