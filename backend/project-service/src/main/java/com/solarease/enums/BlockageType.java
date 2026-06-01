package com.solarease.enums;

public enum BlockageType {
    METEO,
    ACCES_TOIT,
    MATERIEL,
    STEG,
    CLIENT_ABSENT,
    AUTRE;

    public String label() {
        return switch (this) {
            case METEO         -> "Météo";
            case ACCES_TOIT    -> "Accès toit";
            case MATERIEL      -> "Matériel manquant";
            case STEG          -> "STEG";
            case CLIENT_ABSENT -> "Client absent";
            case AUTRE         -> "Autre";
        };
    }
}
