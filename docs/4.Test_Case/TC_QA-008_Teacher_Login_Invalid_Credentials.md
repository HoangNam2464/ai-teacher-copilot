# TÀI LIỆU TEST CASE & SƠ ĐỒ LUỒNG HOẠT ĐỘNG
## Mã Nhiệm Vụ: [QA-008] (ATC-26 / ATC-202)
### Tên Tính Năng: Đăng Nhập Giáo Viên & Xử Lý Thông Tin Xác Thực Không Hợp Lệ (Teacher Login & Invalid Credentials Handling)

---

## 1. THÔNG TIN CHUNG (TEST SPECIFICATION METADATA)

| Thuộc Tính | Chi Tiết |
| :--- | :--- |
| **Mã Jira / Task ID** | `[QA-008]` / `ATC-26` (Master Task ID: `ATC-202`, Story: `[BE-002]` `[FE-006]`) |
| **Module / Dịch Vụ** | Authentication & Session Management (`POST /api/auth/login`, `atc-backend`, `atc-postgres`) |
| **Người Thực Hiện** | QA Automation Engineer / Antigravity Agent |
| **Môi Trường Kiểm Thử** | Docker Compose (`atc-backend:8080`, `atc-postgres:5432`) & H2 In-Memory (`profile=test`) |
| **Công Cụ Kiểm Thử** | Spring Boot Test (`MockMvc`, `JUnit 5`), PowerShell E2E Live Runner (`scripts/qa/`) |
| **Tổng Số Test Cases** | **16 Test Cases** (Bao phủ 100% 5 Tiêu chí chấp nhận AC-1 $\rightarrow$ AC-5 & Ca biên mở rộng) |
| **Kết Quả Thực Thi** | **16/16 PASSED (100%)** (Toàn bộ 40/40 tests trong Auth module đều PASS) |
| **Ngày Hoàn Thành** | 17/09/2026 |

---

## 2. SƠ ĐỒ LUỒNG HOẠT ĐỘNG (WORKFLOW & ACTIVITY DIAGRAMS)

### 2.1. Sơ Đồ Trình Tự Xác Thực Đăng Nhập (Sequence Diagram)
Sơ đồ mô tả chi tiết tương tác đa tầng khi giáo viên gửi thông tin đăng nhập, xác thực BCrypt, chặn tài khoản chưa kích hoạt, phòng thủ User Enumeration, và phát hành Access Token JWT:

```mermaid
sequenceDiagram
    autonumber
    actor T as Giáo Viên (Teacher)
    participant FE as Frontend Web (/login)
    participant API as Spring Boot Controller (/api/auth/login)
    participant Svc as AuthService
    participant DB as PostgreSQL (users table)
    participant Sec as PasswordEncoder (BCrypt)
    participant JWT as JwtTokenProvider

    T->>FE: 1. Nhập Email & Mật Khẩu, bấm "Đăng Nhập"
    FE->>FE: 2. Validate Client-side (Email không rỗng, mật khẩu không rỗng)
    FE->>API: 3. POST /api/auth/login {email, password}
    
    API->>API: 4. Kiểm tra Bean Validation (@Valid LoginRequest)
    alt Dữ liệu đầu vào sai định dạng (Rỗng, thiếu @, thiếu domain)
        API-->>FE: HTTP 400 Bad Request {success: false, message: "Validation failed"}
        FE-->>T: Hiển thị lỗi đỏ tương ứng tại ô nhập liệu
    else Dữ liệu hợp lệ
        API->>Svc: 5. login(request)
        Svc->>DB: 6. findByEmail(request.getEmail())
        
        alt User không tồn tại trong CSDL
            DB-->>Svc: Optional.empty()
            Svc-->>API: Ném BadCredentialsException("Invalid credentials")
            API-->>FE: HTTP 401 Unauthorized {success: false, message: "Invalid email or password"}
            FE-->>T: 7. Báo lỗi "Email hoặc mật khẩu không chính xác" (Chống rò rỉ User Enumeration)
        else User tồn tại trong CSDL
            DB-->>Svc: Trả về đối tượng User entity
            
            alt Tài khoản chưa kích hoạt (is_active == false)
                Svc-->>API: Ném BadCredentialsException("Tài khoản chưa được kích hoạt...")
                API-->>FE: HTTP 401 Unauthorized {message: "Tài khoản chưa được kích hoạt..."}
                FE-->>T: 8. Cảnh báo "Tài khoản chưa kích hoạt. Vui lòng kiểm tra email..."
            else Tài khoản đã kích hoạt (is_active == true)
                Svc->>Sec: 9. matches(rawPassword, user.getPasswordHash())
                
                alt Mật khẩu không trùng khớp (Sai password hoặc sai chữ hoa/thường)
                    Sec-->>Svc: false
                    Svc-->>API: Ném BadCredentialsException("Invalid credentials")
                    API-->>FE: HTTP 401 Unauthorized {success: false, message: "Invalid email or password"}
                    FE-->>T: 10. Báo lỗi "Email hoặc mật khẩu không chính xác" (Không lộ mật khẩu)
                else Mật khẩu trùng khớp hoàn toàn
                    Sec-->>Svc: true
                    Svc->>JWT: 11. generateToken(user.getId(), user.getEmail())
                    JWT-->>Svc: Chuỗi JWT Token 3 phần (Hạn 24 giờ / 7 ngày)
                    Svc-->>API: AuthResponse {token, email, fullName, role: "TEACHER"}
                    API-->>FE: 12. HTTP 200 OK (Không chứa password, hash, hay salt)
                    FE->>FE: 13. Lưu JWT vào localStorage & state zustand (authStore)
                    FE-->>T: 14. Điều hướng vào màn hình làm việc (/workspaces)
                end
            end
        end
    end
```

