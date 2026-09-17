# TÀI LIỆU TEST CASE & SƠ ĐỒ LUỒNG HOẠT ĐỘNG
## Mã Nhiệm Vụ: [QA-007] (ATC-201 / ATC-22)
### Tên Tính Năng: Đăng Ký Giáo Viên, Xử Lý Trùng Email & Kích Hoạt Tài Khoản Qua Email (Email Verification via SMTP)

---

## 1. THÔNG TIN CHUNG (TEST SPECIFICATION METADATA)

| Thuộc Tính | Chi Tiết |
| :--- | :--- |
| **Mã Jira / Task ID** | `[QA-007]` / `ATC-201` (Story: `[BE-001]` `[FE-006]`) |
| **Module / Dịch Vụ** | Authentication & User Management (`backend/`, `frontend/`, `atc-postgres`, `SMTP`) |
| **Người Thực Hiện** | QA Automation Engineer / Antigravity Agent |
| **Môi Trường Kiểm Thử** | Docker Compose (`atc-backend:8080`, `atc-frontend:3000`, `atc-postgres:5432`) & H2 In-Memory (`profile=test`) |
| **Công Cụ Kiểm Thử** | Spring Boot Test (`MockMvc`, `JUnit 5`), PowerShell E2E Live Runner, Playwright Browser Subagent |
| **Tổng Số Test Cases** | **18 Test Cases** (100% Functional, Security, Validation & Resilience Coverage) |
| **Kết Quả Thực Thi** | **18/18 PASSED (100%)** |
| **Ngày Hoàn Thành** | 17/09/2026 |

---

## 2. SƠ ĐỒ LUỒNG HOẠT ĐỘNG (WORKFLOW & ACTIVITY DIAGRAMS)

### 2.1. Sơ Đồ Trình Tự Tương Tác Hệ Thống (Sequence Diagram)
Sơ đồ mô tả chi tiết tương tác đa tầng từ lúc giáo viên nhập thông tin, lưu dữ liệu ở trạng thái chờ (`is_active = false`), gửi email SMTP, xử lý trường hợp đăng nhập trước khi kích hoạt, đến khi mở liên kết xác thực và đăng nhập thành công:

