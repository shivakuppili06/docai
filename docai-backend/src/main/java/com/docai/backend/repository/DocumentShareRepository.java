package com.docai.backend.repository;

import com.docai.backend.model.DocumentShare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentShareRepository extends JpaRepository<DocumentShare, Long> {
    List<DocumentShare> findByDocumentId(Long documentId);
    List<DocumentShare> findBySharedWithId(Long userId);
    Optional<DocumentShare> findByDocumentIdAndSharedWithId(Long documentId, Long userId);
}
