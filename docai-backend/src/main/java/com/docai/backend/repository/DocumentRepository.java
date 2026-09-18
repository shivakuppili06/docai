package com.docai.backend.repository;

import com.docai.backend.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByOwnerId(Long ownerId);
    java.util.Optional<Document> findByIdAndOwnerId(Long id, Long ownerId);

    @Query("SELECT DISTINCT d FROM Document d LEFT JOIN d.shares s WHERE d.ownerId = :userId OR s.sharedWith.id = :userId")
    List<Document> findAllAccessibleByUserId(@Param("userId") Long userId);

    @Query("SELECT d FROM Document d LEFT JOIN d.shares s WHERE d.id = :documentId AND (d.ownerId = :userId OR s.sharedWith.id = :userId)")
    java.util.Optional<Document> findAccessibleByIdAndUserId(@Param("documentId") Long documentId, @Param("userId") Long userId);
}
