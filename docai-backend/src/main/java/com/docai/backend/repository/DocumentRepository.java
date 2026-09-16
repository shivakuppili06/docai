package com.docai.backend.repository;

import com.docai.backend.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByOwnerId(Long ownerId);
    java.util.Optional<Document> findByIdAndOwnerId(Long id, Long ownerId);
}
