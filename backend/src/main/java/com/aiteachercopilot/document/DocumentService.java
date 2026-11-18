package com.aiteachercopilot.document;

import com.aiteachercopilot.common.exception.CorruptFileException;
import com.aiteachercopilot.common.exception.EmptyFileException;
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

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024;

    @Transactional
    public DocumentDto.UploadResponse upload(UUID workspaceId, UUID userId,
                                              MultipartFile file,
                                              String subject, String gradeLevel,
                                              String topic) {

        workspaceService.findAndAuthorize(workspaceId, userId);

        if (file.isEmpty()) {
            throw new EmptyFileException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File exceeds maximum size of 50MB");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = file.getName();
        }
        if (originalFilename != null) {
            if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
                throw new IllegalArgumentException("Suspicious file name detected");
            }
            String lower = originalFilename.toLowerCase();
            if (lower.endsWith(".exe") || lower.endsWith(".bat") || lower.endsWith(".sh")
                    || lower.endsWith(".dll") || lower.endsWith(".zip") || lower.endsWith(".tar")
                    || lower.endsWith(".gz") || lower.endsWith(".7z")) {
                throw new IllegalArgumentException("Unsupported file type. Executable or archive files are not allowed. Allowed: PDF, DOCX, TXT");
            }
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                    "Unsupported file type. Allowed: PDF, DOCX, TXT");
        }

        validateFileIntegrity(file, contentType);

        String objectKey = String.format("%s/%s/%s_%s",
                workspaceId, userId, UUID.randomUUID(),
                sanitizeFileName(file.getOriginalFilename()));

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

        aiServiceWebClient.post()
                .uri(uriBuilder -> uriBuilder.path("/ingestion/process")
                        .queryParam("document_id", savedDocId)
                        .queryParam("workspace_id", workspaceId)
                        .queryParam("minio_object_key", objectKey)
                        .build())
                .retrieve()
                .bodyToMono(Void.class)
                .doOnSuccess(v -> log.info("Successfully triggered AI processing for document: {}", savedDocId))
                .subscribe(v -> {}, e -> log.warn("AI service trigger completed with error: {}", e.getMessage()));

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

    /**
     * Validates file signatures and basic structural integrity [BE-035].
     * Detects corrupt files before upload to MinIO.
     */
    private void validateFileIntegrity(MultipartFile file, String contentType) {
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[Math.min(1024, (int) file.getSize())];
            int read = is.read(header);
            if (read <= 0) {
                throw new EmptyFileException("File is empty");
            }

            if ("application/pdf".equalsIgnoreCase(contentType)) {
                String headerStr = new String(header, 0, read, java.nio.charset.StandardCharsets.ISO_8859_1);
                if (!headerStr.contains("%PDF")) {
                    throw new CorruptFileException("Tập tin PDF không hợp lệ hoặc bị hỏng (thiếu header %PDF)");
                }
            } else if ("application/vnd.openxmlformats-officedocument.wordprocessingml.document".equalsIgnoreCase(contentType)) {
                // ZIP signature: PK\x03\x04 or PK\x05\x06
                if (read < 2 || header[0] != 0x50 || header[1] != 0x4B) {
                    throw new CorruptFileException("Tập tin DOCX không hợp lệ hoặc bị hỏng (thiếu header ZIP OpenXML)");
                }
            } else if ("text/plain".equalsIgnoreCase(contentType)) {
                for (int i = 0; i < read; i++) {
                    if (header[i] == 0) {
                        throw new CorruptFileException("Tập tin văn bản chứa ký tự nhị phân không hợp lệ");
                    }
                }
            }
        } catch (CorruptFileException | EmptyFileException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to inspect file stream", e);
            throw new CorruptFileException("Không thể đọc cấu trúc tập tin tải lên: " + e.getMessage(), e);
        }
    }
}