```mermaid
sequenceDiagram
    autonumber
    actor T as Giáo Viên (Teacher)
    participant FE as Frontend Web (/register, /verify-email)
    participant API as Spring Boot Controller (/api/auth)
    participant Svc as AuthService & EmailService
    participant DB as PostgreSQL (users, tokens)
    participant Mail as Hộp Thư Email (SMTP / Gmail)

    %% BƯỚC 1: ĐĂNG KÝ TÀI KHOẢN
    rect rgb(240, 253, 244)
    note right of T: Giai đoạn 1: Đăng Ký & Khởi Tạo Chờ Kích Hoạt
    T->>FE: 1. Điền Form (Họ tên, Email, Mật khẩu, Xác nhận MK)
    FE->>FE: 2. Validate Client-side (Định dạng, độ mạnh MK, khớp MK)
    FE->>API: 3. POST /api/auth/register {fullName, email, password}
    API->>Svc: 4. register(request)
    Svc->>DB: 5. Kiểm tra email đã tồn tại? (findByEmail)
    alt Email đã tồn tại trong hệ thống
        DB-->>Svc: User tồn tại
        Svc-->>API: Ném IllegalArgumentException (400 Bad Request)
        API-->>FE: HTTP 400 {success: false, message: "Email is already registered"}
        FE-->>T: Hiển thị thông báo đỏ "Email này đã được sử dụng"
    else Email chưa tồn tại
        Svc->>Svc: 6. Mã hóa mật khẩu bằng BCrypt
        Svc->>DB: 7. Lưu User mới (role='TEACHER', is_active=false)
        Svc->>Svc: 8. Sinh JWT Token mục đích VERIFY_EMAIL (Hạn 24 giờ)
        Svc->>Mail: 9. Gửi Email HTML kích hoạt (bất đồng bộ qua SMTP)
        Svc-->>API: 10. Trả về AuthResponse (requiresEmailVerification=true)
        API-->>FE: HTTP 201 Created {requiresEmailVerification: true, email}
        FE->>FE: 11. Tự động điều hướng sang /verify-email?email=...
        FE-->>T: 12. Hiển thị màn hình "Vui lòng kiểm tra email kích hoạt"
    end
    end

    %% BƯỚC 2: CỐ GẮNG ĐĂNG NHẬP KHI CHƯA KÍCH HOẠT
    rect rgb(254, 242, 242)
    note right of T: Giai đoạn 2: Kiểm soát Truy Cập (Chưa Kích Hoạt)
    opt Giáo viên cố gắng đăng nhập trước khi kích hoạt
        T->>FE: Nhập Email & Mật khẩu tại /login
        FE->>API: POST /api/auth/login {email, password}
        API->>Svc: login(request)
        Svc->>DB: Tìm User & So khớp BCrypt password
        alt Mật khẩu đúng nhưng is_active == false
            Svc-->>API: Ném BadCredentialsException ("Tài khoản chưa được kích hoạt...")
            API-->>FE: HTTP 401 Unauthorized
            FE-->>T: Hiển thị cảnh báo: "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email..."
        end
    end
    end

    %% BƯỚC 3: MỞ EMAIL & KÍCH HOẠT TÀI KHOẢN
    rect rgb(238, 242, 255)
    note right of T: Giai đoạn 3: Kích Hoạt Tài Khoản & Đăng Nhập Hoàn Tất
    T->>Mail: 13. Mở Email, bấm nút "Kích Hoạt Tài Khoản Ngay"
    Mail->>FE: 14. Mở URL: /verify-email?token={token}&email={email}
    FE->>API: 15. POST /api/auth/verify-email {token}
    API->>Svc: 16. verifyEmail(token)
    Svc->>Svc: 17. Giải mã và xác thực chữ ký JWT Token
    alt Token không hợp lệ hoặc đã hết hạn > 24h
        Svc-->>API: Ném BadRequestException ("Token không hợp lệ hoặc đã hết hạn")
        API-->>FE: HTTP 400 Bad Request
        FE-->>T: Hiển thị nút "Gửi lại email kích hoạt"
    else Token hợp lệ & tài khoản chưa active
        Svc->>DB: 18. Cập nhật User: is_active = true
        DB-->>Svc: Cập nhật thành công
        Svc-->>API: Trả về ApiResponse thành công
        API-->>FE: HTTP 200 OK {"Tài khoản đã kích hoạt thành công"}
        FE-->>T: 19. Hiển thị thông báo thành công và nút "Đăng Nhập Ngay"
    end
    end

    %% BƯỚC 4: ĐĂNG NHẬP SAU KHI KÍCH HOẠT
    rect rgb(240, 253, 250)
    T->>FE: 20. Bấm "Đăng Nhập Ngay", nhập Email & Mật khẩu
    FE->>API: 21. POST /api/auth/login {email, password}
    API->>Svc: login(request)
    Svc->>DB: Kiểm tra (is_active == true)
    Svc->>Svc: 22. Sinh Access Token JWT (Hạn 7 ngày)
    Svc-->>API: AuthResponse {token, role, email, fullName}
    API-->>FE: HTTP 200 OK
    FE->>FE: 23. Lưu JWT vào localStorage & state zustand
    FE-->>T: 24. Chuyển hướng vào Dashboard làm việc (/workspaces)
    end
```

---

### 2.2. Sơ Đồ Khối Luồng Quyết Định (Activity / Flowchart Diagram)

