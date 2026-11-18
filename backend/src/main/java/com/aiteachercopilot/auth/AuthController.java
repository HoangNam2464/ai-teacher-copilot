package com.aiteachercopilot.auth;

import com.aiteachercopilot.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> register(
            @Valid @RequestBody AuthDto.RegisterRequest request) {
        AuthDto.AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> login(
            @Valid @RequestBody AuthDto.LoginRequest request) {
        AuthDto.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> googleLogin(
            @Valid @RequestBody AuthDto.GoogleLoginRequest request) {
        AuthDto.AuthResponse response = authService.googleLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Google login successful", response));
    }

    @PostMapping("/facebook")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> facebookLogin(
            @Valid @RequestBody AuthDto.FacebookLoginRequest request) {
        AuthDto.AuthResponse response = authService.facebookLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Facebook login successful", response));
    }

    @PostMapping("/apple")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> appleLogin(
            @Valid @RequestBody AuthDto.AppleLoginRequest request) {
        AuthDto.AuthResponse response = authService.appleLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Apple login successful", response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<AuthDto.MessageResponse>> forgotPassword(
            @Valid @RequestBody AuthDto.ForgotPasswordRequest request) {
        AuthDto.MessageResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<AuthDto.MessageResponse>> resetPassword(
            @Valid @RequestBody AuthDto.ResetPasswordRequest request) {
        AuthDto.MessageResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<AuthDto.MessageResponse>> verifyEmail(
            @Valid @RequestBody AuthDto.VerifyEmailRequest request) {
        AuthDto.MessageResponse response = authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<AuthDto.MessageResponse>> resendVerification(
            @Valid @RequestBody AuthDto.ResendVerificationRequest request) {
        AuthDto.MessageResponse response = authService.resendVerification(request);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }
}
