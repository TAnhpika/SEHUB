# SEHub — Demo Data Checklist

> **Ngày kiểm tra:** 2026-06-06  
> **Database:** `SEHubDb` @ `DESKTOP-AN9LFU8\SQL2019`  
> **Mục đích:** Liệt kê dữ liệu cần có **trước** buổi demo Backend ([BACKEND_DEMO_GUEST_AUTH.md](BACKEND_DEMO_GUEST_AUTH.md))  
> **Nguyên tắc:** Chỉ **đề xuất** — không tự động thay đổi database

---

# Kết quả kiểm tra hiện tại

| # | Tiêu chí | Yêu cầu | Hiện có | Trạng thái |
|---|----------|---------|---------|------------|
| 1 | Student account | ≥ 1 | 0 | ❌ THIẾU |
| 2 | Posts (published) | ≥ 5 | 0 | ❌ THIẾU |
| 3 | Final Exam (Published + có câu hỏi) | ≥ 1 | 0 | ❌ THIẾU |
| 4 | Practice Exam (Published) | ≥ 1 *(khuyến nghị)* | 0 | ❌ THIẾU |
| 5 | Document | ≥ 1 | 0 | ❌ THIẾU |
| 6 | Active Premium subscription (demo student) | ≥ 1 | 0 | ❌ THIẾU |

### Đã có sẵn (từ DbSeeder — không cần thêm)

- ✅ 3 Roles: `Student`, `Moderator`, `Admin`
- ✅ 4 LevelConfigs: Bronze, Silver, Gold, Platinum
- ✅ 3 SubscriptionPlans: `1m`, `8m`, `4y`
- ✅ 1 Admin user: `admin@sehub.local` *(không dùng trong demo Student)*

---

# Checklist chuẩn bị trước buổi báo cáo

Đánh dấu khi hoàn thành:

- [ ] **D1** — Tạo tài khoản Student demo
- [ ] **D2** — Seed ≥ 5 bài viết Published
- [ ] **D3** — Seed 1 Final Exam Published (≥ 2 câu hỏi, mỗi câu ≥ 2 đáp án)
- [ ] **D4** — Seed 1 Practice Exam Published
- [ ] **D5** — Seed 1 Document (+ category, file path hợp lệ nếu cần preview)
- [ ] **D6** — Gán Premium active cho demo student *(hoặc chuẩn bị flow PayOS webhook trong demo)*
- [ ] **D7** — Ghi lại GUID cố định vào script demo (examId, postId, documentId)

---

# D1 — Student account

## Cách A — Qua Swagger (không cần SQL)

```
POST /api/v1/auth/register
```

```json
{
  "email": "demo.student@sehub.local",
  "username": "demo_student",
  "password": "Demo@12345",
  "displayName": "Demo Student"
}
```

## Cách B — Kiểm tra sau khi tạo

```sql
SELECT u.Email, u.UserName, u.DisplayName, r.Name AS Role
FROM AspNetUsers u
JOIN AspNetUserRoles ur ON u.Id = ur.UserId
JOIN AspNetRoles r ON ur.RoleId = r.Id
WHERE r.Name = 'Student';
```

**Kỳ vọng:** ≥ 1 dòng.

---

# D2 — Posts (≥ 5 bài Published)

Student có thể tự tạo qua `POST /api/v1/posts` nhưng **không đủ 5 bài** trong 10 phút demo.

## Đề xuất seed qua SQL

> Cần `AuthorId` = GUID của `demo_student`. Lấy bằng:

```sql
DECLARE @AuthorId UNIQUEIDENTIFIER = (
  SELECT Id FROM AspNetUsers WHERE UserName = 'demo_student'
);
```

Tạo 5 posts *(chạy sau khi có @AuthorId)*:

```sql
INSERT INTO Posts (Id, AuthorId, Title, Content, Tags, Status, ViewCount, IsFeatured, IsDeleted, CreatedAt)
VALUES
  (NEWID(), @AuthorId, N'Chia sẻ kinh nghiệm học SQL', N'Nội dung bài 1...', 'sql,demo', 2, 0, 0, 0, GETUTCDATE()),
  (NEWID(), @AuthorId, N'Review môn Lập trình Web', N'Nội dung bài 2...', 'web,demo', 2, 0, 0, 0, GETUTCDATE()),
  (NEWID(), @AuthorId, N'Tips ôn thi cuối kỳ SE', N'Nội dung bài 3...', 'exam,demo', 2, 0, 1, 0, GETUTCDATE()),
  (NEWID(), @AuthorId, N'Tài liệu hay về OOP', N'Nội dung bài 4...', 'oop,demo', 2, 0, 0, 0, GETUTCDATE()),
  (NEWID(), @AuthorId, N'Hỏi đáp về GitHub Classroom', N'Nội dung bài 5...', 'github,demo', 2, 0, 0, 0, GETUTCDATE());
```

