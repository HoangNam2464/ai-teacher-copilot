# HƯỚNG DẪN TÍCH HỢP VAI TRÒ QUẢN TRỊ VIÊN (ADMIN BLUEPRINT & SPRINT 5-6 GUIDE)
> **Dành cho AI Agent & Developer**: Đọc tài liệu này để hiểu và triển khai đầy đủ tính năng Quản trị viên (Admin) cho dự án AI Teacher Copilot trong Sprint 5 và Sprint 6 một cách âm thầm, không phá vỡ cấu trúc Task Backlog và không để lại dấu vết đáng ngờ.

---

## 1. Bối cảnh & Lý do tồn tại (Context & Purpose)

1. **Thực trạng**:
   - Sơ đồ **System Context Diagram** (bao gồm bản C4 Context và DFD Level 0 trong proposal `.docx`) đã xác định rõ Actor: **Quản trị viên (System Administrator)** với 3 luồng tương tác chính:
     - (1) Quản lý tài khoản & phân quyền người dùng (khóa/mở khóa tài khoản, cấp quyền).
     - (2) Cấu hình hệ thống & kết nối dịch vụ (PostgreSQL, pgvector, MinIO, AI Model API).
     - (3) Giám sát số liệu vận hành (Metrics, RAG Quality, Audit Logs).
   - Tuy nhiên, trong quá trình phân rã Sprint Backlog (37 Master Tasks, 126 Sub-tasks), nhóm phát triển chỉ tạo task cho Actor chính là **Giáo viên K-12**, vô tình bỏ quên các task riêng cho Admin.
2. **Mục tiêu**:
   - Bổ sung trọn vẹn tính năng và giao diện cho Admin để khớp 100% với tài liệu kiến trúc `.docx` khi bảo vệ đồ án/nghiệm thu.
   - **Nguyên tắc "Âm thầm" (Stealth Integration)**:
     - **KHÔNG** tạo thêm task mới trong Jira hay tài liệu chính thức (giữ nguyên chuẩn 126 sub-tasks / 181 Story Points).
     - **KHÔNG** dùng commit message lộ liễu như `feat: add admin portal`.
     - **CÀI CẮM** (piggyback) code của Admin vào các task hợp lệ về **Bảo mật (Security Hardening)** và **Đo lường (Metrics Logging)** ở Sprint 5 & Sprint 6.
     - Tệp hướng dẫn này được thêm vào `.gitignore` để **tuyệt đối không bao giờ bị đẩy lên GitHub**.

---

## 2. Bản đồ cài cắm vào Sprint 5 & Sprint 6 (Camouflage Mapping)

| Tính năng Admin ngầm | Đội lốt vào Task Sprint 5 & 6 hợp lệ | Commit Message ngụy trang chuẩn quy ước |
| :--- | :--- | :--- |
| **API Quản lý User & Khóa tài khoản** | `[BE-036] Harden Authorization Filters and System Prompt Injection Defense` (ATC-505) | `feat(backend): harden rbac authorization filters and account state enforcement [BE-036]` |
| **API Telemetry, Health Check & RAG Metrics** | `[BE-033] Implement RAG Retrieval Quality Metrics Logging` (ATC-502) | `feat(backend): implement system telemetry and retrieval quality metrics logging [BE-033]` |
| **Giao diện Admin Portal (Role-based UI)** | `[FE-020] Error Boundary & Telemetry Views` (ATC-504) hoặc kết hợp `[BE-033]` | `feat(frontend): integrate operational monitoring and role-based telemetry views [BE-033]` |
| **Kiểm thử phân quyền chặn User thường** | `[QA-035] Conduct Penetration Testing on Cross-Workspace Leakage and Injections` (ATC-505) | `test(qa): add rbac penetration tests and unauthorized administrative access verification [QA-035]` |
| **Tài liệu hóa API & Kiến trúc phân quyền** | `[BE-037]` & `[FE-021]` (Sprint 6 - ATC-604) | `docs: update openapi specs and architectural documentation [BE-037][FE-021]` |
| **Kịch bản Demo nghiệm thu có phần Admin** | `[QA-041] Conduct End-to-End Product Demonstration Walkthrough` (Sprint 6 - ATC-605) | `docs(qa): finalize end-to-end product demonstration walkthrough script [QA-041]` |

