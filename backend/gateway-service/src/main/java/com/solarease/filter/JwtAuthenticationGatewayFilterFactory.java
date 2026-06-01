package com.solarease.filter;

import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

@Component
public class JwtAuthenticationGatewayFilterFactory extends AbstractGatewayFilterFactory<JwtAuthenticationGatewayFilterFactory.Config> {

    @Autowired
    private JwtTokenValidator jwtTokenValidator;

    private static final String[] PUBLIC_ROUTES = {
            "/api/auth/register",
            "/api/auth/verify-otp",
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/auth/resend-otp",
            "/api/auth/health",
            "/api/demands/public",
            "/api/dimensioning/invoices/parse",
            "/health"
    };

    public JwtAuthenticationGatewayFilterFactory() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getPath().value();

            // Check if the request path is public
            boolean isPublicRoute = false;
            for (String publicRoute : PUBLIC_ROUTES) {
                if (path.startsWith(publicRoute)) {
                    isPublicRoute = true;
                    break;
                }
            }

            // If public route, skip JWT validation
            if (isPublicRoute) {
                return chain.filter(exchange);
            }

            // Get Authorization header
            String authHeader = request.getHeaders().getFirst("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            String token = authHeader.substring(7);

            // Validate token
            if (!jwtTokenValidator.validateToken(token)) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // Extract claims and forward user info as headers to downstream services
            Claims claims = jwtTokenValidator.getClaimsFromToken(token);
            if (claims != null) {
                ServerHttpRequest modifiedRequest = request.mutate()
                        .headers(httpHeaders -> {
                            httpHeaders.set("X-User-Id", claims.getSubject());
                            httpHeaders.set("X-User-Email", claims.get("email", String.class));
                            httpHeaders.set("X-User-Role", claims.get("role", String.class));
                        })
                        .build();

                return chain.filter(exchange.mutate().request(modifiedRequest).build());
            }

            return chain.filter(exchange);
        };
    }

    public static class Config {
        // Configuration class for gateway filter
    }
}
