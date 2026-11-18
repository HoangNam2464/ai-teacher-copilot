package com.aiteachercopilot.citation;

import com.aiteachercopilot.auth.JwtTokenProvider;
import com.aiteachercopilot.document.Document;
import com.aiteachercopilot.document.DocumentChunk;
import com.aiteachercopilot.document.DocumentChunkRepository;
import com.aiteachercopilot.document.DocumentRepository;
import com.aiteachercopilot.generation.ContentCitation;
import com.aiteachercopilot.generation.ContentCitationRepository;
import com.aiteachercopilot.generation.GeneratedContent;
import com.aiteachercopilot.generation.GeneratedContentRepository;
import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import com.aiteachercopilot.workspace.Workspace;
import com.aiteachercopilot.workspace.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CitationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @Autowired
    private GeneratedContentRepository generatedContentRepository;

    @Autowired
    private ContentCitationRepository contentCitationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private WebClient aiServiceWebClient;

    private User teacherA;
    private User teacherB;
    private String tokenA;
    private String tokenB;
    private Workspace workspaceA;
    private Workspace workspaceB;
    private Document documentA;
    private DocumentChunk chunkA;
    private DocumentChunk chunkB;
    private GeneratedContent contentA;
    private ContentCitation citationA;

    @BeforeEach
    void setUp() {
        contentCitationRepository.deleteAll();
        generatedContentRepository.deleteAll();
        documentChunkRepository.deleteAll();
        documentRepository.deleteAll();
        workspaceRepository.deleteAll();
        userRepository.deleteAll();

        teacherA = userRepository.save(User.builder()
                .email("teacherA@citation.edu.vn")
                .passwordHash(passwordEncoder.encode("Password123@"))
                .fullName("Thầy Hoàng Nam")
                .role("TEACHER")
                .isActive(true)
                .build());

        teacherB = userRepository.save(User.builder()
                .email("teacherB@citation.edu.vn")
                .passwordHash(passwordEncoder.encode("Password123@"))
                .fullName("Cô Mai Hoa")
                .role("TEACHER")
                .isActive(true)
                .build());

        tokenA = jwtTokenProvider.generateToken(teacherA.getId(), teacherA.getEmail());
        tokenB = jwtTokenProvider.generateToken(teacherB.getId(), teacherB.getEmail());

        workspaceA = workspaceRepository.save(Workspace.builder()
                .ownerId(teacherA.getId())
                .name("Không gian Toán học 12")
                .subject("Toán học")
                .gradeLevel("12")
                .isActive(true)
                .build());

        workspaceB = workspaceRepository.save(Workspace.builder()
                .ownerId(teacherB.getId())
                .name("Không gian Hóa học 11")
                .subject("Hóa học")
                .gradeLevel("11")
                .isActive(true)
                .build());

        documentA = documentRepository.save(Document.builder()
                .workspaceId(workspaceA.getId())
                .uploadedBy(teacherA.getId())
                .fileName("GiaiTich12_Chuong1.pdf")
                .fileType("pdf")
                .fileSize(2048L)
                .minioObjectKey("docs/gt12.pdf")
                .build());

        Document documentB = documentRepository.save(Document.builder()
                .workspaceId(workspaceB.getId())
                .uploadedBy(teacherB.getId())
                .fileName("HoaHoc11_Chuong2.pdf")
                .fileType("pdf")
                .fileSize(1024L)
                .minioObjectKey("docs/hh11.pdf")
                .build());

        chunkA = documentChunkRepository.save(DocumentChunk.builder()
                .workspaceId(workspaceA.getId())
                .documentId(documentA.getId())
                .chunkIndex(0)
                .content("Khảo sát sự biến thiên và vẽ đồ thị của hàm số y = f(x).")
                .sourcePage(15)
                .sourceLocation("Mục 2. Đạo hàm và tính đơn điệu")
                .topic("Khảo sát hàm số")
                .subject("Toán học")
                .gradeLevel("12")
                .build());

        chunkB = documentChunkRepository.save(DocumentChunk.builder()
                .workspaceId(workspaceB.getId())
                .documentId(documentB.getId())
                .chunkIndex(0)
                .content("Cân bằng phương trình oxi hóa khử.")
                .sourcePage(22)
                .sourceLocation("Chương 2")
                .topic("Phản ứng oxi hóa")
                .subject("Hóa học")
                .gradeLevel("11")
                .build());

        contentA = generatedContentRepository.save(GeneratedContent.builder()
                .workspaceId(workspaceA.getId())
                .createdBy(teacherA.getId())
                .title("Giáo án Khảo sát hàm số nâng cao")
                .contentType("LESSON_PLAN")
                .reviewStatus("DRAFT")
                .version(1)
                .contentData(Map.of("title", "Giáo án Toán"))
                .promptInput("Tạo giáo án khảo sát hàm số")
                .modelUsed("gemini-1.5-flash")
                .generationTimeMs(1500)
                .build());

        citationA = contentCitationRepository.save(ContentCitation.builder()
                .contentId(contentA.getId())
                .chunkId(chunkA.getId())
                .documentId(documentA.getId())
                .citationText("Khảo sát sự biến thiên và vẽ đồ thị của hàm số y = f(x).")
                .relevanceScore(0.95)
                .build());
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/citations/resolve?chunkIds=... resolves successfully")
    void testResolveByChunkIds_Success() throws Exception {
        mockMvc.perform(get("/workspaces/{workspaceId}/citations/resolve", workspaceA.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .param("chunkIds", chunkA.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].chunkId", is(chunkA.getId().toString())))
                .andExpect(jsonPath("$.data[0].documentId", is(documentA.getId().toString())))
                .andExpect(jsonPath("$.data[0].fileName", is("GiaiTich12_Chuong1.pdf")))
                .andExpect(jsonPath("$.data[0].sourcePage", is(15)))
                .andExpect(jsonPath("$.data[0].sourceLocation", is("Mục 2. Đạo hàm và tính đơn điệu")))
                .andExpect(jsonPath("$.data[0].excerpt", is("Khảo sát sự biến thiên và vẽ đồ thị của hàm số y = f(x).")));
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/citations/resolve returns 403 on cross-workspace chunkId")
    void testResolveByChunkIds_CrossWorkspace_Returns403() throws Exception {
        mockMvc.perform(get("/workspaces/{workspaceId}/citations/resolve", workspaceA.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .param("chunkIds", chunkB.getId().toString()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Cross-workspace chunk access is forbidden")));
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/citations/{citationId} resolves single citation successfully")
    void testResolveByCitationId_Success() throws Exception {
        mockMvc.perform(get("/workspaces/{workspaceId}/citations/{citationId}", workspaceA.getId(), citationA.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.citationId", is(citationA.getId().toString())))
                .andExpect(jsonPath("$.data.contentId", is(contentA.getId().toString())))
                .andExpect(jsonPath("$.data.fileName", is("GiaiTich12_Chuong1.pdf")))
                .andExpect(jsonPath("$.data.sourcePage", is(15)))
                .andExpect(jsonPath("$.data.relevanceScore", is(0.95)))
                .andExpect(jsonPath("$.data.citationText", is("Khảo sát sự biến thiên và vẽ đồ thị của hàm số y = f(x).")));
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/citations/{citationId} returns 403 when called by unauthorized user")
    void testResolveByCitationId_WrongUser_Returns403() throws Exception {
        mockMvc.perform(get("/workspaces/{workspaceId}/citations/{citationId}", workspaceA.getId(), citationA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/citations/{citationId} returns 404 when citation does not exist")
    void testResolveByCitationId_NotFound_Returns404() throws Exception {
        mockMvc.perform(get("/workspaces/{workspaceId}/citations/{citationId}", workspaceA.getId(), UUID.randomUUID())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/citations/content/{contentId} resolves all citations for content")
    void testResolveByContentId_Success() throws Exception {
        mockMvc.perform(get("/workspaces/{workspaceId}/citations/content/{contentId}", workspaceA.getId(), contentA.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].citationId", is(citationA.getId().toString())))
                .andExpect(jsonPath("$.data[0].fileName", is("GiaiTich12_Chuong1.pdf")));
    }

    @Test
    @DisplayName("GET /api/workspaces/{workspaceId}/generation/{contentId}/citations resolves content citations")
    void testResolveViaGenerationController_Success() throws Exception {
        mockMvc.perform(get("/workspaces/{workspaceId}/generation/{contentId}/citations", workspaceA.getId(), contentA.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].citationId", is(citationA.getId().toString())))
                .andExpect(jsonPath("$.data[0].fileName", is("GiaiTich12_Chuong1.pdf")));
    }
}