> `Status = 2` = `PostStatus.Published` (enum: Draft=0, Pending=1, Published=2, Rejected=3).

## Verify

```sql
SELECT COUNT(*) AS PostCount FROM Posts WHERE IsDeleted = 0 AND Status = 2;
-- Kỳ vọng: >= 5
```

---

# D3 — Final Exam Published (có câu hỏi)

Không thể tạo exam qua Student API. Đề xuất seed SQL hoặc dùng Admin API **ngoài buổi demo** (không trình bày Admin).

## Đề xuất — Exam + 2 câu hỏi

```sql
DECLARE @ExamId UNIQUEIDENTIFIER = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
DECLARE @Q1 UNIQUEIDENTIFIER = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
DECLARE @Q2 UNIQUEIDENTIFIER = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
DECLARE @O1A UNIQUEIDENTIFIER = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
DECLARE @O1B UNIQUEIDENTIFIER = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
DECLARE @O2B UNIQUEIDENTIFIER = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
DECLARE @O2C UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111111112';

INSERT INTO Exams (Id, Code, Title, ExamType, Semester, Major, QuestionCount, Status, ContentHash, Description, CreatedAt)
VALUES (@ExamId, 'SE301-FINAL-01', N'Đề cuối kỳ SE301', 0, 1, 'SE', 2, 2, 'demo-exam-hash', N'Đề demo buổi báo cáo', GETUTCDATE());

INSERT INTO Questions (Id, ExamId, OrderIndex, Content, CorrectOptionId, CreatedAt) VALUES
  (@Q1, @ExamId, 1, N'Câu 1: HTTP là viết tắt của?', @O1A, GETUTCDATE()),
  (@Q2, @ExamId, 2, N'Câu 2: REST API dùng phương thức nào để đọc?', @O2C, GETUTCDATE());

INSERT INTO QuestionOptions (Id, QuestionId, Label, Text, CreatedAt) VALUES
  (@O1A, @Q1, 'A', N'HyperText Transfer Protocol', GETUTCDATE()),
  (@O1B, @Q1, 'B', N'High Transfer Text Protocol', GETUTCDATE()),
  (@O2B, @Q2, 'B', N'POST', GETUTCDATE()),
  (@O2C, @Q2, 'C', N'GET', GETUTCDATE());
```

> `ExamType = 0` (Final), `Status = 2` (Published).

**Ghi vào script demo:** `examId = aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`

## Verify

```sql
SELECT e.Code, e.Status, COUNT(q.Id) AS QuestionCount
FROM Exams e
LEFT JOIN Questions q ON q.ExamId = e.Id
WHERE e.ExamType = 0 AND e.Status = 2
GROUP BY e.Code, e.Status;
```

---

# D4 — Practice Exam Published

```sql
DECLARE @PracticeExamId UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222222';

INSERT INTO Exams (Id, Code, Title, ExamType, Semester, Major, QuestionCount, Status, ContentHash, Description, AssetUrl, CreatedAt)
VALUES (@PracticeExamId, 'SE301-LAB-01', N'Bài thực hành GitHub Lab 01', 1, 1, 'SE', 0, 2, 'demo-practice-hash', N'Nộp link GitHub', 'https://github.com/example/lab01', GETUTCDATE());
```

> `ExamType = 1` (Practice).

**Ghi vào script demo:** `practiceExamId = 22222222-2222-2222-2222-222222222222`

---

# D5 — Document

```sql
DECLARE @CategoryId UNIQUEIDENTIFIER = NEWID();
DECLARE @DocumentId UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333333';

INSERT INTO DocumentCategories (Id, Name, Semester, Major, CreatedAt)
VALUES (@CategoryId, N'SE301 - Software Engineering', 1, 'SE', GETUTCDATE());

INSERT INTO Documents (Id, CategoryId, Title, FilePath, MimeType, PageCount, AccessTier, IsDeleted, CreatedAt)
VALUES (@DocumentId, @CategoryId, N'Slide SE301 - Chương 1', 'uploads/demo/se301-ch1.pdf', 'application/pdf', 10, 0, 0, GETUTCDATE());
```