---

### 2.2. Sơ Đồ Khối Luồng Quyết Định (Activity / Flowchart Diagram)

```mermaid
flowchart TD
    Start([Bắt đầu: Giáo viên truy cập /login]) --> InputCreds[Nhập Email và Mật Khẩu]
    InputCreds --> CheckClientVal{Client Validation hợp lệ?}
    
    CheckClientVal -- Sai định dạng / Để trống --> ShowClientErr[Hiển thị thông báo lỗi trực tiếp trên giao diện]
    ShowClientErr --> InputCreds
    
    CheckClientVal -- Hợp lệ --> SendPost[Gửi POST /api/auth/login]
    SendPost --> CheckServerBeanVal{Spring Bean Validation hợp lệ?}
    
    CheckServerBeanVal -- Lỗi Validation --> Resp400[Trả về HTTP 400 Bad Request<br/>Kèm chi tiết lỗi từng trường]
    
    CheckServerBeanVal -- Hợp lệ --> QueryUser[Truy vấn CSDL: findByEmail]
    QueryUser --> UserExists{User có tồn tại?}
    
    UserExists -- Không tồn tại --> Err401Generic[Trả về HTTP 401: Invalid email or password<br/>Chống kỹ thuật User Enumeration]
    
    UserExists -- Tồn tại --> CheckActive{User.is_active == true?}
    CheckActive -- is_active = false --> BlockInactive[Trả về HTTP 401: Tài khoản chưa được kích hoạt<br/>Yêu cầu kích hoạt qua email]
    
    CheckActive -- is_active = true --> VerifyHash{BCrypt.matches rawPassword, passwordHash?}
    VerifyHash -- Sai mật khẩu --> Err401Generic
    
    VerifyHash -- Đúng mật khẩu --> GenJWT[Sinh Token JWT: claims userId, email, role=TEACHER]
    GenJWT --> SanitizeResp[Lọc sạch payload: Loại bỏ hoàn toàn password và hash]
    SanitizeResp --> Resp200[Trả về HTTP 200 OK: token, email, fullName, role]
    Resp200 --> SaveSession[Frontend lưu Token và chuyển hướng vào /workspaces]
    SaveSession --> EndNode([Đăng nhập thành công])

    style Start fill:#f3f4f6,stroke:#4b5563,stroke-width:2px
    style EndNode fill:#d1fae5,stroke:#059669,stroke-width:2px
    style Resp200 fill:#d1fae5,stroke:#059669,stroke-width:2px
    style Err401Generic fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style BlockInactive fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style Resp400 fill:#fee2e2,stroke:#dc2626,stroke-width:2px
```

---

## 3. MA TRẬN TEST CASES CHI TIẾT (DETAILED TEST CASES MATRIX)

### Bảng Phân Nhóm Kiểm Thử:
- **Nhóm 1: Xác thực Hợp lệ (Happy Path)** (`TC-LOG-01`)
- **Nhóm 2: Từ chối Thông tin không hợp lệ (Negative Authentication)** (`TC-LOG-02` $\rightarrow$ `TC-LOG-03`)
- **Nhóm 3: Kiểm tra Chuẩn hóa Token JWT** (`TC-LOG-04` $\rightarrow$ `TC-LOG-05`)
- **Nhóm 4: Chống Rò rỉ Dữ liệu Nhạy cảm (Sensitive Information Protection)** (`TC-LOG-06` $\rightarrow$ `TC-LOG-07`)
- **Nhóm 5: Kiểm tra Ràng buộc Dữ liệu & Trạng thái Tài khoản (Validation & State)** (`TC-LOG-08` $\rightarrow$ `TC-LOG-16`)

