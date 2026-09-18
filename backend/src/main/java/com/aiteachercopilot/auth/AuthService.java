package com.aiteachercopilot.auth;

import com.aiteachercopilot.common.service.EmailService;
import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Slf4j
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    @Value("${app.google.client-id}")
    private String googleClientId;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.emailService = emailService;
    }

    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role("TEACHER")
                .isActive(false)
                .build();

        user = userRepository.save(user);
        log.info("New user registered (pending email verification): {}", user.getEmail());

        String verifyToken = tokenProvider.generatePurposeToken(user.getEmail(), "VERIFY_EMAIL", 86400000L);
        String verificationUrl = String.format("%s/verify-email?token=%s&email=%s",
                frontendUrl, verifyToken, user.getEmail());

        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), verificationUrl);

        return new AuthDto.AuthResponse(
                null,
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                true,
                "Tài khoản đã được tạo thành công. Vui lòng kiểm tra email để kích hoạt tài khoản của bạn."
        );
    }

    @Transactional(readOnly = true)
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!user.getIsActive()) {
            throw new BadCredentialsException("Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt trước khi đăng nhập.");
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

        if (googleClientId == null || googleClientId.isBlank()) {
            log.error("GOOGLE_CLIENT_ID is not configured. Cannot verify Google ID Token.");
            throw new IllegalStateException("Google Login chưa được cấu hình trên server.");
        }

        log.info("googleLogin: configured googleClientId = {}", googleClientId);
        try {
            GoogleIdToken parsed = GoogleIdToken.parse(GsonFactory.getDefaultInstance(), request.getCredential());
            if (parsed != null && parsed.getPayload() != null) {
                Payload p = parsed.getPayload();
                long nowSec = System.currentTimeMillis() / 1000;
                log.info("Google Token Parsed: aud={}, iss={}, exp={}, iat={}, serverNowSec={}, diffSec={}",
                        p.getAudience(), p.getIssuer(), p.getExpirationTimeSeconds(), p.getIssuedAtTimeSeconds(),
                        nowSec, (p.getExpirationTimeSeconds() - nowSec));
                boolean audMatch = parsed.verifyAudience(Collections.singletonList(googleClientId));
                log.info("verifyAudience: {}", audMatch);
            }
        } catch (Exception parseEx) {
            log.warn("Failed to parse token for diagnostic: {}", parseEx.getMessage());
        }

        GoogleIdToken idToken;
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            idToken = verifier.verify(request.getCredential());
        } catch (Exception e) {
            log.warn("Google ID Token verification failed: {}", e.getMessage());
            throw new IllegalArgumentException("Không thể xác thực Google ID Token: " + e.getMessage());
        }

        if (idToken == null) {
            log.warn("Google ID Token verification returned null — token is invalid, wrong audience, or expired.");
            throw new IllegalArgumentException("Google ID Token không hợp lệ hoặc đã hết hạn.");
        }

        Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String fullName = (String) payload.get("name");
        String picture = (String) payload.get("picture");
        if (fullName == null || fullName.isBlank()) {
            fullName = "Giáo viên Google";
        }

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Không thể lấy email từ Google ID Token.");
        }

        log.info("Google ID Token verified successfully for: {}", email);
        AuthDto.AuthResponse response = getOrCreateSocialUser(email, fullName);
        if (picture != null && !picture.isBlank()) {
            response.setAvatarUrl(picture);
        }
        return response;
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
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String token = tokenProvider.generatePurposeToken(user.getEmail(), "RESET_PASSWORD", 3600000L);
            String resetUrl = String.format("%s/reset-password?token=%s&email=%s",
                    frontendUrl, token, user.getEmail());
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), resetUrl);
            log.info("Sent password reset email to: {}", user.getEmail());
        }
        // Always return the same message to prevent email enumeration
        return new AuthDto.MessageResponse("Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.");
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

    @Transactional(readOnly = true)
    public AuthDto.MessageResponse resendVerification(AuthDto.ResendVerificationRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!user.getIsActive()) {
                String token = tokenProvider.generatePurposeToken(user.getEmail(), "VERIFY_EMAIL", 86400000L);
                String verificationUrl = String.format("%s/verify-email?token=%s&email=%s",
                        frontendUrl, token, user.getEmail());
                emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), verificationUrl);
                log.info("Resent verification email to: {}", user.getEmail());
            }
        }
        return new AuthDto.MessageResponse("Email kích hoạt đã được gửi lại vào hòm thư của bạn.");
    }
}
