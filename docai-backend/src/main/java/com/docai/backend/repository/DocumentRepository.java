package com.docai.backend.repository;

import com.docai.backend.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByOwnerId(Long ownerId);
    java.util.Optional<Document> findByIdAndOwnerId(Long id, Long ownerId);
    List<Document> findByStatusIn(List<Document.DocumentStatus> statuses);

    @Query(value = "SELECT DISTINCT d FROM Document d LEFT JOIN FETCH d.owner LEFT JOIN d.shares s WHERE (d.ownerId = :userId OR s.sharedWith.id = :userId) AND d.status NOT IN ('DELETING', 'DELETE_FAILED')",
           countQuery = "SELECT COUNT(DISTINCT d) FROM Document d LEFT JOIN d.shares s WHERE (d.ownerId = :userId OR s.sharedWith.id = :userId) AND d.status NOT IN ('DELETING', 'DELETE_FAILED')")
    org.springframework.data.domain.Page<Document> findAllAccessibleByUserId(@Param("userId") Long userId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT d FROM Document d LEFT JOIN FETCH d.owner LEFT JOIN d.shares s WHERE d.id = :documentId AND (d.ownerId = :userId OR s.sharedWith.id = :userId) AND d.status NOT IN ('DELETING', 'DELETE_FAILED')")
    java.util.Optional<Document> findAccessibleByIdAndUserId(@Param("documentId") Long documentId, @Param("userId") Long userId);
}
