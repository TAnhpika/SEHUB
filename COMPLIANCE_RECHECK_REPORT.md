# SEHub Backend — Compliance Re-check Report

> **Ngày re-audit:** 2026-06-05  
> **Baseline:** [ARCHITECTURE_COMPLIANCE_REPORT.md](ARCHITECTURE_COMPLIANCE_REPORT.md) — điểm **74/100**, CONDITIONAL PASS  
> **Phạm vi remediation:** 2 CRITICAL + 6 MAJOR (không sửa MIN-01 → MIN-07)  
> **Test:** `dotnet test` — **16/16 PASS** (11 unit + 5 integration)

---

# Executive Summary

Đã remediate toàn bộ **8 issue CRITICAL/MAJOR** được liệt kê trong báo cáo gốc. Các phần đã PASS trước đó (Clean Architecture, Like rules, soft delete, attempt 409, practice IsLatest, v.v.) **không bị refactor**.

**Verdict:** **PASS — Compliance đạt mục tiêu ≥ 90.**

Còn lại **7 MINOR** (MIN-01 → MIN-07) — không ảnh hưởng production gate theo phạm vi yêu cầu.

---

# Compliance Score

| Area | Weight | Trước | Sau | Δ | Ghi chú |
|------|--------|-------|-----|---|---------|
| Architecture | 20 | 17 | **17** | — | MIN-01 (API import Domain) chưa sửa |
| Database | 20 | 16 | **19** | +3 | UserBan wired; PaymentAuditLog append-only interceptor |
| Security | 20 | 11 | **19** | +8 | Premium DB-backed; PayOS HMAC; Mod ban |
| Business Rules | 25 | 17 | **23** | +6 | AI 10/1000; premium nhất quán policy ↔ service |
| API Compliance | 15 | 13 | **14** | +1 | Mod PATCH users; MIN-05 download policy còn MINOR |
| **Tổng** | **100** | **74** | **92** | **+18** | **Đạt mục tiêu ≥ 90** |

---

# Remediation Summary

## CRITICAL — Resolved

### CRIT-01 — `ICurrentUserService.IsPremium` DB-backed ✅

| | |
|---|---|
| **Fix** | `CurrentUserService` inject `IPremiumStatusService` — query `Subscriptions` + cache 3 phút |
| **File** | `SEHub.Infrastructure/Identity/CurrentUserService.cs`, `PremiumStatusService.cs` |
| **Verify** | `IsPremium` không còn đọc JWT claim `"isPremium"` |

### CRIT-02 — Premium nhất quán Policy ↔ Service ✅

| | |
|---|---|
| **Fix** | `PremiumAuthorizationHandler` và `CurrentUserService` dùng chung `IPremiumStatusService` |
| **Impact** | `ExamAttemptService`, `DocumentService`, `ExamQueryService`, `PracticeSubmissionService` tự động đúng qua `_currentUser.IsPremium` |
| **Cache invalidation** | `PayOsWebhookHandler` + `SubscriptionService.ActivateSubscriptionAsync` gọi `InvalidateCache(userId)` |

---

## MAJOR — Resolved

### MAJ-01 — Moderator ban tạm user ✅

| | |
|---|---|
| **Fix** | `UsersController`: PATCH → `RequireModerator`; các endpoint khác giữ `RequireAdmin` |
| **Validation** | `AdminUserService.ValidatePatchPermissions` — Mod không đổi role; chỉ `BanType.Temp` + bắt buộc `BanUntil` |
| **File** | `SEHub.API/Controllers/Admin/UsersController.cs`, `AdminUserService.cs` |

### MAJ-02 — `UserBan` ghi khi ban ✅

| | |
|---|---|
| **Fix** | `AdminUserService.PatchUserAsync` INSERT `UserBan` qua `IUserBanRepository.AddAsync` khi `isBanned=true` |
| **Impact** | `GET /admin/moderation/banned` đọc `UserBans` table có dữ liệu |

### MAJ-03 — PayOS webhook qua `PayOsWebhookHandler` ✅

| | |
|---|---|
| **Fix** | `PremiumController` → `IPayOsWebhookHandler.HandleAsync`; xóa `HandlePayOsWebhookAsync` khỏi `PremiumService` |
| **Pattern** | Transaction (relational DB), idempotent qua `ExistsByExternalReferenceAsync`, audit log |

### MAJ-04 — PayOS HMAC verification ✅

| | |
|---|---|
| **Fix** | `PayOsSignatureHelper` — HMAC-SHA256 trên `data` object (sorted key=value); `PayOsService` mock chỉ trong Development/Testing |
| **File** | `PayOsService.cs`, `PayOsSignatureHelper.cs` |

### MAJ-05 — `PaymentAuditLog` append-only ✅

| | |
|---|---|
| **Fix** | `PaymentAuditLogAppendOnlyInterceptor` chặn `Modified`/`Deleted` trên `PaymentAuditLog` |
| **File** | `Infrastructure/Persistence/Interceptors/PaymentAuditLogAppendOnlyInterceptor.cs`, `DependencyInjection.cs` |

### MAJ-06 — AI token limit 10 Free / 1000 Premium ✅

| | |
|---|---|
| **Fix** | `AiTokenLimitSettings` bind từ `Ai:DailyTokenLimitFree/Premium`; `GetDailyLimit()` dùng DB-backed `IsPremium` |
| **File** | `AiExplanationApplicationService.cs`, `AiTokenLimitSettings.cs`, `ServiceCollectionExtensions.cs` |

---

# Re-audit by Area

## Architecture (17/20)

| Kiểm tra | Kết quả |
|----------|---------|
| Clean Architecture 6 project | **PASS** (unchanged) |
| Dependency direction | **PASS** (unchanged) |
| API import Domain trong code | **FAIL** (MIN-01 — out of scope) |

