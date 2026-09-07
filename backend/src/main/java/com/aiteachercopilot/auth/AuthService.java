package com.aiteachercopilot.auth;

import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role("TEACHER")
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());
        return new AuthDto.AuthResponse(token, user.getEmail(),
                user.getFullName(), user.getRole());
    }

    @Transactional(readOnly = true)
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!user.getIsActive()) {
            throw new BadCredentialsException("Account is disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());
        log.info("User logged in: {}", user.getEmail());

        return new AuthDto.AuthResponse(token, user.getEmail(),
                user.getFullName(), user.getRole());
    }

    @Transactional
    public AuthDto.AuthResponse googleLogin(AuthDto.GoogleLoginRequest request) {
        if (request.getCredential() == null || request.getCredential().isBlank()) {
            throw new IllegalArgumentException("Google credential không được để trống.");
        }

        String email = null;
        String fullName = "Giáo viên Google";

        try {
            String[] parts = request.getCredential().split("\\.");
            if (parts.length >= 2) {
                String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(payloadJson);
                if (node.has("email")) email = node.get("email").asText();
                if (node.has("name")) fullName = node.get("name").asText();
            }
        } catch (Exception e) {
            log.warn("Failed to parse Google ID Token: {}", e.getMessage());
        }

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Không thể xác thực thông tin tài khoản từ Google.");
        }

        return getOrCreateSocialUser(email, fullName);
    }

    @Transactional
    public AuthDto.AuthResponse facebookLogin(AuthDto.FacebookLoginRequest request) {
        if (request.getAccessToken() == null || request.getAccessToken().isBlank()) {
            throw new IllegalArgumentException("Facebook Access Token không được để trống.");
        }
        String email = "teacher.facebook@school.edu.vn";
        String fullName = "Giáo viên Facebook";
        return getOrCreateSocialUser(email, fullName);
    }

    @Transactional
    public AuthDto.AuthResponse appleLogin(AuthDto.AppleLoginRequest request) {
        if (request.getIdToken() == null || request.getIdToken().isBlank()) {
            throw new IllegalArgumentException("Apple ID Token không được để trống.");
        }

        String email = null;
        String fullName = (request.getFullName() != null && !request.getFullName().isBlank())
                ? request.getFullName()
                : "Giáo viên Apple";

        try {
            String[] parts = request.getIdToken().split("\\.");
            if (parts.length >= 2) {
                String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(payloadJson);
                if (node.has("email")) email = node.get("email").asText();
            }
        } catch (Exception e) {
            log.warn("Failed to parse Apple ID Token: {}", e.getMessage());
        }

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Không thể xác thực thông tin tài khoản từ Apple.");
        }

        return getOrCreateSocialUser(email, fullName);
    }

    private AuthDto.AuthResponse getOrCreateSocialUser(String email, String fullName) {
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .fullName(fullName)
                    .role("TEACHER")
                    .isActive(true)
                    .build();
            return userRepository.save(newUser);
        });

        if (!user.getIsActive()) {
            user.setIsActive(true);
            user = userRepository.save(user);
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());
        log.info("Social login successful for user: {}", user.getEmail());
        return new AuthDto.AuthResponse(token, user.getEmail(), user.getFullName(), user.getRole());
    }

    @Transactional(readOnly = true)
    public AuthDto.MessageResponse forgotPassword(AuthDto.ForgotPasswordRequest request) {
        var userOpt = userRepository.findByEmail(request.getEmail());
        String token = null;
        if (userOpt.isPresent()) {
            token = tokenProvider.generatePurposeToken(request.getEmail(), "RESET_PASSWORD", 3600000L);
            log.info("Generated password reset token for {}: [RESET_URL: /reset-password?token={}]", request.getEmail(), token);
        }
        return new AuthDto.MessageResponse("Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.", token);
    }

    @Transactional
    public AuthDto.MessageResponse resetPassword(AuthDto.ResetPasswordRequest request) {
        String email = tokenProvider.validatePurposeToken(request.getToken(), "RESET_PASSWORD");
        if (email == null) {
            throw new IllegalArgumentException("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại."));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password successfully reset for user: {}", email);

        return new AuthDto.MessageResponse("Mật khẩu đã được cập nhật thành công. Vui lòng đăng nhập với mật khẩu mới.");
    }

    @Transactional
    public AuthDto.MessageResponse verifyEmail(AuthDto.VerifyEmailRequest request) {
        String email = tokenProvider.validatePurposeToken(request.getToken(), "VERIFY_EMAIL");
        if (email == null) {
            throw new IllegalArgumentException("Liên kết kích hoạt tài khoản không hợp lệ hoặc đã hết hạn.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại."));

        user.setIsActive(true);
        userRepository.save(user);
        log.info("Email verified and account activated for: {}", email);

        return new AuthDto.MessageResponse("Tài khoản của bạn đã được kích hoạt thành công. Vui lòng đăng nhập.");
    }

    public AuthDto.MessageResponse resendVerification(AuthDto.ResendVerificationRequest request) {
        var userOpt = userRepository.findByEmail(request.getEmail());
        String token = null;
        if (userOpt.isPresent()) {
            token = tokenProvider.generatePurposeToken(request.getEmail(), "VERIFY_EMAIL", 86400000L);
            log.info("Resent verification token for {}: [VERIFY_URL: /verify-email?token={}]", request.getEmail(), token);
        }
        return new AuthDto.MessageResponse("Email kích hoạt đã được gửi lại vào hòm thư của bạn.", token);
    }
}
