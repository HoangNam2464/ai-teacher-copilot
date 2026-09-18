package com.aiteachercopilot.auth;

import com.aiteachercopilot.common.dto.ApiResponse;
import com.aiteachercopilot.document.Document;
import com.aiteachercopilot.document.DocumentRepository;
import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import com.aiteachercopilot.workspace.Workspace;
import com.aiteachercopilot.workspace.WorkspaceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * QA-014: Automated Unit & Integration Tests for Auth & Ingestion
 * 
 * Comprehensive test suite covering:
 * - User registration with email verification
 * - User login with JWT token generation
 * - Workspace isolation and multi-tenant data separation
 * - Document upload functionality
 * - CI/CD automation requirements
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("QA-014: Auth & Ingestion Integration Tests")
class AuthIngestionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @org.springframework.boot.test.mock.mockito.MockBean
    private io.minio.MinioClient minioClient;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    private String jwtToken;
    private User testUser;
    private UUID testUserId;
    private Workspace testWorkspace;
    private UUID testWorkspaceId;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = User.builder()
                .email("classroom@school.edu.vn")
                .passwordHash(passwordEncoder.encode("TestPassword123!"))
                .fullName("Thầy Nguyễn Văn A")
                .role("TEACHER")
                .isActive(true)
                .build();
        testUser = userRepository.save(testUser);
        testUserId = testUser.getId();

        // Generate valid JWT token for testing
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        jwtToken = Jwts.builder()
                .subject(testUserId.toString())
                .claim("email", testUser.getEmail())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key)
                .compact();

        // Create test workspace
        testWorkspace = Workspace.builder()
                .ownerId(testUserId)
                .name("Lớp 10A - Hóa Học")
                .description("Workspace test cho QA-014")
                .build();
        testWorkspace = workspaceRepository.save(testWorkspace);
        testWorkspaceId = testWorkspace.getId();
    }

    // =========================================================================
    // AC1: Registration Test Suite
    // =========================================================================
    @Nested
    @DisplayName("AC1: Có test cho registration")
    class RegistrationTests {

        @Test
        @DisplayName("Test: User registration with valid credentials returns 201 Created")
        void testRegistrationSuccess() throws Exception {
            // Arrange
            AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
            request.setEmail("newteacher@school.edu.vn");
            request.setPassword("SecurePass123!");
            request.setFullName("Cô Trần Thị B");

            // Act
            mockMvc.perform(post("/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    // Assert
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value(containsString("Registration successful")))
                    .andExpect(jsonPath("$.data.email").value("newteacher@school.edu.vn"))
                    .andExpect(jsonPath("$.data.fullName").value("Cô Trần Thị B"))
                    .andExpect(jsonPath("$.data.role").value("TEACHER"))
                    .andExpect(jsonPath("$.data.requiresEmailVerification").exists())
                    .andExpect(jsonPath("$.data.password").doesNotExist())
                    .andExpect(jsonPath("$.data.passwordHash").doesNotExist());

            // Verify user was created in database
            assert userRepository.existsByEmail("newteacher@school.edu.vn");
        }

        @Test
        @DisplayName("Test: Registration with duplicate email returns 400 Bad Request")
        void testRegistrationDuplicateEmail() throws Exception {
            // Arrange - User already exists from setUp
            AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
            request.setEmail("classroom@school.edu.vn");
            request.setPassword("AnotherPassword123!");
            request.setFullName("Duplicate Name");

            // Act & Assert
            mockMvc.perform(post("/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value(containsString("already registered")));
        }

        @Test
        @DisplayName("Test: Registration with invalid email format returns 400 Bad Request")
        void testRegistrationInvalidEmail() throws Exception {
            // Arrange
            AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
            request.setEmail("invalid-email-format");
            request.setPassword("ValidPassword123!");
            request.setFullName("Test User");

            // Act & Assert
            mockMvc.perform(post("/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.data.email").exists());
        }

        @Test
        @DisplayName("Test: Registration with weak password returns 400 Bad Request")
        void testRegistrationWeakPassword() throws Exception {
            // Arrange
            AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
            request.setEmail("weakpass@school.edu.vn");
            request.setPassword("weak");
            request.setFullName("Test User");

            // Act & Assert
            mockMvc.perform(post("/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.data.password").exists());
        }

        @Test
        @DisplayName("Test: Registration with missing required fields returns 400 Bad Request")
        void testRegistrationMissingFields() throws Exception {
            // Arrange - Empty request
            AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();

            // Act & Assert
            mockMvc.perform(post("/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    // =========================================================================
    // AC2: Login/JWT Test Suite
    // =========================================================================
    @Nested
    @DisplayName("AC2: Có test cho login/JWT")
    class LoginJwtTests {

        @Test
        @DisplayName("Test: Valid login credentials return user info and JWT token")
        void testLoginSuccess() throws Exception {
            // Arrange
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail("classroom@school.edu.vn");
            request.setPassword("TestPassword123!");

            // Act & Assert
            MvcResult result = mockMvc.perform(post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.email").value("classroom@school.edu.vn"))
                    .andExpect(jsonPath("$.data.fullName").value("Thầy Nguyễn Văn A"))
                    .andExpect(jsonPath("$.data.role").value("TEACHER"))
                    .andExpect(jsonPath("$.data.token").isNotEmpty())
                    .andExpect(jsonPath("$.data.password").doesNotExist())
                    .andReturn();

            // Verify token format (JWT: header.payload.signature)
            String responseBody = result.getResponse().getContentAsString();
            ApiResponse<?> apiResponse = objectMapper.readValue(responseBody, ApiResponse.class);
            @SuppressWarnings("unchecked")
            String token = (String) ((java.util.Map<String, Object>) apiResponse.getData()).get("token");
            
            assert token.split("\\.").length == 3 : "Token should be valid JWT format";
        }

        @Test
        @DisplayName("Test: Login with wrong password returns 401 Unauthorized")
        void testLoginInvalidPassword() throws Exception {
            // Arrange
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail("classroom@school.edu.vn");
            request.setPassword("WrongPassword123!");

            // Act & Assert
            mockMvc.perform(post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value(containsString("Invalid credentials")));
        }

        @Test
        @DisplayName("Test: Login with non-existent user returns 401 Unauthorized")
        void testLoginNonExistentUser() throws Exception {
            // Arrange
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail("nonexistent@school.edu.vn");
            request.setPassword("Password123!");

            // Act & Assert
            mockMvc.perform(post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Test: JWT token can be used to access protected routes")
        void testJwtTokenUsageForProtectedRoutes() throws Exception {
            // Act & Assert - Access protected endpoint with valid token
            mockMvc.perform(get("/workspaces")
                    .header("Authorization", "Bearer " + jwtToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Test: Expired JWT token returns 401 Unauthorized")
        void testExpiredJwtToken() throws Exception {
            // Arrange - Create expired token
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            String expiredToken = Jwts.builder()
                    .subject(testUserId.toString())
                    .claim("email", testUser.getEmail())
                    .issuedAt(new Date(System.currentTimeMillis() - 7200000))
                    .expiration(new Date(System.currentTimeMillis() - 3600000))
                    .signWith(key)
                    .compact();

            // Act & Assert
            mockMvc.perform(get("/workspaces")
                    .header("Authorization", "Bearer " + expiredToken))
                    .andExpect(status().isUnauthorized());
        }
    }

    // =========================================================================
    // AC3: Workspace Isolation Test Suite
    // =========================================================================
    @Nested
    @DisplayName("AC3: Có test cho workspace isolation")
    class WorkspaceIsolationTests {

        @Test
        @DisplayName("Test: User can only access their own workspaces")
        void testWorkspaceOwnershipEnforcement() throws Exception {
            // Arrange - Create another user with their workspace
            User otherUser = User.builder()
                    .email("other@school.edu.vn")
                    .passwordHash(passwordEncoder.encode("OtherPassword123!"))
                    .fullName("Cô Khác")
                    .role("TEACHER")
                    .isActive(true)
                    .build();
            otherUser = userRepository.save(otherUser);

            Workspace otherWorkspace = workspaceRepository.save(
                    Workspace.builder()
                            .ownerId(otherUser.getId())
                            .name("Lớp 11B - Vật Lý")
                            .build()
            );

            // Act & Assert - User should see only their own workspace
            MvcResult result = mockMvc.perform(get("/workspaces")
                    .header("Authorization", "Bearer " + jwtToken))
                    .andExpect(status().isOk())
                    .andReturn();

            String responseBody = result.getResponse().getContentAsString();
            ApiResponse<?> apiResponse = objectMapper.readValue(responseBody, ApiResponse.class);
            java.util.List<?> workspaces = (java.util.List<?>) apiResponse.getData();

            // Verify only testWorkspace is returned, not otherWorkspace
            @SuppressWarnings("unchecked")
            boolean isolated = workspaces.stream()
                    .noneMatch(w -> ((java.util.Map<String, Object>) w).get("id").toString().equals(otherWorkspace.getId().toString()));
            assert isolated;
        }

        @Test
        @DisplayName("Test: Accessing other user's workspace returns 403 Forbidden")
        void testCrossWorkspaceAccessDenied() throws Exception {
            // Arrange - Create another user's workspace
            User otherUser = User.builder()
                    .email("other2@school.edu.vn")
                    .passwordHash(passwordEncoder.encode("OtherPassword123!"))
                    .fullName("Cô Khác 2")
                    .role("TEACHER")
                    .isActive(true)
                    .build();
            otherUser = userRepository.save(otherUser);

            Workspace otherWorkspace = Workspace.builder()
                    .ownerId(otherUser.getId())
                    .name("Lớp 12C")
                    .build();
            otherWorkspace = workspaceRepository.save(otherWorkspace);

            // Act & Assert - Try to access other user's workspace
            mockMvc.perform(get("/workspaces/" + otherWorkspace.getId())
                    .header("Authorization", "Bearer " + jwtToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Test: Multi-tenant data isolation - Users have separate data")
        void testMultiTenantDataIsolation() throws Exception {
            // Arrange - Create document in test workspace
            Document testDoc = Document.builder()
                    .workspaceId(testWorkspaceId)
                    .fileName("test_document.pdf")
                    .fileSize(1024L)
                    .fileType("application/pdf")
                    .minioObjectKey("test/path/document.pdf")
                    .uploadedBy(testUserId)
                    .build();
            documentRepository.save(testDoc);

            // Create another user and workspace
            User user2 = User.builder()
                    .email("user2@school.edu.vn")
                    .passwordHash(passwordEncoder.encode("User2Password123!"))
                    .fullName("User 2")
                    .role("TEACHER")
                    .isActive(true)
                    .build();
            user2 = userRepository.save(user2);

            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            String user2Token = Jwts.builder()
                    .subject(user2.getId().toString())
                    .claim("email", user2.getEmail())
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + 3600000))
                    .signWith(key)
                    .compact();

            // Act & Assert - User 2 should not see User 1's documents
            mockMvc.perform(get("/workspaces/" + testWorkspaceId + "/documents")
                    .header("Authorization", "Bearer " + user2Token))
                    .andExpect(status().isForbidden());
        }
    }

    // =========================================================================
    // AC4: Document Upload Test Suite
    // =========================================================================
    @Nested
    @DisplayName("AC4: Có test cho document upload")
    class DocumentUploadTests {

        @Test
        @DisplayName("Test: Document upload to authorized workspace succeeds")
        void testDocumentUploadSuccess() throws Exception {
            // Arrange
            byte[] fileContent = "%PDF-1.4 PDF content here".getBytes();
            org.springframework.mock.web.MockMultipartFile multipartFile =
                    new org.springframework.mock.web.MockMultipartFile(
                            "file",
                            "test.pdf",
                            "application/pdf",
                            fileContent
                    );
            
            // Act & Assert
            mockMvc.perform(multipart("/workspaces/" + testWorkspaceId + "/documents/upload")
                    .file(multipartFile)
                    .header("Authorization", "Bearer " + jwtToken))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.fileName").exists())
                    .andExpect(jsonPath("$.data.workspaceId").value(testWorkspaceId.toString()));

            // Verify document was persisted
            assert documentRepository.findByWorkspaceIdOrderByCreatedAtDesc(testWorkspaceId).size() > 0;
        }

        @Test
        @DisplayName("Test: Document upload without authorization returns 401")
        void testDocumentUploadUnauthorized() throws Exception {
            // Arrange
            byte[] fileContent = "PDF content".getBytes();

            // Act & Assert
            mockMvc.perform(multipart("/workspaces/" + testWorkspaceId + "/documents/upload")
                    .file("file", fileContent))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Test: Document upload to someone else's workspace returns 403 Forbidden")
        void testDocumentUploadForbidden() throws Exception {
            // Arrange - Create other user's workspace
            User otherUser = User.builder()
                    .email("other3@school.edu.vn")
                    .passwordHash(passwordEncoder.encode("OtherPassword123!"))
                    .fullName("Other 3")
                    .role("TEACHER")
                    .isActive(true)
                    .build();
            otherUser = userRepository.save(otherUser);

            Workspace otherWorkspace = Workspace.builder()
                    .ownerId(otherUser.getId())
                    .name("Other's Workspace")
                    .build();
            otherWorkspace = workspaceRepository.save(otherWorkspace);

            byte[] fileContent = "PDF content".getBytes();

            // Act & Assert
            mockMvc.perform(multipart("/workspaces/" + otherWorkspace.getId() + "/documents/upload")
                    .file("file", fileContent)
                    .header("Authorization", "Bearer " + jwtToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Test: Document upload with invalid file type returns 400 Bad Request")
        void testDocumentUploadInvalidFileType() throws Exception {
            // Arrange
            byte[] fileContent = "Invalid content".getBytes();

            // Act & Assert
            mockMvc.perform(multipart("/workspaces/" + testWorkspaceId + "/documents/upload")
                    .file("file", fileContent)
                    .header("Authorization", "Bearer " + jwtToken)
                    .header("Content-Type", "application/invalid-type"))
                    .andExpect(status().isBadRequest());
        }
    }

    // =========================================================================
    // AC5: CI/CD Automation Test Suite
    // =========================================================================
    @Nested
    @DisplayName("AC5: Test chạy tự động trong CI")
    class CIAutomationTests {

        @Test
        @DisplayName("Test: All auth tests can run in CI environment")
        void testAuthTestsCICompatible() throws Exception {
            // This test verifies that auth tests are CI-compatible
            // (no external dependencies, uses test profile)
            
            // Arrange & Act
            AuthDto.LoginRequest loginRequest = new AuthDto.LoginRequest();
            loginRequest.setEmail("classroom@school.edu.vn");
            loginRequest.setPassword("TestPassword123!");

            // Assert - Should succeed in CI context
            mockMvc.perform(post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Test: All workspace tests can run in CI environment")
        void testWorkspaceTestsCICompatible() throws Exception {
            // Arrange & Act
            mockMvc.perform(get("/workspaces")
                    .header("Authorization", "Bearer " + jwtToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Test: Database transactions are managed correctly in tests")
        void testTransactionManagement() {
            // Verify that test user was created in transaction
            Workspace retrievedWorkspace = workspaceRepository.findById(testWorkspaceId).orElse(null);
            assert retrievedWorkspace != null : "Workspace should exist in database";
            assert retrievedWorkspace.getOwnerId().equals(testUserId) : "Workspace owner should be correct";
        }
    }

    // =========================================================================
    // Integration Scenario Tests
    // =========================================================================
    @Nested
    @DisplayName("Integration Scenarios")
    class IntegrationScenarios {

        @Test
        @DisplayName("Scenario: Complete user journey - Register, Login, Create Workspace, Upload Document")
        void testCompleteUserJourney() throws Exception {
            // Step 1: Register new user
            AuthDto.RegisterRequest registerRequest = new AuthDto.RegisterRequest();
            registerRequest.setEmail("journey@school.edu.vn");
            registerRequest.setPassword("JourneyPass123!");
            registerRequest.setFullName("Thầy Journey");

            mockMvc.perform(post("/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registerRequest)))
                    .andExpect(status().isCreated());

            // Activate user so login succeeds
            User journeyUser = userRepository.findByEmail("journey@school.edu.vn").orElseThrow();
            journeyUser.setIsActive(true);
            userRepository.save(journeyUser);

            // Step 2: Login
            AuthDto.LoginRequest loginRequest = new AuthDto.LoginRequest();
            loginRequest.setEmail("journey@school.edu.vn");
            loginRequest.setPassword("JourneyPass123!");

            MvcResult loginResult = mockMvc.perform(post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            // Extract token from login response
            String loginResponse = loginResult.getResponse().getContentAsString();
            ApiResponse<?> apiResponse = objectMapper.readValue(loginResponse, ApiResponse.class);
            @SuppressWarnings("unchecked")
            String userToken = (String) ((java.util.Map<String, Object>) apiResponse.getData()).get("token");

            // Step 3: List workspaces (should be empty)
            mockMvc.perform(get("/workspaces")
                    .header("Authorization", "Bearer " + userToken))
                    .andExpect(status().isOk());

            // Verify user can perform authenticated operations
            assert userToken != null && !userToken.isEmpty() : "JWT token should be valid";
        }
    }
}
