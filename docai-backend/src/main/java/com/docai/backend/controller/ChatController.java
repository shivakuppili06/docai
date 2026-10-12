package com.docai.backend.controller;

import com.docai.backend.dto.ChatDtos.AskRequest;
import com.docai.backend.model.ChatMessage;
import com.docai.backend.repository.ChatMessageRepository;
import com.docai.backend.security.AuthenticatedUser;
import com.docai.backend.service.RagQueryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final RagQueryService ragQueryService;
    private final ChatMessageRepository chatMessageRepository;
    private final com.docai.backend.repository.DocumentRepository documentRepository;

    public ChatController(RagQueryService ragQueryService, ChatMessageRepository chatMessageRepository, com.docai.backend.repository.DocumentRepository documentRepository) {
        this.ragQueryService = ragQueryService;
        this.chatMessageRepository = chatMessageRepository;
        this.documentRepository = documentRepository;
    }

    private java.util.List<Long> resolveAndValidateDocIds(AskRequest req, Long userId) {
        java.util.List<Long> docIds = new java.util.ArrayList<>();
        if (req.documentIds() != null && !req.documentIds().isEmpty()) {
            docIds.addAll(req.documentIds());
        } else if (req.documentId() != null) {
            docIds.add(req.documentId());
        } else {
            throw new IllegalArgumentException("At least one document ID must be specified.");
        }

        // Enforce RBAC / access control on every single document in the comparison list
        for (Long id : docIds) {
            documentRepository.findAccessibleByIdAndUserId(id, userId)
                    .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Document " + id + " not found or access denied"));
        }
        return docIds;
    }

    @PostMapping("/ask")
    public ResponseEntity<ChatMessage> ask(
            @Valid @RequestBody AskRequest req,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        java.util.List<Long> docIds = resolveAndValidateDocIds(req, user.userId());
        Long primaryDocId = req.documentId() != null ? req.documentId() : docIds.get(0);
        ChatMessage msg = ragQueryService.ask(user.userId(), primaryDocId, docIds, req.question());
        return ResponseEntity.ok(msg);
    }

    @PostMapping(value = "/ask/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter askStream(
            @Valid @RequestBody AskRequest req,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        java.util.List<Long> docIds = resolveAndValidateDocIds(req, user.userId());
        Long primaryDocId = req.documentId() != null ? req.documentId() : docIds.get(0);
        
        org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter = new org.springframework.web.servlet.mvc.method.annotation.SseEmitter(60000L);
        ragQueryService.askStream(user.userId(), primaryDocId, docIds, req.question(), emitter);
        return emitter;
    }

    @GetMapping("/history/{documentId}")
    public ResponseEntity<List<ChatMessage>> history(
            @PathVariable Long documentId,
            @AuthenticationPrincipal AuthenticatedUser user) {
        
        documentRepository.findAccessibleByIdAndUserId(documentId, user.userId())
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Document not found or access denied"));
        
        return ResponseEntity.ok(chatMessageRepository.findByDocumentIdOrderByCreatedAtAsc(documentId));
    }
}