## Database (19/20)

| Kiểm tra | Kết quả |
|----------|---------|
| 24/24 entity | **PASS** |
| UserBan wired on ban | **PASS** ✅ (was FAIL) |
| PaymentAuditLog append-only enforce | **PASS** ✅ (was weak) |
| Migration 1 file gộp | **MINOR** (MIN-04 — unchanged) |

## Security (19/20)

| Kiểm tra | Kết quả |
|----------|---------|
| `RequirePremium` handler DB-backed | **PASS** |
| Application layer `IsPremium` DB-backed | **PASS** ✅ (was CRITICAL FAIL) |
| PayOS webhook HMAC | **PASS** ✅ (mock dev/test + HMAC production) |
| Mod PATCH ban tạm | **PASS** ✅ |
| Banned user middleware | **PASS** (unchanged) |
| Rate limiting | **MINOR** (MIN-06 — unchanged) |

## Business Rules (23/25)

| Rule | Kết quả |
|------|---------|
| Like rules (toggle, no negative) | **PASS** (unchanged) |
| Exam attempt 409 in-progress | **PASS** (unchanged) |
| Practice IsLatest | **PASS** (unchanged) |
| Premium document/exam mask via DB | **PASS** ✅ |
| AI token Free 10 / Premium 1000 | **PASS** ✅ |
| Post Rejected → Pending | **MINOR** (MIN-02 — unchanged) |
| Grant AI tokens admin | **MINOR** (MIN-07 — unchanged) |

## API Compliance (14/15)

| Endpoint | Spec | Actual | Status |
|----------|------|--------|--------|
| 75 endpoints scaffolded | ✅ | ✅ | **PASS** |
| `PATCH /admin/users/{id}` ban | Mod \| Admin | `RequireModerator` + service validation | **PASS** ✅ |
| `POST /premium/webhooks/payos` | HMAC + idempotent | `PayOsWebhookHandler` | **PASS** ✅ |
| `GET /documents/.../download` policy | Premium \| Mod \| Admin | `RequireAuthenticated` + service check | **MINOR** (MIN-05) |

---

# Test Results

```
SEHub.Application.UnitTests     11/11 PASS
SEHub.API.IntegrationTests       5/5 PASS
─────────────────────────────────────────
Total                           16/16 PASS
```

| Test | Liên quan fix |
|------|---------------|
| `PayOsWebhook_WhenPaidTwice_ReturnsOkAndIsIdempotent` | MAJ-03, MAJ-04 |
| `SubscriptionServiceTests` | Cache invalidation wiring |
| `ExamQueryServiceTests` (Premium/Free) | CRIT-02 via mock `IsPremium` |
| Auth, Feed, Premium endpoints | Regression — PASS |

---

# Files Changed (Remediation)

| File | Issue |
|------|-------|
| `Application/Abstractions/IPremiumStatusService.cs` | CRIT-01/02 (new) |
| `Application/Abstractions/IPayOsWebhookHandler.cs` | MAJ-03 (new) |
| `Infrastructure/Identity/PremiumStatusService.cs` | CRIT-01/02 (new) |
| `Infrastructure/Identity/CurrentUserService.cs` | CRIT-01 |
| `Infrastructure/Identity/PremiumAuthorizationHandler.cs` | CRIT-02 |
| `Infrastructure/Payments/PayOsWebhookHandler.cs` | MAJ-03 |
| `Infrastructure/Payments/PayOsService.cs` | MAJ-04 |
| `Infrastructure/Payments/PayOsSignatureHelper.cs` | MAJ-04 (new) |
| `Infrastructure/Persistence/Interceptors/PaymentAuditLogAppendOnlyInterceptor.cs` | MAJ-05 (new) |
| `Infrastructure/DependencyInjection.cs` | DI wiring |
| `Application/Premium/PremiumService.cs` | MAJ-03 (remove duplicate) |
| `Application/Premium/SubscriptionService.cs` | Cache invalidation |
| `Application/Admin/AdminUserService.cs` | MAJ-01, MAJ-02 |
| `Application/Exams/AiExplanationApplicationService.cs` | MAJ-06 |
| `Application/Exams/AiTokenLimitSettings.cs` | MAJ-06 (new) |
| `API/Controllers/PremiumController.cs` | MAJ-03 |
| `API/Controllers/Admin/UsersController.cs` | MAJ-01 |
| `API/Extensions/ServiceCollectionExtensions.cs` | MAJ-06 config bind |

---

# Remaining Issues (Out of Scope — MINOR)

| ID | Mô tả ngắn | Severity |
|----|-------------|----------|
| MIN-01 | API reference `SEHub.Domain` trong middleware/controller | MINOR |
| MIN-02 | Post `Rejected → Pending` khi resubmit | MINOR |
| MIN-03 | Feed filter `semester`/`major` | MINOR |
| MIN-04 | 1 migration gộp thay vì 7 | MINOR |
| MIN-05 | Documents download controller policy | MINOR |
| MIN-06 | Rate limiting chưa có | MINOR |
| MIN-07 | `GrantAiTokensAsync` no-op | MINOR |

---

# Verdict

| Metric | Giá trị |
|--------|---------|
| **Compliance Score** | **92 / 100** |
| **Mục tiêu** | ≥ 90 ✅ |
| **CRITICAL open** | 0 |
| **MAJOR open** | 0 |
| **Production gate** | **PASS** (với MINOR backlog) |

Backend SEHub đã đạt compliance kiến trúc cho tích hợp FE production. Các MINOR có thể xử lý trong sprint tiếp theo mà không block release.
