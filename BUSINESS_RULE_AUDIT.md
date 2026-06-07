# SEHub — Business Rule Validation Audit

> **Date:** 2026-06-06  
> **Method:** Source code inspection + CodeGraph call-chain verification  
> **Reference:** `SEHUB_PhanTichNghiepVu.md` §3–§4, `ARCHITECTURE-BE.md` §3.4–§6

---

## Summary

| Result | Count |
|--------|-------|
| PASS | 18 |
| PARTIAL | 7 |
| FAIL | 2 |

---

## Rule Validation Matrix

### Authentication & OTP

| Rule | Expected Behavior | Actual Implementation | Result |
|------|-------------------|----------------------|--------|
| Password hashing | BCrypt / secure hash | ASP.NET Identity `UserManager` / `PasswordHasher` via `UserRepository` | **PASS** |
| OTP expiry | Time-limited code | `ExpiresAt = UtcNow + 10 min` (`OtpService.cs:189`) | **PASS** |
| OTP resend limit | Rate limit sends | 60s cooldown + max 5/hour (`OtpService.cs:261-279`, `appsettings.json:32-36`) | **PASS** |
| OTP max attempts | Limit verify tries | `MaxAttempts = 5`; marks `IsUsed` on exceed (`OtpService.cs:168-186`) | **PASS** |
| Forgot-password anti-enumeration | No leak if email missing | `SendForgotPasswordOtpAsync` silent return if user null | **PASS** |
| Email verification gate | Optional login block | `AuthSettings.RequireConfirmedEmail` — default `false` (`appsettings.json:38-40`) | **PARTIAL** — configurable, off by default |
| Google OAuth verify | Verify `id_token` with Google | Stub: uses raw string as email (`AuthService.cs:219-223`) | **FAIL** |
| SMS forgot-password | Email **or** SMS channel | SMS endpoints exist; `MockSmsService` only | **PARTIAL** |

---

### Feed & Community

| Rule | Expected Behavior | Actual Implementation | Result |
|------|-------------------|----------------------|--------|
| Like idempotent | Repeat like = no duplicate / no double points | Early return if like exists (`PostLikeService.cs:36-44`) | **PASS** |
| Unlike separate | DELETE unlike, not toggle on POST | `UnlikeAsync` removes row (`PostLikeService.cs:63-80`) | **PASS** |
| Like +2 points author | Gamification on first like only | `AwardLikeReceivedAsync` only after new like (`PostLikeService.cs:54`) | **PASS** |
| Post +10 points | On publish | `AwardPostPublishedAsync` on create (`PostService.cs:114`) | **PASS** |
| Post max 10,000 chars | Validator limit | `CreatePostRequestValidator.MaxContentLength = 10_000` | **PASS** |
| Soft delete posts | `IsDeleted=true`, not physical delete | `PostRepository.SoftDeleteAsync` + global filter (`SEHubDbContext.cs:46`) | **PASS** |
| Soft delete comments | Same pattern | `CommentService.DeleteAsync` → `SoftDeleteAsync` | **PASS** |
| Rejected post resubmit | Edit rejected → Pending | Posts always `Published` on create; no status transition on update | **FAIL** |
| Pre-moderation | Optional pending review | Not enforced — direct publish | **PARTIAL** |

---

### Exam & Practice

| Rule | Expected Behavior | Actual Implementation | Result |
|------|-------------------|----------------------|--------|
| Mask answers (Guest/Free) | Hide `CorrectOptionId` | `ShouldMaskAnswers()` (`ExamQueryService.cs:100-101`) | **PASS** |
| Premium online exam | Only Premium attempts | `RequirePremium` + `ExamAttemptService.RequirePremiumUser()` | **PASS** |
| Active attempt restriction | Max 1 `InProgress` per user/exam | `GetActiveAsync` → 409 `ACTIVE_ATTEMPT_EXISTS` (`ExamAttemptService.cs:45-49`) | **PASS** |
| Exam grading on submit | Score calculated | `ExamGradingService` invoked on submit | **PASS** |
| Practice resubmit | New `IsLatest=true`, old `false` | `MarkPreviousAsNotLatestAsync` (`PracticeSubmissionService.cs:48`) | **PASS** |
| GitHub URL validation | Whitelist `github.com` | `SubmitPracticeRequestValidator` (FluentValidation) | **PASS** |
| Mod review practice | Manual Passed/Failed | `ReviewAsync` updates status + comment | **PASS** |
| Duplicate exam (OCR hash) | SHA-256 after normalize → 409 | `AdminExamService.CreateExamAsync` + `OcrExamService` | **PASS** |
| AI token lazy reset | Per-user daily row, no cron | `AiTokenDailyUsage` + `RecordTokenUsageAsync`; limits 10/1000 | **PASS** |

