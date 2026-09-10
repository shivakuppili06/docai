package com.docai.backend.repository;

import com.docai.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByDocumentIdOrderByCreatedAtAsc(Long documentId);
}