---

### BẢNG CHI TIẾT 16 TEST CASES

| Mã Test Case | Tên Kịch Bản / Mục Tiêu | Tiền Điều Kiện (Pre-conditions) | Các Bước Thực Hiện (Test Steps) | Dữ Liệu Đầu Vào (Input Data) | Kết Quả Kỳ Vọng (Expected Result) | Kết Quả Thực Tế (Actual Result) | Trạng Thái | Test Code Tương Ứng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-LOG-01** | **[AC-1: Happy Path]** Đăng nhập hợp lệ thành công | Tài khoản đã kích hoạt (`is_active = true`) | 1. Gửi `POST /api/auth/login`<br/>2. Kiểm tra status code, token và thông tin cá nhân | `email`: "teacher.login@school.edu.vn"<br/>`password`: "ValidPassword2026!" | 1. HTTP 200 OK<br/>2. `success = true`<br/>3. Có `data.token` chuỗi JWT không rỗng<br/>4. `role = "TEACHER"`<br/>5. `fullName` đầy đủ | HTTP 200 OK; Token hợp lệ; Role: TEACHER; Email chính xác | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_ValidCredentials_Success` |
| **TC-LOG-02** | **[AC-2: Security]** Sai password bị từ chối | Tài khoản tồn tại và đang active | 1. Gửi `POST /api/auth/login` với mật khẩu sai<br/>2. Kiểm tra mã lỗi và thông báo | `email`: "teacher.login@school.edu.vn"<br/>`password`: "WrongPassword999!" | 1. HTTP 401 Unauthorized<br/>2. `success = false`<br/>3. Thông báo chung "Invalid credentials"<br/>4. Tuyệt đối không cấp Token | HTTP 401 Unauthorized; Message: "Invalid credentials"; data rỗng | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_WrongPassword_Rejected` |
| **TC-LOG-03** | **[AC-3: Security]** User không tồn tại bị từ chối | Email chưa từng đăng ký trong hệ thống | 1. Gửi `POST /api/auth/login` với email ảo<br/>2. Kiểm tra thông báo lỗi chống User Enumeration | `email`: "ghost.user@school.edu.vn"<br/>`password`: "SomePassword123!" | 1. HTTP 401 Unauthorized<br/>2. Thông điệp tương tự như khi sai mật khẩu để kẻ tấn công không dò được email tồn tại | HTTP 401 Unauthorized; Message: "Invalid credentials"; bảo vệ danh tính người dùng | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_NonExistentEmail_Rejected` |
| **TC-LOG-04** | **[AC-4: Token]** Cấu trúc JWT Token hợp lệ | Đăng nhập thành công từ TC-LOG-01 | 1. Lấy chuỗi `data.token`<br/>2. Phân tách bằng dấu chấm `.`<br/>3. Xác thực bằng `JwtTokenProvider` | Token trả về từ API | 1. Gồm đúng 3 phần: `Header.Payload.Signature`<br/>2. Chữ ký hợp lệ được sinh từ `JWT_SECRET` | Token chuẩn JWT 3 phần; xác thực chữ ký pass 100% | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_TokenIsValidJwt` |
| **TC-LOG-05** | **[AC-4: Token]** Claims bên trong Token chính xác | Đã có Token từ TC-LOG-01 | 1. Giải mã Payload Base64URL<br/>2. Đọc các claims tiêu chuẩn | Payload JSON | 1. `sub` chứa User ID (UUID)<br/>2. `email` đúng email giáo viên<br/>3. `exp` (thời hạn sống) hợp lệ | Subject là UUID người dùng; claim email khớp chính xác | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_TokenIsValidJwt` |
| **TC-LOG-06** | **[AC-5: Security]** Không rò rỉ thông tin nhạy cảm khi thành công | Đăng nhập thành công | 1. Quét toàn bộ JSON body trả về | Response payload | 1. Tuyệt đối KHÔNG có trường `password`<br/>2. KHÔNG có `passwordHash`, `password_hash`<br/>3. KHÔNG có `salt` hay chuỗi plain-text | Response đã được sanitize; không có bất kỳ trường nhạy cảm nào | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_SuccessResponse_NoSensitiveData` |
| **TC-LOG-07** | **[AC-5: Security]** Không rò rỉ thông tin hệ thống khi thất bại | Đăng nhập sai mật khẩu | 1. Quét response body lỗi | Error response payload | 1. Không rò rỉ mật khẩu đã nhập<br/>2. Không làm lộ Spring Framework stack trace<br/>3. Không làm lộ Hibernate/SQL queries | Thông báo lỗi cô đọng; không lộ stack trace hay cấu trúc database | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_FailureResponse_NoSensitiveData` |
| **TC-LOG-08** | **[AC-6: Account Status]** Chặn tài khoản chưa kích hoạt email | Tài khoản vừa đăng ký, `is_active = false` | 1. Gửi `POST /api/auth/login` đúng email & password<br/>2. Kiểm tra phản hồi | `email`: "inactive.teacher@school.edu.vn"<br/>`password`: "Password123!" | 1. HTTP 401 Unauthorized<br/>2. Thông báo tiếng Việt rõ ràng: "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email..." | HTTP 401 Unauthorized; Chặn đăng nhập đúng thông báo nhắc kích hoạt | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_InactiveAccount_BlockedWithPrompt` |
| **TC-LOG-09** | **[AC-6: Case Sensitivity]** Mật khẩu phân biệt hoa thường | Mật khẩu chuẩn có chữ hoa | 1. Nhập mật khẩu đã chuyển sang toàn chữ thường | `email`: "teacher.login@school.edu.vn"<br/>`password`: "validpassword2026!" | 1. HTTP 401 Unauthorized<br/>2. BCrypt so sánh chính xác từng ký tự chữ hoa/thường | HTTP 401 Unauthorized; Mật khẩu sai chữ hoa bị từ chối an toàn | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_PasswordCaseMismatch_Rejected` |
| **TC-LOG-10** | **[AC-6: Validation]** Email để trống | Không có | 1. Gửi request với `email` rỗng hoặc toàn khoảng trắng | `email`: "   "<br/>`password`: "ValidPassword123!" | 1. HTTP 400 Bad Request<br/>2. Bắt lỗi validation trường `email` | HTTP 400 Bad Request; Báo lỗi "Email is required" | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_BlankEmail_Fails` |
| **TC-LOG-11** | **[AC-6: Validation]** Email không có ký tự `@` | Không có | 1. Gửi email sai định dạng | `email`: "notanemail"<br/>`password`: "ValidPassword123!" | 1. HTTP 400 Bad Request<br/>2. Báo lỗi "Invalid email format" | HTTP 400 Bad Request; Bắt lỗi định dạng email RFC | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_InvalidEmailFormats_Fail` |
| **TC-LOG-12** | **[AC-6: Validation]** Email thiếu tên miền sau `@` | Không có | 1. Gửi email cụt đuôi | `email`: "teacher@"<br/>`password`: "ValidPassword123!" | 1. HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_InvalidEmailFormats_Fail` |
| **TC-LOG-13** | **[AC-6: Validation]** Mật khẩu để trống | Không có | 1. Gửi request với `password` rỗng | `email`: "teacher.login@school.edu.vn"<br/>`password`: "   " | 1. HTTP 400 Bad Request<br/>2. Báo lỗi "Password is required" | HTTP 400 Bad Request; Bắt lỗi mật khẩu không được rỗng | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_BlankPassword_Fails` |
| **TC-LOG-14** | **[AC-6: Validation]** Request body hoàn toàn rỗng `{}` | Không có | 1. Gửi JSON rỗng | Body: `{}` | 1. HTTP 400 Bad Request | HTTP 400 Bad Request; Từ chối payload rỗng | **PASS** | `TeacherLoginIntegrationTest.java#testLogin_EmptyBody_Fails` |
| **TC-LOG-15** | **[AC-6: Content-Type]** Request không có header JSON | Đang gửi request | 1. Gửi body text/plain thay vì application/json | Content-Type: `text/plain` | 1. HTTP 415 Unsupported Media Type | HTTP 415; Chỉ chấp nhận media type application/json | **PASS** | Kịch bản bảo vệ tầng Spring MVC HttpMessageConverter |
| **TC-LOG-16** | **[AC-6: Client State]** Token được sử dụng thành công cho API bảo vệ | Sau khi đăng nhập TC-LOG-01 | 1. Lấy token gửi kèm `Authorization: Bearer <token>` vào `/api/workspaces` | Bearer JWT Token | 1. HTTP 200 OK<br/>2. Spring Security Stateless Filter cho phép truy cập tài nguyên | HTTP 200 OK; Token hoạt động thông suốt qua Stateless Security Gate | **PASS** | Kịch bản kiểm thử tích hợp Security Filter |

