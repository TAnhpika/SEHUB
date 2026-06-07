# API Coverage Report

> **Date:** 2026-06-06  
> **BA reference:** `ARCHITECTURE-BE.md` §4 (~71–75 planned endpoints)  
> **Actual:** 15 controllers · **~79 business endpoints** + health

---

## Coverage Percentages

| Metric | Value |
|--------|-------|
| **Implemented (G1 scope)** | **98%** |
| **Missing (G1)** | **0%** |
| **Partially Implemented** | **2%** (1 endpoint) |
| **Extra beyond plan** | +4 auth endpoints (email verify, SMS OTP, refresh) |

---

## By Module

| Module | Planned | Implemented | Missing | Partial | Result |
|--------|---------|-------------|---------|---------|--------|
| Health | 1 | 1 | 0 | 0 | **PASS** |
| Auth | 8 | 13 | 0 | 1 | **PARTIAL** |
| Feed | 12 | 12 | 0 | 0 | **PASS** |
| Exam Final | 11 | 11 | 0 | 0 | **PASS** |
| Exam Practice | 4 | 4 | 0 | 0 | **PASS** |
| Documents | 4 | 4 | 0 | 0 | **PASS** |
| Premium | 5 | 5 | 0 | 0 | **PASS** |
| Profile | 3 | 3 | 0 | 0 | **PASS** |
| Admin | 27 | 27 | 0 | 0 | **PASS** |
| G2 (Chat/Follow) | 0 | 0 | — | — | **N/A** |

---

## Use Case → Endpoint → DTO → Validator Matrix

### Auth

| UC | Endpoint | Request DTO | Response DTO | Validator | Status |
|----|----------|-------------|--------------|-----------|--------|
| Register | `POST /auth/register` | `RegisterRequest` | `LoginResponse` | `RegisterRequestValidator` | **PASS** |
| Login | `POST /auth/login` | `LoginRequest` | `LoginResponse` | `LoginRequestValidator` | **PASS** |
| Google | `POST /auth/google` | `GoogleAuthRequest` | `LoginResponse` | — | **PARTIAL** |
| Forgot password | `POST /auth/forgot-password` | `ForgotPasswordRequest` | message | — | **PASS** |
| Verify OTP | `POST /auth/verify-otp` | `VerifyOtpRequest` | message | — | **PASS** |
| Reset password | `POST /auth/reset-password` | `ResetPasswordRequest` | message | `ResetPasswordRequestValidator` | **PASS** |
| Email verify | `POST /auth/send-email-verification` | `SendEmailVerificationRequest` | message | `SendEmailVerificationRequestValidator` | **PASS** |
| Verify email | `POST /auth/verify-email` | `VerifyEmailRequest` | message | `VerifyEmailRequestValidator` | **PASS** |
| Refresh | `POST /auth/refresh` | `RefreshTokenRequest` | `LoginResponse` | `RefreshTokenRequestValidator` | **PASS** |
| Logout | `POST /auth/logout` | — | message | — | **PASS** |
| Me | `GET /auth/me` | — | `MeResponse` | — | **PASS** |

### Feed

| UC | Endpoint | Request DTO | Response DTO | Validator | Status |
|----|----------|-------------|--------------|-----------|--------|
| List posts | `GET /posts` | query | `PagedResult<PostDto>` | — | **PASS** |
| Create post | `POST /posts` | `CreatePostRequest` | `PostDto` | `CreatePostRequestValidator` | **PASS** |
| Update post | `PUT /posts/{id}` | `UpdatePostRequest` | `PostDto` | — | **PASS** |
| Delete post | `DELETE /posts/{id}` | — | — | — | **PASS** |
| Like/Unlike | `POST/DELETE .../like` | — | `LikeResultDto` | — | **PASS** |
| Comments | `GET/POST .../comments` | `CreateCommentRequest` | `CommentDto` | — | **PASS** |
| Report | `POST .../report` | `ReportPostRequest` | — | — | **PASS** |
| Feature | `PATCH .../feature` | `FeaturePostRequest` | — | — | **PASS** |

### Exam

| UC | Endpoint | Request DTO | Response DTO | Validator | Status |
|----|----------|-------------|--------------|-----------|--------|
| List/detail | `GET /exams` | query | `ExamDto` | — | **PASS** |
| Questions | `GET .../questions` | — | `QuestionDto[]` | — | **PASS** |
| Answer (Premium) | `GET .../questions/{id}` | — | `QuestionWithAnswerDto` | — | **PASS** |
| Attempts | `POST/PUT/POST submit` | `SaveAnswersRequest` | `ExamAttemptDto` | `SaveAnswersRequestValidator` | **PASS** |
| AI explain | `POST .../ai-explain` | — | `AiExplainResponse` | — | **PASS** |
| Practice submit | `POST .../practice-submissions` | `SubmitPracticeRequest` | `PracticeSubmissionDto` | `SubmitPracticeRequestValidator` | **PASS** |

### Documents, Premium, Profile, Admin

All planned G1 endpoints present with matching DTOs in `SEHub.Contracts`. Admin endpoints use dedicated `Contracts/Admin/*` DTOs.

---

## Missing Endpoints (Intentional)

| Planned (BA/ARCH) | Reason |
|-------------------|--------|
| Chat WebSocket `/hubs/chat` | G2 §5.1 |
| `POST /users/{id}/follow` | G2 |
| Notifications API | G2 |
| Question comment APIs | G2 |
| `/admin/gamification/vouchers` | P1 |
| Export CSV / backup | P2 |

---

## Validation Gaps

| Endpoint | Gap |
|----------|-----|
| `POST /auth/forgot-password` | No FluentValidation |
| `POST /auth/verify-otp` | No FluentValidation |
| `PUT /posts/{id}` | No dedicated validator |
| `POST .../report` | No dedicated validator |

**API Coverage Score:** **98/100** for G1 scope
