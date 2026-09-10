package com.docai.backend.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private User user;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", insertable = false, updatable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private Document document;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String question;

    @Column(columnDefinition = "TEXT")
    private String answer;

    @Column(columnDefinition = "TEXT")
    private String sourceCitations;

    private Instant createdAt = Instant.now();

    public ChatMessage() {
    }

    public ChatMessage(Long id, Long userId, Long documentId, String question, String answer, String sourceCitations, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.documentId = documentId;
        this.question = question;
        this.answer = answer;
        this.sourceCitations = sourceCitations;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getSourceCitations() {
        return sourceCitations;
    }

    public void setSourceCitations(String sourceCitations) {
        this.sourceCitations = sourceCitations;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public static ChatMessageBuilder builder() {
        return new ChatMessageBuilder();
    }

    public static class ChatMessageBuilder {
        private Long id;
        private Long userId;
        private Long documentId;
        private String question;
        private String answer;
        private String sourceCitations;
        private Instant createdAt = Instant.now();

        public ChatMessageBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public ChatMessageBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public ChatMessageBuilder documentId(Long documentId) {
            this.documentId = documentId;
            return this;
        }

        public ChatMessageBuilder question(String question) {
            this.question = question;
            return this;
        }

        public ChatMessageBuilder answer(String answer) {
            this.answer = answer;
            return this;
        }

        public ChatMessageBuilder sourceCitations(String sourceCitations) {
            this.sourceCitations = sourceCitations;
            return this;
        }

        public ChatMessageBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ChatMessage build() {
            return new ChatMessage(id, userId, documentId, question, answer, sourceCitations, createdAt);
        }
    }
}
