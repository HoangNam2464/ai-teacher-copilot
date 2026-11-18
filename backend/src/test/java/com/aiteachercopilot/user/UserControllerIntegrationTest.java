package com.aiteachercopilot.user;

import com.aiteachercopilot.auth.JwtTokenProvider;
import com.aiteachercopilot.workspace.Workspace;
import com.aiteachercopilot.workspace.WorkspaceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class UserControllerIntegrationTest {

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

    private User testUser;
    private String token;

    @BeforeEach
    void setUp() {
        workspaceRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(User.builder()
                .email("teacher.test@school.edu.vn")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Cô Nguyễn Thị Lan")
                .role("TEACHER")
                .isActive(true)
                .educationLevel("high_school")
                .subjects("[\"Toán học\", \"Vật lý\"]")
                .plan("FREE")
                .build());

        token = jwtTokenProvider.generateToken(testUser.getId(), testUser.getEmail());
    }

    @Test
    @DisplayName("GET /users/me - Trả về profile chính xác của người dùng đăng nhập")
    void getProfile_Success() throws Exception {
        mockMvc.perform(get("/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("teacher.test@school.edu.vn"))
                .andExpect(jsonPath("$.data.fullName").value("Cô Nguyễn Thị Lan"))
                .andExpect(jsonPath("$.data.educationLevel").value("high_school"))
                .andExpect(jsonPath("$.data.plan").value("FREE"));
    }

    @Test
    @DisplayName("GET /users/me - Không có token trả về HTTP 401 Unauthorized")
    void getProfile_Unauthorized() throws Exception {
        mockMvc.perform(get("/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /users/me - Cập nhật thông tin profile thành công")
    void updateProfile_Success() throws Exception {
        UserDto.UpdateProfileRequest request = new UserDto.UpdateProfileRequest(
                "Cô Lan Dạy Toán 12",
                "data:image/png;base64,mockAvatar",
                "high_school",
                "[\"Toán học\", \"Tin học\"]"
        );

        mockMvc.perform(put("/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Cô Lan Dạy Toán 12"))
                .andExpect(jsonPath("$.data.avatarUrl").value("data:image/png;base64,mockAvatar"))
                .andExpect(jsonPath("$.data.educationLevel").value("high_school"));

        User reloaded = userRepository.findById(testUser.getId()).orElseThrow();
        assertThat(reloaded.getFullName()).isEqualTo("Cô Lan Dạy Toán 12");
        assertThat(reloaded.getAvatarUrl()).isEqualTo("data:image/png;base64,mockAvatar");
    }

    @Test
    @DisplayName("PUT /users/me/password - Đổi mật khẩu thành công khi mật khẩu cũ đúng")
    void changePassword_Success() throws Exception {
        UserDto.ChangePasswordRequest request = new UserDto.ChangePasswordRequest(
                "Password123!",
                "NewSecurePassword2026!"
        );

        mockMvc.perform(put("/users/me/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        User reloaded = userRepository.findById(testUser.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("NewSecurePassword2026!", reloaded.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("PUT /users/me/password - Từ chối đổi mật khẩu khi mật khẩu cũ sai")
    void changePassword_WrongOldPassword() throws Exception {
        UserDto.ChangePasswordRequest request = new UserDto.ChangePasswordRequest(
                "WrongOldPassword!",
                "NewSecurePassword2026!"
        );

        mockMvc.perform(put("/users/me/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("PUT /users/me/notifications - Cập nhật tùy chọn thông báo thành công")
    void updateNotifications_Success() throws Exception {
        String jsonPrefs = "{\"enabled\":true,\"documentProcessing\":false,\"securityAlerts\":true,\"productUpdates\":true}";
        UserDto.UpdateNotificationsRequest request = new UserDto.UpdateNotificationsRequest(jsonPrefs);

        mockMvc.perform(put("/users/me/notifications")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.notificationPreferences").value(jsonPrefs));
    }

    @Test
    @DisplayName("PUT /users/me/plan - Cập nhật gói đăng ký thành PRO thành công")
    void updatePlan_Success() throws Exception {
        UserDto.UpdatePlanRequest request = new UserDto.UpdatePlanRequest("PRO");

        mockMvc.perform(put("/users/me/plan")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.plan").value("PRO"));

        User reloaded = userRepository.findById(testUser.getId()).orElseThrow();
        assertThat(reloaded.getPlan()).isEqualTo("PRO");
    }

    @Test
    @DisplayName("DELETE /users/me - Xóa tài khoản vĩnh viễn và các dữ liệu liên quan")
    void deleteAccount_Success() throws Exception {
        // Tạo một workspace cho user
        workspaceRepository.save(Workspace.builder()
                .ownerId(testUser.getId())
                .name("Toán 12 Thầy Test")
                .build());

        mockMvc.perform(delete("/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(userRepository.findById(testUser.getId())).isEmpty();
        assertThat(workspaceRepository.findByOwnerId(testUser.getId())).isEmpty();
    }
}
