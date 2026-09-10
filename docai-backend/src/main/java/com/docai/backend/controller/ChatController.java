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

    public ChatController(RagQueryService ragQueryService, ChatMessageRepository chatMessageRepository) {
        this.ragQueryService = ragQueryService;
        this.chatMessageRepository = chatMessageRepository;
    }

    @PostMapping("/ask")
    public ResponseEntity<ChatMessage> ask(
            @Valid @RequestBody AskRequest req,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        ChatMessage msg = ragQueryService.ask(user.userId(), req.documentId(), req.question());
        return ResponseEntity.ok(msg);
    }

    @GetMapping("/history/{documentId}")
    public ResponseEntity<List<ChatMessage>> history(@PathVariable Long documentId) {
        return ResponseEntity.ok(chatMessageRepository.findByDocumentIdOrderByCreatedAtAsc(documentId));
    }
}
