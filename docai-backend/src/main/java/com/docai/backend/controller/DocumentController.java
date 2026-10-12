package com.docai.backend.controller;

import com.docai.backend.dto.StatusUpdateRequest;
import com.docai.backend.model.Document;
import com.docai.backend.security.AuthenticatedUser;
import com.docai.backend.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<Document> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AuthenticatedUser user
    ) throws IOException {
        return ResponseEntity.ok(documentService.upload(file, user.userId()));
    }

    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<Document>> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "uploadedAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction
    ) {
        if (size > 100) size = 100;
        return ResponseEntity.ok(documentService.listForUser(user.userId(), page, size, sort, direction));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        try {
            return ResponseEntity.ok(documentService.getDocument(id, user.userId()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/url")
    public ResponseEntity<java.util.Map<String, String>> getDocumentUrl(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        try {
            String url = documentService.generatePresignedUrl(id, user.userId());
            return ResponseEntity.ok(java.util.Map.of("url", url));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Internal callback used by the Python RAG worker to report ingestion status.
    @PatchMapping("/{id}/status")
    public ResponseEntity<Document> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest req
    ) {
        return ResponseEntity.ok(documentService.updateStatus(id, req.status()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        documentService.delete(id, user.userId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<Void> shareDocument(
            @PathVariable Long id,
            @RequestParam("userId") Long targetUserId,
            @RequestParam(value = "role", defaultValue = "VIEWER") com.docai.backend.model.DocumentShareRole role,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        documentService.shareDocument(id, user.userId(), targetUserId, role);
        return ResponseEntity.ok().build();
    }
}
