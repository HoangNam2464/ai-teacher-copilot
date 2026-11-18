package com.aiteachercopilot.document;

import com.aiteachercopilot.auth.JwtTokenProvider;
import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import com.aiteachercopilot.workspace.Workspace;
import com.aiteachercopilot.workspace.WorkspaceRepository;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * QA Integration Tests for [QA-011]: Test Document Upload, MinIO Storage & Metadata Persistence (ATC-37 / ATC-205).
 * Validates multipart file uploads, MinIO object routing, database metadata persistence,
 * workspace ownership boundaries, file validation, and document deletion.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DocumentUploadIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private MinioClient minioClient;

    private User teacherA;
    private User teacherB;

    private String tokenA;

    private Workspace workspaceA;
    private Workspace workspaceB;

    @BeforeEach
    void setUp() {
        documentRepository.deleteAll();
        workspaceRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Seed Teacher A
        teacherA = User.builder()
                .email("teacher.upload.a@school.edu.vn")
                .fullName("Cô Lê Thị A")
                .passwordHash(passwordEncoder.encode("PassA2026!"))
                .role("TEACHER")
                .isActive(true)
                .build();
        teacherA = userRepository.save(teacherA);
        tokenA = jwtTokenProvider.generateToken(teacherA.getId(), teacherA.getEmail());

        // 2. Seed Teacher B
        teacherB = User.builder()
                .email("teacher.upload.b@school.edu.vn")
                .fullName("Thầy Phạm Văn B")
                .passwordHash(passwordEncoder.encode("PassB2026!"))
                .role("TEACHER")
                .isActive(true)
                .build();
        teacherB = userRepository.save(teacherB);

        // 3. Seed Workspace for Teacher A
        workspaceA = Workspace.builder()
                .ownerId(teacherA.getId())
                .name("Toán Lớp 10 - Chương 1")
                .subject("Toán học")
                .gradeLevel("10")
                .isActive(true)
                .build();
        workspaceA = workspaceRepository.save(workspaceA);

        // 4. Seed Workspace for Teacher B
        workspaceB = Workspace.builder()
                .ownerId(teacherB.getId())
                .name("Hóa Học Lớp 11")
                .subject("Hóa học")
                .gradeLevel("11")
                .isActive(true)
                .build();
        workspaceB = workspaceRepository.save(workspaceB);
    }

    // =========================================================================
    // Scenario 1: Valid File Uploads (PDF, DOCX, TXT)
    // =========================================================================
    @Nested
    @DisplayName("Scenario 1: Valid File Uploads & Metadata Persistence")
    class ValidUploadTests {

        @Test
        @DisplayName("Should upload valid PDF file successfully, save to MinIO and persist metadata (HTTP 201)")
        void testUpload_ValidPdf_Success() throws Exception {
            byte[] pdfContent = "%PDF-1.4 sample syllabus content for Math 10".getBytes();
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "GiaoAnToan10.pdf",
                    "application/pdf",
                    pdfContent
            );

            mockMvc.perform(multipart("/workspaces/" + workspaceA.getId() + "/documents/upload")
                            .file(file)
                            .param("subject", "Toán học")
                            .param("gradeLevel", "10")
                            .param("topic", "Mệnh đề & Tập hợp")
                            .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNotEmpty())
                    .andExpect(jsonPath("$.data.fileName").value("GiaoAnToan10.pdf"))
                    .andExpect(jsonPath("$.data.fileType").value("application/pdf"))
                    .andExpect(jsonPath("$.data.fileSize").value(pdfContent.length))
                    .andExpect(jsonPath("$.data.processingStatus").value("PENDING"));

            // Verify MinIO putObject was called
            verify(minioClient, times(1)).putObject(any(PutObjectArgs.class));

            // Verify PostgreSQL metadata persistence
            List<Document> docs = documentRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceA.getId());
            assertThat(docs).hasSize(1);
            Document savedDoc = docs.get(0);
            assertThat(savedDoc.getFileName()).isEqualTo("GiaoAnToan10.pdf");
            assertThat(savedDoc.getSubject()).isEqualTo("Toán học");
            assertThat(savedDoc.getGradeLevel()).isEqualTo("10");
            assertThat(savedDoc.getTopic()).isEqualTo("Mệnh đề & Tập hợp");
            assertThat(savedDoc.getProcessingStatus()).isEqualTo("PENDING");
            assertThat(savedDoc.getMinioObjectKey()).startsWith(workspaceA.getId().toString() + "/" + teacherA.getId().toString());
        }

        @Test
        @DisplayName("Should upload valid DOCX file successfully (HTTP 201)")
        void testUpload_ValidDocx_Success() throws Exception {
            byte[] docxContent = "PK\u0003\u0004 sample docx content".getBytes();
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "BaiGiang.docx",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    docxContent
            );

            mockMvc.perform(multipart("/workspaces/" + workspaceA.getId() + "/documents/upload")
                            .file(file)
                            .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.fileName").value("BaiGiang.docx"))
                    .andExpect(jsonPath("$.data.fileType").value("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));

            verify(minioClient, times(1)).putObject(any(PutObjectArgs.class));
        }

        @Test
        @DisplayName("Should upload valid plain text TXT file successfully (HTTP 201)")
        void testUpload_ValidTxt_Success() throws Exception {
            byte[] txtContent = "Nội dung bài tập về nhà môn Toán".getBytes();
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "notes.txt",
                    "text/plain",
                    txtContent
            );

            mockMvc.perform(multipart("/workspaces/" + workspaceA.getId() + "/documents/upload")
                            .file(file)
                            .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.fileName").value("notes.txt"))
                    .andExpect(jsonPath("$.data.fileType").value("text/plain"));

            verify(minioClient, times(1)).putObject(any(PutObjectArgs.class));
        }
    }

    // =========================================================================
    // Scenario 2: Validation & Error Handling (Empty, Format, Size)
    // =========================================================================
    @Nested
    @DisplayName("Scenario 2: Validation & Error Rejection")
    class ValidationRejectionTests {

        @Test
        @DisplayName("Should reject empty (0 bytes) file with HTTP 400 Bad Request")
        void testUpload_EmptyFile_BadRequest() throws Exception {
            MockMultipartFile emptyFile = new MockMultipartFile(
                    "file",
                    "empty.pdf",
                    "application/pdf",
                    new byte[0]
            );

            mockMvc.perform(multipart("/workspaces/" + workspaceA.getId() + "/documents/upload")
                            .file(emptyFile)
                            .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("File is empty"));

            verify(minioClient, never()).putObject(any());
        }

        @Test
        @DisplayName("Should reject unsupported file format (e.g. .exe / application/x-msdownload) with HTTP 400")
        void testUpload_UnsupportedFormat_BadRequest() throws Exception {
            MockMultipartFile exeFile = new MockMultipartFile(
                    "file",
                    "malware.exe",
                    "application/x-msdownload",
                    "MZ executable content".getBytes()
            );

            mockMvc.perform(multipart("/workspaces/" + workspaceA.getId() + "/documents/upload")
                            .file(exeFile)
                            .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value(containsString("Unsupported file type")));

            verify(minioClient, never()).putObject(any());
        }
    }

    // =========================================================================
    // Scenario 3: Workspace Ownership Security Boundary (AC-4 & AC-5)
    // =========================================================================
    @Nested
    @DisplayName("Scenario 3: Workspace Ownership & Cross-Tenant Boundary")
    class OwnershipBoundaryTests {

        @Test
        @DisplayName("Teacher A attempting to upload document into Teacher B's workspace must be rejected with HTTP 403 Forbidden")
        void testUpload_CrossWorkspace_Forbidden() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "StealthDoc.pdf",
                    "application/pdf",
                    "content".getBytes()
            );

            mockMvc.perform(multipart("/workspaces/" + workspaceB.getId() + "/documents/upload")
                            .file(file)
                            .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("You do not have access to this workspace"));

            verify(minioClient, never()).putObject(any());
            assertThat(documentRepository.countByWorkspaceId(workspaceB.getId())).isZero();
        }

        @Test
        @DisplayName("Teacher A attempting to list documents in Teacher B's workspace must be rejected with HTTP 403 Forbidden")
        void testListDocuments_CrossWorkspace_Forbidden() throws Exception {
            mockMvc.perform(get("/workspaces/" + workspaceB.getId() + "/documents")
                            .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("You do not have access to this workspace"));
        }
    }

    // =========================================================================
    // Scenario 4: Document Deletion & MinIO Cleanup
    // =========================================================================
    @Nested
    @DisplayName("Scenario 4: Document Deletion & Resource Cleanup")
    class DocumentDeletionTests {

        @Test
        @DisplayName("Owner deleting document should succeed with HTTP 204, delete DB record and call MinIO remove")
        void testDeleteDocument_OwnerAccess_Success() throws Exception {
            // 1. Seed document
            Document doc = Document.builder()
                    .workspaceId(workspaceA.getId())
                    .uploadedBy(teacherA.getId())
                    .fileName("GiaoAnDeXoa.pdf")
                    .fileType("application/pdf")
                    .fileSize(1024L)
                    .minioObjectKey(workspaceA.getId() + "/" + teacherA.getId() + "/test_file.pdf")
                    .processingStatus("READY")
                    .build();
            doc = documentRepository.save(doc);

            // 2. Delete document
            mockMvc.perform(delete("/workspaces/" + workspaceA.getId() + "/documents/" + doc.getId())
                            .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isNoContent());

            // 3. Verify deleted from PostgreSQL
            assertThat(documentRepository.findById(doc.getId())).isEmpty();

            // 4. Verify MinIO removeObject called
            verify(minioClient, times(1)).removeObject(any(RemoveObjectArgs.class));
        }

        @Test
        @DisplayName("Teacher A attempting to delete Teacher B's document must return HTTP 403 Forbidden")
        void testDeleteDocument_CrossWorkspace_Forbidden() throws Exception {
            // Seed document for Teacher B
            Document docB = Document.builder()
                    .workspaceId(workspaceB.getId())
                    .uploadedBy(teacherB.getId())
                    .fileName("TaiLieuThayB.pdf")
                    .fileType("application/pdf")
                    .fileSize(2048L)
                    .minioObjectKey(workspaceB.getId() + "/" + teacherB.getId() + "/doc_b.pdf")
                    .processingStatus("READY")
                    .build();
            docB = documentRepository.save(docB);

            // Teacher A attempts delete
            mockMvc.perform(delete("/workspaces/" + workspaceB.getId() + "/documents/" + docB.getId())
                            .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.error").value("You do not have access to this workspace"));

            // Verify document still exists in DB
            assertThat(documentRepository.findById(docB.getId())).isPresent();
            verify(minioClient, never()).removeObject(any());
        }
    }
}
