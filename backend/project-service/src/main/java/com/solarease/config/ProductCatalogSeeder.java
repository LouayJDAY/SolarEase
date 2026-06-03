package com.solarease.config;

import com.solarease.entity.ProductCatalog;
import com.solarease.repository.ProductCatalogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Ensures quote catalog items exist when Flyway seed migrations did not run
 * (e.g. Hibernate created {@code product_catalog} before Flyway baseline).
 */
@Component
@Order(50)
@RequiredArgsConstructor
@Slf4j
public class ProductCatalogSeeder implements ApplicationRunner {

    private final ProductCatalogRepository repository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) {
            return;
        }
        log.info("product_catalog empty — seeding default quote catalog items");
        seed(
                "Panneau solaire monocristallin 400W", "JA-400M", "250.00", ProductCatalog.Category.MATERIEL,
                "Panneau JA Solar 400Wc monocristallin");
        seed("Panneau solaire monocristallin 550W", "JA-550M", "320.00", ProductCatalog.Category.MATERIEL,
                "Panneau JA Solar 550Wc monocristallin");
        seed("Panneau solaire polycristallin 300W", "POL-300W", "180.00", ProductCatalog.Category.MATERIEL,
                "Panneau polycristallin standard");
        seed("Onduleur hybride 3kW", "HW-3K", "850.00", ProductCatalog.Category.MATERIEL,
                "Onduleur hybride triphasé 3kW");
        seed("Onduleur hybride 5kW Huawei", "HW-5K", "1200.00", ProductCatalog.Category.MATERIEL,
                "Onduleur hybride Huawei 5kW");
        seed("Onduleur hybride 10kW Huawei", "HW-10K", "2100.00", ProductCatalog.Category.MATERIEL,
                "Onduleur hybride Huawei 10kW");
        seed("Batterie LFP 5kWh BYD", "BYD-5K", "2000.00", ProductCatalog.Category.MATERIEL,
                "Batterie lithium fer phosphate 5kWh");
        seed("Batterie LFP 10kWh BYD", "BYD-10K", "3800.00", ProductCatalog.Category.MATERIEL,
                "Batterie lithium fer phosphate 10kWh");
        seed("Structure de montage toiture (kit)", "STR-TOIT-KIT", "180.00", ProductCatalog.Category.MATERIEL,
                "Kit de fixation panneaux sur toiture");
        seed("Structure de montage sol (kit)", "STR-SOL-KIT", "220.00", ProductCatalog.Category.MATERIEL,
                "Kit de fixation panneaux au sol");
        seed("Câblage DC 4mm² (par mètre)", "CAB-DC-4", "2.50", ProductCatalog.Category.MATERIEL,
                "Câble solaire DC 4mm² rouge/noir");
        seed("Câblage AC (forfait)", "CAB-AC", "150.00", ProductCatalog.Category.MATERIEL,
                "Câblage AC depuis onduleur tableau");
        seed("Boîte de jonction DC", "BOJ-DC", "45.00", ProductCatalog.Category.MATERIEL,
                "Boîte de jonction protection DC");
        seed("Disjoncteur DC", "DIS-DC", "60.00", ProductCatalog.Category.MATERIEL,
                "Disjoncteur de protection DC");
        seed("Parafoudre DC + AC", "PAR-DC-AC", "90.00", ProductCatalog.Category.MATERIEL,
                "Protection contre la foudre DC et AC");
        seed("Compteur bidirectionnel STEG", "CTR-BI", "350.00", ProductCatalog.Category.MATERIEL,
                "Compteur de production/injection STEG");
        seed("Main d'œuvre installation (journée)", "MO-JOUR", "300.00", ProductCatalog.Category.MAIN_OEUVRE,
                "Forfait journée technicien installateur");
        seed("Mise en service et tests", "MES-TEST", "150.00", ProductCatalog.Category.MAIN_OEUVRE,
                "Mise en service, tests et réglages");
        seed("Étude technique et plans", "ETUDE-TECH", "200.00", ProductCatalog.Category.MAIN_OEUVRE,
                "Étude de faisabilité et plans d'exécution");
        seed("Démarches administratives STEG", "ADM-STEG", "250.00", ProductCatalog.Category.MAIN_OEUVRE,
                "Dossier raccordement et autorisation STEG");
        seed("Transport et logistique", "TRANS", "200.00", ProductCatalog.Category.TRANSPORT,
                "Transport matériel et déplacement équipe");
        seed("Garantie extension 5 ans", "GAR-5ANS", "400.00", ProductCatalog.Category.AUTRE,
                "Extension de garantie main d'œuvre 5 ans");
        log.info("Seeded {} product catalog items", repository.count());
    }

    private void seed(String name, String reference, String price, ProductCatalog.Category category, String description) {
        repository.save(ProductCatalog.builder()
                .name(name)
                .reference(reference)
                .defaultPrice(new BigDecimal(price))
                .category(category)
                .description(description)
                .build());
    }
}
