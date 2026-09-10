package com.docai.backend.event;

public record DocumentProcessingEvent(Long documentId, String storagePath, Long ownerId) {
}
