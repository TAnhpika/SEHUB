# SEHub — Demo Data Seeder Report

> **Date:** 2026-06-06  
> **Implementation:** `SEHub.Backend/src/SEHub.Infrastructure/Persistence/DemoDataSeeder.cs`  
> **Registration:** `SEHub.Backend/src/SEHub.API/Program.cs` — **Development only**  
> **Prerequisites:** `DbSeeder` must run first (roles, level configs, subscription plans, admin)

---

## Overview

`DemoDataSeeder` is a separate, idempotent seeder that adds realistic demo content for local Development. It does **not** modify migrations, `SEHubDbContext` schema, `DbSeeder`, or subscription plan definitions.

| Property | Value |
|----------|-------|
| Runs in | `IsDevelopment()` only |
| Skipped in | Production, Testing |
| Data access | EF Core (`SEHubDbContext`) + `UserManager` + `ISubscriptionService` |
| Idempotency | Existence checks before every insert |

---

## Demo Credentials

| Field | Value |
|-------|-------|
| **Email** | `demo.student@sehub.local` |
| **Password** | `Demo@12345` |
| **Username** | `demo_student` |
| **Role** | `Student` |
| **Display name** | `Demo Student` |

**Existing admin** (from `DbSeeder`, unchanged):

| Email | Password | Role |
|-------|----------|------|
| `admin@sehub.local` | `Admin@123` | `Admin` |

---

## Entities Created

### A. Student Account

| Table | Entity | Idempotency key |
|-------|--------|-----------------|
| `AspNetUsers` | `ApplicationUser` | `Email = demo.student@sehub.local` |
| `UserProfiles` | `UserProfile` | `UserId` = student id |
| `AspNetUserRoles` | Identity role link | Role `Student` via `UserManager.AddToRoleAsync` |

### B. Five Published Posts

| Table | Entity | Idempotency key |
|-------|--------|-----------------|
| `Posts` | `Post` × 5 | `AuthorId` + `Tags` contains `demo-seed` (stops at 5) |

All posts: `Status = Published (2)`, `IsDeleted = false`, tag `demo-seed,demo,sehub`.

| # | Title | Featured |
|---|-------|----------|
| 1 | Chào mừng đến với SEHub | No |
| 2 | Mẹo ôn thi SE301 - Software Engineering | No |
| 3 | Kinh nghiệm làm đồ án nhóm hiệu quả | No |
| 4 | Tổng hợp tài liệu học tập kỳ này | **Yes** |
| 5 | Review môn SE301 sau giữa kỳ | No |

### C. Final Exam (2 questions, correct answers)

| Table | Entity | Idempotency key |
|-------|--------|-----------------|
| `Exams` | `Exam` (Final, Published) | `Code = SE301-FINAL-01` |
| `Questions` | `Question` × 2 | Created with exam (cascade) |
| `QuestionOptions` | `QuestionOption` × 7 | 4 options Q1, 3 options Q2 |

| Exam field | Value |
|------------|-------|
| Code | `SE301-FINAL-01` |
| Title | Đề cuối kỳ SE301 |
| ExamType | `Final (0)` |
| Status | `Published (2)` |
| QuestionCount | `2` |

| Q# | Correct answer |
|----|----------------|
| 1 | **A** — Các giai đoạn phát triển phần mềm từ yêu cầu đến bảo trì |
| 2 | **A** — Sprint Planning |

### D. Practice Exam

| Table | Entity | Idempotency key |
|-------|--------|-----------------|
| `Exams` | `Exam` (Practice, Published) | `Code = SE301-LAB-01` |

| Exam field | Value |
|------------|-------|
| Code | `SE301-LAB-01` |
| Title | Bài thực hành Lab 01 |
| ExamType | `Practice (1)` |
| Status | `Published (2)` |
| QuestionCount | `0` |
| AssetUrl | `https://github.com/sehub-demo/se301-lab01-template` |

### E. Public Document (FreePreview)

