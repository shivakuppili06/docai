package com.docai.backend.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", insertable = false, updatable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private User owner;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String storagePath;

    @Enumerated(EnumType.STRING)
    private DocumentStatus status = DocumentStatus.PENDING;

    private Instant uploadedAt = Instant.now();

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentShare> shares = new ArrayList<>();

    public enum DocumentStatus {
        PENDING, PROCESSING, INDEXED, FAILED
    }

    public Document() {
    }

    public Document(Long id, Long ownerId, String fileName, String storagePath, DocumentStatus status, Instant uploadedAt) {
        this.id = id;
        this.ownerId = ownerId;
        this.fileName = fileName;
        this.storagePath = storagePath;
        this.status = status != null ? status : DocumentStatus.PENDING;
        this.uploadedAt = uploadedAt != null ? uploadedAt : Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public DocumentStatus getStatus() {
        return status;
    }

    public void setStatus(DocumentStatus status) {
        this.status = status;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public List<DocumentShare> getShares() {
        return shares;
    }

    public void setShares(List<DocumentShare> shares) {
        this.shares = shares;
    }

    public static DocumentBuilder builder() {
        return new DocumentBuilder();
    }

    public static class DocumentBuilder {
        private Long id;
        private Long ownerId;
        private String fileName;
        private String storagePath;
        private DocumentStatus status = DocumentStatus.PENDING;
        private Instant uploadedAt = Instant.now();

        public DocumentBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public DocumentBuilder ownerId(Long ownerId) {
            this.ownerId = ownerId;
            return this;
        }

        public DocumentBuilder fileName(String fileName) {
            this.fileName = fileName;
            return this;
        }

        public DocumentBuilder storagePath(String storagePath) {
            this.storagePath = storagePath;
            return this;
        }

        public DocumentBuilder status(DocumentStatus status) {
            this.status = status;
            return this;
        }

        public DocumentBuilder uploadedAt(Instant uploadedAt) {
            this.uploadedAt = uploadedAt;
            return this;
        }

        public Document build() {
            return new Document(id, ownerId, fileName, storagePath, status, uploadedAt);
        }
    }
}
