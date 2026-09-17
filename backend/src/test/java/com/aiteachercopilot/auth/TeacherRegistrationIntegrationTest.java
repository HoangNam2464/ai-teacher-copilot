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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * QA Integration Tests for [QA-007]: Test Teacher Registration & Duplicate Email Handling (ATC-22).
 * Verifies real end-to-end slice through Controller -> Service -> Security -> Repository -> H2 DB.
 *
 * Acceptance Criteria:
 * 1. Registration hợp lệ thành công
 * 2. Email không hợp lệ bị từ chối
 * 3. Password không hợp lệ bị từ chối
 * 4. Email trùng được xử lý đúng
 * 5. Password được lưu dưới dạng hash
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class TeacherRegistrationIntegrationTest {

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

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("AC-1: Registration hợp lệ thành công")
    class ValidRegistrationTests {

        @Test
        @DisplayName("Should successfully register a new teacher with pending email verification, then activate and login")
        void testRegister_ValidTeacher_Success() throws Exception {
            AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
            request.setEmail("teacher.nguyen@school.edu.vn");
            request.setPassword("ChinhPhucToan123!");
            request.setFullName("Thầy Nguyễn Văn Nam");

            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Registration successful"))
                    .andExpect(jsonPath("$.data.requiresEmailVerification").value(true))
                    .andExpect(jsonPath("$.data.email").value("teacher.nguyen@school.edu.vn"))
                    .andExpect(jsonPath("$.data.fullName").value("Thầy Nguyễn Văn Nam"))
                    .andExpect(jsonPath("$.data.role").value("TEACHER"));

            // Verify persistence in real database: user is INACTIVE until email verification
            Optional<User> savedOpt = userRepository.findByEmail("teacher.nguyen@school.edu.vn");
            assertThat(savedOpt).isPresent();
            User savedUser = savedOpt.get();

            assertThat(savedUser.getId()).isNotNull();
            assertThat(savedUser.getEmail()).isEqualTo("teacher.nguyen@school.edu.vn");
            assertThat(savedUser.getFullName()).isEqualTo("Thầy Nguyễn Văn Nam");
            assertThat(savedUser.getRole()).isEqualTo("TEACHER");
            assertThat(savedUser.getIsActive()).isFalse();
            assertThat(savedUser.getCreatedAt()).isNotNull();

            // Attempt login before email verification -> Rejected with 401
            AuthDto.LoginRequest loginBeforeVerify = new AuthDto.LoginRequest();
            loginBeforeVerify.setEmail("teacher.nguyen@school.edu.vn");
            loginBeforeVerify.setPassword("ChinhPhucToan123!");

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginBeforeVerify)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error").value(containsString("chưa được kích hoạt")));

            // Activate account via token
            String activationToken = jwtTokenProvider.generatePurposeToken("teacher.nguyen@school.edu.vn", "VERIFY_EMAIL", 86400000L);
            AuthDto.VerifyEmailRequest verifyReq = new AuthDto.VerifyEmailRequest();
            verifyReq.setToken(activationToken);

            mockMvc.perform(post("/auth/verify-email")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(verifyReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));

            // User is now active
            User activeUser = userRepository.findByEmail("teacher.nguyen@school.edu.vn").orElseThrow();
            assertThat(activeUser.getIsActive()).isTrue();

            // Login after activation -> Success with JWT token
            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginBeforeVerify)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.token").isNotEmpty())
                    .andExpect(jsonPath("$.data.email").value("teacher.nguyen@school.edu.vn"));
        }
    }

    @Nested
    @DisplayName("AC-2: Email không hợp lệ bị từ chối")
    class InvalidEmailTests {

        @ParameterizedTest(name = "Should reject invalid email: ''{0}'' with HTTP 400 Bad Request")
        @ValueSource(strings = {
                "",
                "   ",
                "plainaddress",
                "@missingusername.com",
                "username@.com",
                "user space@school.edu.vn"
        })
        void testRegister_InvalidEmail_RejectedWith400(String invalidEmail) throws Exception {
            AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
            request.setEmail(invalidEmail);
            request.setPassword("StrongPassword123!");
            request.setFullName("Cô Giáo Mai");

            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Validation failed"))
                    .andExpect(jsonPath("$.data.email").exists());

            // Verify no user was saved
            assertThat(userRepository.count()).isZero();
        }

        @Test
        @DisplayName("Should reject null email with HTTP 400 Bad Request")
        void testRegister_NullEmail_RejectedWith400() throws Exception {
            AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
            request.setEmail(null);
            request.setPassword("StrongPassword123!");
            request.setFullName("Cô Giáo Mai");

            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Validation failed"))
                    .andExpect(jsonPath("$.data.email").exists());

            assertThat(userRepository.count()).isZero();
        }
    }

    @Nested
    @DisplayName("AC-3: Password không hợp lệ bị từ chối")
    class InvalidPasswordTests {

        @ParameterizedTest(name = "Should reject short or invalid password: ''{0}'' with HTTP 400")
        @ValueSource(strings = {
                "",
                "   ",
                "12345",
                "short",
                "1234567" // 7 characters, minimum required is 8
        })
        void testRegister_ShortOrBlankPassword_RejectedWith400(String invalidPassword) throws Exception {
            AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
            request.setEmail("teacher.valid@school.edu.vn");
            request.setPassword(invalidPassword);
            request.setFullName("Thầy Hoàng Nam");

            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Validation failed"))
                    .andExpect(jsonPath("$.data.password").exists());

            assertThat(userRepository.count()).isZero();
        }

        @Test
        @DisplayName("Should reject null password with HTTP 400 Bad Request")
        void testRegister_NullPassword_RejectedWith400() throws Exception {
            AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
            request.setEmail("teacher.valid@school.edu.vn");
            request.setPassword(null);
            request.setFullName("Thầy Hoàng Nam");

            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Validation failed"))
                    .andExpect(jsonPath("$.data.password").exists());

            assertThat(userRepository.count()).isZero();
        }
    }

    @Nested
    @DisplayName("AC-4: Email trùng được xử lý đúng")
    class DuplicateEmailTests {

        @Test
        @DisplayName("Should reject duplicate email registration with HTTP 400 and clear error message")
        void testRegister_DuplicateEmail_RejectedWith400() throws Exception {
            String duplicateEmail = "existing.teacher@school.edu.vn";

            // 1. Initial registration - should succeed
            AuthDto.RegisterRequest firstRequest = new AuthDto.RegisterRequest();
            firstRequest.setEmail(duplicateEmail);
            firstRequest.setPassword("InitialPassword123!");
            firstRequest.setFullName("Thầy Nguyễn Văn A");

            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(firstRequest)))
                    .andExpect(status().isCreated());

            assertThat(userRepository.count()).isEqualTo(1);

            // 2. Second registration with identical email - should fail
            AuthDto.RegisterRequest duplicateRequest = new AuthDto.RegisterRequest();
            duplicateRequest.setEmail(duplicateEmail);
            duplicateRequest.setPassword("DifferentPassword999!");
            duplicateRequest.setFullName("Thầy Nguyễn Văn B");

            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(duplicateRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error").value("Email is already registered"));

            // Verify database still only contains 1 user, and original data wasn't mutated
            assertThat(userRepository.count()).isEqualTo(1);
            User originalUser = userRepository.findByEmail(duplicateEmail).orElseThrow();
            assertThat(originalUser.getFullName()).isEqualTo("Thầy Nguyễn Văn A");
            assertThat(passwordEncoder.matches("InitialPassword123!", originalUser.getPasswordHash())).isTrue();
        }
    }

    @Nested
    @DisplayName("AC-5: Password được lưu dưới dạng hash")
    class PasswordHashingSecurityTests {

        @Test
        @DisplayName("Should store password as BCrypt hash in database and never in plain text or in API response")
        void testRegister_PasswordHashedAndNeverExposed() throws Exception {
            String rawPassword = "TopSecretPassword2026$!";
            AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
            request.setEmail("secure.teacher@school.edu.vn");
            request.setPassword(rawPassword);
            request.setFullName("Cô Trần Thị Bảo");

            // 1. Assert response never leaks password or hash
            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.password").doesNotExist())
                    .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                    .andExpect(jsonPath("$.data.password_hash").doesNotExist())
                    .andExpect(content().string(org.hamcrest.Matchers.not(containsString(rawPassword))));

            // 2. Query database directly and verify BCrypt hash
            User savedUser = userRepository.findByEmail("secure.teacher@school.edu.vn").orElseThrow();
            String storedHash = savedUser.getPasswordHash();

            assertThat(storedHash).isNotNull();
            // Verify BCrypt hash prefix ($2a$, $2b$, or $2y$)
            assertThat(storedHash).matches("^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$");
            // Verify it is NOT plain text
            assertThat(storedHash).isNotEqualTo(rawPassword);
            assertThat(storedHash).doesNotContain(rawPassword);
            // Verify BCrypt password encoder validates the raw password against stored hash
            assertThat(passwordEncoder.matches(rawPassword, storedHash)).isTrue();
            // Verify wrong password does not match
            assertThat(passwordEncoder.matches("WrongPassword", storedHash)).isFalse();
        }
    }
}
