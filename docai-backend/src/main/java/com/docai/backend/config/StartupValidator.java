package com.docai.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class StartupValidator {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.rag-service.api-key}")
    private String serviceApiKey;

    @Value("${aws.secret-access-key:default}")
    private String awsSecretKey;

    @PostConstruct
    public void validate() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty() || jwtSecret.contains("${")) {
            throw new IllegalStateException("CRITICAL STARTUP FAILURE: app.jwt.secret (JWT_SECRET) is missing or unresolved. Provide it via environment variables.");
        }
        if (serviceApiKey == null || serviceApiKey.trim().isEmpty() || serviceApiKey.contains("${")) {
            throw new IllegalStateException("CRITICAL STARTUP FAILURE: app.rag-service.api-key (SERVICE_API_KEY) is missing or unresolved. Provide it via environment variables.");
        }
    }
}
