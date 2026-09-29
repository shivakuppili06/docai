package com.docai.backend.service;

import com.docai.backend.config.RabbitMQConfig;
import com.docai.backend.event.DocumentProcessingEvent;
import com.docai.backend.model.Document;
import com.docai.backend.repository.DocumentRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import java.time.Duration;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final com.docai.backend.repository.DocumentShareRepository documentShareRepository;
    private final com.docai.backend.repository.UserRepository userRepository;
    private final RabbitTemplate rabbitTemplate;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @org.springframework.beans.factory.annotation.Value("${app.rag-service.base-url}")
    private String ragServiceBaseUrl;

    @org.springframework.beans.factory.annotation.Value("${app.rag-service.api-key}")
    private String serviceApiKey;

    @org.springframework.beans.factory.annotation.Value("${aws.s3-bucket}")
    private String s3Bucket;

    public DocumentService(DocumentRepository documentRepository, 
                           com.docai.backend.repository.DocumentShareRepository documentShareRepository,
                           com.docai.backend.repository.UserRepository userRepository,
                           RabbitTemplate rabbitTemplate, 
                           S3Client s3Client,
                           S3Presigner s3Presigner) {
        this.documentRepository = documentRepository;
        this.documentShareRepository = documentShareRepository;
        this.userRepository = userRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    public Document upload(MultipartFile file, Long ownerId) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String s3Key = "documents/" + UUID.randomUUID() + "-" + originalFilename;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3Bucket)
                .key(s3Key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        Document doc = Document.builder()
                .ownerId(ownerId)
                .fileName(originalFilename)
                .storagePath(s3Key)
                .status(Document.DocumentStatus.PENDING)
                .build();

        doc = documentRepository.save(doc);

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.DOCUMENT_PROCESSING_QUEUE,
                    new DocumentProcessingEvent(doc.getId(), doc.getStoragePath(), ownerId)
            );
            doc.setStatus(Document.DocumentStatus.PROCESSING);
        } catch (org.springframework.amqp.AmqpException e) {
            System.err.println("RabbitMQ unavailable, falling back to direct RAG /ingest: " + e.getMessage());
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.node.ObjectNode bodyNode = mapper.createObjectNode();
                bodyNode.put("document_id", doc.getId());
                bodyNode.put("storage_path", doc.getStoragePath());
                bodyNode.put("owner_id", ownerId);
                byte[] jsonBytes = mapper.writeValueAsBytes(bodyNode);

                java.net.http.HttpClient httpClient = java.net.http.HttpClient.newBuilder()
                        .version(java.net.http.HttpClient.Version.HTTP_1_1)
                        .build();
                java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create(ragServiceBaseUrl + "/ingest"))
                        .header("Content-Type", "application/json")
                        .header("X-Service-Token", serviceApiKey)
                        .POST(java.net.http.HttpRequest.BodyPublishers.ofByteArray(jsonBytes))
                        .build();
                java.net.http.HttpResponse<String> response = httpClient.send(request,
                        java.net.http.HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    doc.setStatus(Document.DocumentStatus.INDEXED);
                } else {
                    System.err.println("RAG /ingest returned " + response.statusCode() + ": " + response.body());
                    doc.setStatus(Document.DocumentStatus.FAILED);
                }
            } catch (IOException | InterruptedException ex) {
                System.err.println("Direct RAG ingestion failed: " + ex.getMessage());
                doc.setStatus(Document.DocumentStatus.FAILED);
            }
        }
        return documentRepository.save(doc);
    }

    public List<Document> listForUser(Long ownerId) {
        return documentRepository.findAllAccessibleByUserId(ownerId);
    }

    public Document getDocument(Long documentId, Long userId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));
        // Check if user is owner or if they have it shared (simple check for now)
        if (!doc.getOwnerId().equals(userId)) {
            boolean hasShare = documentShareRepository.findByDocumentIdAndSharedWithId(documentId, userId).isPresent();
            if (!hasShare) {
                throw new SecurityException("Not authorized to view this document");
            }
        }
        return doc;
    }

    public String generatePresignedUrl(Long documentId, Long userId) {
        Document doc = getDocument(documentId, userId); // Will throw if not found or no auth

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(s3Bucket)
                .key(doc.getStoragePath())
                .responseContentType("application/pdf")
                .responseContentDisposition("inline; filename=\"" + doc.getFileName() + "\"")
                .build();

        GetObjectPresignRequest getObjectPresignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(60))
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presignedGetObjectRequest = s3Presigner.presignGetObject(getObjectPresignRequest);
        return presignedGetObjectRequest.url().toString();
    }

    public Document updateStatus(Long documentId, Document.DocumentStatus status) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));
        doc.setStatus(status);
        return documentRepository.save(doc);
    }

    public void delete(Long documentId, Long ownerId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));
                
        if (!doc.getOwnerId().equals(ownerId)) {
            throw new SecurityException("Not authorized to delete this document");
        }

        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(s3Bucket)
                    .key(doc.getStoragePath())
                    .build();
            s3Client.deleteObject(deleteObjectRequest);
        } catch (software.amazon.awssdk.services.s3.model.S3Exception e) {
            System.err.println("Failed to delete S3 object: " + e.getMessage());
        }

        try {
            java.net.http.HttpClient httpClient = java.net.http.HttpClient.newBuilder()
                    .version(java.net.http.HttpClient.Version.HTTP_1_1)
                    .build();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(ragServiceBaseUrl + "/documents/" + documentId))
                    .header("X-Service-Token", serviceApiKey)
                    .DELETE()
                    .build();
            httpClient.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException e) {
            System.err.println("Failed to delete vectors from RAG service: " + e.getMessage());
        }

        documentRepository.delete(doc);
    }

    public void shareDocument(Long documentId, Long ownerId, Long targetUserId, com.docai.backend.model.DocumentShareRole role) {
        Document doc = documentRepository.findByIdAndOwnerId(documentId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found or you are not the owner: " + documentId));
                
        com.docai.backend.model.User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + targetUserId));
                
        com.docai.backend.model.DocumentShare share = documentShareRepository.findByDocumentIdAndSharedWithId(documentId, targetUserId)
                .orElse(new com.docai.backend.model.DocumentShare(doc, targetUser, role));
                
        share.setRole(role);
        documentShareRepository.save(share);
    }
}
