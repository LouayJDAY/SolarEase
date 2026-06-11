package com.solarease.config;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Migrates equipment panel types to SOLAR_PANEL + panel_category and restores
 * dimensioning panel_type values CLASSIC / NIGHT_PANEL.
 */
@Component
@Order(0)
@RequiredArgsConstructor
@Slf4j
public class PanelCatalogMigration implements CommandLineRunner {

    private final EntityManager entityManager;
    private final PanelCatalogSeeder panelCatalogSeeder;

    @Override
    @Transactional
    public void run(String... args) {
        dropEquipmentTypeConstraint();
        ensurePanelCategoryColumn();
        migrateEquipmentPanelTypes();
        migrateDimensioningPanelTypes();
        addEquipmentTypeConstraint();
        panelCatalogSeeder.ensureCompanyPanels();
    }

    private void dropEquipmentTypeConstraint() {
        entityManager.createNativeQuery(
                        "ALTER TABLE equipments DROP CONSTRAINT IF EXISTS equipments_type_check")
                .executeUpdate();
    }

    private void ensurePanelCategoryColumn() {
        entityManager.createNativeQuery(
                        "ALTER TABLE equipments ADD COLUMN IF NOT EXISTS panel_category VARCHAR(255)")
                .executeUpdate();
    }

    private void migrateEquipmentPanelTypes() {
        entityManager.createNativeQuery(
                        "UPDATE equipments SET type = 'SOLAR_PANEL', panel_category = 'TOPCON_N_TYPE' "
                                + "WHERE type IN ('SOLAR_PANEL', 'PANEL_TOPCON_N_TYPE') "
                                + "AND (panel_category IS NULL OR panel_category = '')")
                .executeUpdate();
        entityManager.createNativeQuery(
                        "UPDATE equipments SET type = 'SOLAR_PANEL', panel_category = 'BIFACIAL' "
                                + "WHERE type = 'PANEL_BIFACIAL'")
                .executeUpdate();
        entityManager.createNativeQuery(
                        "UPDATE equipments SET type = 'SOLAR_PANEL', panel_category = 'GLASS_GLASS' "
                                + "WHERE type = 'PANEL_GLASS_GLASS'")
                .executeUpdate();
        entityManager.createNativeQuery(
                        "UPDATE equipments SET panel_category = NULL "
                                + "WHERE type = 'NIGHT_PANEL'")
                .executeUpdate();
        log.info("Equipment panel types migrated to SOLAR_PANEL + panel_category.");
    }

    private void migrateDimensioningPanelTypes() {
        entityManager.createNativeQuery(
                        "UPDATE dimensionings SET panel_type = 'CLASSIC' "
                                + "WHERE panel_type IS NULL "
                                + "OR panel_type IN ('TOPCON_N_TYPE', 'BIFACIAL', 'GLASS_GLASS')")
                .executeUpdate();
        entityManager.createNativeQuery(
                        "UPDATE dimensionings SET panel_type = 'NIGHT_PANEL' "
                                + "WHERE panel_type NOT IN ('CLASSIC', 'NIGHT_PANEL') "
                                + "AND panel_type IS NOT NULL")
                .executeUpdate();
    }

    private void addEquipmentTypeConstraint() {
        entityManager.createNativeQuery("""
                ALTER TABLE equipments ADD CONSTRAINT equipments_type_check CHECK (type IN (
                  'SOLAR_PANEL',
                  'NIGHT_PANEL',
                  'INVERTER',
                  'BATTERY',
                  'MOUNTING_SYSTEM',
                  'CABLE',
                  'CIRCUIT_BREAKER_DC',
                  'CIRCUIT_BREAKER_AC'
                ))
                """)
                .executeUpdate();
    }
}
