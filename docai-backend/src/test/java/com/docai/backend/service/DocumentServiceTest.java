package com.docai.backend.service;

import com.docai.backend.model.Document;
import com.docai.backend.repository.DocumentRepository;
import com.docai.backend.repository.DocumentShareRepository;
import com.docai.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock private DocumentRepository documentRepository;
    @Mock private DocumentShareRepository documentShareRepository;
    @Mock private UserRepository userRepository;
    @Mock private AmqpTemplate rabbitTemplate;
    @Mock private S3Client s3Client;
    @Mock private S3Presigner s3Presigner;
    @Mock private java.util.concurrent.Executor rabbitMqFallbackExecutor;

    @InjectMocks
    private DocumentService documentService;

    @Test
    void upload_invalidExtension() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(100L);
        when(file.getOriginalFilename()).thenReturn("test.exe");
        
        // Reflection to set max file size
        org.springframework.test.util.ReflectionTestUtils.setField(documentService, "maxFileSize", 20971520L);

        assertThrows(IllegalArgumentException.class, () -> documentService.upload(file, 1L));
    }
    
    @Test
    void getDocument_successOwner() {
        Document doc = Document.builder().id(1L).ownerId(2L).build();
        when(documentRepository.findById(1L)).thenReturn(Optional.of(doc));

        Document result = documentService.getDocument(1L, 2L);
        assertEquals(1L, result.getId());
    }

    @Test
    void getDocument_unauthorized() {
        Document doc = Document.builder().id(1L).ownerId(2L).build();
        when(documentRepository.findById(1L)).thenReturn(Optional.of(doc));
        when(documentShareRepository.findByDocumentIdAndSharedWithId(1L, 3L)).thenReturn(Optional.empty());

        assertThrows(SecurityException.class, () -> documentService.getDocument(1L, 3L));
    }
    
    @Test
    void delete_successOwner() {
        org.springframework.test.util.ReflectionTestUtils.setField(documentService, "ragServiceBaseUrl", "http://localhost:8000");
        org.springframework.test.util.ReflectionTestUtils.setField(documentService, "serviceApiKey", "secret");
        Document doc = Document.builder().id(1L).ownerId(2L).status(Document.DocumentStatus.INDEXED).build();
        when(documentRepository.findById(1L)).thenReturn(Optional.of(doc));

        documentService.delete(1L, 2L);
        assertEquals(Document.DocumentStatus.DELETE_FAILED, doc.getStatus());
        verify(documentRepository, times(2)).save(doc);
    }
}