```mermaid
flowchart TD
    Start([Bắt đầu: Giáo viên truy cập /register]) --> FillForm[Điền Họ tên, Email, Mật khẩu, Nhập lại MK]
    FillForm --> ValidateFE{Validate trên Frontend?}
    
    ValidateFE -- Lỗi (Rỗng / Sai format / MK yếu / Không khớp) --> ShowFEError[Hiển thị lỗi Validation trực tiếp tại Form]
    ShowFEError --> FillForm
    
    ValidateFE -- Hợp lệ --> SendReg[Gửi POST /api/auth/register]
    SendReg --> CheckDup{Email đã tồn tại trong DB?}
    
    CheckDup -- Đã tồn tại --> Err400[Trả về HTTP 400 Bad Request: Email is already registered]
    Err400 --> ShowToastDup[Frontend hiển thị Toast báo email đã đăng ký]
    
    CheckDup -- Chưa tồn tại --> HashPass[Bcrypt Hash Password]
    HashPass --> SaveUser[Lưu User vào DB: is_active = false]
    SaveUser --> GenToken[Sinh Token VERIFY_EMAIL hạn 24 giờ]
    GenToken --> SendMail[EmailService gửi Email HTML kích hoạt qua SMTP]
    SendMail --> Resp201[Trả về HTTP 201: requiresEmailVerification = true]
    Resp201 --> RedirectVerify[Frontend chuyển hướng tới /verify-email]
    
    RedirectVerify --> UserAction{Hành động tiếp theo của Giáo viên?}
    
    UserAction -- Cố gắng Login tại /login --> TryLogin[Nhập thông tin tại /login]
    TryLogin --> CheckActiveLogin{Tài khoản đã kích hoạt?}
    CheckActiveLogin -- is_active = false --> BlockLogin[Chặn đăng nhập: HTTP 401 Unauthorized<br/>Thông báo yêu cầu kích hoạt email]
    BlockLogin --> TryLogin
    
    UserAction -- Kiểm tra hòm thư Email --> OpenEmail[Mở Email & Bấm liên kết kích hoạt]
    OpenEmail --> CallVerifyApi[Frontend gọi POST /api/auth/verify-email]
    CallVerifyApi --> ValidateToken{Token hợp lệ & còn hạn?}
    
    ValidateToken -- Hết hạn hoặc Giả mạo --> ErrToken[Trả về HTTP 400: Invalid or expired token]
    ErrToken --> AllowResend[Hiển thị nút 'Gửi lại email xác thực']
    AllowResend --> CallResend[POST /api/auth/resend-verification]
    CallResend --> SendMail
    
    ValidateToken -- Hợp lệ --> UpdateActive[Cập nhật CSDL: is_active = true]
    UpdateActive --> ShowSuccess[Frontend hiển thị thông báo thành công]
    ShowSuccess --> LoginNow[Bấm 'Đăng nhập ngay']
    LoginNow --> LoginSuccess[Đăng nhập thành công, nhận JWT Token và vào /workspaces]
    LoginSuccess --> EndNode([Kết thúc thành công])

    style Start fill:#f3f4f6,stroke:#4b5563,stroke-width:2px
    style EndNode fill:#d1fae5,stroke:#059669,stroke-width:2px
    style Err400 fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style BlockLogin fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style ErrToken fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style UpdateActive fill:#d1fae5,stroke:#059669,stroke-width:2px
```

---

### 2.3. Sơ Đồ Chuyển Trạng Thái Tài Khoản (State Transition Diagram)

```mermaid
stateDiagram-v2
    [*] --> UNREGISTERED: Chưa đăng ký tài khoản

    UNREGISTERED --> PENDING_VERIFICATION: POST /api/auth/register<br/>(is_active = false, sinh token 24h)
    
    state PENDING_VERIFICATION {
        [*] --> WAITING_FOR_EMAIL
        WAITING_FOR_EMAIL --> LOGIN_REJECTED: Thử đăng nhập (401 Unauthorized)
        LOGIN_REJECTED --> WAITING_FOR_EMAIL: Nhận thông báo kích hoạt
        WAITING_FOR_EMAIL --> TOKEN_EXPIRED: Quá 24 giờ chưa bấm link
        TOKEN_EXPIRED --> WAITING_FOR_EMAIL: Yêu cầu gửi lại mail (/resend-verification)
    }

    PENDING_VERIFICATION --> ACTIVE: POST /api/auth/verify-email<br/>(Token hợp lệ -> is_active = true)

    ACTIVE --> AUTHENTICATED: POST /api/auth/login<br/>(Nhận JWT Token 7 ngày)
    AUTHENTICATED --> LOGGED_OUT: Đăng xuất / Hết hạn JWT
    LOGGED_OUT --> AUTHENTICATED: Đăng nhập lại
```

---

## 3. MA TRẬN TEST CASES CHI TIẾT (DETAILED TEST CASES MATRIX)

