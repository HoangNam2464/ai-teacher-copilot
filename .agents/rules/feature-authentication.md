---
description: >-
  Rules for implementing Authentication in AI Teacher Copilot.
  Covers user registration, login, JWT issuance and validation,
  and Spring Security configuration.
trigger: model_decision
---

# Feature Rules: Authentication

## 1. Scope

### Includes
- User registration (email, password, full name)
- User login returning JWT access token
- Stateless JWT authentication filter on protected endpoints
- Spring Security configuration with public auth endpoints
- Frontend authentication state (Zustand) and Axios Bearer interceptor

### Excludes (Deferred)
- OAuth2 / Social login (Google, Microsoft)
- Refresh token rotation
- Multi-factor authentication (MFA)
- Password reset via email

---

## 2. Architecture & Responsibility

- **Owner Service**: Spring Boot (`backend/`)
- **Package**: `com.aiteachercopilot.auth`, `com.aiteachercopilot.user`
- **FastAPI / AI Service**: Does not handle authentication; trusts Spring Boot for user identity.

---

## 3. Implementation & Security Constraints

1. **Password Security**: Passwords must be hashed using `BCryptPasswordEncoder`. Plain-text passwords must never be logged or stored.
2. **JWT Configuration**: Secret key and expiration time are injected via environment variables (`app.jwt.secret`, `app.jwt.expiration-ms`). Hardcoded keys are prohibited.
3. **Endpoint Protection**: Only `/api/auth/**` and public health endpoints are unauthenticated. All other API routes require a valid `Bearer <token>`.
4. **Token Payload**: JWT claims include `userId` (UUID) and `email`. Sensitive data must not be embedded in the token.
5. **Response Sanitization**: Auth responses return only `token`, `email`, `fullName`, and `role`. Never expose password hashes or internal keys.
6. **Frontend Handling**: Axios interceptor attaches the JWT to the `Authorization` header and handles `401 Unauthorized` by clearing session and redirecting to login.

---

## 4. API Contract

```text
POST /api/auth/register
Request:  { email: string, password: string, fullName: string }
Response: 201 Created { token: string, email: string, fullName: string, role: string }
Errors:   400 Bad Request (email already exists, validation failed)

POST /api/auth/login
Request:  { email: string, password: string }
Response: 200 OK { token: string, email: string, fullName: string, role: string }
Errors:   401 Unauthorized (invalid credentials, inactive account)
```

---

## 5. Definition of Done

- [ ] User can register with valid credentials; duplicate email returns 400.
- [ ] User can authenticate and receive a valid JWT.
- [ ] Protected endpoints return 401 when token is missing or invalid.
- [ ] Passwords stored only as BCrypt hashes in PostgreSQL.
- [ ] Frontend stores token and attaches Bearer header on API requests.
- [ ] Automated tests pass in CI (`backend-ci.yml`).
