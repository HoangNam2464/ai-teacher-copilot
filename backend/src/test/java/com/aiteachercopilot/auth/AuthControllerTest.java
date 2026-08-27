package com.aiteachercopilot.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    @DisplayName("POST /auth/register - Success returns 201 Created and user details without password")
    void register_Success() throws Exception {
        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
        request.setEmail("teacher@school.edu.vn");
        request.setPassword("SecurePassword123!");
        request.setFullName("Thầy Nguyễn Văn A");

        AuthDto.AuthResponse authResponse = new AuthDto.AuthResponse(
                "jwt.mock.token",
                "teacher@school.edu.vn",
                "Thầy Nguyễn Văn A",
                "TEACHER"
        );

        when(authService.register(any(AuthDto.RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Registration successful"))
                .andExpect(jsonPath("$.data.token").value("jwt.mock.token"))
                .andExpect(jsonPath("$.data.email").value("teacher@school.edu.vn"))
                .andExpect(jsonPath("$.data.fullName").value("Thầy Nguyễn Văn A"))
                .andExpect(jsonPath("$.data.role").value("TEACHER"))
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("POST /auth/register - Duplicate email returns 400 Bad Request")
    void register_DuplicateEmail_ReturnsBadRequest() throws Exception {
        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
        request.setEmail("existing@school.edu.vn");
        request.setPassword("SecurePassword123!");
        request.setFullName("Cô Trần Thị B");

        when(authService.register(any(AuthDto.RegisterRequest.class)))
                .thenThrow(new IllegalArgumentException("Email is already registered"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Email is already registered"));
    }

    @Test
    @DisplayName("POST /auth/register - Password less than 8 chars returns 400 Bad Request validation error")
    void register_ShortPassword_ReturnsBadRequest() throws Exception {
        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
        request.setEmail("teacher@school.edu.vn");
        request.setPassword("12345"); // < 8 chars
        request.setFullName("Thầy Nguyễn Văn A");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.data.password").exists());
    }

    @Test
    @DisplayName("POST /auth/register - Invalid email format returns 400 Bad Request validation error")
    void register_InvalidEmail_ReturnsBadRequest() throws Exception {
        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest();
        request.setEmail("invalid-email-format");
        request.setPassword("SecurePassword123!");
        request.setFullName("Thầy Nguyễn Văn A");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.data.email").exists());
    }
}
