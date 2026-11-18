package com.aiteachercopilot.citation;

import com.aiteachercopilot.common.exception.ForbiddenException;
import com.aiteachercopilot.common.exception.ResourceNotFoundException;
import com.aiteachercopilot.document.Document;
import com.aiteachercopilot.document.DocumentChunk;
import com.aiteachercopilot.document.DocumentChunkRepository;
import com.aiteachercopilot.document.DocumentRepository;
import com.aiteachercopilot.generation.ContentCitation;
import com.aiteachercopilot.generation.ContentCitationRepository;
import com.aiteachercopilot.generation.GeneratedContent;
import com.aiteachercopilot.generation.GeneratedContentRepository;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CitationServiceTest {

    @Mock
    private WorkspaceService workspaceService;

    @Mock
    private DocumentChunkRepository documentChunkRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private ContentCitationRepository contentCitationRepository;

    @Mock
    private GeneratedContentRepository generatedContentRepository;

    @InjectMocks
    private CitationService citationService;

    private UUID workspaceId;
    private UUID otherWorkspaceId;
    private UUID userId;
    private UUID docId;
    private UUID chunkId;
    private UUID citationId;
    private UUID contentId;

    private Workspace testWorkspace;
    private Document testDoc;
    private DocumentChunk testChunk;
    private ContentCitation testCitation;
    private GeneratedContent testContent;

    @BeforeEach
    void setUp() {
        workspaceId = UUID.randomUUID();
        otherWorkspaceId = UUID.randomUUID();
        userId = UUID.randomUUID();
        docId = UUID.randomUUID();
        chunkId = UUID.randomUUID();
        citationId = UUID.randomUUID();
        contentId = UUID.randomUUID();

        testWorkspace = Workspace.builder()
                .id(workspaceId)
                .ownerId(userId)
                .name("Sinh học 10")
                .isActive(true)
                .build();

        testDoc = Document.builder()
                .id(docId)
                .workspaceId(workspaceId)
                .fileName("Sach_Giao_Khoa_Sinh_10.pdf")
                .fileType("pdf")
                .fileSize(1024L)
                .minioObjectKey("docs/test.pdf")
                .build();

        testChunk = DocumentChunk.builder()
                .id(chunkId)
                .workspaceId(workspaceId)
                .documentId(docId)
                .chunkIndex(1)
                .content("Quang hợp là quá trình lục lạp hấp thu năng lượng ánh sáng mặt trời để tổng hợp chất hữu cơ từ CO2 và H2O.")
                .sourcePage(42)
                .sourceLocation("Chương 3 - Mục 1")
                .topic("Quang hợp")
                .subject("Sinh học")
                .gradeLevel("10")
                .build();

        testCitation = ContentCitation.builder()
                .id(citationId)
                .contentId(contentId)
                .chunkId(chunkId)
                .documentId(docId)
                .citationText("Quang hợp là quá trình lục lạp hấp thu năng lượng ánh sáng mặt trời...")
                .relevanceScore(0.92)
                .build();

        testContent = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(workspaceId)
                .createdBy(userId)
                .title("Giáo án Quang hợp ở thực vật")
                .contentType("LESSON_PLAN")
                .reviewStatus("DRAFT")
                .version(1)
                .build();
    }

    @Test
    @DisplayName("resolveByChunkIds resolves document metadata, page, and excerpt successfully")
    void testResolveByChunkIds_Success() {
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(testWorkspace);
        when(documentChunkRepository.findById(chunkId)).thenReturn(Optional.of(testChunk));
        when(documentRepository.findById(docId)).thenReturn(Optional.of(testDoc));

        List<CitationResolutionDto> results = citationService.resolveByChunkIds(
                workspaceId, userId, List.of(chunkId));

        assertThat(results).hasSize(1);
        CitationResolutionDto dto = results.get(0);
        assertThat(dto.getChunkId()).isEqualTo(chunkId);
        assertThat(dto.getDocumentId()).isEqualTo(docId);
        assertThat(dto.getFileName()).isEqualTo("Sach_Giao_Khoa_Sinh_10.pdf");
        assertThat(dto.getSourcePage()).isEqualTo(42);
        assertThat(dto.getSourceLocation()).isEqualTo("Chương 3 - Mục 1");
        assertThat(dto.getExcerpt()).contains("Quang hợp là quá trình");
        assertThat(dto.getChunkIndex()).isEqualTo(1);
        assertThat(dto.getTopic()).isEqualTo("Quang hợp");
    }

    @Test
    @DisplayName("resolveByChunkIds throws ForbiddenException on cross-workspace chunk access")
    void testResolveByChunkIds_CrossWorkspaceChunk_ThrowsForbidden() {
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(testWorkspace);

        DocumentChunk crossWorkspaceChunk = DocumentChunk.builder()
                .id(chunkId)
                .workspaceId(otherWorkspaceId)
                .documentId(docId)
                .content("Hacked content")
                .build();
        when(documentChunkRepository.findById(chunkId)).thenReturn(Optional.of(crossWorkspaceChunk));

        assertThatThrownBy(() -> citationService.resolveByChunkIds(workspaceId, userId, List.of(chunkId)))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cross-workspace chunk access is forbidden");
    }

    @Test
    @DisplayName("resolveByChunkIds throws ResourceNotFoundException when chunk does not exist")
    void testResolveByChunkIds_ChunkNotFound_ThrowsNotFound() {
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(testWorkspace);
        when(documentChunkRepository.findById(chunkId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> citationService.resolveByChunkIds(workspaceId, userId, List.of(chunkId)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Document chunk not found");
    }

    @Test
    @DisplayName("resolveByCitationId resolves citation record with citationText and relevanceScore")
    void testResolveByCitationId_Success() {
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(testWorkspace);
        when(contentCitationRepository.findById(citationId)).thenReturn(Optional.of(testCitation));
        when(documentChunkRepository.findById(chunkId)).thenReturn(Optional.of(testChunk));
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(testContent));
        when(documentRepository.findById(docId)).thenReturn(Optional.of(testDoc));

        CitationResolutionDto result = citationService.resolveByCitationId(workspaceId, userId, citationId);

        assertThat(result).isNotNull();
        assertThat(result.getCitationId()).isEqualTo(citationId);
        assertThat(result.getContentId()).isEqualTo(contentId);
        assertThat(result.getChunkId()).isEqualTo(chunkId);
        assertThat(result.getDocumentId()).isEqualTo(docId);
        assertThat(result.getFileName()).isEqualTo("Sach_Giao_Khoa_Sinh_10.pdf");
        assertThat(result.getSourcePage()).isEqualTo(42);
        assertThat(result.getRelevanceScore()).isEqualTo(0.92);
        assertThat(result.getCitationText()).contains("Quang hợp");
    }

    @Test
    @DisplayName("resolveByCitationId throws ForbiddenException on cross-workspace citation chunk")
    void testResolveByCitationId_CrossWorkspaceChunk_ThrowsForbidden() {
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(testWorkspace);
        when(contentCitationRepository.findById(citationId)).thenReturn(Optional.of(testCitation));

        DocumentChunk otherChunk = DocumentChunk.builder()
                .id(chunkId)
                .workspaceId(otherWorkspaceId)
                .build();
        when(documentChunkRepository.findById(chunkId)).thenReturn(Optional.of(otherChunk));

        assertThatThrownBy(() -> citationService.resolveByCitationId(workspaceId, userId, citationId))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cross-workspace citation access is forbidden");
    }

    @Test
    @DisplayName("resolveByContentId resolves all citations for a given generated content")
    void testResolveByContentId_Success() {
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(testWorkspace);
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(testContent));
        when(contentCitationRepository.findByContentId(contentId)).thenReturn(List.of(testCitation));

        when(contentCitationRepository.findById(citationId)).thenReturn(Optional.of(testCitation));
        when(documentChunkRepository.findById(chunkId)).thenReturn(Optional.of(testChunk));
        when(documentRepository.findById(docId)).thenReturn(Optional.of(testDoc));

        List<CitationResolutionDto> results = citationService.resolveByContentId(workspaceId, userId, contentId);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getCitationId()).isEqualTo(citationId);
        assertThat(results.get(0).getFileName()).isEqualTo("Sach_Giao_Khoa_Sinh_10.pdf");
    }

    @Test
    @DisplayName("resolveByContentId throws ForbiddenException when content belongs to another workspace")
    void testResolveByContentId_CrossWorkspaceContent_ThrowsForbidden() {
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(testWorkspace);

        GeneratedContent otherContent = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(otherWorkspaceId)
                .build();
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(otherContent));

        assertThatThrownBy(() -> citationService.resolveByContentId(workspaceId, userId, contentId))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cross-workspace content access is forbidden");
    }

    @Test
    @DisplayName("sanitizeExcerpt safely truncates text exceeding 200 characters")
    void testSanitizeExcerpt() {
        String shortText = "Ngắn gọn dưới 200 ký tự.";
        assertThat(CitationService.sanitizeExcerpt(shortText)).isEqualTo(shortText);

        String longText = "A".repeat(300);
        String sanitized = CitationService.sanitizeExcerpt(longText);
        assertThat(sanitized).hasSize(203); // 200 chars + "..."
        assertThat(sanitized).endsWith("...");

        assertThat(CitationService.sanitizeExcerpt(null)).isEmpty();
        assertThat(CitationService.sanitizeExcerpt("")).isEmpty();
        assertThat(CitationService.sanitizeExcerpt("   ")).isEmpty();
    }
}
