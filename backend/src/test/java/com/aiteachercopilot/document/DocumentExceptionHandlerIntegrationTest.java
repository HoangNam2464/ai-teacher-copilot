package com.aiteachercopilot.document;

import com.aiteachercopilot.auth.JwtTokenProvider;
import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import com.aiteachercopilot.workspace.Workspace;
import com.aiteachercopilot.workspace.WorkspaceRepository;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration Test Suite for Corrupt Files & Empty Text Handling [BE-035].
 *
 * Verifies Acceptance Criteria:
 * 1. Corrupt files are detected before persistence and storage.
 * 2. Empty files/text are handled gracefully with HTTP 400 Bad Request.
 * 3. Clear, descriptive error messages are returned in API responses.
 * 4. Error messages and FAILED status are accurately persisted and exposed via DTOs.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DocumentExceptionHandlerIntegrationTest {

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

    private User teacher;
    private Workspace workspace;
    private String token;

    @BeforeEach
    void setUp() {
        documentRepository.deleteAll();
        workspaceRepository.deleteAll();
        userRepository.deleteAll();

        teacher = User.builder()
                .email("teacher.be035@school.edu.vn")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .fullName("Thầy Hoàng Nam")
                .role("TEACHER")
                .educationLevel("THPT")
                .plan("FREE")
                .isActive(true)
                .build();
        teacher = userRepository.save(teacher);

        workspace = Workspace.builder()
                .name("Toán 10 - Xử lý ngoại lệ tài liệu")
                .subject("Toán học")
                .gradeLevel("10")
                .ownerId(teacher.getId())
                .isActive(true)
                .build();
        workspace = workspaceRepository.save(workspace);

        token = jwtTokenProvider.generateToken(teacher.getId(), teacher.getEmail());
    }

    @Test
    @DisplayName("AC-1 & AC-3: Reject corrupt PDF file (missing %PDF header) with HTTP 400 and clear error")
    void testUpload_CorruptPdf_Rejected() throws Exception {
        byte[] corruptPdfContent = "This is not a real PDF file! Random corrupted bytes here.".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "corrupt_syllabus.pdf",
                "application/pdf",
                corruptPdfContent
        );

        mockMvc.perform(multipart("/workspaces/" + workspace.getId() + "/documents/upload")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Tập tin PDF không hợp lệ hoặc bị hỏng (thiếu header %PDF)"));

        // MinIO should never receive corrupt file
        verify(minioClient, never()).putObject(any(PutObjectArgs.class));
        assertThat(documentRepository.count()).isEqualTo(0);
    }

    @Test
    @DisplayName("AC-1 & AC-3: Reject corrupt DOCX file (missing ZIP header) with HTTP 400 and clear error")
    void testUpload_CorruptDocx_Rejected() throws Exception {
        byte[] corruptDocxContent = "NOT_A_ZIP_HEADER corrupt docx file content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "corrupted_exam.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                corruptDocxContent
        );

        mockMvc.perform(multipart("/workspaces/" + workspace.getId() + "/documents/upload")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Tập tin DOCX không hợp lệ hoặc bị hỏng (thiếu header ZIP OpenXML)"));

        verify(minioClient, never()).putObject(any(PutObjectArgs.class));
        assertThat(documentRepository.count()).isEqualTo(0);
    }

    @Test
    @DisplayName("AC-2 & AC-3: Reject empty file (0 bytes) with HTTP 400 Bad Request")
    void testUpload_EmptyFile_Rejected() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.pdf",
                "application/pdf",
                new byte[0]
        );

        mockMvc.perform(multipart("/workspaces/" + workspace.getId() + "/documents/upload")
                        .file(emptyFile)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("File is empty"));

        verify(minioClient, never()).putObject(any(PutObjectArgs.class));
    }

    @Test
    @DisplayName("AC-1 & AC-3: Reject text file with binary null bytes")
    void testUpload_TextFileWithBinaryBytes_Rejected() throws Exception {
        byte[] binaryTextContent = new byte[]{'H', 'e', 'l', 'l', 'o', 0x00, 'W', 'o', 'r', 'l', 'd'};
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "disguised_binary.txt",
                "text/plain",
                binaryTextContent
        );

        mockMvc.perform(multipart("/workspaces/" + workspace.getId() + "/documents/upload")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Tập tin văn bản chứa ký tự nhị phân không hợp lệ"));

        verify(minioClient, never()).putObject(any(PutObjectArgs.class));
    }

    @Test
    @DisplayName("AC-3 & AC-4: List documents exposes errorMessage and FAILED status accurately")
    void testListDocuments_ExposesFailedStatusAndErrorMessage() throws Exception {
        Document failedDoc = Document.builder()
                .workspaceId(workspace.getId())
                .uploadedBy(teacher.getId())
                .fileName("scanned_empty_image.pdf")
                .fileType("application/pdf")
                .fileSize(1024L)
                .minioObjectKey(workspace.getId() + "/" + teacher.getId() + "/test_scanned.pdf")
                .processingStatus("FAILED")
                .errorMessage("Tài liệu không chứa nội dung văn bản có thể xử lý (tập tin có thể là bản scan hình ảnh).")
                .chunkCount(0)
                .subject("Toán học")
                .gradeLevel("10")
                .topic("Hình học")
                .build();
        documentRepository.save(failedDoc);

        mockMvc.perform(get("/workspaces/" + workspace.getId() + "/documents")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].processingStatus").value("FAILED"))
                .andExpect(jsonPath("$.data[0].errorMessage").value("Tài liệu không chứa nội dung văn bản có thể xử lý (tập tin có thể là bản scan hình ảnh)."))
                .andExpect(jsonPath("$.data[0].chunkCount").value(0));
    }
}
