package com.solarease.enums;

public enum BlockageImpact {
    ONE_DAY,
    THREE_DAYS,
    UNKNOWN;

    public String label() {
        return switch (this) {
            case ONE_DAY    -> "+1 jour";
            case THREE_DAYS -> "+3 jours";
            case UNKNOWN    -> "Indéterminé";
        };
    }
}
