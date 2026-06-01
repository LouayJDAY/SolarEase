package com.solarease.enums;

/**
 * Phases métier d'une installation photovoltaïque, dans l'ordre logique du chantier.
 * Le pourcentage d'avancement est calculé à partir du nombre de phases cochées :
 * progress = completedSteps.size() * 100 / values().length.
 */
public enum InstallationPhase {
    PREPARATION,
    STRUCTURE,
    PV,
    ELECTRIQUE,
    TESTS,
    ADMIN_STEG;

    public String label() {
        return switch (this) {
            case PREPARATION -> "Préparation";
            case STRUCTURE   -> "Structure";
            case PV          -> "Pose des panneaux";
            case ELECTRIQUE  -> "Raccordement électrique";
            case TESTS       -> "Tests et mise en service";
            case ADMIN_STEG  -> "Dossier STEG";
        };
    }
}