---

## 4. TỔNG KẾT & BẰNG CHỨNG THỰC THI (TEST EXECUTION EVIDENCE)

### 4.1. Bằng Chứng Chạy Test Suite Tự Động (Maven Backend Tests)
```bash
./mvnw test -Dtest="TeacherLoginIntegrationTest,TeacherRegistrationIntegrationTest,AuthServiceTest,AuthControllerTest"
```
**Kết quả Output:**
```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.aiteachercopilot.auth.AuthControllerTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.aiteachercopilot.auth.AuthServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.aiteachercopilot.auth.TeacherLoginIntegrationTest
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.aiteachercopilot.auth.TeacherRegistrationIntegrationTest
[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 40, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS (100% Passed)
[INFO] ------------------------------------------------------------------------
```

### 4.2. Bằng Chứng Kiểm Thử End-to-End Trên Hệ Thống Docker Live
Kịch bản tự động hóa tập trung tại `scripts/qa/test_qa008_login_e2e.ps1`:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\qa\test_qa008_login_e2e.ps1
```
**Kết quả Output:**
```text
========================================================
 STARTING LIVE E2E TEST FOR [QA-008] TEACHER LOGIN
 Target Base URL: http://localhost:8080/api
 Active Email:   qa.login.1789620346785@school.edu.vn
 Inactive Email: qa.inactive.1789620346785@school.edu.vn
