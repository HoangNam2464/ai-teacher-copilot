package com.aiteachercopilot.user;

import com.aiteachercopilot.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto.ProfileResponse>> getProfile(
            @AuthenticationPrincipal User user) {
        UserDto.ProfileResponse response = userService.getProfile(user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto.ProfileResponse>> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UserDto.UpdateProfileRequest request) {
        UserDto.ProfileResponse response = userService.updateProfile(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công", response));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserDto.ProfileResponse>> patchProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UserDto.UpdateProfileRequest request) {
        UserDto.ProfileResponse response = userService.updateProfile(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công", response));
    }

    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UserDto.ChangePasswordRequest request) {
        userService.changePassword(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }

    @PutMapping("/me/notifications")
    public ResponseEntity<ApiResponse<UserDto.ProfileResponse>> updateNotifications(
            @AuthenticationPrincipal User user,
            @RequestBody UserDto.UpdateNotificationsRequest request) {
        UserDto.ProfileResponse response = userService.updateNotifications(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tùy chọn thông báo thành công", response));
    }

    @PutMapping("/me/plan")
    public ResponseEntity<ApiResponse<UserDto.ProfileResponse>> updatePlan(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UserDto.UpdatePlanRequest request) {
        UserDto.ProfileResponse response = userService.updatePlan(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật gói thành công", response));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @AuthenticationPrincipal User user) {
        userService.deleteAccount(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Tài khoản đã được xóa vĩnh viễn khỏi hệ thống", null));
    }
}
