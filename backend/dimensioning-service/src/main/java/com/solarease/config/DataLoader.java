package com.solarease.config;

import com.solarease.entity.Equipment;
import com.solarease.enums.EquipmentType;
import com.solarease.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Seeds the {@code equipments} table with the real catalogue of the installer
 * company:
 *
 * <ul>
 *   <li>Inverters Solax/Sungrow (mono and three-phase) -- exhaustive list from
 *       the company spreadsheet.</li>
 *   <li>Schneider AC/DC circuit breakers -- standard Acti9/iC60N range.</li>
 *   <li>A few reference solar panels and Night Panels used for compatibility
 *       checks and PVGIS-based dimensioning.</li>
 * </ul>
 *
 * Cables stay as <em>sizing rules</em> (indexed in {@code knowledge_chunks})
 * because the brand is a placeholder until the company shares exact references.
 *
 * Runs only when the equipment table is empty so manual edits in production
 * are preserved.
 */
@Component
@RequiredArgsConstructor
@Order(1)
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final EquipmentRepository equipmentRepository;

    @Override
    public void run(String... args) {
        if (equipmentRepository.count() > 0) {
            log.info("Equipment catalog already seeded ({} rows), skipping.",
                    equipmentRepository.count());
            return;
        }

        seedPanels();
        seedNightPanels();
        seedCompanyInverters();
        seedSchneiderBreakers();

        log.info("Seeded {} equipments (panels, inverters, breakers).",
                equipmentRepository.count());
    }

    private void seedPanels() {
        equipmentRepository.save(Equipment.builder()
                .name("JA Solar JAM72S30")
                .brand("JA Solar")
                .model("JAM72S30-540")
                .type(EquipmentType.SOLAR_PANEL)
                .nominalPower(540.0)
                .efficiency(0.209)
                .area(2.58)
                .price(BigDecimal.valueOf(450.0))
                .warrantyYears(25)
                .build());

        equipmentRepository.save(Equipment.builder()
                .name("Jinko Solar Tiger Neo")
                .brand("Jinko Solar")
                .model("JKM565N-72HL4")
                .type(EquipmentType.SOLAR_PANEL)
                .nominalPower(565.0)
                .efficiency(0.2187)
                .area(2.27)
                .price(BigDecimal.valueOf(550.0))
                .warrantyYears(15)
                .build());
    }

    private void seedNightPanels() {
        equipmentRepository.save(Equipment.builder()
                .name("SolarNight SN-400 Hybrid")
                .brand("SolarNight")
                .model("SN-400-HB")
                .type(EquipmentType.NIGHT_PANEL)
                .nominalPower(400.0)
                .efficiency(0.21)
                .area(1.85)
                .storageCapacityKwh(1.2)
                .price(BigDecimal.valueOf(750.0))
                .warrantyYears(20)
                .specifications("{\"technology\":\"Monocrystalline + Integrated LFP Battery\","
                        + "\"nightOutput\":\"1.2 kWh\",\"cycleLife\":6000}")
                .build());

        equipmentRepository.save(Equipment.builder()
                .name("EcoNight EN-550 Pro")
                .brand("EcoNight Energy")
                .model("EN-550-PRO")
                .type(EquipmentType.NIGHT_PANEL)
                .nominalPower(550.0)
                .efficiency(0.215)
                .area(2.30)
                .storageCapacityKwh(2.0)
                .price(BigDecimal.valueOf(1100.0))
                .warrantyYears(25)
                .specifications("{\"technology\":\"HJT + Solid-State Battery\","
                        + "\"nightOutput\":\"2.0 kWh\",\"cycleLife\":8000}")
                .build());
    }

    /**
     * Inverters available in the company stock, exact list provided by the
     * client. Power range is encoded in {@code specifications} so that the
     * deterministic selection engine can pick the right unit for a given kWc.
     */
    private void seedCompanyInverters() {
        // Mono-phase
        addInverter("Solax 2 kW",      "Solax",   "X1-Mini-2.0",    2_000,  "MONO", 1.5,  2.2);
        addInverter("Sungrow 2 kW",    "Sungrow", "SG2K-S",          2_000,  "MONO", 1.5,  2.2);
        addInverter("Solax 2,5 kW",    "Solax",   "X1-Mini-2.5",    2_500,  "MONO", 2.0,  2.7);
        addInverter("Sungrow 2,5 kW",  "Sungrow", "SG2.5K-S",        2_500,  "MONO", 2.0,  2.7);
        addInverter("Sungrow 3 kW",    "Sungrow", "SG3K-S",          3_000,  "MONO", 2.5,  3.3);
        addInverter("Sungrow 3,5 kW",  "Sungrow", "SG3.5K-S",        3_500,  "MONO", 3.0,  3.8);
        addInverter("Sungrow 4 kW",    "Sungrow", "SG4K-S",          4_000,  "MONO", 3.5,  4.3);
        addInverter("Sungrow 4,5 kW",  "Sungrow", "SG4.5K-S",        4_500,  "MONO", 4.0,  4.8);
        addInverter("Sungrow 5 kW",    "Sungrow", "SG5K-S",          5_000,  "MONO", 4.5,  5.3);
        addInverter("Sungrow 5,5 kW",  "Sungrow", "SG5.5K-S",        5_500,  "MONO", 5.0,  5.8);

        // Three-phase
        addInverter("Sungrow 6 kW (tri)",  "Sungrow", "SG6K-D",     6_000,  "TRI",  5.5,  6.3);
        addInverter("Sungrow 6,5 kW (tri)","Sungrow", "SG6.5K-D",   6_500,  "TRI",  6.0,  6.8);
        addInverter("Sungrow 8 kW (tri)",  "Sungrow", "SG8K-D",     8_000,  "TRI",  6.8,  8.0);
        addInverter("Sungrow 10 kW (tri)", "Sungrow", "SG10K-D",   10_000,  "TRI",  8.5, 10.5);
    }

    private void addInverter(String name, String brand, String model, int powerW,
                             String phase, double minKw, double maxKw) {
        BigDecimal price = BigDecimal.valueOf(800 + powerW * 0.4);
        equipmentRepository.save(Equipment.builder()
                .name(name)
                .brand(brand)
                .model(model)
                .type(EquipmentType.INVERTER)
                .nominalPower((double) powerW)
                .price(price)
                .warrantyYears(10)
                .specifications(String.format(
                        "{\"phase\":\"%s\",\"minPowerKw\":%.1f,\"maxPowerKw\":%.1f}",
                        phase, minKw, maxKw))
                .build());
    }

    /**
     * Schneider Electric circuit breakers covering the typical residential and
     * small commercial range (up to ~10 kW). DC variants protect the panel
     * string side, AC variants protect the inverter output.
     */
    private void seedSchneiderBreakers() {
        // DC string protection (Acti9 DC range)
        addDcBreaker("Schneider DC 16A", "A9N61515", 16);
        addDcBreaker("Schneider DC 20A", "A9N61520", 20);
        addDcBreaker("Schneider DC 25A", "A9N61525", 25);
        addDcBreaker("Schneider DC 32A", "A9N61532", 32);
        addDcBreaker("Schneider DC 40A", "A9N61540", 40);

        // AC output protection (iC60N)
        addAcBreaker("Schneider iC60N 16A 1P", "A9F74116", 16, "MONO");
        addAcBreaker("Schneider iC60N 20A 1P", "A9F74120", 20, "MONO");
        addAcBreaker("Schneider iC60N 25A 1P", "A9F74125", 25, "MONO");
        addAcBreaker("Schneider iC60N 32A 1P", "A9F74132", 32, "MONO");
        addAcBreaker("Schneider iC60N 40A 4P", "A9F74440", 40, "TRI");
        addAcBreaker("Schneider iC60N 50A 4P", "A9F74450", 50, "TRI");
    }

    private void addDcBreaker(String name, String ref, int ratingA) {
        equipmentRepository.save(Equipment.builder()
                .name(name)
                .brand("Schneider Electric")
                .model(ref)
                .type(EquipmentType.CIRCUIT_BREAKER_DC)
                .price(BigDecimal.valueOf(40 + ratingA * 1.5))
                .warrantyYears(2)
                .specifications(String.format(
                        "{\"ratingA\":%d,\"application\":\"DC string protection\","
                                + "\"schneiderRef\":\"%s\"}",
                        ratingA, ref))
                .build());
    }

    private void addAcBreaker(String name, String ref, int ratingA, String phase) {
        equipmentRepository.save(Equipment.builder()
                .name(name)
                .brand("Schneider Electric")
                .model(ref)
                .type(EquipmentType.CIRCUIT_BREAKER_AC)
                .price(BigDecimal.valueOf(35 + ratingA * 1.2))
                .warrantyYears(2)
                .specifications(String.format(
                        "{\"ratingA\":%d,\"phase\":\"%s\","
                                + "\"application\":\"AC inverter output\","
                                + "\"schneiderRef\":\"%s\"}",
                        ratingA, phase, ref))
                .build());
    }
}