> `AccessTier = 0` (FreePreview). Đặt file PDF thật tại `SEHub.API/wwwroot/uploads/demo/se301-ch1.pdf` nếu muốn demo preview.

**Ghi vào script demo:** `documentId = 33333333-3333-3333-3333-333333333333`

## Verify

```sql
SELECT COUNT(*) FROM Documents WHERE IsDeleted = 0;
-- Kỳ vọng: >= 1
```

---

# D6 — Premium subscription (demo student)

Cần cho Demo 12 (Exam attempt) và Demo 13 (Practice submit).

## Cách A — Trong buổi demo (không cần SQL)

1. Login `demo_student`
2. `POST /api/v1/premium/orders` — `{ "planCode": "1m" }`
3. `POST /api/v1/premium/webhooks/payos` — signature `mock-mock-checksum-key-dev`
4. `GET /api/v1/premium/subscription` → `isActive: true`

## Cách B — Seed SQL (ổn định hơn trước buổi demo)

```sql
DECLARE @UserId UNIQUEIDENTIFIER = (SELECT Id FROM AspNetUsers WHERE UserName = 'demo_student');
DECLARE @PlanId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM SubscriptionPlans WHERE Code = '1m');

INSERT INTO Subscriptions (Id, UserId, PlanId, StartAt, EndAt, IsActive, CreatedAt)
VALUES (NEWID(), @UserId, @PlanId, GETUTCDATE(), DATEADD(DAY, 30, GETUTCDATE()), 1, GETUTCDATE());
```

## Verify

```sql
SELECT u.UserName, s.IsActive, s.EndAt, p.Name AS PlanName
FROM Subscriptions s
JOIN AspNetUsers u ON s.UserId = u.Id
JOIN SubscriptionPlans p ON s.PlanId = p.Id
WHERE s.IsActive = 1;
```

---

# D7 — Bảng GUID tham chiếu nhanh (điền sau khi seed)

| Entity | GUID đề xuất | Ghi chú |
|--------|--------------|---------|
| Final Exam | `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` | SE301-FINAL-01 |
| Practice Exam | `22222222-2222-2222-2222-222222222222` | SE301-LAB-01 |
| Document | `33333333-3333-3333-3333-333333333333` | Slide SE301 |
| Question 1 | `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` | Đáp án đúng: option A |
| Question 2 | `cccccccc-cccc-cccc-cccc-cccccccccccc` | Đáp án đúng: option C |

Lấy Post ID sau seed:

```sql
SELECT TOP 5 Id, Title FROM Posts WHERE IsDeleted = 0 ORDER BY CreatedAt;
```

---

# Thứ tự seed đề xuất

```
1. D1  Student (Register hoặc SQL)
2. D3  Final Exam + Questions
3. D4  Practice Exam
4. D5  Document Category + Document (+ file PDF nếu cần)
5. D2  Posts (5 bài)
6. D6  Premium subscription
7. D7  Ghi GUID vào BACKEND_DEMO_GUEST_AUTH.md / note riêng
```

---

# Rủi ro nếu không seed

| Demo | Hậu quả |
|------|---------|
| Demo 4 Feed Guest | `items: []` — không có gì để show |
| Demo 5 Exams Guest | `items: []` |
| Demo 6 Documents | 401 Guest OK; sau login vẫn `items: []` |
| Demo 12 Exam | Không có examId; hoặc 403 nếu không Premium |
| Demo 13 Practice | Không có practice examId |

**Khuyến nghị:** Seed tối thiểu **D1 + D3 + D6** trước buổi báo cáo; **D2 + D5** nếu muốn demo feed/documents đầy đủ.

---

# Liên kết

- [BACKEND_DEMO_GUEST_AUTH.md](BACKEND_DEMO_GUEST_AUTH.md) — Kịch bản demo Swagger
- [DATABASE_CONFIGURATION_REPORT.md](DATABASE_CONFIGURATION_REPORT.md) — Cấu hình DB
- [DATABASE_VALIDATION_REPORT.md](DATABASE_VALIDATION_REPORT.md) — Validate seed cơ bản
