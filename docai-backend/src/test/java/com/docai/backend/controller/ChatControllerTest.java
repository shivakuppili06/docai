package com.docai.backend.controller;

import com.docai.backend.config.RateLimitProperties;
import com.docai.backend.config.SecurityConfig;
import com.docai.backend.dto.ChatDtos.AskRequest;
import com.docai.backend.model.ChatMessage;
import com.docai.backend.model.Document;
import com.docai.backend.repository.ChatMessageRepository;
import com.docai.backend.repository.DocumentRepository;
import com.docai.backend.security.JwtAuthFilter;
import com.docai.backend.security.JwtUtil;
import com.docai.backend.security.ServiceAuthFilter;
import com.docai.backend.service.RagQueryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ChatController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, ServiceAuthFilter.class})
@AutoConfigureMockMvc
public class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RagQueryService ragQueryService;

    @MockBean
    private ChatMessageRepository chatMessageRepository;

    @MockBean
    private DocumentRepository documentRepository;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private StringRedisTemplate stringRedisTemplate;

    @MockBean
    private RateLimitProperties rateLimitProperties;

    @BeforeEach
    void setupRedisMock() {
        ValueOperations valueOperations = mock(ValueOperations.class);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(1L);
        when(rateLimitProperties.getApiLimit()).thenReturn(100L);
        when(rateLimitProperties.getApiWindow()).thenReturn(60L);
        when(rateLimitProperties.getChatLimit()).thenReturn(100L);
        when(rateLimitProperties.getChatWindow()).thenReturn(60L);
    }

    private void mockValidJwt(Long userId, String email) {
        Claims claims = mock(Claims.class);
        when(claims.get("userId", Long.class)).thenReturn(userId);
        when(jwtUtil.isTokenValid("valid-token")).thenReturn(true);
        when(jwtUtil.extractEmail("valid-token")).thenReturn(email);
        when(jwtUtil.extractClaims("valid-token")).thenReturn(claims);
    }

    @Test
    void ask_unauthorized_returns401() throws Exception {
        AskRequest req = new AskRequest(1L, null, "What is this?");
        mockMvc.perform(post("/api/chat/ask")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req))
                .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ask_forbiddenDocument_returns403() throws Exception {
        mockValidJwt(1L, "user@example.com");
        AskRequest req = new AskRequest(999L, null, "What is this?");

        when(documentRepository.findAccessibleByIdAndUserId(999L, 1L))
                .thenReturn(Optional.empty());

        mockMvc.perform(post("/api/chat/ask")
                .header("Authorization", "Bearer valid-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req))
                .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void ask_authorized_returns200() throws Exception {
        mockValidJwt(1L, "user@example.com");
        AskRequest req = new AskRequest(1L, null, "What is this?");
        Document doc = new Document();
        doc.setId(1L);

        when(documentRepository.findAccessibleByIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(doc));

        ChatMessage message = new ChatMessage();
        message.setId(10L);
        message.setDocumentId(1L);
        message.setUserId(1L);
        message.setQuestion("What is this?");
        message.setAnswer("This is the answer.");

        when(ragQueryService.ask(anyLong(), anyLong(), any(), anyString()))
                .thenReturn(message);

        mockMvc.perform(post("/api/chat/ask")
                .header("Authorization", "Bearer valid-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.answer").value("This is the answer."));
    }

    @Test
    void history_unauthorized_returns401() throws Exception {
        mockMvc.perform(get("/api/chat/history/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void history_forbiddenDocument_returns403() throws Exception {
        mockValidJwt(1L, "user@example.com");

        when(documentRepository.findAccessibleByIdAndUserId(1L, 1L))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/chat/history/1")
                .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    void history_authorized_returns200() throws Exception {
        mockValidJwt(1L, "user@example.com");
        Document doc = new Document();
        doc.setId(1L);

        when(documentRepository.findAccessibleByIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(doc));

        ChatMessage msg = new ChatMessage();
        msg.setId(5L);
        msg.setDocumentId(1L);
        msg.setQuestion("Question");
        msg.setAnswer("Answer");

        when(chatMessageRepository.findByDocumentIdOrderByCreatedAtAsc(1L))
                .thenReturn(List.of(msg));

        mockMvc.perform(get("/api/chat/history/1")
                .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(5))
                .andExpect(jsonPath("$[0].answer").value("Answer"));
    }
}