| Table | Entity | Idempotency key |
|-------|--------|-----------------|
| `DocumentCategories` | `DocumentCategory` | `Name = SE301 - Software Engineering` |
| `Documents` | `Document` | `Title = Slide SE301 - Chương 1` |

| Document field | Value |
|----------------|-------|
| Title | Slide SE301 - Chương 1 |
| FilePath | `demo/se301-ch1.pdf` (under `FileStorage:LocalPath`) |
| MimeType | `application/pdf` |
| PageCount | `10` |
| AccessTier | `FreePreview (0)` |

A minimal PDF placeholder is written to disk if missing (filesystem helper only; not stored in DB).

### F. Active Premium Subscription

| Table | Entity | Idempotency key |
|-------|--------|-----------------|
| `Subscriptions` | `Subscription` | Active row for demo student with `EndAt > UtcNow` |

| Field | Value |
|-------|-------|
| Plan | Existing `SubscriptionPlans` where `Code = '1m'` — **no new plan created** |
| Activation | `ISubscriptionService.ActivateSubscriptionAsync` (deactivates prior actives, sets `EndAt`, invalidates premium cache) |

---

## Counts: Before vs After Seeding

Baseline assumes `DbSeeder` has already run on a fresh database (admin + roles + levels + plans only).

| Metric | Before (typical) | After (first run) | Delta |
|--------|------------------|-------------------|-------|
| `AspNetUsers` (total) | 1 | 2 | +1 demo student |
| Demo posts (`demo-seed` tag) | 0 | 5 | +5 |
| Demo exams (`SE301-FINAL-01`, `SE301-LAB-01`) | 0 | 2 | +2 |
| Questions (final exam) | 0 | 2 | +2 |
| Options (final exam) | 0 | 7 | +7 |
| Document categories (demo name) | 0 | 1 | +1 |
| Documents (demo title) | 0 | 1 | +1 |
| Active subscriptions (demo student) | 0 | 1 | +1 |

**Second and subsequent Development starts:** counts stay at target values; seeder logs show no new inserts.

Check application logs for lines:

```
DemoDataSeeder starting. Before: Users=...
DemoDataSeeder completed. After: Users=...
```

---

## Registration

```csharp
// Program.cs — after DbSeeder
if (app.Environment.IsDevelopment())
{
    await DemoDataSeeder.SeedAsync(app.Services);
}
```

| Environment | `DbSeeder` | `DemoDataSeeder` |
|-------------|------------|------------------|
| Development | ✅ | ✅ |
| Production | ✅ | ❌ |
| Testing | ❌ | ❌ |

---

## Verification SQL Queries

Run against `SEHubDb` after starting the API in Development.

### Prerequisites (unchanged by demo seeder)

```sql
-- Roles
SELECT Name FROM AspNetRoles
WHERE Name IN ('Student', 'Moderator', 'Admin');
-- Expect: 3 rows

-- Subscription plans (no duplicate plans created)
SELECT Code, Name, DurationDays, PriceVnd FROM SubscriptionPlans ORDER BY DurationDays;
-- Expect: 1m, 8m, 4y
```

### A. Student

```sql
SELECT Id, UserName, Email, DisplayName, LevelId, IsBanned
FROM AspNetUsers
WHERE Email = 'demo.student@sehub.local';
-- Expect: 1 row, UserName = demo_student

SELECT r.Name
FROM AspNetUserRoles ur
JOIN AspNetRoles r ON ur.RoleId = r.Id
JOIN AspNetUsers u ON ur.UserId = u.Id
WHERE u.Email = 'demo.student@sehub.local';
-- Expect: Student

SELECT UserId, Major, Semester, Bio
FROM UserProfiles
WHERE UserId = (SELECT Id FROM AspNetUsers WHERE Email = 'demo.student@sehub.local');
-- Expect: 1 row, Major = SE, Semester = 1
```

### B. Posts

```sql
SELECT Title, Status, Tags, IsFeatured, IsDeleted, ViewCount
FROM Posts
WHERE AuthorId = (SELECT Id FROM AspNetUsers WHERE Email = 'demo.student@sehub.local')
  AND Tags LIKE '%demo-seed%'
ORDER BY CreatedAt;
-- Expect: 5 rows, Status = 2 (Published), IsDeleted = 0
```