---

### Documents

| Rule | Expected Behavior | Actual Implementation | Result |
|------|-------------------|----------------------|--------|
| Guest cannot view docs | 401 for unauthenticated | `DocumentService.EnsureAuthenticated()` | **PASS** |
| Free preview ≤3 pages | Page limit enforced | `FreePreviewPageLimit = 3` (`DocumentService.cs:12,74-83`) | **PASS** |
| Premium full + download | Premium/Mod/Admin full access | `HasFullAccess()` check (`DocumentService.cs:121`) | **PASS** |

---

### Premium & Payment

| Rule | Expected Behavior | Actual Implementation | Result |
|------|-------------------|----------------------|--------|
| Premium from DB | Not JWT-only | `PremiumAuthorizationHandler` → `IPremiumStatusService` | **PASS** |
| PayOS webhook idempotent | Paid twice → 200, no duplicate | Reference check + status guard (`PayOsWebhookHandler.cs:131-138`) | **PASS** |
| Payment audit append-only | INSERT only | `PaymentAuditLogAppendOnlyInterceptor` | **PASS** |
| Admin manual confirm | Audit trail on confirm | `AdminPaymentService.ConfirmPaymentAsync` | **PASS** |

---

### Ban & Moderation

| Rule | Expected Behavior | Actual Implementation | Result |
|------|-------------------|----------------------|--------|
| Ban blocks login | 403 on banned user login | `EnsureNotBannedAsync` (`AuthService.cs`) | **PASS** |
| Ban blocks API calls | Middleware 403 | `BannedUserMiddleware` (`Program.cs:36`) | **PASS** |
| Mod temp ban only | Mod cannot permanent ban | `ValidatePatchPermissions` (`AdminUserService.cs:317-337`) | **PASS** |
| Admin permanent ban | Admin can ban without `BanUntil` | Admin bypasses Mod restrictions | **PASS** |
| Report resolution | Approve/Reject + optional delete | `ModerationService.ResolveReportAsync` | **PASS** |

---

### Gamification

| Rule | Expected Behavior | Actual Implementation | Result |
|------|-------------------|----------------------|--------|
| Level from points | Bronze→Platinum thresholds | `LevelConfigRepository.GetForPointsAsync` | **PASS** |
| Streak +20 on 7 days | Bonus points every 7-day streak | Only `StreakCount` incremented on login | **PARTIAL** |
| 26 badges event-driven | Award on conditions | `Badge`/`UserBadge` tables exist; no award service | **PARTIAL** |
| Voucher by rank | Gold 10%, Platinum 20% on checkout | `LevelConfig.VoucherPercent` field only; no checkout logic | **PARTIAL** |

---

## Code References — Critical Findings

### FAIL: Google OAuth stub

```215:223:SEHub.Backend/src/SEHub.Application/Auth/AuthService.cs
    public async Task<LoginResponse> GoogleAuthAsync(GoogleAuthRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.IdToken.Contains('@')
            ? request.IdToken
            : $"google_{request.IdToken}@stub.sehub.local";
```

### FAIL: No rejected-post resubmit workflow

```101:109:SEHub.Backend/src/SEHub.Application/Feed/PostService.cs
        var post = new Post
        {
            // ...
            Status = PostStatus.Published,
```

`UpdateAsync` does not transition `Rejected → Pending`.

### PASS: Like idempotency

```36:44:SEHub.Backend/src/SEHub.Application/Feed/PostLikeService.cs
        var existing = await _likeRepository.GetAsync(postId, userId, cancellationToken);
        if (existing is not null)
        {
            return new LikeResultDto { IsLiked = true, LikeCount = ... };
        }
```

### PASS: Active attempt guard

```45:49:SEHub.Backend/src/SEHub.Application/Exams/ExamAttemptService.cs
        var active = await _attemptRepository.GetActiveAsync(userId, examId, cancellationToken);
        if (active is not null)
        {
            throw new ConflictException(ErrorCodes.ActiveAttemptExists);
        }
```