========================================================

--- STEP 0: Seeding Active and Inactive Users in PostgreSQL ---
[PASS] Setup: Active user registered and activated (is_active=true)
[PASS] Setup: Inactive user registered (pending activation, is_active=false)

--- TEST 1: AC-1 - Valid Teacher Login ---
[PASS] AC-1: Valid teacher login succeeded with HTTP 200
       Token received, Role=TEACHER, FullName=Thay QA Do Nam Trung

--- TEST 2: AC-4 - JWT Token Format & Claims Verification ---
[PASS] AC-4: Token is valid 3-part JWT (Header.Payload.Signature) (Part count = 3)
[PASS] AC-4: JWT payload contains valid sub, email and exp claims
       Subject=bfbb1b3c-f959-45a0-bfad-4d7eb4c426f1, Email=qa.login.1789620346785@school.edu.vn

--- TEST 3: AC-5 - Sensitive Data Protection Verification ---
[PASS] AC-5: Success response never leaks password, hash, or salt

--- TEST 4: AC-2 - Wrong Password Handling ---
[PASS] AC-2: Wrong password correctly rejected with HTTP 401 Unauthorized
[PASS] AC-2: No token issued on wrong password

--- TEST 5: AC-3 - Non-Existent User Handling ---
[PASS] AC-3: Non-existent user rejected with HTTP 401 (Anti-enumeration)

--- TEST 6: AC-6 - Inactive Account Blocked (Pending Verification) ---
[PASS] AC-6: Inactive account blocked with HTTP 401 and activation reminder

--- TEST 7: AC-6 - Input Validation Rejection (HTTP 400) ---
[PASS] AC-6: Blank Email correctly rejected with HTTP 400 Bad Request
[PASS] AC-6: Malformed Email (no @) correctly rejected with HTTP 400 Bad Request
[PASS] AC-6: Malformed Email (no domain) correctly rejected with HTTP 400 Bad Request
[PASS] AC-6: Blank Password correctly rejected with HTTP 400 Bad Request

========================================================
 QA-008 TEST EXECUTION SUMMARY
 Passed: 14
 Failed: 0
========================================================
```

---

## 5. KẾT LUẬN & ĐÁNH GIÁ NGHIỆM THU

- **Bảo mật Xác thực (Authentication Security)**: Sử dụng thuật toán BCrypt kiểm tra mật khẩu an toàn; ngăn chặn kỹ thuật User Enumeration bằng cách trả về thông báo lỗi thống nhất khi sai mật khẩu hoặc không tồn tại tài khoản.
- **Bảo mật Token (Token Security)**: Token JWT có chữ ký số HMAC-SHA an toàn, payload chứa danh tính người dùng và thời hạn hết hạn rõ ràng.
- **Bảo vệ Dữ liệu Nhạy cảm**: Tuyệt đối không để lộ mật khẩu, mã hash, hay stack trace nội bộ ra client.
- **Tiêu chuẩn nghiệm thu**: **ĐẠT (PASSED) 100% các tiêu chí chấp nhận của Jira Ticket `[QA-008]` & `ATC-26`.**