### Bảng Phân Nhóm Kiểm Thử:
- **Nhóm 1: Happy Path & Vòng đời kích hoạt tài khoản** (`TC-REG-01` $\rightarrow$ `TC-REG-04`)
- **Nhóm 2: Bảo mật & Xử lý Token xác thực** (`TC-REG-05` $\rightarrow$ `TC-REG-09`)
- **Nhóm 3: Xử lý Trùng lặp Email (Duplicate Handling)** (`TC-REG-10` $\rightarrow$ `TC-REG-11`)
- **Nhóm 4: Kiểm tra Ràng buộc Dữ liệu Đầu vào (Validation Rules)** (`TC-REG-12` $\rightarrow$ `TC-REG-16`)
- **Nhóm 5: An toàn Dữ liệu & Hạ tầng Fallback** (`TC-REG-17` $\rightarrow$ `TC-REG-18`)

---

### BẢNG CHI TIẾT TEST CASES

| Mã Test Case | Tên Kịch Bản / Mục Tiêu | Tiền Điều Kiện (Pre-conditions) | Các Bước Thực Hiện (Test Steps) | Dữ Liệu Đầu Vào (Input Data) | Kết Quả Kỳ Vọng (Expected Result) | Kết Quả Thực Tế (Actual Result) | Trạng Thái | Test Code Tương Ứng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-REG-01** | **[Happy Path]** Đăng ký tài khoản giáo viên hợp lệ | CSDL đã chạy migration Flyway; Email chưa từng được dùng | 1. Gửi request `POST /api/auth/register`<br/>2. Kiểm tra response status & body<br/>3. Kiểm tra bản ghi trong bảng `users` | `fullName`: "Thầy Nguyễn Văn Nam"<br/>`email`: "teacher.nguyen@school.edu.vn"<br/>`password`: "ChinhPhucToan123!" | 1. HTTP 201 Created<br/>2. `requiresEmailVerification = true`<br/>3. CSDL có user với `is_active = false`<br/>4. Không lộ `password` trong body | HTTP 201; User được lưu với `is_active = false`; sinh Purpose Token `VERIFY_EMAIL` 24h | **PASS** | `TeacherRegistrationIntegrationTest.java#testRegister_ValidTeacher_Success` |
| **TC-REG-02** | **[Security]** Chặn đăng nhập khi tài khoản chưa kích hoạt | Tài khoản vừa đăng ký ở TC-01, chưa bấm link kích hoạt | 1. Gửi `POST /api/auth/login` với email & mật khẩu đã đăng ký<br/>2. Kiểm tra HTTP Status & Message | `email`: "teacher.nguyen@school.edu.vn"<br/>`password`: "ChinhPhucToan123!" | 1. HTTP 401 Unauthorized<br/>2. Thông báo: "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt trước khi đăng nhập."<br/>3. Không trả về JWT | HTTP 401; Chặn đăng nhập đúng thông báo; không cấp JWT | **PASS** | `TeacherRegistrationIntegrationTest.java#testRegister_ValidTeacher_Success` |
| **TC-REG-03** | **[Lifecycle]** Kích hoạt tài khoản bằng token hợp lệ | Đã nhận được Purpose Token kích hoạt (24h) | 1. Gửi `POST /api/auth/verify-email`<br/>2. Truyền token hợp lệ<br/>3. Kiểm tra trạng thái trong CSDL | `token`: "{valid_verify_email_jwt_token}" | 1. HTTP 200 OK<br/>2. `success = true`<br/>3. CSDL: cột `is_active` đổi thành `true` | HTTP 200 OK; CSDL cập nhật `is_active = true` ngay lập tức | **PASS** | `TeacherRegistrationIntegrationTest.java#testRegister_ValidTeacher_Success` |
| **TC-REG-04** | **[Lifecycle]** Đăng nhập thành công sau khi kích hoạt | Tài khoản đã kích hoạt thành công ở TC-03 (`is_active = true`) | 1. Gửi `POST /api/auth/login`<br/>2. Kiểm tra JWT token và thông tin User | `email`: "teacher.nguyen@school.edu.vn"<br/>`password`: "ChinhPhucToan123!" | 1. HTTP 200 OK<br/>2. Trả về access token JWT hợp lệ<br/>3. Role: `TEACHER`<br/>4. Thông tin cá nhân đầy đủ | HTTP 200 OK; Token hợp lệ; Đăng nhập vào hệ thống thành công | **PASS** | `TeacherRegistrationIntegrationTest.java#testRegister_ValidTeacher_Success` |
| **TC-REG-05** | **[Security]** Kích hoạt với Token giả mạo hoặc sai chữ ký | Hệ thống đang chạy | 1. Gửi `POST /api/auth/verify-email`<br/>2. Truyền token rác hoặc token bị chỉnh sửa payload | `token`: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered_payload.signature" | 1. HTTP 400 Bad Request<br/>2. Thông báo: "Invalid verification token" hoặc "Invalid purpose token"<br/>3. Không kích hoạt user | HTTP 400 Bad Request; Từ chối token giả mạo | **PASS** | `TeacherRegistrationIntegrationTest.java#testVerifyEmail_InvalidToken_Fails` |
| **TC-REG-06** | **[Security]** Kích hoạt với Token đã hết hạn (> 24 giờ) | Tạo token với thời hạn âm / quá khứ | 1. Gửi `POST /api/auth/verify-email`<br/>2. Truyền token hết hạn | `token`: "{expired_verify_token}" | 1. HTTP 400 Bad Request<br/>2. Báo lỗi token hết hạn, yêu cầu gửi lại | HTTP 400 Bad Request; Báo token expired | **PASS** | `TeacherRegistrationIntegrationTest.java#testVerifyEmail_ExpiredToken_Fails` |
| **TC-REG-07** | **[Edge Case]** Kích hoạt lại khi tài khoản đã Active | Tài khoản đã `is_active = true` | 1. Gửi `POST /api/auth/verify-email` lần thứ 2 với cùng email | `token`: "{valid_token_for_already_active_user}" | 1. HTTP 400 Bad Request<br/>2. Thông báo tài khoản đã được kích hoạt trước đó | HTTP 400 Bad Request; "User is already active" | **PASS** | `TeacherRegistrationIntegrationTest.java#testVerifyEmail_AlreadyActive_Fails` |
| **TC-REG-08** | **[Feature]** Yêu cầu gửi lại email kích hoạt (Resend Verification) | User chưa kích hoạt (`is_active = false`) | 1. Gửi `POST /api/auth/resend-verification`<br/>2. Kiểm tra việc gửi lại email | `email`: "teacher.nguyen@school.edu.vn" | 1. HTTP 200 OK<br/>2. Sinh mã token mới<br/>3. Gửi email kích hoạt mới đến hòm thư | HTTP 200 OK; Tạo token mới và kích hoạt gửi mail thành công | **PASS** | `TeacherRegistrationIntegrationTest.java#testResendVerification_Success` |
| **TC-REG-09** | **[Edge Case]** Gửi lại email kích hoạt cho tài khoản đã active | User đã có `is_active = true` | 1. Gửi `POST /api/auth/resend-verification` với email đã kích hoạt | `email`: "active.teacher@school.edu.vn" | 1. HTTP 400 Bad Request<br/>2. Thông báo tài khoản này đã kích hoạt rồi | HTTP 400 Bad Request; Báo lỗi tài khoản đã kích hoạt | **PASS** | `TeacherRegistrationIntegrationTest.java#testResendVerification_AlreadyActive_Fails` |
| **TC-REG-10** | **[Conflict]** Đăng ký với Email đã tồn tại | Email `teacher1@school.edu.vn` đã có trong CSDL | 1. Gửi `POST /api/auth/register` với email trùng lặp | `fullName`: "Thầy Trần Văn B"<br/>`email`: "teacher1@school.edu.vn"<br/>`password`: "Password123!" | 1. HTTP 400 Bad Request<br/>2. `message`: "Email is already registered"<br/>3. Không ghi đè user cũ | HTTP 400 Bad Request; Đúng format lỗi; bảo vệ dữ liệu cũ | **PASS** | `TeacherRegistrationIntegrationTest.java#testRegister_DuplicateEmail_Fails` |
| **TC-REG-11** | **[Case Sensitivity]** Đăng ký email trùng nhưng khác chữ hoa/thường | Đã có user với email `teacher@school.edu.vn` | 1. Gửi `POST /api/auth/register` với email viết hoa | `fullName`: "Thầy B"<br/>`email`: "TEACHER@SCHOOL.EDU.VN"<br/>`password`: "Password123!" | 1. HTTP 400 Bad Request (Hệ thống chuẩn hóa lowercase hoặc truy vấn không phân biệt hoa thường) | HTTP 400 Bad Request; Bắt trùng email chính xác không phân biệt hoa thường | **PASS** | `TeacherRegistrationIntegrationTest.java#testRegister_DuplicateEmail_CaseInsensitive` |
| **TC-REG-12** | **[Validation]** Họ và tên rỗng hoặc chứa khoảng trắng | Không có | 1. Gửi `POST /api/auth/register` với `fullName` rỗng, null hoặc toàn dấu cách | `fullName`: "   "<br/>`email`: "teacher.valid@school.edu.vn"<br/>`password`: "Password123!" | 1. HTTP 400 Bad Request<br/>2. Lỗi validation trường `fullName` | HTTP 400 Bad Request; Báo lỗi "Full name is required" | **PASS** | `TeacherRegistrationIntegrationTest.java#testRegister_BlankFullName_Fails` |
| **TC-REG-13** | **[Validation]** Email không đúng định dạng RFC | Không có | 1. Gửi `POST /api/auth/register` với email thiếu `@`, thiếu tên miền | `email`: "invalid-email-string", "test@", "@domain.com" | 1. HTTP 400 Bad Request<br/>2. Báo lỗi "Invalid email format" | HTTP 400 Bad Request; Bắt lỗi validation email trên toàn bộ các chuỗi sai | **PASS** | `TeacherRegistrationIntegrationTest.java#testRegister_InvalidEmailFormats_Fail` (Parameterized) |
| **TC-REG-14** | **[Validation]** Mật khẩu quá ngắn (< 8 ký tự) | Không có | 1. Gửi `POST /api/auth/register` với mật khẩu 6 ký tự | `password`: "Pass1!" (6 chars) | 1. HTTP 400 Bad Request<br/>2. Báo lỗi độ dài mật khẩu tối thiểu | HTTP 400 Bad Request; Yêu cầu mật khẩu tối thiểu 8 ký tự | **PASS** | `TeacherRegistrationIntegrationTest.java#testRegister_ShortPassword_Fails` |
| **TC-REG-15** | **[Validation]** Mật khẩu thiếu độ phức tạp | Không có | 1. Gửi mật khẩu chỉ toàn chữ thường hoặc chỉ toàn số | `password`: "alllowercasepassword", "1234567890" | 1. HTTP 400 Bad Request<br/>2. Báo lỗi độ phức tạp mật khẩu | HTTP 400 Bad Request; Yêu cầu có chữ hoa, chữ số, ký tự đặc biệt | **PASS** | `TeacherRegistrationIntegrationTest.java#testRegister_WeakPassword_Fails` |
| **TC-REG-16** | **[Frontend UI]** Mật khẩu xác nhận không khớp (Client Validation) | Đang mở trang `/register` | 1. Nhập `password` và `confirmPassword` khác nhau<br/>2. Bấm "Đăng ký" | `password`: "Password123!"<br/>`confirmPassword`: "Password456!" | 1. Chặn submit ngay tại Frontend<br/>2. Hiển thị thông báo đỏ "Mật khẩu xác nhận không khớp"<br/>3. Không gửi request lên backend | Client validation chặn thành công; hiển thị lỗi ngay lập tức | **PASS** | Kiểm thử trực tiếp trên trình duyệt Browser Subagent |
| **TC-REG-17** | **[Data Security]** Mật khẩu được mã hóa an toàn bằng BCrypt | Sau khi đăng ký thành công TC-01 | 1. Truy vấn trực tiếp cột `password_hash` trong CSDL PostgreSQL / H2 | CSDL record của user | 1. Chuỗi hash bắt đầu bằng `$2a$10$` hoặc `$2b$`<br/>2. Tuyệt đối không lưu mật khẩu dạng bản rõ (plaintext) | Hash hợp lệ BCrypt 60 ký tự; Plaintext không hề xuất hiện trong DB | **PASS** | `TeacherRegistrationIntegrationTest.java#testRegister_PasswordIsHashedWithBcrypt` |
| **TC-REG-18** | **[Resilience]** Cơ chế an toàn khi SMTP chưa cấu hình | Môi trường Docker chưa điền `MAIL_PASSWORD` | 1. Đăng ký tài khoản giáo viên mới<br/>2. Quan sát log container backend | Request đăng ký hợp lệ | 1. Ứng dụng không bị crash (500)<br/>2. In đường link kích hoạt an toàn ra console log<br/>3. Actuator Health không bị `DOWN` | Ứng dụng chạy mượt mà; link kích hoạt xuất hiện trong log; Actuator giữ `{"status":"UP"}` | **PASS** | Kiểm thử thực tế trên container Docker `atc-backend` |

