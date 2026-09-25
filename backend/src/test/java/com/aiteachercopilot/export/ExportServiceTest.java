package com.aiteachercopilot.export;

import com.aiteachercopilot.citation.CitationResolutionDto;
import com.aiteachercopilot.citation.CitationService;
import com.aiteachercopilot.common.exception.ForbiddenException;
import com.aiteachercopilot.common.exception.ResourceNotFoundException;
import com.aiteachercopilot.generation.GeneratedContent;
import com.aiteachercopilot.generation.GeneratedContentRepository;
import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import com.aiteachercopilot.workspace.Workspace;
import com.aiteachercopilot.workspace.WorkspaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExportServiceTest {

    @Mock
    private WorkspaceService workspaceService;

    @Mock
    private GeneratedContentRepository generatedContentRepository;

    @Mock
    private CitationService citationService;

    @Mock
    private DocxLessonExporter docxLessonExporter;

    @Mock
    private PdfLessonExporter pdfLessonExporter;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExportService exportService;

    private UUID workspaceId;
    private UUID otherWorkspaceId;
    private UUID contentId;
    private UUID userId;
    private Workspace workspace;
    private GeneratedContent content;
    private User teacher;

    @BeforeEach
    void setUp() {
        workspaceId = UUID.randomUUID();
        otherWorkspaceId = UUID.randomUUID();
        contentId = UUID.randomUUID();
        userId = UUID.randomUUID();

        workspace = Workspace.builder()
                .id(workspaceId)
                .name("Không gian Toán 10")
                .ownerId(userId)
                .build();

        teacher = User.builder()
                .id(userId)
                .fullName("Thầy Hoàng Nam")
                .email("nam.hoang@school.edu.vn")
                .build();

        content = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(workspaceId)
                .createdBy(userId)
                .contentType("LESSON_PLAN")
                .title("Kế hoạch bài dạy: Tích vô hướng của hai véc tơ")
                .topic("Tích vô hướng")
                .subject("Toán")
                .gradeLevel("10")
                .contentData(Map.of("title", "Tích vô hướng"))
                .reviewStatus("APPROVED")
                .build();
    }

    @Test
    @DisplayName("Export document to DOCX succeeds and builds standardized file name")
    void shouldExportDocumentSuccessfully() {
        // Arrange
        byte[] fakeBytes = new byte[]{1, 2, 3, 4};
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(content));
        when(userRepository.findById(userId)).thenReturn(Optional.of(teacher));
        when(citationService.resolveByContentId(workspaceId, userId, contentId)).thenReturn(List.of(
                CitationResolutionDto.builder().fileName("SGK.pdf").build()
        ));
        when(docxLessonExporter.exportLessonPlan(eq(content), any(), any(), eq(true), eq(teacher)))
                .thenReturn(fakeBytes);

        ExportRequestDto request = ExportRequestDto.builder()
                .includeCitations(true)
                .build();

        // Act
        ExportResult result = exportService.exportDocument(workspaceId, contentId, userId, "DOCX", request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getData()).isEqualTo(fakeBytes);
        assertThat(result.getContentType()).isEqualTo(ExportService.DOCX_MIME_TYPE);
        assertThat(result.getFileName()).startsWith("lesson-plan_tich-vo-huong_");
        assertThat(result.getFileName()).endsWith(".docx");

        verify(citationService).resolveByContentId(workspaceId, userId, contentId);
        verify(docxLessonExporter).exportLessonPlan(eq(content), any(), any(), eq(true), eq(teacher));
    }

    @Test
    @DisplayName("Export honors custom fileName provided in request")
    void shouldHonorCustomFileName() {
        // Arrange
        byte[] fakeBytes = new byte[]{5, 6, 7};
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(content));
        when(userRepository.findById(userId)).thenReturn(Optional.of(teacher));
        when(docxLessonExporter.exportLessonPlan(eq(content), any(), any(), eq(false), eq(teacher)))
                .thenReturn(fakeBytes);

        ExportRequestDto request = ExportRequestDto.builder()
                .includeCitations(false)
                .fileName("Giao_An_Chuyen_De_Toan_10")
                .build();

        // Act
        ExportResult result = exportService.exportDocument(workspaceId, contentId, userId, "DOCX", request);

        // Assert
        assertThat(result.getFileName()).isEqualTo("Giao_An_Chuyen_De_Toan_10.docx");
        verify(citationService, never()).resolveByContentId(any(), any(), any());
    }

    @Test
    @DisplayName("Cross-workspace export throws ForbiddenException")
    void shouldThrowForbiddenOnCrossWorkspaceExport() {
        // Arrange
        GeneratedContent otherContent = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(otherWorkspaceId)
                .build();

        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(otherContent));

        ExportRequestDto request = ExportRequestDto.builder().build();

        // Act & Assert
        assertThatThrownBy(() -> exportService.exportDocument(workspaceId, contentId, userId, "DOCX", request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cross-workspace content access is forbidden");
    }

    @Test
    @DisplayName("Non-existent content throws ResourceNotFoundException")
    void shouldThrowNotFoundWhenContentDoesNotExist() {
        // Arrange
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> exportService.exportDocument(workspaceId, contentId, userId, "DOCX", null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Export document to PDF succeeds and delegates to PdfLessonExporter [BE-023]")
    void shouldExportDocumentToPdfSuccessfully() {
        // Arrange
        byte[] fakePdfBytes = new byte[]{37, 80, 68, 70}; // %PDF
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(content));
        when(userRepository.findById(userId)).thenReturn(Optional.of(teacher));
        when(citationService.resolveByContentId(workspaceId, userId, contentId)).thenReturn(List.of(
                CitationResolutionDto.builder().fileName("SGK.pdf").build()
        ));
        when(pdfLessonExporter.exportLessonPlan(eq(content), any(), any(), eq(true), eq(teacher)))
                .thenReturn(fakePdfBytes);

        ExportRequestDto request = ExportRequestDto.builder()
                .includeCitations(true)
                .build();

        // Act
        ExportResult result = exportService.exportDocument(workspaceId, contentId, userId, "PDF", request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getData()).isEqualTo(fakePdfBytes);
        assertThat(result.getContentType()).isEqualTo(ExportService.PDF_MIME_TYPE);
        assertThat(result.getFileName()).startsWith("lesson-plan_tich-vo-huong_");
        assertThat(result.getFileName()).endsWith(".pdf");

        verify(pdfLessonExporter).exportLessonPlan(eq(content), any(), any(), eq(true), eq(teacher));
        verify(docxLessonExporter, never()).exportLessonPlan(any(), any(), any(), anyBoolean(), any());
    }

    @Test
    @DisplayName("Unsupported export format throws IllegalArgumentException")
    void shouldThrowIllegalArgumentOnUnsupportedFormat() {
        // Arrange
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(content));

        // Act & Assert
        assertThatThrownBy(() -> exportService.exportDocument(workspaceId, contentId, userId, "PPTX", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported export format: PPTX");
    }
}
