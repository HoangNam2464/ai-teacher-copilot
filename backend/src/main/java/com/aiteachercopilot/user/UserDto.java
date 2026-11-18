package com.aiteachercopilot.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

public class UserDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileResponse {
        private UUID id;
        private String email;
        private String fullName;
        private String role;
        private Boolean isActive;
        private String avatarUrl;
        private String educationLevel;
        private String subjects;
        private String notificationPreferences;
        private String plan;
        private Instant createdAt;

        public static ProfileResponse fromEntity(User user) {
            return ProfileResponse.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole())
                    .isActive(user.getIsActive())
                    .avatarUrl(user.getAvatarUrl())
                    .educationLevel(user.getEducationLevel())
                    .subjects(user.getSubjects())
                    .notificationPreferences(user.getNotificationPreferences())
                    .plan(user.getPlan() != null ? user.getPlan() : "FREE")
                    .createdAt(user.getCreatedAt())
                    .build();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateProfileRequest {
        @NotBlank(message = "Họ và tên không được để trống")
        private String fullName;

        private String avatarUrl;
        private String educationLevel;
        private String subjects;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Mật khẩu hiện tại không được để trống")
        private String oldPassword;

        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 8, message = "Mật khẩu mới phải có tối thiểu 8 ký tự")
        private String newPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateNotificationsRequest {
        private String notificationPreferences;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdatePlanRequest {
        @NotBlank(message = "Gói đăng ký không được để trống")
        private String plan;
    }
}
