# Database Compliance Report

> **Date:** 2026-06-06  
> **ORM:** EF Core Code First · SQL Server  
> **DbContext:** `SEHub.Infrastructure/Persistence/SEHubDbContext.cs`  
> **Migrations:** `InitialCreate` · `AddOtpEnhancements`

---

## Summary

| Check | Result |
|-------|--------|
| Tables (G1) | **22/22 PASS** |
| Foreign Keys | **PASS** |
| Unique Indexes | **PASS** |
| Soft Delete | **PASS** (Post, Comment, Document) |
| Audit Fields | **PARTIAL** |
| G2 Tables | **N/A** (deferred) |

**Database Compliance Score:** **91%**

---

## Table Mapping (BA Data Model vs EF)

| Table | Entity | BA Required | Present | Result |
|-------|--------|-------------|---------|--------|
| AspNetUsers | ApplicationUser | ✅ | ✅ | **PASS** |
| UserProfiles | UserProfile | ✅ | ✅ | **PASS** |
| RefreshTokens | RefreshToken | ✅ (P1) | ✅ | **PASS** |
| OtpVerifications | OtpVerification | ✅ | ✅ | **PASS** |
| Posts | Post | ✅ | ✅ | **PASS** |
| Comments | Comment | ✅ | ✅ | **PASS** |
| PostLikes | PostLike | ✅ | ✅ | **PASS** |
| PostReports | PostReport | ✅ | ✅ | **PASS** |
| Exams | Exam | ✅ | ✅ | **PASS** |
| Questions | Question | ✅ | ✅ | **PASS** |
| QuestionOptions | QuestionOption | ✅ | ✅ | **PASS** |
| ExamAttempts | ExamAttempt | ✅ | ✅ | **PASS** |
| PracticeSubmissions | PracticeSubmission | ✅ | ✅ | **PASS** |
| DocumentCategories | DocumentCategory | ✅ | ✅ | **PASS** |
| Documents | Document | ✅ | ✅ | **PASS** |
| SubscriptionPlans | SubscriptionPlan | ✅ | ✅ | **PASS** |
| Subscriptions | Subscription | ✅ | ✅ | **PASS** |
| PaymentOrders | PaymentOrder | ✅ | ✅ | **PASS** |
| PaymentAuditLogs | PaymentAuditLog | ✅ | ✅ | **PASS** |
| LevelConfigs | LevelConfig | ✅ | ✅ | **PASS** |
| Badges | Badge | ✅ | ✅ | **PASS** |
| UserBadges | UserBadge | ✅ | ✅ | **PARTIAL** (no writes) |
| AiTokenDailyUsages | AiTokenDailyUsage | ✅ | ✅ | **PASS** |
| UserBans | UserBan | ✅ | ✅ | **PASS** |

---

## Foreign Keys

| FK | Config File | On Delete | Result |
|----|-------------|-----------|--------|
| Post → User (Author) | `PostConfiguration` | Restrict | **PASS** |
| Comment → Post | `CommentConfiguration` | Cascade | **PASS** |
| Comment → ParentComment | Self-ref | Restrict | **PASS** |
| Exam → Questions → Options | Cascade chain | **PASS** |
| PaymentOrder → PaymentAuditLog | Cascade | **PASS** |
| Subscription → Plan | `SubscriptionConfiguration` | **PASS** |
| ApplicationUser → LevelConfig | `ApplicationUserConfiguration` | **PASS** |

---

## Constraints & Indexes

| Constraint | Table | Implementation | Result |
|------------|-------|----------------|--------|
| Unique email/username | AspNetUsers | `ApplicationUserConfiguration` | **PASS** |
| Unique refresh token | RefreshTokens | `IX_RefreshTokens_Token` | **PASS** |
| Unique PayOs order code | PaymentOrders | `PaymentOrderConfiguration` | **PASS** |
| Unique exam code | Exams | `ExamConfiguration` | **PASS** |
| Composite PK PostLike | PostLikes | `(PostId, UserId)` | **PASS** |
| Filtered unique active attempt | ExamAttempts | InProgress index | **PASS** |
| Unique AI usage per day | AiTokenDailyUsages | `(UserId, UsageDate)` | **PASS** |
| OTP indexes | OtpVerifications | `(Email, Purpose)`, `(Phone, Purpose)` | **PASS** |

---

## Soft Delete

| Entity | Global Query Filter | Soft Delete API | Result |
|--------|---------------------|-----------------|--------|
| Post | `!IsDeleted` | `SoftDeleteAsync` | **PASS** |
| Comment | `!IsDeleted` | `SoftDeleteAsync` | **PASS** |
| Document | `!IsDeleted` | Admin delete sets flag | **PASS** |
| Exam | Physical only | No soft delete | **PARTIAL** (BA allows Admin hard delete) |

**Interceptor:** `SoftDeleteInterceptor` sets `DeletedAt`/`DeletedById`

---

## Audit Fields

| Pattern | Expected | Actual | Result |
|---------|----------|--------|--------|
| `CreatedAt` / `UpdatedAt` | Base entity | `BaseEntity` on domain entities | **PASS** |
| Payment audit append-only | INSERT only | `PaymentAuditLogAppendOnlyInterceptor` | **PASS** |
| `DeletedById` on soft delete | Moderation trace | Present on ISoftDeletable | **PASS** |
| Row-level change history | Optional G2 | Not implemented | **N/A** |

---

## Seed Data

| Seed | File | Result |
|------|------|--------|
| Roles + Admin user | `DbSeeder.cs` | **PASS** |
| Subscription plans (1m/8m/4y) | `DemoDataSeeder` / migration | **PASS** |
| Level configs | Seeded | **PASS** |
| Badges (26) | Seeded | **PASS** (no award logic) |

---

## Gaps

| Gap | Severity | Detail |
|-----|----------|--------|
| Refresh token stored plain text | MAJOR | `RefreshTokens.Token` not hashed |
| 7 incremental migrations planned → 2 actual | MINOR | Schema content present |
| UserBadge never populated | MINOR | Gamification incomplete |
