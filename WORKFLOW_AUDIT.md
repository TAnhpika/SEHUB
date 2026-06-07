# SEHub — End-to-End Workflow Audit

> **Date:** 2026-06-06  
> **Method:** Trace actual controller → service → repository → entity chains

---

## Workflow Results Summary

| # | Workflow | Result |
|---|----------|--------|
| 1 | Register | **PASS** |
| 2 | Login | **PASS** |
| 3 | Email Verification | **PASS** |
| 4 | Forgot Password | **PASS** |
| 5 | Create Post | **PASS** |
| 6 | Like Post | **PASS** |
| 7 | Create Exam (Admin/Mod) | **PASS** |
| 8 | Submit Exam (Premium) | **PASS** |
| 9 | Practice Exam (GitHub) | **PASS** |
| 10 | Upload Document (Admin) | **PASS** |
| 11 | Premium Purchase | **PASS** |
| 12 | Moderation | **PASS** |
| 13 | User Ban | **PASS** |

---

## 1. Register

**Expected (BA §3.1):** Guest enters email/username/password → account created → can authenticate.

**Actual flow:**
```
POST /auth/register
  → AuthController.Register
  → AuthService.RegisterAsync (duplicate checks)
  → UserRepository.CreateAsync + UserProfile
  → OtpService.GenerateAndSendEmailAsync (EmailVerification)
  → BuildLoginResponseAsync (JWT returned immediately)
```

**Issues:** User receives JWT before email confirmed; `RequireConfirmedEmail` defaults `false`. Registration works; email gate is optional.

**Result:** **PASS**

---

## 2. Login

**Expected:** Email/username + password → JWT + profile; banned users blocked.

**Actual flow:**
```
POST /auth/login
  → AuthService.LoginAsync
  → ValidatePasswordAsync
  → [optional] EmailNotConfirmed check
  → EnsureNotBannedAsync
  → UpdateStreakOnLoginAsync
  → JwtTokenService → LoginResponse
```

**Middleware:** Subsequent requests checked by `BannedUserMiddleware`.

**Result:** **PASS**

---

## 3. Email Verification

**Expected (enhanced):** Send OTP → verify → `EmailConfirmed=true`.

**Actual flow:**
```
POST /auth/send-email-verification (unconfirmed user only)
  → OtpService → SmtpEmailService/LoggingEmailService

POST /auth/verify-email
  → OtpService.VerifyEmailAsync (markUsed)
  → UserRepository.ConfirmEmailAsync
```

**Issues:** Silent no-op for missing/already-confirmed users (anti-enumeration). OTP cooldown/rate limits enforced.

**Result:** **PASS**

---

## 4. Forgot Password

**Expected:** Email OTP → verify → reset password.

**Actual flow:**
```
POST /auth/forgot-password → OtpService (ForgotPassword purpose)
POST /auth/verify-otp → OtpService.VerifyAsync
POST /auth/reset-password → verify OTP (markUsed) → UpdatePasswordAsync
```

**Issues:** BA mentions SMS option — SMS endpoints exist but mock only.

**Result:** **PASS** (email path)

---

## 5. Create Post

**Expected:** Authenticated student creates Markdown post ≤10k chars; +10 points.

**Actual flow:**
```
POST /api/v1/posts [RequireAuthenticated]
  → CreatePostRequestValidator
  → PostService.CreateAsync (Status=Published)
  → GamificationService.AwardPostPublishedAsync (+10)
```

**Issues:** No pre-moderation / pending queue despite `PostStatus` enum supporting it.

**Result:** **PASS** (post-moderation model)

---

## 6. Like Post

**Expected:** Idempotent like; +2 points to author on first like; unlike via DELETE.

**Actual flow:**
```
POST /api/v1/posts/{id}/like
  → PostLikeService.LikeAsync (skip if exists)
  → AwardLikeReceivedAsync (+2) on new like only

DELETE /api/v1/posts/{id}/like
  → PostLikeService.UnlikeAsync
```

**Result:** **PASS**

---

## 7. Create Exam (Admin/Mod)

**Expected:** Mod creates exam → PendingApproval → Admin approves → Published.

**Actual flow:**
```
POST /api/v1/admin/exams [RequireModerator]
  → AdminExamService.CreateExamAsync
  → Status = PendingApproval
  → ContentHash duplicate check → 409 DUPLICATE_EXAM

POST /api/v1/admin/exams/{id}/approve [RequireAdmin]
  → Status = Published
```

**Issues:** OCR endpoint Admin-only; Mod cannot edit after create (PUT is Admin).

**Result:** **PASS**

---

## 8. Submit Exam (Premium)

**Expected:** Premium starts attempt → autosave answers → submit → scored result; max 1 InProgress.

**Actual flow:**
```
POST /api/v1/exams/{id}/attempts [RequirePremium]
  → ExamAttemptService.StartAttemptAsync (409 if active exists)

PUT .../answers → SaveAnswersAsync

POST .../submit → ExamGradingService → Submitted

GET .../result → ExamResultDto
GET .../attempts/current → resume InProgress
```

**Result:** **PASS**

---

## 9. Practice Exam (GitHub)

**Expected:** Premium submits GitHub URL → Mod reviews → student sees status/comment.

**Actual flow:**
```
POST /api/v1/exams/{examId}/practice-submissions [RequirePremium]
  → MarkPreviousAsNotLatestAsync
  → New PracticeSubmission (Submitted, IsLatest=true)

GET .../practice-submissions/me → latest status

PATCH .../practice-submissions/{id} [RequireModerator]
  → ReviewAsync (Passed/Failed + comment)
```

**Result:** **PASS** — closes BA §4.1.A risk (manual review MVP)

---

## 10. Upload Document (Admin)

**Expected:** Admin uploads → categorized → Free preview 3 pages / Premium full.

**Actual flow:**
```
POST /api/v1/admin/documents [RequireAdmin]
  → AdminDocumentService (file storage + metadata)

GET /api/v1/documents/{id}/preview [Authenticated]
  → DocumentService page limit enforcement
```

**Result:** **PASS**

---

## 11. Premium Purchase

**Expected:** Select plan → PayOS order/QR → webhook or admin confirm → subscription active.

**Actual flow:**
```
GET /api/v1/premium/plans (Anonymous)
POST /api/v1/premium/orders → PaymentOrder Pending + QR
POST /api/v1/premium/webhooks/payos → HMAC verify → activate Subscription
  OR POST /api/v1/admin/payments/{id}/confirm (Admin)
GET /api/v1/premium/subscription → isActive
```

**Premium check:** `PremiumAuthorizationHandler` reads DB (cached).

**Result:** **PASS**

---

## 12. Moderation

**Expected:** Student reports → Mod queue → approve/reject → optional delete post.

**Actual flow:**
```
POST /api/v1/posts/{id}/report → PostReport Pending
GET /api/v1/admin/moderation/reports [RequireModerator]
PATCH .../reports/{id} → ResolveReportAsync
  → optional delete_post soft-delete
```

**Issues:** No comment-level report workflow; post rejected-resubmit not wired.

**Result:** **PASS** (core queue)

---

## 13. User Ban

**Expected:** Mod temp ban (1/7/30 days); Admin permanent; banned user cannot use API.

**Actual flow:**
```
PATCH /api/v1/admin/users/{id} [RequireModerator]
  → AdminUserService.ValidatePatchPermissions
  → UserRepository.UpdateBanAsync
  → UserBan audit record

Login / API requests:
  → EnsureNotBannedAsync (login)
  → BannedUserMiddleware (all authenticated routes)
```

**Result:** **PASS**
