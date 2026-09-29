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

    @PostMapping("/ask")
    public ResponseEntity<ChatMessage> ask(
            @Valid @RequestBody AskRequest req,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        documentRepository.findAccessibleByIdAndUserId(req.documentId(), user.userId())
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Document not found or access denied"));
        ChatMessage msg = ragQueryService.ask(user.userId(), req.documentId(), req.question());
        return ResponseEntity.ok(msg);
    }

    @PostMapping(value = "/ask/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter askStream(
            @Valid @RequestBody AskRequest req,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        documentRepository.findAccessibleByIdAndUserId(req.documentId(), user.userId())
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Document not found or access denied"));
        return ragQueryService.askStream(user.userId(), req.documentId(), req.question());
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