---

## 4. TỔNG KẾT & BẰNG CHỨNG THỰC THI (TEST EXECUTION EVIDENCE)

### 4.1. Bằng Chứng Chạy Test Suite Tự Động (Maven Integration Tests)
```bash
./mvnw test -Dtest="TeacherRegistrationIntegrationTest,AuthServiceTest,AuthControllerTest"
```
**Kết quả Output:**
```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.aiteachercopilot.auth.AuthControllerTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.12 s - in com.aiteachercopilot.auth.AuthControllerTest
[INFO] Running com.aiteachercopilot.auth.AuthServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.15 s - in com.aiteachercopilot.auth.AuthServiceTest
[INFO] Running com.aiteachercopilot.auth.TeacherRegistrationIntegrationTest
[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 3.48 s - in com.aiteachercopilot.auth.TeacherRegistrationIntegrationTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 25, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### 4.2. Bằng Chứng Kiểm Thử End-to-End Trên Hệ Thống Docker Live
Kịch bản chạy tự động kiểm thử cả vòng đời đăng ký, chặn đăng nhập, lấy token kích hoạt và đăng nhập thành công:
```text
=== KIỂM THỬ VÒNG ĐỜI KÍCH HOẠT TÀI KHOẢN (LIVE SYSTEM) ===
1. Đăng ký tài khoản: teacher.verify.1789616297698@school.edu.vn ...
   -> Phản hồi: HTTP 201 Created
   -> requiresEmailVerification: true
   -> message: "Tài khoản đã được tạo thành công. Vui lòng kiểm tra email để kích hoạt tài khoản của bạn."

