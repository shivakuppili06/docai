package com.docai.backend.service;

import com.docai.backend.config.RabbitMQConfig;
import com.docai.backend.event.DocumentProcessingEvent;
import com.docai.backend.model.Document;
import com.docai.backend.repository.DocumentRepository;
import org.springframework.amqp.core.AmqpTemplate;
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
    private final AmqpTemplate rabbitTemplate;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @org.springframework.beans.factory.annotation.Value("${app.rag-service.base-url}")
    private String ragServiceBaseUrl;

    @org.springframework.beans.factory.annotation.Value("${app.rag-service.api-key}")
    private String serviceApiKey;

    @org.springframework.beans.factory.annotation.Value("${aws.s3-bucket}")
    private String s3Bucket;

    private final java.util.concurrent.Executor rabbitMqFallbackExecutor;

    public DocumentService(DocumentRepository documentRepository, 
                           com.docai.backend.repository.DocumentShareRepository documentShareRepository,
                           com.docai.backend.repository.UserRepository userRepository,
                           AmqpTemplate rabbitTemplate, 
                           S3Client s3Client,
                           S3Presigner s3Presigner,
                           @org.springframework.beans.factory.annotation.Qualifier("rabbitMqFallbackExecutor") java.util.concurrent.Executor rabbitMqFallbackExecutor) {
        this.documentRepository = documentRepository;
        this.documentShareRepository = documentShareRepository;
        this.userRepository = userRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.rabbitMqFallbackExecutor = rabbitMqFallbackExecutor;
    }

    @org.springframework.beans.factory.annotation.Value("${app.document.max-file-size:20971520}")
    private long maxFileSize;

    @org.springframework.beans.factory.annotation.Value("${app.document.presigned-url-duration-minutes:60}")
    private long presignedUrlDurationMinutes;

    public Document upload(MultipartFile file, Long ownerId) throws IOException {
        if (file.isEmpty() || file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File is empty or exceeds the size limit");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new IllegalArgumentException("Invalid filename");
        }
        
        // Sanitize filename
        String sanitizedFilename = originalFilename.replaceAll("[^a-zA-Z0-9.\\-_]", "_");
        String extension = "";
        int i = sanitizedFilename.lastIndexOf('.');
        if (i > 0) {
            extension = sanitizedFilename.substring(i).toLowerCase();
        }

        if (!List.of(".pdf", ".txt").contains(extension)) {
            throw new IllegalArgumentException("Unsupported file type. Only PDF and TXT are allowed.");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("application/pdf") && !contentType.equals("text/plain"))) {
            throw new IllegalArgumentException("Unsupported MIME type.");
        }

        // Magic byte check for PDF
        if (extension.equals(".pdf")) {
            byte[] magicBytes = new byte[4];
            java.io.InputStream is = file.getInputStream();
            if (is.read(magicBytes) != 4 || !new String(magicBytes).equals("%PDF")) {
                throw new IllegalArgumentException("Invalid file signature for PDF.");
            }
        }

        String s3Key = "documents/" + UUID.randomUUID() + "-" + sanitizedFilename;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3Bucket)
                .key(s3Key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        Document doc = Document.builder()
                .ownerId(ownerId)
                .fileName(sanitizedFilename)
                .storagePath(s3Key)
                .status(Document.DocumentStatus.PENDING)
                .build();

        doc = documentRepository.save(doc);

        try {
            String correlationId = org.slf4j.MDC.get("correlationId");
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.DOCUMENT_PROCESSING_QUEUE,
                    new DocumentProcessingEvent(doc.getId(), doc.getStoragePath(), ownerId),
                    message -> {
                        if (correlationId != null) {
                            message.getMessageProperties().setHeader("X-Correlation-ID", correlationId);
                        }
                        return message;
                    }
            );
            doc.setStatus(Document.DocumentStatus.PROCESSING);
        } catch (org.springframework.amqp.AmqpException e) {
            System.err.println("RabbitMQ unavailable, falling back to async direct RAG /ingest: " + e.getMessage());
            doc.setStatus(Document.DocumentStatus.PROCESSING);
            final Document finalDoc = doc;
            final String fallbackCorrelationId = org.slf4j.MDC.get("correlationId");
            
            // Execute the fallback asynchronously so the upload thread isn't blocked
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.node.ObjectNode bodyNode = mapper.createObjectNode();
                    bodyNode.put("document_id", finalDoc.getId());
                    bodyNode.put("storage_path", finalDoc.getStoragePath());
                    bodyNode.put("owner_id", ownerId);
                    byte[] jsonBytes = mapper.writeValueAsBytes(bodyNode);

                    java.net.http.HttpRequest.Builder requestBuilder = java.net.http.HttpRequest.newBuilder()
                            .uri(java.net.URI.create(ragServiceBaseUrl + "/ingest"))
                            .header("Content-Type", "application/json")
                            .header("X-Service-Token", serviceApiKey);
                    
                    if (fallbackCorrelationId != null) {
                        requestBuilder.header("X-Correlation-ID", fallbackCorrelationId);
                    }
                    
                    java.net.http.HttpRequest request = requestBuilder.POST(java.net.http.HttpRequest.BodyPublishers.ofByteArray(jsonBytes)).build();
                            
                    java.net.http.HttpClient httpClient = java.net.http.HttpClient.newBuilder()
                            .version(java.net.http.HttpClient.Version.HTTP_1_1)
                            .build();
                            
                    java.net.http.HttpResponse<String> response = httpClient.send(request,
                            java.net.http.HttpResponse.BodyHandlers.ofString());
                    if (response.statusCode() >= 200 && response.statusCode() < 300) {
                        finalDoc.setStatus(Document.DocumentStatus.INDEXED);
                    } else {
                        System.err.println("RAG /ingest returned " + response.statusCode() + ": " + response.body());
                        finalDoc.setStatus(Document.DocumentStatus.FAILED);
                    }
                    documentRepository.save(finalDoc);
                } catch (java.io.IOException | InterruptedException ex) {
                    System.err.println("Async direct RAG ingestion failed: " + ex.getMessage());
                    finalDoc.setStatus(Document.DocumentStatus.FAILED);
                    documentRepository.save(finalDoc);
                }
            }, rabbitMqFallbackExecutor);
        }
        return documentRepository.save(doc);
    }

    public org.springframework.data.domain.Page<Document> listForUser(Long ownerId, int page, int size, String sort, String direction) {
        org.springframework.data.domain.Sort.Direction dir = org.springframework.data.domain.Sort.Direction.fromString(direction);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(dir, sort));
        return documentRepository.findAllAccessibleByUserId(ownerId, pageable);
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
                .signatureDuration(Duration.ofMinutes(presignedUrlDurationMinutes))
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

    @org.springframework.transaction.annotation.Transactional
    public void delete(Long documentId, Long ownerId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));
                
        if (!doc.getOwnerId().equals(ownerId)) {
            throw new SecurityException("Not authorized to delete this document");
        }

        doc.setStatus(Document.DocumentStatus.DELETING);
        documentRepository.save(doc);
        
        // Attempt immediate cleanup
        cleanupDocument(doc);
    }

    private void cleanupDocument(Document doc) {
        boolean s3Success = false;
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(s3Bucket)
                    .key(doc.getStoragePath())
                    .build();
            s3Client.deleteObject(deleteObjectRequest);
            s3Success = true;
        } catch (software.amazon.awssdk.services.s3.model.S3Exception e) {
            System.err.println("Failed to delete S3 object: " + e.getMessage());
        }

        boolean ragSuccess = false;
        try {
            java.net.http.HttpClient httpClient = java.net.http.HttpClient.newBuilder()
                    .version(java.net.http.HttpClient.Version.HTTP_1_1)
                    .build();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(ragServiceBaseUrl + "/documents/" + doc.getId()))
                    .header("X-Service-Token", serviceApiKey)
                    .DELETE()
                    .build();
            java.net.http.HttpResponse<String> response = httpClient.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300 || response.statusCode() == 404) {
                ragSuccess = true;
            } else {
                System.err.println("Failed to delete vectors, status " + response.statusCode());
            }
        } catch (IOException | InterruptedException e) {
            System.err.println("Failed to delete vectors from RAG service: " + e.getMessage());
        }

        if (s3Success && ragSuccess) {
            documentRepository.delete(doc);
        } else {
            doc.setStatus(Document.DocumentStatus.DELETE_FAILED);
            documentRepository.save(doc);
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelayString = "${app.document.delete-retry-delay-ms:60000}")
    public void retryFailedDeletions() {
        List<Document> toDelete = documentRepository.findByStatusIn(List.of(
            Document.DocumentStatus.DELETING, 
            Document.DocumentStatus.DELETE_FAILED
        ));
        for (Document doc : toDelete) {
            cleanupDocument(doc);
        }
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
