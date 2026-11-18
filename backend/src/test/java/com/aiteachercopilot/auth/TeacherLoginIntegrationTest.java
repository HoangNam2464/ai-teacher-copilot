package com.aiteachercopilot.auth;

import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * QA Integration Tests for [QA-008]: Test Teacher Login & Invalid Credentials Handling (ATC-26 / ATC-202).
 * Verifies real end-to-end slice through Controller -> Service -> Security -> Repository -> H2 DB.
 *
 * Acceptance Criteria:
 * 1. Login hợp lệ thành công
 * 2. Sai password bị từ chối
 * 3. User không tồn tại bị từ chối
 * 4. Token được tạo đúng
 * 5. Sensitive information không bị trả về
 * 6. Input validation & Edge cases (Inactive account, Blank inputs, Malformed email)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class TeacherLoginIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private static final String VALID_EMAIL = "teacher.login@school.edu.vn";
    private static final String VALID_PASSWORD = "ValidPassword2026!";
    private static final String TEACHER_NAME = "Thầy Đỗ Nam Trung";

    private User activeTeacher;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        // Seed an active teacher user
        activeTeacher = User.builder()
                .email(VALID_EMAIL)
                .fullName(TEACHER_NAME)
                .passwordHash(passwordEncoder.encode(VALID_PASSWORD))
                .role("TEACHER")
                .isActive(true)
                .build();
        activeTeacher = userRepository.save(activeTeacher);
    }

    // =========================================================================
    // AC-1: Login hợp lệ thành công
    // =========================================================================
    @Nested
    @DisplayName("AC-1: Login hợp lệ thành công")
    class ValidLoginTests {

        @Test
        @DisplayName("Should login successfully with valid credentials and return JWT token with profile")
        void testLogin_ValidCredentials_Success() throws Exception {
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail(VALID_EMAIL);
            request.setPassword(VALID_PASSWORD);

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.token").isString())
                    .andExpect(jsonPath("$.data.token").isNotEmpty())
                    .andExpect(jsonPath("$.data.email").value(VALID_EMAIL))
                    .andExpect(jsonPath("$.data.fullName").value(TEACHER_NAME))
                    .andExpect(jsonPath("$.data.role").value("TEACHER"));
        }
    }

    // =========================================================================
    // AC-2: Sai password bị từ chối
    // =========================================================================
    @Nested
    @DisplayName("AC-2: Sai password bị từ chối")
    class WrongPasswordTests {

        @Test
        @DisplayName("Should reject login when password does not match (HTTP 401 Unauthorized)")
        void testLogin_WrongPassword_Rejected() throws Exception {
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail(VALID_EMAIL);
            request.setPassword("TotallyWrongPassword123!");

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.data").doesNotExist())
                    .andExpect(jsonPath("$.message", anyOf(
                            containsString("Invalid credentials"),
                            containsString("Invalid email or password")
                    )));
        }

        @Test
        @DisplayName("Should reject login with case-variant password (case sensitivity check)")
        void testLogin_PasswordCaseMismatch_Rejected() throws Exception {
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail(VALID_EMAIL);
            // Lowercase variant of VALID_PASSWORD
            request.setPassword(VALID_PASSWORD.toLowerCase());

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    // =========================================================================
    // AC-3: User không tồn tại bị từ chối
    // =========================================================================
    @Nested
    @DisplayName("AC-3: User không tồn tại bị từ chối")
    class NonExistentUserTests {

        @Test
        @DisplayName("Should reject login with unregistered email (HTTP 401 Unauthorized, anti-enumeration)")
        void testLogin_NonExistentEmail_Rejected() throws Exception {
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail("nobody.exists@school.edu.vn");
            request.setPassword("SomePassword123!");

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.data").doesNotExist())
                    .andExpect(jsonPath("$.message", anyOf(
                            containsString("Invalid credentials"),
                            containsString("Invalid email or password")
                    )));
        }
    }

    // =========================================================================
    // AC-4: Token được tạo đúng
    // =========================================================================
    @Nested
    @DisplayName("AC-4: Token được tạo đúng")
    class TokenValidationTests {

        @Test
        @DisplayName("Should generate valid JWT token with valid structure, subject and email claims")
        void testLogin_TokenIsValidJwt() throws Exception {
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail(VALID_EMAIL);
            request.setPassword(VALID_PASSWORD);

            MvcResult result = mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andReturn();

            String jsonResponse = result.getResponse().getContentAsString();
            var tree = objectMapper.readTree(jsonResponse);
            String token = tree.path("data").path("token").asText();

            // 1. Assert token format is 3-part JWT (Header.Payload.Signature)
            assertThat(token).isNotBlank();
            String[] parts = token.split("\\.");
            assertThat(parts).hasSize(3);

            // 2. Validate token with JwtTokenProvider
            assertThat(jwtTokenProvider.validateToken(token)).isTrue();

            // 3. Extract claims from token and verify correctness
            UUID userIdFromToken = jwtTokenProvider.getUserIdFromToken(token);
            assertThat(userIdFromToken).isEqualTo(activeTeacher.getId());

            String emailFromToken = jwtTokenProvider.getEmailFromToken(token);
            assertThat(emailFromToken).isEqualTo(VALID_EMAIL);
        }
    }

    // =========================================================================
    // AC-5: Sensitive information không bị trả về
    // =========================================================================
    @Nested
    @DisplayName("AC-5: Sensitive information không bị trả về")
    class SensitiveDataProtectionTests {

        @Test
        @DisplayName("Should not leak password, passwordHash, salt or secret in success response")
        void testLogin_SuccessResponse_NoSensitiveData() throws Exception {
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail(VALID_EMAIL);
            request.setPassword(VALID_PASSWORD);

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.password").doesNotExist())
                    .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                    .andExpect(jsonPath("$.data.password_hash").doesNotExist())
                    .andExpect(jsonPath("$.data.salt").doesNotExist())
                    .andExpect(content().string(not(containsString(VALID_PASSWORD))))
                    .andExpect(content().string(not(containsString(activeTeacher.getPasswordHash()))));
        }

        @Test
        @DisplayName("Should not leak password, stack trace or DB details in failure response")
        void testLogin_FailureResponse_NoSensitiveData() throws Exception {
            String rawPassword = "FailedAttemptPassword999!";
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail(VALID_EMAIL);
            request.setPassword(rawPassword);

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(content().string(not(containsString(rawPassword))))
                    .andExpect(content().string(not(containsString("org.springframework"))))
                    .andExpect(content().string(not(containsString("Hibernate"))))
                    .andExpect(content().string(not(containsString("SQL"))));
        }
    }

    // =========================================================================
    // AC-6: Dữ liệu đầu vào không hợp lệ & Trạng thái tài khoản (Edge Cases)
    // =========================================================================
    @Nested
    @DisplayName("AC-6: Validation & Account Status Edge Cases")
    class ValidationAndEdgeCaseTests {

        @Test
        @DisplayName("Should reject login when account is inactive / pending email verification (HTTP 401)")
        void testLogin_InactiveAccount_BlockedWithPrompt() throws Exception {
            // Seed inactive teacher
            User inactiveUser = User.builder()
                    .email("inactive.teacher@school.edu.vn")
                    .fullName("Thầy Chưa Kích Hoạt")
                    .passwordHash(passwordEncoder.encode("Password123!"))
                    .role("TEACHER")
                    .isActive(false)
                    .build();
            userRepository.save(inactiveUser);

            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail("inactive.teacher@school.edu.vn");
            request.setPassword("Password123!");

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.data").doesNotExist())
                    .andExpect(jsonPath("$.message", containsString("Tài khoản chưa được kích hoạt")));
        }

        @Test
        @DisplayName("Should reject login with blank email (HTTP 400 Bad Request)")
        void testLogin_BlankEmail_Fails() throws Exception {
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail("   ");
            request.setPassword("SomePassword123!");

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Should reject login with blank password (HTTP 400 Bad Request)")
        void testLogin_BlankPassword_Fails() throws Exception {
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail(VALID_EMAIL);
            request.setPassword("   ");

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @ParameterizedTest
        @ValueSource(strings = {"invalid-email", "teacher@", "@school.edu.vn", "plainaddress"})
        @DisplayName("Should reject login with invalid email formats (HTTP 400 Bad Request)")
        void testLogin_InvalidEmailFormats_Fail(String invalidEmail) throws Exception {
            AuthDto.LoginRequest request = new AuthDto.LoginRequest();
            request.setEmail(invalidEmail);
            request.setPassword("SomePassword123!");

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Should reject login when request body is empty (HTTP 400 Bad Request)")
        void testLogin_EmptyBody_Fails() throws Exception {
            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }
}
