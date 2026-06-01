package com.solarease.enums;

/**
 * How a demand reached the platform.
 *
 * <ul>
 *   <li>{@link #PUBLIC}  -- anonymous contact form, no account required.</li>
 *   <li>{@link #CLIENT}  -- authenticated client portal (existing user).</li>
 * </ul>
 */
public enum DemandSource {
    PUBLIC,
    CLIENT
}
