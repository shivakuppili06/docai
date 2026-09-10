package com.docai.backend.service;

import com.docai.backend.model.ChatMessage;
import com.docai.backend.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class RagQueryService {

    private final ChatMessageRepository chatMessageRepository;

    public RagQueryService(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    @Value("${app.rag-service.base-url}")
    private String ragServiceBaseUrl;

    @Value("${app.rag-service.api-key}")
    private String serviceApiKey;

    private final java.net.http.HttpClient httpClient = java.net.http.HttpClient.newBuilder()
            .version(java.net.http.HttpClient.Version.HTTP_1_1)
            .build();

    public ChatMessage ask(Long userId, Long documentId, String question) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            byte[] jsonBytes = mapper.writeValueAsBytes(Map.of("document_id", documentId, "question", question));

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(ragServiceBaseUrl + "/query"))
                    .header("Content-Type", "application/json")
                    .header("X-Service-Token", serviceApiKey)
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofByteArray(jsonBytes))
                    .build();

            java.net.http.HttpResponse<String> httpResponse = httpClient.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            
            if (httpResponse.statusCode() != 200) {
                throw new RuntimeException("RAG query failed with status " + httpResponse.statusCode() + ": " + httpResponse.body());
            }
            
            Map<String, Object> response = mapper.readValue(
                    httpResponse.body(), 
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}
            );

            String answer = (String) response.get("answer");
            String citations = String.valueOf(response.get("sources"));

            ChatMessage msg = ChatMessage.builder()
                    .userId(userId)
                    .documentId(documentId)
                    .question(question)
                    .answer(answer)
                    .sourceCitations(citations)
                    .build();

            return chatMessageRepository.save(msg);
        } catch (Exception e) {
            throw new RuntimeException("Error executing RAG query: " + e.getMessage(), e);
        }
    }
}