### C. Final exam

```sql
SELECT Id, Code, Title, ExamType, Status, QuestionCount
FROM Exams
WHERE Code = 'SE301-FINAL-01';
-- Expect: 1 row, ExamType = 0, Status = 2, QuestionCount = 2

SELECT q.OrderIndex, q.Content, q.CorrectOptionId, o.Label, o.Text
FROM Questions q
JOIN Exams e ON q.ExamId = e.Id
LEFT JOIN QuestionOptions o ON o.QuestionId = q.Id
WHERE e.Code = 'SE301-FINAL-01'
ORDER BY q.OrderIndex, o.Label;
-- Expect: 2 questions, 7 options; CorrectOptionId matches option Label 'A' for each question
```

### D. Practice exam

```sql
SELECT Code, Title, ExamType, Status, QuestionCount, AssetUrl
FROM Exams
WHERE Code = 'SE301-LAB-01';
-- Expect: ExamType = 1, Status = 2, QuestionCount = 0, AssetUrl NOT NULL
```

### E. Document

```sql
SELECT dc.Name, d.Title, d.FilePath, d.MimeType, d.PageCount, d.AccessTier, d.IsDeleted
FROM Documents d
JOIN DocumentCategories dc ON d.CategoryId = dc.Id
WHERE d.Title = 'Slide SE301 - Chương 1';
-- Expect: AccessTier = 0, IsDeleted = 0, FilePath = demo/se301-ch1.pdf
```

### F. Subscription

```sql
SELECT s.IsActive, s.StartAt, s.EndAt, p.Code, p.Name
FROM Subscriptions s
JOIN SubscriptionPlans p ON s.PlanId = p.Id
WHERE s.UserId = (SELECT Id FROM AspNetUsers WHERE Email = 'demo.student@sehub.local')
  AND s.IsActive = 1
  AND s.EndAt > GETUTCDATE();
-- Expect: 1 row, Code = 1m, EndAt in the future
```

### Idempotency check (re-run safe)

```sql
-- Re-start API in Development twice; these counts should be unchanged:
SELECT COUNT(*) AS DemoPosts FROM Posts WHERE Tags LIKE '%demo-seed%';
SELECT COUNT(*) AS DemoExams FROM Exams WHERE Code IN ('SE301-FINAL-01', 'SE301-LAB-01');
SELECT COUNT(*) AS DemoDocs FROM Documents WHERE Title = 'Slide SE301 - Chương 1';
```

---

## Stable GUIDs (first-run reference)

Used when the database is empty; re-runs skip creation if idempotency keys already exist.

| Entity | GUID |
|--------|------|
| Demo student | `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` |
| Document category | `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` |
| Document | `cccccccc-cccc-cccc-cccc-cccccccccccc` |
| Final exam | `dddddddd-dddd-dddd-dddd-dddddddddddd` |
| Practice exam | `eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee` |

---

## API Smoke Test (Swagger)

1. **Guest** — `GET /posts` → ≥ 5 published posts in feed  
2. **Guest** — `GET /exams` → lists `SE301-FINAL-01` and `SE301-LAB-01`  
3. **Login** — `POST /auth/login` with demo student credentials  
4. **Premium** — `GET /premium/subscription` → `isActive: true`, plan `1 Month`  
5. **Exam** — `POST /exams/{finalExamId}/attempts` → requires premium; returns questions  
6. **Documents** — `GET /documents` → authenticated; preview tier available  

---

## Files Changed

| File | Change |
|------|--------|
| `SEHub.Infrastructure/Persistence/DemoDataSeeder.cs` | **New** — demo seed logic |
| `SEHub.API/Program.cs` | Register seeder in Development only |
| `DEMO_DATA_SEEDER_REPORT.md` | **New** — this report |

**Not modified:** migrations, `SEHubDbContext`, `DbSeeder.cs`, `SubscriptionPlans` seed data.
