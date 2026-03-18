package com.solarease.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${app.jwt.secret:SolarEaseSecretKeyFor256BitHS256AlgorithmThatMustBeLong}")
    private String jwtSecret;

    @Value("${app.jwt.expiration:86400000}")
    private long jwtExpiration;

    @Value("${app.jwt.refresh-expiration:604800000}")
    private long refreshTokenExpiration;

    public String generateAccessToken(String userId, String email, String role) {
        return generateToken(userId, email, role, jwtExpiration, "ACCESS");
    }

    public String generateRefreshToken(String userId, String email, String role) {
        return generateToken(userId, email, role, refreshTokenExpiration, "REFRESH");
    }

    private String generateToken(String userId, String email, String role, long expirationTime, String tokenType) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        
        return Jwts.builder()
                .setSubject(userId)
                .claim("email", email)
                .claim("role", role)
                .claim("type", tokenType)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUserIdFromToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return claims.getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Error getting user ID from token: {}", e.getMessage());
            return null;
        }
    }

    public String getEmailFromToken(String token) {
        Claims claims = getAllClaims(token);
        return claims != null ? claims.get("email", String.class) : null;
    }

    public String getRoleFromToken(String token) {
        Claims claims = getAllClaims(token);
        return claims != null ? claims.get("role", String.class) : null;
    }

    public String getTokenType(String token) {
        Claims claims = getAllClaims(token);
        return claims != null ? claims.get("type", String.class) : null;
    }

    private Claims getAllClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Error parsing token claims: {}", e.getMessage());
            return null;
        }
    }

    public boolean validateToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.info("Invalid JWT signature.");
        } catch (ExpiredJwtException e) {
            log.info("Expired JWT token.");
        } catch (UnsupportedJwtException e) {
            log.info("Unsupported JWT token.");
        } catch (IllegalArgumentException e) {
            log.info("JWT token compact of handler are invalid.");
        }
        return false;
    }

    public long getExpirationTime() {
        return jwtExpiration;
    }
}
