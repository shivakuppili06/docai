package com.docai.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "document_shares")
public class DocumentShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_with_user_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private User sharedWith;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentShareRole role = DocumentShareRole.VIEWER;

    public DocumentShare() {}

    public DocumentShare(Document document, User sharedWith, DocumentShareRole role) {
        this.document = document;
        this.sharedWith = sharedWith;
        this.role = role != null ? role : DocumentShareRole.VIEWER;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }

    public User getSharedWith() { return sharedWith; }
    public void setSharedWith(User sharedWith) { this.sharedWith = sharedWith; }

    public DocumentShareRole getRole() { return role; }
    public void setRole(DocumentShareRole role) { this.role = role; }
}
