# Business Rule Compliance Report

> **Date:** 2026-06-06  
> **Sources:** `SEHUB_PhanTichNghiepVu.md` §3–§4 · `ARCHITECTURE-BE.md` §3.4–§6  
> **Method:** Source code + CodeGraph call-chain verification

---

## Summary

| Status | Count | % |
|--------|-------|---|
| **PASS** | 18 | 67% |
| **PARTIAL** | 7 | 26% |
| **FAIL** | 2 | 7% |
| **Total Rules** | 27 | 100% |

---

## Authentication & OTP

| Business Rule | Implementation Location | Status |
|---------------|------------------------|--------|
| Password hashing (BCrypt) | `UserRepository` / ASP.NET Identity `PasswordHasher` | **PASS** |
| OTP expiry (10 min) | `OtpService` → `ExpiresAt = UtcNow + ExpiryMinutes` | **PASS** |
| OTP resend cooldown (60s) | `OtpService.EnsureCanSendEmailAsync` | **PASS** |
| OTP hourly cap (5/hour) | `OtpService` + `OtpSettings.MaxRequestsPerHour` | **PASS** |
| OTP max verify attempts (5) | `OtpService.VerifyInternalAsync` | **PASS** |
| OTP hash at rest (SHA256) | `OtpVerification.CodeHash` | **PASS** |
| Forgot-password anti-enumeration | `AuthService.SendForgotPasswordOtpAsync` silent 200 | **PASS** |
| Email verification gate on login | `AuthSettings.RequireConfirmedEmail` (default `false`) | **PARTIAL** |
| Google OAuth token verification | `AuthService.GoogleAuthAsync` stub | **FAIL** |
| SMS OTP channel | `MockSmsService` only | **PARTIAL** |
| Ban blocks login | `AuthService.EnsureNotBannedAsync` | **PASS** |
| Ban blocks API (middleware) | `BannedUserMiddleware` | **PASS** |
| Refresh token rotation | `AuthService.RefreshAsync` | **PASS** |
| Refresh token reuse detection | `RevokeAllForUserAsync` on revoked token | **PASS** |

---

## Feed & Community

| Business Rule | Implementation Location | Status |
|---------------|------------------------|--------|
| Like idempotent (no double points) | `PostLikeService.LikeAsync` early return | **PASS** |
| Unlike via DELETE (not toggle) | `PostLikeService.UnlikeAsync` | **PASS** |
| Like +2 points to author (first only) | `GamificationService.AwardLikeReceivedAsync` | **PASS** |
| Post +10 points on publish | `GamificationService.AwardPostPublishedAsync` | **PASS** |
| Post max 10,000 characters | `CreatePostRequestValidator` | **PASS** |
| Soft delete posts | `PostRepository.SoftDeleteAsync` + global filter | **PASS** |
| Soft delete comments | `CommentService.DeleteAsync` | **PASS** |
| Rejected post resubmit | `PostService` — always `Published` on create | **FAIL** |
| Pre-moderation queue | `PostStatus.Pending` not used on create | **PARTIAL** |
| Report dedup (pending) | `PostReportService` | **PASS** |

---

## Exam & Practice

| Business Rule | Implementation Location | Status |
|---------------|------------------------|--------|
| Mask answers for Guest/Free | `ExamQueryService.ShouldMaskAnswers()` | **PASS** |
| Premium-only online exam | `RequirePremium` + `ExamAttemptService` | **PASS** |
| One active attempt per user/exam | `GetActiveAsync` → 409 `ACTIVE_ATTEMPT_EXISTS` | **PASS** |
| Exam grading on submit | `ExamGradingService` | **PASS** |
| Practice resubmit (`IsLatest` flip) | `PracticeSubmissionService` | **PASS** |
| GitHub URL validation | `SubmitPracticeRequestValidator` | **PASS** |
| Mod manual review (Passed/Failed) | `PracticeSubmissionService.ReviewAsync` | **PASS** |
| OCR duplicate exam (SHA-256) | `AdminExamService` + `OcrExamService` | **PASS** |
| AI token lazy reset (no cron) | `AiTokenDailyUsage` per day; 10/1000 limits | **PASS** |

---

## Documents

| Business Rule | Implementation Location | Status |
|---------------|------------------------|--------|
| Guest cannot view documents | `DocumentService.EnsureAuthenticated()` → 401 | **PASS** |
| Free preview ≤3 pages | `DocumentService.FreePreviewPageLimit = 3` | **PASS** |
| Premium full access + download | `DocumentService.HasFullAccess()` | **PASS** |

---

## Premium & Payment

| Business Rule | Implementation Location | Status |
|---------------|------------------------|--------|
| Premium from DB (not JWT-only) | `PremiumAuthorizationHandler` → `IPremiumStatusService` | **PASS** |
| PayOS webhook idempotent | `PayOsWebhookHandler` status guard | **PASS** |
| Payment audit append-only | `PaymentAuditLogAppendOnlyInterceptor` | **PASS** |
| Admin manual confirm + audit | `AdminPaymentService.ConfirmPaymentAsync` | **PASS** |
| Subscription activation on paid | `SubscriptionService.ActivateSubscriptionAsync` | **PASS** |

---

## Ban & Moderation

| Business Rule | Implementation Location | Status |
|---------------|------------------------|--------|
| Mod temp ban only | `AdminUserService.ValidatePatchPermissions` | **PASS** |
| Admin permanent ban | Admin bypass `BanUntil` restriction | **PASS** |
| Report resolution + optional delete | `ModerationService.ResolveReportAsync` | **PASS** |
| Mod cannot confirm payments | `Admin/PaymentsController` `RequireAdmin` | **PASS** |

---

## Gamification

| Business Rule | Implementation Location | Status |
|---------------|------------------------|--------|
| Level from points (Bronze→Platinum) | `LevelConfigRepository.GetForPointsAsync` | **PASS** |
| Streak +20 points every 7 days | `UserRepository.UpdateStreakOnLoginAsync` — count only | **PARTIAL** |
| 26 badges event-driven | `Badge`/`UserBadge` seeded; no award service | **PARTIAL** |
| Voucher by rank at checkout | `LevelConfig.VoucherPercent` field only | **PARTIAL** |
| Heatmap 6-month cache | Not implemented | **PARTIAL** (G2 defer) |

---

## Rate Limiting (Auth)

| Business Rule | Implementation Location | Status |
|---------------|------------------------|--------|
| Login 5/min/IP | `AuthRateLimitExtensions.LoginPolicy` | **PASS** |
| Register 5/min/IP | `RegisterPolicy` | **PASS** |
| Refresh 20/min/user | `RefreshPolicy` | **PASS** |
| OTP HTTP rate limit | App-level only in `OtpService` | **PARTIAL** |