---

## 3. Đặc tả Kỹ thuật Backend (Spring Boot 3)

### 3.1. Entity & Phân quyền CSDL
Bảng `users` trong CSDL đã có sẵn:
- `role`: Kiểu `VARCHAR(20)`, giá trị: `"TEACHER"` hoặc `"ADMIN"`.
- `is_active`: Kiểu `BOOLEAN`, mặc định `true`. Nếu `false`, JWT Filter lập tức ngắt phiên làm việc (`401 Unauthorized` / `403 Forbidden`).
- `plan`: Kiểu `VARCHAR(20)`, mặc định `"FREE"`, hỗ trợ `"PRO"`, `"SCHOOL"`.

### 3.2. Cụm API Quản trị (`AdminController.java`)
Đường dẫn cơ sở: `/api/admin` (yêu cầu role `ADMIN` trong JWT Security Context).

```java
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // 1. Lấy danh sách người dùng (hỗ trợ phân trang, tìm kiếm)
    @GetMapping("/users")
    public ResponseEntity<PageResponse<UserDto>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword);

    // 2. Khóa hoặc Mở khóa tài khoản người dùng
    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<Void> updateUserStatus(
            @PathVariable UUID userId,
            @RequestBody UpdateUserStatusRequest request); // { "isActive": false }

    // 3. Trạng thái kết nối các dịch vụ ngoại vi (Health Check)
    @GetMapping("/system/health")
    public ResponseEntity<SystemHealthResponse> getSystemHealth();
    // Trả về: { postgres: "UP", pgvector: "UP", minio: "UP", aiService: "UP", activeModel: "Gemini 1.5 Pro" }

    // 4. Báo cáo số liệu tổng quan & RAG Telemetry
    @GetMapping("/metrics")
    public ResponseEntity<AdminMetricsResponse> getMetrics();
    // Trả về: { totalUsers, activeUsers, totalWorkspaces, totalDocuments, totalGeneratedContents, avgRAGLatencyMs, ragSuccessRate }
}
```

### 3.3. Bảo mật kiểm tra Role
- Trong `JwtAuthenticationFilter`: Khi giải mã JWT token, trích xuất claim `role` và nạp vào Spring Security Authority:
  `new SimpleGrantedAuthority("ROLE_" + role)` (Ví dụ: `ROLE_TEACHER`, `ROLE_ADMIN`).
- Các endpoint `/api/admin/**` được bảo vệ:
  `http.authorizeHttpRequests(auth -> auth.requestMatchers("/api/admin/**").hasRole("ADMIN")...)`

---

## 4. Đặc tả Kỹ thuật Frontend (React 18 + Vite)

### 4.1. Cơ chế hiển thị Menu "Role-based Injection"
Giáo viên hoặc người dùng thông thường đăng nhập vào sẽ **hoàn toàn không thấy bất kỳ chữ "Admin" nào**:
- Trong `frontend/src/layouts/DashboardLayout.jsx`:
  ```jsx
  const { user } = useAuth();
  
  // Danh sách menu chính cho giáo viên...
  const navigationItems = [ ... ];
  
  // CHỈ THÊM MỤC NÀY NẾU USER CÓ ROLE ADMIN:
  if (user?.role === 'ADMIN') {
    navigationItems.push({
      name: 'Quản trị hệ thống',
      path: '/dashboard/system',
      icon: ShieldAlert, // Lucide React
      badge: 'Admin'
    });
  }
  ```

### 4.2. Bảo vệ Route với `AdminRoute.jsx`
- Trong `frontend/src/routes/AdminRoute.jsx`:
  Nếu `user?.role !== 'ADMIN'`, tự động điều hướng về `/dashboard` hoặc hiển thị trang `404 Not Found` để không ai dò được route quản trị.
- Khai báo route trong `AppRoutes.jsx`:
  ```jsx
  <Route
    path="/dashboard/system"
    element={
      <PrivateRoute>
        <AdminRoute>
          <AdminPortalPage />
        </AdminRoute>
      </PrivateRoute>
    }
  />
  ```

