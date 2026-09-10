package com.aiteachercopilot.document;

import com.aiteachercopilot.common.exception.ResourceNotFoundException;
import com.aiteachercopilot.workspace.WorkspaceService;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.InputStream;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Document service — handles file upload to MinIO, metadata persistence,
 * and document listing with workspace authorization.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final WorkspaceService workspaceService;
    private final MinioClient minioClient;
    private final WebClient aiServiceWebClient;

    @Value("${app.minio.bucket-documents}")
    private String bucketName;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
    );

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

    /**
     * Upload a document to MinIO and save metadata.
     * The file is treated as untrusted data.
     */
    @Transactional
    public DocumentDto.UploadResponse upload(UUID workspaceId, UUID userId,
                                              MultipartFile file,
                                              String subject, String gradeLevel,
                                              String topic) {
        // Verify workspace ownership
        workspaceService.findAndAuthorize(workspaceId, userId);

        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File exceeds maximum size of 50MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                    "Unsupported file type. Allowed: PDF, DOCX, TXT");
        }

        // Generate a unique object key
        String objectKey = String.format("%s/%s/%s_%s",
                workspaceId, userId, UUID.randomUUID(),
                sanitizeFileName(file.getOriginalFilename()));

        // Upload to MinIO
        try (InputStream is = file.getInputStream()) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectKey)
                    .stream(is, file.getSize(), -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            log.error("Failed to upload file to MinIO", e);
            throw new RuntimeException("File upload failed", e);
        }

        // Save metadata
        Document doc = Document.builder()
                .workspaceId(workspaceId)
                .uploadedBy(userId)
                .fileName(file.getOriginalFilename())
                .fileType(contentType)
                .fileSize(file.getSize())
                .minioObjectKey(objectKey)
                .processingStatus("PENDING")
                .subject(subject)
                .gradeLevel(gradeLevel)
                .topic(topic)
                .build();

        doc = documentRepository.save(doc);
        final java.util.UUID savedDocId = doc.getId();
        log.info("Document uploaded: {} -> {}", savedDocId, objectKey);

        // Trigger AI processing asynchronously
        aiServiceWebClient.post()
                .uri(uriBuilder -> uriBuilder.path("/ingestion/process")
                        .queryParam("document_id", savedDocId)
                        .queryParam("workspace_id", workspaceId)
                        .queryParam("minio_object_key", objectKey)
                        .build())
                .retrieve()
                .bodyToMono(Void.class)
                .doOnSuccess(v -> log.info("Successfully triggered AI processing for document: {}", savedDocId))
                .doOnError(e -> log.error("Failed to trigger AI processing for document: {}", savedDocId, e))
                .subscribe();

        return DocumentDto.UploadResponse.fromEntity(doc);
    }

    @Transactional(readOnly = true)
    public List<DocumentDto.ListResponse> listByWorkspace(UUID workspaceId, UUID userId) {
        workspaceService.findAndAuthorize(workspaceId, userId);
        return documentRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId)
                .stream()
                .map(DocumentDto.ListResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Document getDocument(UUID documentId, UUID workspaceId, UUID userId) {
        workspaceService.findAndAuthorize(workspaceId, userId);
        return documentRepository.findById(documentId)
                .filter(d -> d.getWorkspaceId().equals(workspaceId))
                .orElseThrow(() -> new ResourceNotFoundException("Document", documentId));
    }

    /**
     * Delete document: verifies workspace ownership, removes object from MinIO,
     * and deletes database records.
     */
    @Transactional
    public void deleteDocument(UUID documentId, UUID workspaceId, UUID userId) {
        workspaceService.findAndAuthorize(workspaceId, userId);
        Document document = documentRepository.findById(documentId)
                .filter(d -> d.getWorkspaceId().equals(workspaceId))
                .orElseThrow(() -> new ResourceNotFoundException("Document", documentId));

        // 1. Remove MinIO object if exists
        if (document.getMinioObjectKey() != null) {
            try {
                minioClient.removeObject(
                        RemoveObjectArgs.builder()
                                .bucket(bucketName)
                                .object(document.getMinioObjectKey())
                                .build()
                );
                log.info("Removed MinIO object: {}", document.getMinioObjectKey());
            } catch (Exception e) {
                log.warn("Failed to remove MinIO object {}: {}", document.getMinioObjectKey(), e.getMessage());
            }
        }

        // 2. Delete database record
        documentRepository.delete(document);
        log.info("Document deleted successfully: {}", documentId);
    }

    /**
     * Sanitize file name to prevent path traversal.
     * Uploaded documents are untrusted data.
     */
    private String sanitizeFileName(String fileName) {
        if (fileName == null) return "unnamed";
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
