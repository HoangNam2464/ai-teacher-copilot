package com.aiteachercopilot.workspace;

import com.aiteachercopilot.auth.JwtTokenProvider;
import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * QA Integration Tests for [QA-010]: Test Workspace Multi-Tenant Data Isolation & 403 Forbidden (ATC-33 / ATC-204).
 * Verifies strict data boundaries between teachers across Workspace CRUD and child resources.
 *
 * Acceptance Criteria:
 * 1. User A không đọc được workspace của User B (GET /workspaces/{id_B} -> 403 Forbidden)
 * 2. User A không thấy workspace của User B trong danh sách (GET /workspaces -> Chỉ trả về workspace của User A)
 * 3. User A không sửa được workspace của User B (PUT /workspaces/{id_B} -> 403 Forbidden)
 * 4. User A không xóa được workspace của User B (DELETE /workspaces/{id_B} -> 403 Forbidden)
 * 5. Unauthorized cross-tenant access trả về HTTP 403 Forbidden
 * 6. User A không truy cập được tài nguyên con (documents) thuộc workspace của User B (HTTP 403 Forbidden)
 * 7. Cơ chế Anti-enumeration bảo vệ workspace đã xóa của User B trước truy vấn của User A (HTTP 403 thay vì 404)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class WorkspaceMultiTenantIsolationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User teacherA;
    private User teacherB;

    private String tokenA;
    private String tokenB;

    private Workspace workspaceA1;
    private Workspace workspaceA2;
    private Workspace workspaceB1;

    @BeforeEach
    void setUp() {
        workspaceRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Seed Teacher A
        teacherA = User.builder()
                .email("teacher.a@school.edu.vn")
                .fullName("Cô Nguyễn Thị A")
                .passwordHash(passwordEncoder.encode("PasswordA2026!"))
                .role("TEACHER")
                .isActive(true)
                .build();
        teacherA = userRepository.save(teacherA);
        tokenA = jwtTokenProvider.generateToken(teacherA.getId(), teacherA.getEmail());

        // 2. Seed Teacher B
        teacherB = User.builder()
                .email("teacher.b@school.edu.vn")
                .fullName("Thầy Trần Văn B")
                .passwordHash(passwordEncoder.encode("PasswordB2026!"))
                .role("TEACHER")
                .isActive(true)
                .build();
        teacherB = userRepository.save(teacherB);
        tokenB = jwtTokenProvider.generateToken(teacherB.getId(), teacherB.getEmail());

        // 3. Seed Workspaces for Teacher A
        workspaceA1 = Workspace.builder()
                .ownerId(teacherA.getId())
                .name("Toán Lớp 10 - Cô A")
                .description("Không gian soạn bài môn Toán 10")
                .subject("Toán học")
                .gradeLevel("10")
                .isActive(true)
                .build();
        workspaceA1 = workspaceRepository.save(workspaceA1);

        workspaceA2 = Workspace.builder()
                .ownerId(teacherA.getId())
                .name("Hình Học Lớp 11 - Cô A")
                .description("Không gian chuyên đề Hình Học")
                .subject("Toán học")
                .gradeLevel("11")
                .isActive(true)
                .build();
        workspaceA2 = workspaceRepository.save(workspaceA2);

        // 4. Seed Workspace for Teacher B
        workspaceB1 = Workspace.builder()
                .ownerId(teacherB.getId())
                .name("Vật Lý Lớp 12 - Thầy B")
                .description("Không gian bài giảng Vật Lý 12")
                .subject("Vật lý")
                .gradeLevel("12")
                .isActive(true)
                .build();
        workspaceB1 = workspaceRepository.save(workspaceB1);
    }

    // =========================================================================
    // Scenario 1: Workspace List Isolation (AC-2)
    // =========================================================================
    @Nested
    @DisplayName("Scenario 1: Workspace List Isolation (GET /workspaces)")
    class ListIsolationTests {

        @Test
        @DisplayName("Teacher A should only list workspaces owned by Teacher A, excluding Teacher B's")
        void testListWorkspaces_TeacherA_OnlySeesOwnWorkspaces() throws Exception {
            mockMvc.perform(get("/workspaces")
                            .header("Authorization", "Bearer " + tokenA)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(2)))
                    .andExpect(jsonPath("$.data[*].id", containsInAnyOrder(
                            workspaceA1.getId().toString(), workspaceA2.getId().toString())))
                    .andExpect(jsonPath("$.data[*].id", not(hasItem(workspaceB1.getId().toString()))));
        }

        @Test
        @DisplayName("Teacher B should only list workspaces owned by Teacher B, excluding Teacher A's")
        void testListWorkspaces_TeacherB_OnlySeesOwnWorkspaces() throws Exception {
            mockMvc.perform(get("/workspaces")
                            .header("Authorization", "Bearer " + tokenB)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].id").value(workspaceB1.getId().toString()))
                    .andExpect(jsonPath("$.data[*].id", not(hasItem(workspaceA1.getId().toString()))))
                    .andExpect(jsonPath("$.data[*].id", not(hasItem(workspaceA2.getId().toString()))));
        }
    }

    // =========================================================================
    // Scenario 2: Workspace Read Isolation (AC-1 & AC-5)
    // =========================================================================
    @Nested
    @DisplayName("Scenario 2: Workspace Read Isolation (GET /workspaces/{id})")
    class ReadIsolationTests {

        @Test
        @DisplayName("Teacher A reading own workspace A1 should succeed with HTTP 200 OK")
        void testGetWorkspaceById_OwnerAccess_Success() throws Exception {
            mockMvc.perform(get("/workspaces/" + workspaceA1.getId())
                            .header("Authorization", "Bearer " + tokenA)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(workspaceA1.getId().toString()))
                    .andExpect(jsonPath("$.data.name").value("Toán Lớp 10 - Cô A"));
        }

        @Test
        @DisplayName("Teacher A reading Teacher B's workspace B1 must be rejected with HTTP 403 Forbidden")
        void testGetWorkspaceById_CrossTenantAccess_Forbidden() throws Exception {
            mockMvc.perform(get("/workspaces/" + workspaceB1.getId())
                            .header("Authorization", "Bearer " + tokenA)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("You do not have access to this workspace"));
        }

        @Test
        @DisplayName("Teacher B reading Teacher A's workspace A1 must be rejected with HTTP 403 Forbidden")
        void testGetWorkspaceById_ReverseCrossTenantAccess_Forbidden() throws Exception {
            mockMvc.perform(get("/workspaces/" + workspaceA1.getId())
                            .header("Authorization", "Bearer " + tokenB)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("You do not have access to this workspace"));
        }
    }

    // =========================================================================
    // Scenario 3: Workspace Update Isolation (AC-3 & AC-5)
    // =========================================================================
    @Nested
    @DisplayName("Scenario 3: Workspace Update Isolation (PUT /workspaces/{id})")
    class UpdateIsolationTests {

        @Test
        @DisplayName("Teacher A attempting to update Teacher B's workspace B1 must return HTTP 403 and keep DB unchanged")
        void testUpdateWorkspace_CrossTenantAccess_Forbidden() throws Exception {
            WorkspaceDto.UpdateRequest request = new WorkspaceDto.UpdateRequest();
            request.setName("Hacked Workspace B1");
            request.setDescription("Unauthorized Modification Attempt");

            mockMvc.perform(put("/workspaces/" + workspaceB1.getId())
                            .header("Authorization", "Bearer " + tokenA)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("You do not have access to this workspace"));

            // Verify in DB that workspace B1 was NOT modified
            Workspace freshB1 = workspaceRepository.findById(workspaceB1.getId()).orElseThrow();
            assertThat(freshB1.getName()).isEqualTo("Vật Lý Lớp 12 - Thầy B");
            assertThat(freshB1.getDescription()).isEqualTo("Không gian bài giảng Vật Lý 12");
        }

        @Test
        @DisplayName("Teacher B updating own workspace B1 should succeed with HTTP 200 OK and persist changes")
        void testUpdateWorkspace_OwnerAccess_Success() throws Exception {
            WorkspaceDto.UpdateRequest request = new WorkspaceDto.UpdateRequest();
            request.setName("Vật Lý Lớp 12 Nâng Cao - Thầy B");
            request.setDescription("Cập nhật chuyên đề Ôn Thi Tốt Nghiệp");

            mockMvc.perform(put("/workspaces/" + workspaceB1.getId())
                            .header("Authorization", "Bearer " + tokenB)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Vật Lý Lớp 12 Nâng Cao - Thầy B"));

            // Verify in DB that workspace B1 was updated
            Workspace freshB1 = workspaceRepository.findById(workspaceB1.getId()).orElseThrow();
            assertThat(freshB1.getName()).isEqualTo("Vật Lý Lớp 12 Nâng Cao - Thầy B");
        }
    }

    // =========================================================================
    // Scenario 4: Workspace Delete Isolation (AC-4 & AC-5)
    // =========================================================================
    @Nested
    @DisplayName("Scenario 4: Workspace Delete Isolation (DELETE /workspaces/{id})")
    class DeleteIsolationTests {

        @Test
        @DisplayName("Teacher A attempting to delete Teacher B's workspace B1 must return HTTP 403 and keep it active")
        void testDeleteWorkspace_CrossTenantAccess_Forbidden() throws Exception {
            mockMvc.perform(delete("/workspaces/" + workspaceB1.getId())
                            .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("You do not have access to this workspace"));

            // Verify in DB that workspace B1 remains active
            Workspace freshB1 = workspaceRepository.findById(workspaceB1.getId()).orElseThrow();
            assertThat(freshB1.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("Teacher B deleting own workspace B1 should succeed with HTTP 200 and soft-delete in DB")
        void testDeleteWorkspace_OwnerAccess_Success() throws Exception {
            mockMvc.perform(delete("/workspaces/" + workspaceB1.getId())
                            .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Workspace deleted"));

            // Verify in DB that workspace B1 is soft-deleted
            Workspace freshB1 = workspaceRepository.findById(workspaceB1.getId()).orElseThrow();
            assertThat(freshB1.getIsActive()).isFalse();
        }
    }

    // =========================================================================
    // Scenario 5: Anti-Enumeration & Non-Existent Workspace Boundaries
    // =========================================================================
    @Nested
    @DisplayName("Scenario 5: Anti-Enumeration & State Boundaries")
    class AntiEnumerationAndBoundaryTests {

        @Test
        @DisplayName("Teacher B reading own soft-deleted workspace B1 returns HTTP 404 Not Found")
        void testGetWorkspaceById_SoftDeleted_OwnerGetsNotFound() throws Exception {
            // Soft delete workspace B1
            workspaceB1.setIsActive(false);
            workspaceRepository.save(workspaceB1);

            mockMvc.perform(get("/workspaces/" + workspaceB1.getId())
                            .header("Authorization", "Bearer " + tokenB)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value(containsString("Workspace not found")));
        }

        @Test
        @DisplayName("Teacher A reading Teacher B's soft-deleted workspace B1 returns HTTP 403 Forbidden (Anti-enumeration)")
        void testGetWorkspaceById_SoftDeleted_CrossTenantGetsForbidden() throws Exception {
            // Soft delete workspace B1
            workspaceB1.setIsActive(false);
            workspaceRepository.save(workspaceB1);

            // Teacher A must receive 403 Forbidden, not 404, preventing knowledge of whether B1 exists or was deleted
            mockMvc.perform(get("/workspaces/" + workspaceB1.getId())
                            .header("Authorization", "Bearer " + tokenA)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("You do not have access to this workspace"));
        }

        @Test
        @DisplayName("Accessing a non-existent random workspace UUID returns HTTP 404 Not Found")
        void testGetWorkspaceById_NonExistent_NotFound() throws Exception {
            UUID nonExistentId = UUID.randomUUID();

            mockMvc.perform(get("/workspaces/" + nonExistentId)
                            .header("Authorization", "Bearer " + tokenA)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value(containsString("Workspace not found")));
        }
    }

    // =========================================================================
    // Scenario 6: Child Entity / Document Endpoint Isolation
    // =========================================================================
    @Nested
    @DisplayName("Scenario 6: Child Entity Isolation (/workspaces/{id}/documents)")
    class ChildEntityIsolationTests {

        @Test
        @DisplayName("Teacher A accessing documents of Teacher B's workspace B1 must return HTTP 403 Forbidden")
        void testChildDocuments_CrossTenantAccess_Forbidden() throws Exception {
            mockMvc.perform(get("/workspaces/" + workspaceB1.getId() + "/documents")
                            .header("Authorization", "Bearer " + tokenA)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("You do not have access to this workspace"));
        }

        @Test
        @DisplayName("Teacher B accessing documents of own workspace B1 should succeed with HTTP 200 OK")
        void testChildDocuments_OwnerAccess_Success() throws Exception {
            mockMvc.perform(get("/workspaces/" + workspaceB1.getId() + "/documents")
                            .header("Authorization", "Bearer " + tokenB)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());
        }
    }
}
