package com.aiteachercopilot.auth;

import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthService authService;

    private AuthDto.RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new AuthDto.RegisterRequest();
        registerRequest.setEmail("teacher@school.edu.vn");
        registerRequest.setPassword("SecretPassword123!");
        registerRequest.setFullName("Thầy Nguyễn Văn A");
    }

    @Test
    @DisplayName("Should successfully register teacher with BCrypt hashed password and role TEACHER")
    void register_Success() {
        // Arrange
        UUID userId = UUID.randomUUID();
        when(userRepository.existsByEmail("teacher@school.edu.vn")).thenReturn(false);
        when(passwordEncoder.encode("SecretPassword123!")).thenReturn("$2a$10$hashedPasswordString");
        when(tokenProvider.generateToken(any(), eq("teacher@school.edu.vn"))).thenReturn("mocked.jwt.token");

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(userId);
            return user;
        });

        // Act
        AuthDto.AuthResponse response = authService.register(registerRequest);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mocked.jwt.token");
        assertThat(response.getEmail()).isEqualTo("teacher@school.edu.vn");
        assertThat(response.getFullName()).isEqualTo("Thầy Nguyễn Văn A");
        assertThat(response.getRole()).isEqualTo("TEACHER");

        // Verify password hashing and persistence
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertThat(savedUser.getEmail()).isEqualTo("teacher@school.edu.vn");
        assertThat(savedUser.getPasswordHash()).isEqualTo("$2a$10$hashedPasswordString");
        assertThat(savedUser.getPasswordHash()).isNotEqualTo("SecretPassword123!");
        assertThat(savedUser.getRole()).isEqualTo("TEACHER");
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when email is already registered")
    void register_DuplicateEmail_ThrowsException() {
        // Arrange
        when(userRepository.existsByEmail("teacher@school.edu.vn")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email is already registered");

        verify(userRepository, never()).save(any(User.class));
    }
}
