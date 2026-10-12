package com.docai.backend.service;

import com.docai.backend.model.ChatMessage;
import com.docai.backend.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


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

    public ChatMessage ask(Long userId, Long primaryDocumentId, java.util.List<Long> documentIds, String question) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> reqBody;
            if (documentIds != null && documentIds.size() > 1) {
                reqBody = Map.of("document_ids", documentIds, "question", question);
            } else {
                reqBody = Map.of("document_id", primaryDocumentId, "question", question);
            }
            byte[] jsonBytes = mapper.writeValueAsBytes(reqBody);

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
                    .documentId(primaryDocumentId)
                    .question(question)
                    .answer(answer)
                    .sourceCitations(citations)
                    .build();

            return chatMessageRepository.save(msg);
        } catch (java.io.IOException | InterruptedException e) {
            throw new RuntimeException("Error executing RAG query: " + e.getMessage(), e);
        }
    }

    @org.springframework.scheduling.annotation.Async("sseTaskExecutor")
    public void askStream(Long userId, Long primaryDocumentId, java.util.List<Long> documentIds, String question, org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> reqBody;
            if (documentIds != null && documentIds.size() > 1) {
                reqBody = Map.of("document_ids", documentIds, "question", question);
            } else {
                reqBody = Map.of("document_id", primaryDocumentId, "question", question);
            }
            byte[] jsonBytes = mapper.writeValueAsBytes(reqBody);

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(ragServiceBaseUrl + "/query/stream"))
                    .header("Content-Type", "application/json")
                    .header("X-Service-Token", serviceApiKey)
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofByteArray(jsonBytes))
                    .build();

            java.util.concurrent.CompletableFuture<java.net.http.HttpResponse<java.util.stream.Stream<String>>> future = 
                httpClient.sendAsync(request, java.net.http.HttpResponse.BodyHandlers.ofLines());

            emitter.onTimeout(() -> {
                future.cancel(true);
                emitter.complete();
            });
            emitter.onCompletion(() -> future.cancel(true));
            emitter.onError(e -> future.cancel(true));

            future.thenAccept(response -> {
                StringBuilder fullAnswer = new StringBuilder();
                String[] finalSources = new String[]{"[]"};
                
                try {
                    response.body().forEach(line -> {
                        if(line == null || line.trim().isEmpty()) return;
                        try {
                            Map<String, Object> data = mapper.readValue(line, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                            if(data.containsKey("text")) {
                                String t = (String) data.get("text");
                                fullAnswer.append(t);
                                emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event().data(line));
                            }
                            if(data.containsKey("sources")) {
                                finalSources[0] = mapper.writeValueAsString(data.get("sources"));
                                emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event().data(line));
                            }
                            if(data.containsKey("error")) {
                                emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event().data(line));
                            }
                        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                        } catch (java.io.IOException e) {
                            throw new java.io.UncheckedIOException(e);
                        }
                    });
                    
                    ChatMessage msg = ChatMessage.builder()
                        .userId(userId)
                        .documentId(primaryDocumentId)
                        .question(question)
                        .answer(fullAnswer.toString())
                        .sourceCitations(finalSources[0])
                        .build();
                    chatMessageRepository.save(msg);
                    
                    emitter.complete();
                } catch (Exception ex) {
                    emitter.completeWithError(ex);
                }
            }).exceptionally(e -> {
                emitter.completeWithError(e);
                return null;
            });
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            emitter.completeWithError(e);
        }
    }
}
