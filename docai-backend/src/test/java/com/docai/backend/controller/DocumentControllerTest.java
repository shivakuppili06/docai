package com.docai.backend.controller;


import com.docai.backend.model.DocumentShareRole;
import com.docai.backend.service.DocumentService;
import com.docai.backend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import com.docai.backend.config.SecurityConfig;
import com.docai.backend.security.JwtAuthFilter;
import com.docai.backend.security.ServiceAuthFilter;
import com.docai.backend.config.RateLimitProperties;
import com.docai.backend.security.AuthenticatedUser;
import org.springframework.data.redis.core.StringRedisTemplate;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import java.util.Collections;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import com.docai.backend.config.SecurityConfig;
import com.docai.backend.security.JwtAuthFilter;
import com.docai.backend.security.ServiceAuthFilter;

@WebMvcTest(DocumentController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, ServiceAuthFilter.class})
@AutoConfigureMockMvc
public class DocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DocumentService documentService;

    @MockBean
    private JwtUtil jwtUtil; // Required for JwtAuthenticationFilter

    @MockBean
    private StringRedisTemplate stringRedisTemplate;

    @MockBean
    private RateLimitProperties rateLimitProperties;

    @Test
    void shareDocument_unauthorized_returns401() throws Exception {
        mockMvc.perform(post("/api/documents/1/share")
                .param("userId", "2")
                .param("role", "VIEWER")
                .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void uploadDocument_maliciousUpload_returns400() throws Exception {
        org.springframework.data.redis.core.ValueOperations valueOperations = org.mockito.Mockito.mock(org.springframework.data.redis.core.ValueOperations.class);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(1L);
        when(rateLimitProperties.getUploadLimit()).thenReturn(10L);

        io.jsonwebtoken.Claims claims = org.mockito.Mockito.mock(io.jsonwebtoken.Claims.class);
        when(claims.get("userId", Long.class)).thenReturn(1L);
        when(jwtUtil.isTokenValid(anyString())).thenReturn(true);
        when(jwtUtil.extractEmail(anyString())).thenReturn("user@example.com");
        when(jwtUtil.extractClaims(anyString())).thenReturn(claims);

        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file", "malicious.exe", "application/x-msdownload", "malicious content".getBytes());

        when(documentService.upload(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyLong()))
                .thenThrow(new IllegalArgumentException("Unsupported file type."));

        mockMvc.perform(multipart("/api/documents/upload")
                .file(file)
                .header("Authorization", "Bearer valid-token")
                .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shareDocument_invalidToken_returns401() throws Exception {
        when(jwtUtil.isTokenValid("invalid-token")).thenReturn(false);

        mockMvc.perform(post("/api/documents/1/share")
                .header("Authorization", "Bearer invalid-token")
                .param("userId", "2")
                .param("role", "VIEWER")
                .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shareDocument_authorized_returns200() throws Exception {
        org.springframework.data.redis.core.ValueOperations valueOperations = org.mockito.Mockito.mock(org.springframework.data.redis.core.ValueOperations.class);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(1L);
        when(rateLimitProperties.getApiLimit()).thenReturn(100L);
        when(rateLimitProperties.getUploadLimit()).thenReturn(10L);

        io.jsonwebtoken.Claims claims = org.mockito.Mockito.mock(io.jsonwebtoken.Claims.class);
        when(claims.get("userId", Long.class)).thenReturn(1L);
        when(jwtUtil.isTokenValid(anyString())).thenReturn(true);
        when(jwtUtil.extractEmail(anyString())).thenReturn("user@example.com");
        when(jwtUtil.extractClaims(anyString())).thenReturn(claims);

        mockMvc.perform(post("/api/documents/1/share")
                .header("Authorization", "Bearer valid-token")
                .param("userId", "2")
                .param("role", "VIEWER")
                .with(csrf()))
                .andExpect(status().isOk());
    }
}
