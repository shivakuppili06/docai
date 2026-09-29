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
import java.util.List;

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
    public ResponseEntity<List<Document>> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(documentService.listForUser(user.userId()));
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

    @org.springframework.beans.factory.annotation.Value("${app.rag-service.api-key}")
    private String serviceApiKey;

    // Internal callback used by the Python RAG worker to report ingestion status.
    @PatchMapping("/{id}/status")
    public ResponseEntity<Document> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest req,
            @RequestHeader(value = "X-Service-Token", required = false) String serviceToken
    ) {
        if (serviceToken == null || !serviceToken.equals(serviceApiKey)) {
            return ResponseEntity.status(401).build();
        }
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
