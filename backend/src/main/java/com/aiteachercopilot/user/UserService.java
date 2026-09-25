package com.aiteachercopilot.user;

import com.aiteachercopilot.common.exception.ResourceNotFoundException;
import com.aiteachercopilot.document.DocumentRepository;
import com.aiteachercopilot.workspace.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final DocumentRepository documentRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserDto.ProfileResponse getProfile(UUID userId) {
        User user = findUserById(userId);
        return UserDto.ProfileResponse.fromEntity(user);
    }

    @Transactional
    public UserDto.ProfileResponse updateProfile(UUID userId, UserDto.UpdateProfileRequest request) {
        User user = findUserById(userId);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        if (request.getEducationLevel() != null) {
            user.setEducationLevel(request.getEducationLevel().trim());
        }

        if (request.getSubjects() != null) {
            user.setSubjects(request.getSubjects());
        }

        User updated = userRepository.save(user);
        log.info("Profile updated for user: id={}, email={}", updated.getId(), updated.getEmail());
        return UserDto.ProfileResponse.fromEntity(updated);
    }

    @Transactional
    public void changePassword(UUID userId, UserDto.ChangePasswordRequest request) {
        User user = findUserById(userId);

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác.");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new IllegalArgumentException("Mật khẩu mới phải có tối thiểu 8 ký tự.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed successfully for user: id={}, email={}", user.getId(), user.getEmail());
    }

    @Transactional
    public UserDto.ProfileResponse updateNotifications(UUID userId, UserDto.UpdateNotificationsRequest request) {
        User user = findUserById(userId);
        user.setNotificationPreferences(request.getNotificationPreferences());
        User updated = userRepository.save(user);
        log.info("Notification preferences updated for user: id={}", user.getId());
        return UserDto.ProfileResponse.fromEntity(updated);
    }

    @Transactional
    public UserDto.ProfileResponse updatePlan(UUID userId, UserDto.UpdatePlanRequest request) {
        User user = findUserById(userId);
        if (request.getPlan() == null || request.getPlan().isBlank()) {
            throw new IllegalArgumentException("Gói đăng ký không được để trống.");
        }
        String plan = request.getPlan().trim().toUpperCase();
        user.setPlan(plan);
        User updated = userRepository.save(user);
        log.info("Plan updated to {} for user: id={}", plan, user.getId());
        return UserDto.ProfileResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteAccount(UUID userId) {
        User user = findUserById(userId);
        log.warn("Deleting account and all associated data for user: id={}, email={}", user.getId(), user.getEmail());

        // 1. Collect workspace IDs owned by user
        var workspaces = workspaceRepository.findByOwnerId(userId);
        var workspaceIds = workspaces.stream().map(w -> w.getId()).toList();

        // 2. Delete all documents in user's workspaces (covers docs uploaded by others)
        if (!workspaceIds.isEmpty()) {
            documentRepository.deleteByWorkspaceIdIn(workspaceIds);
        }

        // 3. Delete any remaining documents uploaded by user in other workspaces
        var ownDocs = documentRepository.findByUploadedBy(userId);
        if (!ownDocs.isEmpty()) {
            documentRepository.deleteAll(ownDocs);
        }

        // 4. Delete all workspaces owned by user
        if (!workspaces.isEmpty()) {
            workspaceRepository.deleteAll(workspaces);
        }

        // 5. Delete user record completely from database
        userRepository.delete(user);
        log.info("Account successfully purged from system: id={}, email={}", userId, user.getEmail());
    }

    private User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));
    }
}
