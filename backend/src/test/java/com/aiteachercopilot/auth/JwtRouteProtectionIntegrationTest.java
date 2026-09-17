package com.aiteachercopilot.auth;

import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * QA Integration Tests for [QA-009]: Test JWT Route Protection & Token Expiration (ATC-29 / ATC-203).
 * Verifies security boundary enforcement, JWT lifecycle, tampering detection, and public route access.
 *
 * Acceptance Criteria:
 * 1. Request có valid JWT truy cập endpoint được bảo vệ -> HTTP 200 OK
 * 2. Request không có JWT bị từ chối -> HTTP 401 Unauthorized
 * 3. Request với JWT hết hạn bị từ chối -> HTTP 401 Unauthorized
 * 4. Request với JWT bị giả mạo / sai chữ ký / sai định dạng bị từ chối -> HTTP 401 Unauthorized
 * 5. Request với token của user bị vô hiệu hóa (is_active = false) bị từ chối -> HTTP 401 Unauthorized
 * 6. Public endpoints (/auth/**, /actuator/health) truy cập bình thường không cần JWT
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class JwtRouteProtectionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    private static final String TEACHER_EMAIL = "security.teacher@school.edu.vn";
    private static final String TEACHER_NAME = "Cô Nguyễn Bảo Ngọc";
    private static final String TEACHER_PASSWORD = "StrongTeacherPassword2026!";

    private User activeTeacher;
    private User inactiveTeacher;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        // 1. Seed active teacher
        activeTeacher = User.builder()
                .email(TEACHER_EMAIL)
                .fullName(TEACHER_NAME)
                .passwordHash(passwordEncoder.encode(TEACHER_PASSWORD))
                .role("TEACHER")
                .isActive(true)
                .build();
        activeTeacher = userRepository.save(activeTeacher);

        // 2. Seed inactive teacher
        inactiveTeacher = User.builder()
                .email("inactive.teacher@school.edu.vn")
                .fullName("Thầy Bị Khóa")
                .passwordHash(passwordEncoder.encode(TEACHER_PASSWORD))
                .role("TEACHER")
                .isActive(false)
                .build();
        inactiveTeacher = userRepository.save(inactiveTeacher);
    }

    // =========================================================================
    // Scenario 1: Valid JWT Access
    // =========================================================================
    @Nested
    @DisplayName("Scenario 1: Valid JWT Access to Protected Endpoints")
    class ValidJwtAccessTests {

        @Test
        @DisplayName("Should allow access to protected /workspaces with valid Bearer token (HTTP 200)")
        void testAccessProtected_ValidJwt_Success() throws Exception {
            String token = jwtTokenProvider.generateToken(activeTeacher.getId(), activeTeacher.getEmail());

            mockMvc.perform(get("/workspaces")
                            .header("Authorization", "Bearer " + token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());
        }
    }

    // =========================================================================
    // Scenario 2: Missing or Incomplete Authorization Header
    // =========================================================================
    @Nested
    @DisplayName("Scenario 2: Missing or Incomplete Authorization Header")
    class MissingTokenTests {

        @Test
        @DisplayName("Should reject request without Authorization header (HTTP 401 Unauthorized)")
        void testAccessProtected_NoHeader_Unauthorized() throws Exception {
            mockMvc.perform(get("/workspaces")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Unauthorized"))
                    .andExpect(jsonPath("$.message").value(containsString("Full authentication is required")));
        }

        @Test
        @DisplayName("Should reject request with empty Bearer header (HTTP 401 Unauthorized)")
        void testAccessProtected_EmptyBearer_Unauthorized() throws Exception {
            mockMvc.perform(get("/workspaces")
                            .header("Authorization", "Bearer ")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Unauthorized"));
        }

        @Test
        @DisplayName("Should reject request with wrong auth scheme prefix (e.g. Basic) (HTTP 401)")
        void testAccessProtected_WrongPrefix_Unauthorized() throws Exception {
            mockMvc.perform(get("/workspaces")
                            .header("Authorization", "Basic dXNlcm5hbWU6cGFzc3dvcmQ=")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Unauthorized"));
        }
    }

    // =========================================================================
    // Scenario 3: Token Expiration Handling
    // =========================================================================
    @Nested
    @DisplayName("Scenario 3: Token Expiration Handling")
    class ExpiredTokenTests {

        @Test
        @DisplayName("Should reject request with expired JWT token (HTTP 401 Unauthorized)")
        void testAccessProtected_ExpiredToken_Unauthorized() throws Exception {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Date pastExpiry = new Date(System.currentTimeMillis() - 10_000); // expired 10 seconds ago
            Date pastIssued = new Date(System.currentTimeMillis() - 20_000);

            String expiredToken = Jwts.builder()
                    .subject(activeTeacher.getId().toString())
                    .claim("email", activeTeacher.getEmail())
                    .issuedAt(pastIssued)
                    .expiration(pastExpiry)
                    .signWith(key)
                    .compact();

            mockMvc.perform(get("/workspaces")
                            .header("Authorization", "Bearer " + expiredToken)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Unauthorized"));
        }
    }

    // =========================================================================
    // Scenario 4: Forged, Tampered, or Malformed Tokens
    // =========================================================================
    @Nested
    @DisplayName("Scenario 4: Forged, Tampered, or Malformed Tokens")
    class TamperedTokenTests {

        @Test
        @DisplayName("Should reject request when token signature is signed with different secret key (HTTP 401)")
        void testAccessProtected_InvalidSignature_Unauthorized() throws Exception {
            // Signed with foreign secret key
            SecretKey foreignKey = Keys.hmacShaKeyFor(
                    "completely-different-foreign-secret-key-32-chars-long!".getBytes(StandardCharsets.UTF_8));

            String forgedToken = Jwts.builder()
                    .subject(activeTeacher.getId().toString())
                    .claim("email", activeTeacher.getEmail())
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + 3600_000))
                    .signWith(foreignKey)
                    .compact();

            mockMvc.perform(get("/workspaces")
                            .header("Authorization", "Bearer " + forgedToken)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Unauthorized"));
        }

        @Test
        @DisplayName("Should reject request when token payload is tampered (HTTP 401 Unauthorized)")
        void testAccessProtected_TamperedPayload_Unauthorized() throws Exception {
            String originalToken = jwtTokenProvider.generateToken(activeTeacher.getId(), activeTeacher.getEmail());
            String[] parts = originalToken.split("\\.");

            // Tamper the payload chunk by appending characters
            String tamperedToken = parts[0] + "." + parts[1] + "tampered" + "." + parts[2];

            mockMvc.perform(get("/workspaces")
                            .header("Authorization", "Bearer " + tamperedToken)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Unauthorized"));
        }

        @Test
        @DisplayName("Should reject request with malformed / garbage token string (HTTP 401 Unauthorized)")
        void testAccessProtected_MalformedToken_Unauthorized() throws Exception {
            String malformedToken = "not.a.valid.jwt.token.at.all";

            mockMvc.perform(get("/workspaces")
                            .header("Authorization", "Bearer " + malformedToken)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Unauthorized"));
        }
    }

    // =========================================================================
    // Scenario 5: Inactive User or Non-Existent User Token
    // =========================================================================
    @Nested
    @DisplayName("Scenario 5: User Lifecycle & Account State Boundary")
    class UserLifecycleBoundaryTests {

        @Test
        @DisplayName("Should reject request with valid JWT for deactivated user (isActive = false) (HTTP 401)")
        void testAccessProtected_InactiveUserToken_Unauthorized() throws Exception {
            String inactiveUserToken = jwtTokenProvider.generateToken(
                    inactiveTeacher.getId(), inactiveTeacher.getEmail());

            mockMvc.perform(get("/workspaces")
                            .header("Authorization", "Bearer " + inactiveUserToken)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Unauthorized"));
        }

        @Test
        @DisplayName("Should reject request with valid JWT for deleted / non-existent user ID (HTTP 401)")
        void testAccessProtected_DeletedUserToken_Unauthorized() throws Exception {
            UUID randomUserId = UUID.randomUUID();
            String ghostUserToken = jwtTokenProvider.generateToken(randomUserId, "ghost@school.edu.vn");

            mockMvc.perform(get("/workspaces")
                            .header("Authorization", "Bearer " + ghostUserToken)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Unauthorized"));
        }
    }

    // =========================================================================
    // Scenario 6: Public Endpoints Remain Accessible Without Token
    // =========================================================================
    @Nested
    @DisplayName("Scenario 6: Public Endpoints Accessibility")
    class PublicEndpointsTests {

        @Test
        @DisplayName("Should allow access to /actuator/health without any Authorization header (HTTP 200)")
        void testPublicEndpoint_ActuatorHealth_Permitted() throws Exception {
            mockMvc.perform(get("/actuator/health"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Should allow access to /auth/login without token (rejected by validation, not 401)")
        void testPublicEndpoint_Login_Permitted() throws Exception {
            // Posting bad credentials gives 401/400 from auth logic, NOT blocked at security filter
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail("unknown@school.edu.vn");
            request.setPassword("Password123!");

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(new ObjectMapper().writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid credentials"));
        }

        @Test
        @DisplayName("Should allow access to /auth/register without token (validation error, not 401)")
        void testPublicEndpoint_Register_Permitted() throws Exception {
            // Empty body triggers validation error 400 Bad Request, NOT 401 Unauthorized
            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());
        }
    }
}
