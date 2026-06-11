package com.solarease.enums;

/**
 * Types de panneaux solaires classiques (catalogue).
 */
public enum PanelCategory {
    TOPCON_N_TYPE("Monocristallin TOPCon / N-type", 1.0),
    BIFACIAL("Bifacial", 1.10),
    GLASS_GLASS("Biverre (glass-glass)", 1.0);

    private final String label;
    private final double productionFactor;

    PanelCategory(String label, double productionFactor) {
        this.label = label;
        this.productionFactor = productionFactor;
    }

    public String getLabel() {
        return label;
    }

    public double getProductionFactor() {
        return productionFactor;
    }

    public static PanelCategory fromString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        for (PanelCategory category : values()) {
            if (category.name().equalsIgnoreCase(value)) {
                return category;
            }
        }
        return null;
    }
}
