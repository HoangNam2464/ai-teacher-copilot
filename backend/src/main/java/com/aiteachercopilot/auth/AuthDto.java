package com.aiteachercopilot.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public final class AuthDto {

    private AuthDto() {}

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;

        @NotBlank(message = "Full name is required")
        private String fullName;
    }

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String email;
        private String fullName;
        private String role;

        public AuthResponse(String token, String email, String fullName, String role) {
            this.token = token;
            this.email = email;
            this.fullName = fullName;
            this.role = role;
        }
    }

    @Data
    public static class GoogleLoginRequest {
        @NotBlank(message = "Google credential is required")
        private String credential;
    }

    @Data
    public static class FacebookLoginRequest {
        @NotBlank(message = "Facebook access token is required")
        private String accessToken;
    }

    @Data
    public static class AppleLoginRequest {
        @NotBlank(message = "Apple idToken is required")
        private String idToken;
        private String fullName;
    }

    @Data
    public static class ForgotPasswordRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank(message = "Token is required")
        private String token;

        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String newPassword;
    }

    @Data
    public static class VerifyEmailRequest {
        @NotBlank(message = "Token is required")
        private String token;
    }

    @Data
    public static class ResendVerificationRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
    }

    @Data
    public static class MessageResponse {
        private String message;
        private String token;

        public MessageResponse(String message) {
            this.message = message;
        }

        public MessageResponse(String message, String token) {
            this.message = message;
            this.token = token;
        }
    }
}
