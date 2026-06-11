package com.solarease.config;

import com.solarease.entity.Equipment;
import com.solarease.enums.EquipmentType;
import com.solarease.enums.PanelCategory;
import com.solarease.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Catalogue panneaux : types TOPCon, bifacial, biverre + Night Panels.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PanelCatalogSeeder {

    private static final String IMG = "/equipment/";

    private final EquipmentRepository equipmentRepository;

    public void seedCompanyPanels() {
        upsertPanel(topconPanel());
        upsertPanel(topconPanelAlt());
        upsertPanel(bifacialPanel());
        upsertPanel(glassGlassPanel());
        upsertPanel(nightPanel400());
        upsertPanel(nightPanel550());
        log.info("Company panel catalog ensured.");
    }

    public void ensureCompanyPanels() {
        seedCompanyPanels();
    }

    private void upsertPanel(Equipment template) {
        equipmentRepository.findByModel(template.getModel()).ifPresentOrElse(existing -> {
            if (existing.getImageUrl() == null && template.getImageUrl() != null) {
                existing.setImageUrl(template.getImageUrl());
                existing.setPanelCategory(template.getPanelCategory());
                equipmentRepository.save(existing);
            }
        }, () -> equipmentRepository.save(template));
    }

    private Equipment topconPanel() {
        return Equipment.builder()
                .name("Jinko Tiger Neo N-type")
                .brand("Jinko Solar")
                .model("JKM565N-72HL4-B")
                .type(EquipmentType.SOLAR_PANEL)
                .panelCategory(PanelCategory.TOPCON_N_TYPE)
                .nominalPower(565.0)
                .efficiency(0.223)
                .area(2.27)
                .price(BigDecimal.valueOf(580.0))
                .warrantyYears(25)
                .imageUrl(IMG + "jinko-tiger-neo.jpg")
                .specifications("{\"technology\":\"Monocristallin TOPCon N-type\"}")
                .build();
    }

    private Equipment topconPanelAlt() {
        return Equipment.builder()
                .name("JA Solar DeepBlue 4.0 Pro")
                .brand("JA Solar")
                .model("JAM72S30-545-MR")
                .type(EquipmentType.SOLAR_PANEL)
                .panelCategory(PanelCategory.TOPCON_N_TYPE)
                .nominalPower(545.0)
                .efficiency(0.211)
                .area(2.58)
                .price(BigDecimal.valueOf(520.0))
                .warrantyYears(25)
                .imageUrl(IMG + "ja-solar-deepblue.jpg")
                .build();
    }

    private Equipment bifacialPanel() {
        return Equipment.builder()
                .name("LONGi Hi-MO 6 Bifacial")
                .brand("LONGi")
                .model("LR5-72HIH-580M")
                .type(EquipmentType.SOLAR_PANEL)
                .panelCategory(PanelCategory.BIFACIAL)
                .nominalPower(580.0)
                .efficiency(0.225)
                .area(2.58)
                .price(BigDecimal.valueOf(620.0))
                .warrantyYears(25)
                .imageUrl(IMG + "longi-bifacial.jpg")
                .specifications("{\"bifacialGainPercent\":10}")
                .build();
    }

    private Equipment glassGlassPanel() {
        return Equipment.builder()
                .name("Trina Vertex S+ Biverre")
                .brand("Trina Solar")
                .model("TSM-445NEG9R.28")
                .type(EquipmentType.SOLAR_PANEL)
                .panelCategory(PanelCategory.GLASS_GLASS)
                .nominalPower(445.0)
                .efficiency(0.218)
                .area(1.97)
                .price(BigDecimal.valueOf(540.0))
                .warrantyYears(30)
                .imageUrl(IMG + "trina-glass-glass.jpg")
                .build();
    }

    private Equipment nightPanel400() {
        return Equipment.builder()
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
                .imageUrl(IMG + "night-panel-400.jpg")
                .build();
    }

    private Equipment nightPanel550() {
        return Equipment.builder()
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
                .imageUrl(IMG + "night-panel-550.jpg")
                .build();
    }
}