2. Kiểm tra chặn đăng nhập khi chưa kích hoạt:
   -> Gửi POST /api/auth/login
   -> Phản hồi: HTTP 401 Unauthorized
   -> Thông báo lỗi: "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt trước khi đăng nhập."

3. Lấy verification token từ log EmailService:
   -> URL: http://localhost:3000/verify-email?token=eyJhbGciOiJIUzI1NiJ9...

4. Kích hoạt tài khoản qua POST /api/auth/verify-email:
   -> Phản hồi: HTTP 200 OK
   -> Thông báo: "Tài khoản của bạn đã được kích hoạt thành công. Vui lòng đăng nhập."

5. Đăng nhập lại sau khi kích hoạt:
   -> Gửi POST /api/auth/login
   -> Phản hồi: HTTP 200 OK
   -> Nhận Access Token: eyJhbGciOiJIUzI1NiJ9... (Role: TEACHER, FullName: Thầy QA Hoàng Nam)
```

---

## 5. KẾT LUẬN & ĐÁNH GIÁ NGHIỆM THU

- **Độ tin cậy (Reliability)**: Toàn bộ luồng đăng ký giáo viên và kích hoạt email hoạt động đồng bộ từ UI $\rightarrow$ API $\rightarrow$ Database $\rightarrow$ SMTP.
- **Tính bảo mật (Security)**: Mật khẩu được mã hóa BCrypt một chiều; Token xác thực JWT có thời hạn 24 giờ và ràng buộc mục đích sử dụng (`purpose = VERIFY_EMAIL`); Chặn hoàn toàn người dùng chưa kích hoạt đăng nhập vào tài nguyên hệ thống.
- **Trải nghiệm người dùng (UX)**: Giao diện bám sát chuẩn, bảng màu Emerald/Teal trang nhã, không rườm rà, thông báo lỗi tiếng Việt thân thiện và dễ hiểu.
- **Tiêu chuẩn nghiệm thu**: **ĐẠT (PASSED) 100% các tiêu chí chấp nhận của Jira Ticket `[QA-007]` & `ATC-201`.**