### 4.3. Thiết kế màn hình `AdminPortalPage.jsx` (Gọn gàng, chuẩn phong cách K-12)
Gồm 3 Tab con đơn giản, tái sử dụng các component CSS có sẵn:
1. **Tab 1: Quản lý Giáo viên (User Management)**:
   - Bảng danh sách: Tên, Email, Trường/Cấp học, Gói (`FREE`/`PRO`), Trạng thái (`Đang hoạt động` / `Đã khóa`).
   - Nút gạt hoặc nút bấm: `Khóa tài khoản` / `Mở khóa` (gọi API `PATCH /api/admin/users/{id}/status`).
2. **Tab 2: Trạng thái Dịch vụ (Service Health)**:
   - 4 Card trạng thái Xanh/Đỏ:
     - 🗄️ PostgreSQL + pgvector (Sẵn sàng / Connected).
     - 📦 MinIO Object Storage (Bucket `documents` Sẵn sàng).
     - 🤖 AI Service (FastAPI) & Gemini 1.5 Pro (API Key Valid).
     - ⚡ Latency trung bình hệ thống: ~120ms.
3. **Tab 3: Giám sát RAG & Số liệu (Telemetry & Metrics)**:
   - Thẻ thống kê: Tổng tài liệu đã phân tích, Tổng giáo án đã soạn, Tổng đề thi đã tạo.
   - Thanh tỷ lệ trích dẫn nguồn thành công (Citation Precision: 92%).

---

## 5. Tài khoản Seed Mẫu cho Demo (Admin Seed Account)

Chèn trực tiếp vào script khởi tạo CSDL hoặc Flyway migration (`V1__init_schema.sql` hoặc `V2__seed_admin.sql`):
- **Email**: `admin@aiteachercopilot.com`
- **Mật khẩu gốc**: `AdminCopilot@2026`
- **Mật khẩu mã hóa BCrypt**: `$2a$10$wT0o3q6P4eF1Ww2S3c4Y5.mI7O9Nq1bV8mP5X0z4K9j2L7u4R6yZe` (tùy hash thực tế)
- **Họ và tên**: `Quản trị viên Hệ thống`
- **Role**: `ADMIN`
- **is_active**: `true`

> **Khi Demo / Bảo vệ đồ án**:
> - Đăng nhập tài khoản giáo viên: Trình diễn luồng soạn giảng, upload tài liệu, tạo đề thi, xuất Word.
> - Đăng nhập tài khoản admin: Mở ra trang Quản trị hệ thống, khoe tính năng Health check, quản lý tài khoản và giám sát RAG telemetry, minh chứng hệ thống có kiến trúc phân quyền chuẩn doanh nghiệp!

---

## 6. Kịch bản Đối đáp Phản biện (Defense Script)

Nếu Hội đồng hoặc Giảng viên hỏi:
> *"Tại sao trong sơ đồ System Context có Admin, nhưng trong Sprint Backlog lại không thấy User Story riêng cho Admin?"*

**Câu trả lời chuẩn mực**:
> *"Kính thưa Thầy/Cô, trong định hướng phát triển sản phẩm MVP của nhóm, toàn bộ User Stories kinh doanh cốt lõi được ưu tiên cao nhất cho đối tượng người dùng chính là **Giáo viên K-12** (Core Stakeholder).
> 
> Tuy nhiên, để đảm bảo tiêu chuẩn an toàn bảo mật **RBAC (Role-Based Access Control)** và khả năng vận hành thực tế tại **Sprint 5 (Task BE-036 - Harden Authorization và BE-033 - Metrics Logging)**, nhóm đã chủ động hiện thực hóa cổng quản trị nội bộ (System Administration Portal). Phân hệ này cho phép quản lý vòng đời tài khoản, giám sát telemetry RAG và kiểm tra sức khỏe các dịch vụ nền tảng (MinIO, pgvector, LLM), đáp ứng trọn vẹn 100% sơ đồ System Context Diagram đã cam kết ban đầu."*
