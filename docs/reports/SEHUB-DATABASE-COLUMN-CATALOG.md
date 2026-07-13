# SEHUB — Catalog cột cơ sở dữ liệu

Tài liệu này mô tả cột các bảng trong schema SEHUB, suy ra từ **EF Core Code First** (entity Domain + Fluent configurations trong Infrastructure).

- **Nguồn:** `be/src/SEHub.Domain/Entities/`, `ApplicationUser`, `Persistence/Configurations/`
- **Ngày tham chiếu:** Jul 2026
- **Phạm vi:** ~71 bảng (gồm AspNet Identity + domain)
- **Bỏ qua:** `PaymentVerificationMethods` (hằng số C#, không phải bảng)

### Quy ước

- Entity kế thừa `BaseEntity` luôn có: **Id** (`Guid` PK), **CreatedAt** (`DateTime`), **UpdatedAt** (`DateTime?`).
- Entity **không** kế thừa `BaseEntity` dùng khóa riêng (ghi rõ ở từng bảng).
- Navigation property không map thành cột (chỉ liệt kê cột scalar / FK).
- Độ dài / unique / FK lấy từ Fluent config khi có.

---

## 1. Auth & Identity

### 1.1. AspNetUsers (`ApplicationUser`)

Bảng người dùng: `IdentityUser<Guid>` + cột mở rộng SEHUB. PK: `Id`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| UserName | string? | Có | Tên đăng nhập; unique |
| NormalizedUserName | string? | Có | UserName chuẩn hóa (Identity) |
| Email | string? | Có | Email; unique |
| NormalizedEmail | string? | Có | Email chuẩn hóa (Identity) |
| EmailConfirmed | bool | Không | Đã xác thực email |
| PasswordHash | string? | Có | Hash mật khẩu |
| SecurityStamp | string? | Có | Stamp bảo mật Identity |
| ConcurrencyStamp | string? | Có | Optimistic concurrency |
| PhoneNumber | string? | Có | SĐT Identity |
| PhoneNumberConfirmed | bool | Không | Đã xác thực SĐT |
| TwoFactorEnabled | bool | Không | Bật 2FA |
| LockoutEnd | DateTimeOffset? | Có | Hết khóa tài khoản |
| LockoutEnabled | bool | Không | Cho phép lockout |
| AccessFailedCount | int | Không | Số lần đăng nhập sai |
| DisplayName | string | Không | Tên hiển thị (max 100) |
| Points | int | Không | Điểm gamification hiện tại |
| LevelId | Guid? | Có | FK → LevelConfigs; rank hiện tại |
| StreakCount | int | Không | Chuỗi hoạt động hiện tại |
| HighestStreak | int | Không | Chuỗi cao nhất |
| LastActivityDate | DateTime? | Có | Ngày hoạt động gần nhất |
| LastDailyLoginBonusAt | DateTime? | Có | Lần nhận bonus login ngày |
| LastSeenAt | DateTime? | Có | Lần online gần nhất |
| IsBanned | bool | Không | Cờ đang bị cấm |
| BanUntil | DateTime? | Có | Hết hạn cấm (null = vĩnh viễn/không áp) |
| BanReason | string? | Có | Lý do cấm (max 500) |

### 1.2. Bảng Identity chuẩn (tóm tắt)

Không liệt kê hết cột framework — chỉ mục đích:

| Bảng | Mục đích |
|---|---|
| **AspNetRoles** | Danh mục vai trò (Admin, Student, …) |
| **AspNetUserRoles** | Liên kết nhiều-nhiều User ↔ Role |
| **AspNetUserClaims** | Claim gắn theo user |
| **AspNetRoleClaims** | Claim gắn theo role |
| **AspNetUserLogins** | Đăng nhập ngoài (Google, …) nếu dùng |
| **AspNetUserTokens** | Token Identity (2FA, provider, …) |

### 1.3. UserProfiles

Kế thừa `BaseEntity`. 1–1 với user (`UserId` unique).

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK (BaseEntity) |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK → AspNetUsers; unique |
| AvatarUrl | string? | Có | URL avatar (max 500) |
| AvatarPublicId | string? | Có | Public ID Cloudinary (max 256) |
| Bio | string? | Có | Tiểu sử (max 1000) |
| Major | string? | Có | Ngành học (max 100) |
| Semester | int? | Có | Học kỳ |
| Gender | string? | Có | Giới tính (max 20) |
| DateOfBirth | DateOnly? | Có | Ngày sinh |
| Phone | string? | Có | SĐT hồ sơ (max 20) |
| Address | string? | Có | Địa chỉ (max 200) |

### 1.4. RefreshTokens

Kế thừa `BaseEntity`. Token làm mới JWT.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK → AspNetUsers |
| Token | string | Không | Giá trị token; unique (max 256) |
| ExpiresAt | DateTime | Không | Hết hạn |
| IsRevoked | bool | Không | Đã thu hồi |

### 1.5. OtpVerifications

Kế thừa `BaseEntity`. OTP xác thực email/SĐT.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| Email | string | Không | Email nhận OTP (max 256) |
| Phone | string? | Có | SĐT nhận OTP (max 20) |
| CodeHash | string | Không | Hash mã OTP (max 256) |
| ExpiresAt | DateTime | Không | Hết hạn OTP |
| AttemptCount | int | Không | Số lần thử |
| IsUsed | bool | Không | Đã dùng |
| Purpose | OtpPurpose | Không | Mục đích (đăng ký, reset, …) |

### 1.6. RoleChangeAudits

Kế thừa `BaseEntity`. Audit đổi role.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| TargetUserId | Guid | Không | User bị đổi role |
| ActorId | Guid? | Có | Người thực hiện |
| Action | string | Không | Hành động (max 50) |
| FromRole | string | Không | Role trước (max 50) |
| ToRole | string | Không | Role sau (max 50) |
| Detail | string | Không | Chi tiết (max 500) |

### 1.7. UserDailyActivities

**Không** kế thừa `BaseEntity`. PK composite `(UserId, ActivityDate)`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| UserId | Guid | Không | PK + FK → AspNetUsers |
| ActivityDate | DateOnly | Không | PK; ngày hoạt động |
| ActivityCount | int | Không | Số lần hoạt động trong ngày |

---

## 2. Feed & Community

### 2.1. Posts

Kế thừa `BaseEntity` + soft delete.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| AuthorId | Guid | Không | FK → AspNetUsers |
| Title | string | Không | Tiêu đề (max 200) |
| Content | string | Không | Nội dung (max 10000) |
| Status | PostStatus | Không | Trạng thái duyệt |
| ViewCount | int | Không | Lượt xem |
| IsPinned | bool | Không | Ghim bài |
| IsFeatured | bool | Không | Nổi bật |
| ModeratedById | Guid? | Có | FK moderator |
| ModeratedAt | DateTime? | Có | Thời điểm duyệt |
| ModerationNote | string? | Có | Ghi chú duyệt (max 1000) |
| IsDeleted | bool | Không | Soft delete |
| DeletedAt | DateTime? | Có | Thời điểm xóa |
| DeletedById | Guid? | Có | FK người xóa |

### 2.2. PostImages

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| PostId | Guid | Không | FK → Posts |
| DriveFileId | string? | Có | ID file Drive (max 128) |
| PublicId | string | Không | Public ID media (max 256) |
| Url | string | Không | URL ảnh (max 2048) |
| SortOrder | int | Không | Thứ tự hiển thị |

### 2.3. PostLikes

**Không** kế thừa `BaseEntity`. PK `(PostId, UserId)`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| PostId | Guid | Không | PK + FK → Posts |
| UserId | Guid | Không | PK + FK → AspNetUsers |
| CreatedAt | DateTime | Không | Thời điểm like |

### 2.4. Tags

Kế thừa `BaseEntity`. `Name` / `Slug` unique.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| Name | string | Không | Tên tag; unique (max 100) |
| Slug | string | Không | Slug URL; unique (max 120) |

### 2.5. PostTags

**Không** kế thừa `BaseEntity`. PK `(PostId, TagId)`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| PostId | Guid | Không | PK + FK → Posts |
| TagId | Guid | Không | PK + FK → Tags |

### 2.6. Comments

Kế thừa `BaseEntity` + soft delete. Hỗ trợ reply.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| PostId | Guid | Không | FK → Posts |
| AuthorId | Guid | Không | FK → AspNetUsers |
| ParentCommentId | Guid? | Có | FK → Comments (reply) |
| Content | string | Không | Nội dung (max 2000) |
| IsDeleted | bool | Không | Soft delete |
| DeletedAt | DateTime? | Có | Thời điểm xóa |
| DeletedById | Guid? | Có | FK người xóa |

### 2.7. UserFollows

**Không** kế thừa `BaseEntity`. PK `(FollowerId, FollowingId)`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| FollowerId | Guid | Không | PK + FK người follow |
| FollowingId | Guid | Không | PK + FK người được follow |
| CreatedAt | DateTime | Không | Thời điểm follow |

### 2.8. UserBlocks

**Không** kế thừa `BaseEntity`. PK `(BlockerId, BlockedUserId)`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| BlockerId | Guid | Không | PK + FK người chặn |
| BlockedUserId | Guid | Không | PK + FK người bị chặn |
| CreatedAt | DateTime | Không | Thời điểm chặn |

---

## 3. Exams & Practice

### 3.1. Exams

Kế thừa `BaseEntity`. `PaperCode` unique; `SubjectCode` FK → Subjects.Code.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| SubjectCode | string | Không | FK → Subjects.Code (max 20) |
| PaperCode | string | Không | Mã đề; unique (max 100) |
| ExamType | ExamType | Không | Loại đề |
| Status | ExamStatus | Không | Trạng thái duyệt/xuất bản |
| ContentHash | string | Không | Hash nội dung (max 64) |
| Description | string | Không | Mô tả (max 4000) |
| SubmittedById | Guid? | Có | FK người nộp đề |
| RevisionOfExamId | Guid? | Có | FK đề gốc (bản sửa) |
| RejectionReasonCode | string? | Có | Mã lý do từ chối (max 50) |
| RejectionReasonDetail | string? | Có | Chi tiết từ chối (max 2000) |
| RejectedAt | DateTime? | Có | Thời điểm từ chối |
| RejectedById | Guid? | Có | FK người từ chối |
| IsPinned | bool | Không | Ghim đề |
| PinnedAt | DateTime? | Có | Thời điểm ghim |

### 3.2. ExamAttachments

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| ExamId | Guid | Không | FK → Exams |
| DriveFileId | string | Không | ID file Drive (max 128) |
| OriginalFileName | string | Không | Tên file gốc (max 260) |
| ContentType | string | Không | MIME (max 128) |
| FileSize | long | Không | Kích thước bytes |

### 3.3. Questions

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| ExamId | Guid | Không | FK → Exams |
| OrderIndex | int | Không | Thứ tự câu |
| Content | string | Không | Nội dung câu (text) |
| QuestionType | QuestionType | Không | Single/Multi choice, … |
| RequiredSelectCount | int? | Có | Số đáp án cần chọn |
| CorrectOptionId | Guid? | Có | Đáp án đúng (single) |
| CorrectOptionIdsJson | string | Không | JSON danh sách đáp án đúng |

### 3.4. QuestionOptions

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| QuestionId | Guid | Không | FK → Questions |
| Label | string | Không | Nhãn A/B/C… (max 5) |
| Text | string | Không | Nội dung lựa chọn (text) |

### 3.5. QuestionAttachments

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| QuestionId | Guid | Không | FK → Questions |
| PublicId | string | Không | Public ID media (max 256) |
| Url | string | Không | URL đính kèm (max 1000) |
| SortOrder | int | Không | Thứ tự |

### 3.6. ExamAttempts

Kế thừa `BaseEntity`. Lượt làm trắc nghiệm.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK → AspNetUsers |
| ExamId | Guid | Không | FK → Exams |
| StartedAt | DateTime | Không | Bắt đầu làm |
| SubmittedAt | DateTime? | Có | Nộp bài |
| Score | decimal? | Có | Điểm (precision 5,2) |
| AnswersJson | string | Không | JSON đáp án (text) |
| Status | ExamAttemptStatus | Không | InProgress / Submitted… |

### 3.7. PracticeSubmissions

Kế thừa `BaseEntity`. Nộp bài practice (GitHub).

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK → AspNetUsers |
| ExamId | Guid | Không | FK → Exams |
| GitHubRepoUrl | string | Không | URL repo (max 500) |
| SubmittedAt | DateTime | Không | Thời điểm nộp |
| Status | PracticeSubmissionStatus | Không | Trạng thái review |
| ReviewerComment | string? | Có | Nhận xét (max 2000) |
| ReviewedById | Guid? | Có | FK reviewer |
| ReviewedAt | DateTime? | Có | Thời điểm review |
| IsLatest | bool | Không | Bản nộp mới nhất |

### 3.8. QuestionComments

Kế thừa `BaseEntity` + soft delete. Bình luận theo câu hỏi đề.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| ExamId | Guid | Không | FK → Exams |
| QuestionId | Guid | Không | FK → Questions |
| AuthorId | Guid | Không | FK → AspNetUsers |
| ParentCommentId | Guid? | Có | FK reply |
| Content | string | Không | Nội dung (max 2000) |
| IsDeleted | bool | Không | Soft delete |
| DeletedAt | DateTime? | Có | Thời điểm xóa |
| DeletedById | Guid? | Có | FK người xóa |

---

## 4. Documents & Subjects

### 4.1. Subjects

**Không** kế thừa `BaseEntity`. PK: `Code`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Code | string | Không | PK mã môn (max 20) |
| DisplayOrder | int | Không | Thứ tự hiển thị |
| Name | string | Không | Tên môn (max 200) |
| Semester | int | Không | Học kỳ |

### 4.2. DocumentCategories

Kế thừa `BaseEntity`. `SubjectCode` unique + FK → Subjects.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| Name | string | Không | Tên danh mục (max 200) |
| SubjectCode | string | Không | FK → Subjects.Code; unique |

### 4.3. Documents

Kế thừa `BaseEntity` + soft delete.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| CategoryId | Guid | Không | FK → DocumentCategories |
| Title | string | Không | Tiêu đề (max 200) |
| DriveFileId | string? | Có | ID file Drive (max 128) |
| OriginalFileName | string? | Có | Tên file gốc (max 260) |
| MimeType | string | Không | MIME (max 100) |
| PageCount | int | Không | Số trang |
| AccessTier | AccessTier | Không | Free / Premium… |
| IsDeleted | bool | Không | Soft delete |
| DeletedAt | DateTime? | Có | Thời điểm xóa |
| DeletedById | Guid? | Có | FK người xóa |

### 4.4. DocumentAccessLogs

Kế thừa `BaseEntity`. Log xem/tải tài liệu.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| DocumentId | Guid | Không | FK → Documents |
| UserId | Guid | Không | FK → AspNetUsers |
| Action | string | Không | Hành động (view/download…) max 50 |
| IpAddress | string? | Có | IP (max 64) |

---

## 5. Premium / Payments / Vouchers

### 5.1. SubscriptionPlans

Kế thừa `BaseEntity`. `Code` unique.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| Code | string | Không | Mã gói; unique (max 20) |
| Name | string | Không | Tên gói (max 100) |
| DurationDays | int | Không | Số ngày hiệu lực |
| PriceVnd | decimal | Không | Giá VND (precision 18,2) |

### 5.2. Subscriptions

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK → AspNetUsers |
| PlanId | Guid | Không | FK → SubscriptionPlans |
| StartAt | DateTime | Không | Bắt đầu |
| EndAt | DateTime | Không | Kết thúc |
| IsActive | bool | Không | Đang active |

### 5.3. PaymentOrders

Kế thừa `BaseEntity`. Đơn PayOS; `PayOsOrderCode` unique.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK → AspNetUsers |
| PlanId | Guid | Không | FK → SubscriptionPlans |
| PayOsOrderCode | string | Không | Mã đơn PayOS; unique (max 50) |
| Amount | decimal | Không | Số tiền thanh toán |
| OriginalAmount | decimal | Không | Giá gốc trước giảm |
| DiscountPercent | int? | Có | % giảm |
| DiscountSource | string? | Có | Nguồn giảm giá (max 50) |
| Status | PaymentOrderStatus | Không | Trạng thái đơn |
| QrUrl | string? | Có | URL QR (max 500) |
| ExpiredAt | DateTime | Không | Hết hạn thanh toán |
| PaidAt | DateTime? | Có | Thời điểm thanh toán |
| VerifiedAt | DateTime? | Có | Thời điểm xác minh |
| VerificationMethod | string? | Có | Webhook / Manual… (max 50) |
| WaitingConfirmationAt | DateTime? | Có | Chờ xác nhận |

### 5.4. PaymentAuditLogs

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| OrderId | Guid | Không | FK → PaymentOrders |
| Action | string | Không | Hành động audit (max 100) |
| ActorId | Guid? | Có | Người/hệ thống thực hiện |
| PayloadJson | string | Không | Payload (max 8000) |

### 5.5. RankRewardVouchers

Kế thừa `BaseEntity`. Voucher giảm giá theo rank.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK → AspNetUsers |
| LevelId | Guid | Không | FK → LevelConfigs |
| DiscountPercent | int | Không | % giảm |
| Status | VoucherStatus | Không | Active / Used… |
| ExpiresAt | DateTime | Không | Hết hạn |
| GrantedAt | DateTime | Không | Thời điểm cấp |

### 5.6. PartnerVoucherTypes

Kế thừa `BaseEntity`. Loại voucher đối tác; `Code` unique.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| Code | string | Không | Mã loại; unique (max 40) |
| Label | string | Không | Nhãn hiển thị (max 120) |
| DiscountPercent | int | Không | % giảm |
| ValidityDays | int | Không | Số ngày hiệu lực |
| PartnerName | string | Không | Tên đối tác (max 60) |

### 5.7. PartnerVoucherCodes

Kế thừa `BaseEntity`. Mã voucher cụ thể; `Code` unique.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| TypeId | Guid | Không | FK → PartnerVoucherTypes |
| Code | string | Không | Mã voucher; unique (max 120) |
| Status | PartnerVoucherStatus | Không | Available / Assigned… |
| AssignedUserId | Guid? | Có | FK user được gán |
| AssignedAt | DateTime? | Có | Thời điểm gán |
| PaymentOrderId | Guid? | Có | FK đơn TT; unique khi có |
| ImportedByAdminId | Guid? | Có | FK admin import |
| ImportedAt | DateTime | Không | Thời điểm import |
| ExpiresAt | DateTime? | Có | Hết hạn mã |

### 5.8. SubscriptionPlanPartnerRewards

Kế thừa `BaseEntity`. Map plan code → partner voucher type; `PlanCode` unique.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| PlanCode | string | Không | Mã gói; unique (max 20) |
| PartnerVoucherTypeCode | string | Không | Mã loại voucher (max 40) |

### 5.9. RewardRules

Kế thừa `BaseEntity`. Rule cấp voucher theo level.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| LevelId | Guid | Không | FK → LevelConfigs |
| DiscountPercent | int | Không | % giảm khi lên rank |
| ExpiryDays | int | Không | Số ngày hết hạn voucher |
| OneTimeOnly | bool | Không | Chỉ cấp một lần |
| IsActive | bool | Không | Rule đang bật |

---

## 6. Gamification

### 6.1. LevelConfigs

Kế thừa `BaseEntity`. Cấu hình rank/điểm.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| Name | string | Không | Tên rank (max 50) |
| MinPoints | int | Không | Điểm tối thiểu |
| SortOrder | int | Không | Thứ tự |
| VoucherPercent | int? | Có | % voucher gắn rank |

### 6.2. Badges

Kế thừa `BaseEntity`. `Code` unique.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| Code | string | Không | Mã badge; unique (max 50) |
| Name | string | Không | Tên badge (max 100) |
| ConditionJson | string | Không | Điều kiện JSON (max 2000) |

### 6.3. UserBadges

**Không** kế thừa `BaseEntity`. PK `(UserId, BadgeId)`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| UserId | Guid | Không | PK + FK → AspNetUsers |
| BadgeId | Guid | Không | PK + FK → Badges |
| EarnedAt | DateTime | Không | Thời điểm nhận |

### 6.4. PointRules

Kế thừa `BaseEntity`. `Code` unique.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| Code | string | Không | Mã rule; unique (max 64) |
| EventType | string | Không | Loại sự kiện (max 64) |
| Points | int | Không | Điểm cộng/trừ |
| IsActive | bool | Không | Rule đang bật |
| MetadataJson | string? | Có | Metadata bổ sung |
| Description | string? | Có | Mô tả (max 256) |

### 6.5. PointTransactions

Kế thừa `BaseEntity`. `IdempotencyKey` unique.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK → AspNetUsers |
| RuleCode | string | Không | Mã rule áp dụng (max 64) |
| Amount | int | Không | Số điểm |
| IdempotencyKey | string | Không | Chống ghi đúp; unique |
| SourceType | string | Không | Loại nguồn (max 64) |
| SourceId | Guid? | Có | ID nguồn (post, exam…) |
| Status | PointTransactionStatus | Không | Posted / Reversed… |
| MetadataJson | string? | Có | Metadata |

### 6.6. GamificationEventInbox

**Không** kế thừa `BaseEntity`. PK: `IdempotencyKey`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| IdempotencyKey | string | Không | PK; khóa idempotent (max 256) |
| EventType | string | Không | Loại sự kiện (max 64) |
| PayloadJson | string | Không | Payload sự kiện |
| ProcessedAt | DateTime | Không | Thời điểm xử lý |
| Result | string | Không | Kết quả xử lý (max 64) |

### 6.7. UserLevelHistories

Kế thừa `BaseEntity`. Lịch sử lên rank.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK → AspNetUsers |
| LevelId | Guid | Không | FK → LevelConfigs |
| PointsAtPromotion | int | Không | Điểm lúc lên rank |
| PromotedAt | DateTime | Không | Thời điểm lên rank |

### 6.8. DailyMissions

Kế thừa `BaseEntity`. `Code` unique.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| Code | string | Không | Mã nhiệm vụ; unique (max 64) |
| Name | string | Không | Tên (max 128) |
| EventType | string | Không | Event cần đạt (max 64) |
| TargetCount | int | Không | Số lần cần hoàn thành |
| RewardPoints | int | Không | Điểm thưởng |
| IsActive | bool | Không | Đang bật |

### 6.9. WeeklyMissions

Kế thừa `BaseEntity`. `Code` unique.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| Code | string | Không | Mã nhiệm vụ; unique (max 64) |
| Name | string | Không | Tên (max 128) |
| EventType | string | Không | Event cần đạt (max 64) |
| TargetCount | int | Không | Số lần cần hoàn thành |
| RewardPoints | int | Không | Điểm thưởng |
| IsActive | bool | Không | Đang bật |

### 6.10. UserMissionProgress

**Không** kế thừa `BaseEntity`. PK `(UserId, MissionCode, PeriodKey)`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| UserId | Guid | Không | PK + FK → AspNetUsers |
| MissionCode | string | Không | PK; mã mission (max 64) |
| PeriodKey | string | Không | PK; kỳ (ngày/tuần) max 32 |
| ProgressCount | int | Không | Tiến độ hiện tại |
| CompletedAt | DateTime? | Có | Thời điểm hoàn thành |
| ClaimedAt | DateTime? | Có | Thời điểm nhận thưởng |
| UpdatedAt | DateTime | Không | Cập nhật gần nhất |

---

## 7. AI Chatbot & Exam AI

### 7.1. ChatbotSettings

Kế thừa `BaseEntity`. Cấu hình chatbot hệ thống.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| SystemPrompt | string | Không | System prompt (max 4000) |
| WelcomeMessage | string | Không | Tin chào (max 1000) |
| IsEnabled | bool | Không | Bật/tắt chatbot |

### 7.2. ChatbotKnowledgeEntries

Kế thừa `BaseEntity`. Knowledge base.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| Title | string | Không | Tiêu đề (max 200) |
| Content | string | Không | Nội dung KB (max 8000) |
| Tags | string? | Có | Tag (max 500) |
| IsActive | bool | Không | Đang dùng |
| SortOrder | int | Không | Thứ tự |

### 7.3. ChatbotConversations

Kế thừa `BaseEntity`. Hội thoại chatbot theo user.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK → AspNetUsers |
| Title | string | Không | Tiêu đề hội thoại (max 200) |

### 7.4. ChatbotMessages

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| ConversationId | Guid | Không | FK → ChatbotConversations |
| Role | string | Không | user / assistant (max 20) |
| Content | string | Không | Nội dung tin (max 8000) |

### 7.5. AiExamChatThreads

Kế thừa `BaseEntity`. Unique `(UserId, ExamId, QuestionId)`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK → AspNetUsers |
| ExamId | Guid | Không | FK → Exams |
| QuestionId | Guid | Không | FK → Questions |

### 7.6. AiExamChatMessages

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| ThreadId | Guid | Không | FK → AiExamChatThreads |
| Role | string | Không | user / assistant (max 20) |
| Content | string | Không | Nội dung (max 8000) |

### 7.7. AiTokenDailyUsages

Kế thừa `BaseEntity`. Unique `(UserId, UsageDate)`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK → AspNetUsers |
| UsageDate | DateOnly | Không | Ngày dùng token |
| TokensConsumed | int | Không | Tổng token đã dùng |

---

## 8. Chat DM

### 8.1. Conversations

Kế thừa `BaseEntity`. Hội thoại 1–1 / nhóm DM.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| LastMessageAt | DateTime? | Có | Thời điểm tin cuối |
| LastMessagePreview | string? | Có | Preview tin cuối (max 500) |

### 8.2. ConversationParticipants

**Không** kế thừa `BaseEntity`. PK `(ConversationId, UserId)`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| ConversationId | Guid | Không | PK + FK → Conversations |
| UserId | Guid | Không | PK + FK → AspNetUsers |
| JoinedAt | DateTime | Không | Thời điểm tham gia |
| LastReadAt | DateTime? | Có | Đã đọc tới |
| HistoryClearedAt | DateTime? | Có | Xóa lịch sử phía user |

### 8.3. Messages

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| ConversationId | Guid | Không | FK → Conversations |
| SenderId | Guid | Không | FK → AspNetUsers |
| Content | string | Không | Nội dung text (max 4000) |
| MessageType | MessageType | Không | Text / Attachment… (string max 16) |
| AttachmentPath | string? | Có | Đường dẫn file (max 500) |
| AttachmentPublicId | string? | Có | Public ID (max 256) |
| AttachmentFileName | string? | Có | Tên file (max 260) |
| AttachmentMimeType | string? | Có | MIME (max 128) |
| AttachmentSizeBytes | long? | Có | Kích thước file |
| SentAt | DateTime | Không | Thời điểm gửi |

---

## 9. Moderation

### 9.1. PostReports

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| PostId | Guid | Không | FK → Posts |
| ReporterId | Guid | Không | FK người báo cáo |
| Reason | string | Không | Lý do (max 1000) |
| Status | ReportStatus | Không | Pending / Resolved… |
| ResolvedById | Guid? | Có | FK người xử lý |

### 9.2. CommentReports

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| PostId | Guid | Không | FK → Posts |
| CommentId | Guid | Không | FK → Comments |
| ReporterId | Guid | Không | FK người báo cáo |
| Reason | string | Không | Lý do (max 200) |
| Detail | string | Không | Chi tiết (max 2000) |
| Status | ReportStatus | Không | Trạng thái |
| ResolvedById | Guid? | Có | FK người xử lý |
| ResolutionNote | string? | Có | Ghi chú xử lý (max 2000) |

### 9.3. QuestionReports

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| QuestionId | Guid | Không | FK → Questions |
| ExamId | Guid | Không | FK → Exams |
| ReporterId | Guid | Không | FK người báo cáo |
| Reason | string | Không | Lý do (max 64) |
| Detail | string | Không | Chi tiết (max 2000) |
| Status | ReportStatus | Không | Trạng thái |
| ResolvedById | Guid? | Có | FK người xử lý |
| ResolutionNote | string? | Có | Ghi chú xử lý (max 2000) |

### 9.4. UserReports

Kế thừa `BaseEntity`. Báo cáo user (context theo `Source`).

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| ReportedUserId | Guid | Không | FK user bị báo |
| ReporterId | Guid | Không | FK người báo |
| Source | UserReportSource | Không | Nguồn (Post / ExamComment / Direct…) |
| PostId | Guid? | Có | FK post (nếu từ feed) |
| ExamId | Guid? | Có | FK exam (nếu từ đề) |
| QuestionId | Guid? | Có | FK câu hỏi |
| QuestionCommentId | Guid? | Có | FK bình luận câu hỏi |
| Reason | string | Không | Lý do (max 200) |
| Detail | string | Không | Chi tiết (max 2000) |
| Status | ReportStatus | Không | Trạng thái |
| ResolvedById | Guid? | Có | FK người xử lý |
| ResolutionNote | string? | Có | Ghi chú xử lý (max 2000) |

### 9.5. ConversationReports

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| ConversationId | Guid | Không | FK → Conversations |
| ReporterId | Guid | Không | FK người báo |
| Reason | string | Không | Lý do (max 200) |
| Detail | string | Không | Chi tiết (max 2000) |
| Status | ReportStatus | Không | Trạng thái (int) |
| ResolvedById | Guid? | Có | FK người xử lý |
| ResolutionNote | string? | Có | Ghi chú (max 500) |

### 9.6. UserBans

Kế thừa `BaseEntity`. Lịch sử cấm tài khoản.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK user bị cấm |
| ActorId | Guid | Không | FK admin thực hiện |
| BanType | BanType | Không | Temporary / Permanent… |
| Until | DateTime? | Có | Hết hạn cấm |
| Reason | string | Không | Lý do (max 1000) |

### 9.7. ViolationEscalations

Kế thừa `BaseEntity`. **Deprecated** — không còn nguồn trang Vi phạm (list chỉ `UserBans`). API escalate còn giữ tạm; drop bảng theo PR follow-up.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK user bị leo thang |
| SourceReportId | Guid | Không | ID báo cáo nguồn |
| SourceType | string | Không | Loại nguồn (max 64) |
| Reason | string | Không | Lý do (max 1000) |
| EscalatedById | Guid | Không | FK người leo thang |

---

## 10. Notifications

### 10.1. UserNotifications

Kế thừa `BaseEntity`.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid | Không | FK người nhận |
| Type | NotificationType | Không | Loại thông báo (string max 32) |
| Title | string | Không | Tiêu đề (max 500) |
| Body | string? | Có | Nội dung (max 2000) |
| LinkUrl | string? | Có | Deep link (max 500) |
| ActorUserId | Guid? | Có | User gây ra sự kiện |
| ReferenceId | Guid? | Có | ID đối tượng liên quan |
| IsRead | bool | Không | Đã đọc |
| ReadAt | DateTime? | Có | Thời điểm đọc |

---

## 11. Feedback

### 11.1. UserFeedbacks

Kế thừa `BaseEntity`. Phản hồi người dùng về sản phẩm.

| Cột | Kiểu (C#) | Null? | Ghi chú (PK/FK/ý nghĩa) |
|---|---|---|---|
| Id | Guid | Không | PK |
| CreatedAt | DateTime | Không | Thời điểm tạo |
| UpdatedAt | DateTime? | Có | Thời điểm cập nhật |
| UserId | Guid? | Có | FK user (nullable nếu guest) |
| Username | string | Không | Tên hiển thị lúc gửi (max 100) |
| Description | string | Không | Nội dung góp ý (max 4000) |
| Status | FeedbackStatus | Không | Trạng thái xử lý |
| AttachmentUrlsJson | string | Không | JSON URL ảnh đính kèm |

---

## Phụ lục — Entity không kế thừa BaseEntity

| Bảng | Khóa chính thực tế |
|---|---|
| PostLikes | `(PostId, UserId)` |
| PostTags | `(PostId, TagId)` |
| UserFollows | `(FollowerId, FollowingId)` |
| UserBlocks | `(BlockerId, BlockedUserId)` |
| UserBadges | `(UserId, BadgeId)` |
| UserMissionProgress | `(UserId, MissionCode, PeriodKey)` |
| UserDailyActivities | `(UserId, ActivityDate)` |
| ConversationParticipants | `(ConversationId, UserId)` |
| GamificationEventInboxes | `IdempotencyKey` |
| Subjects | `Code` |

---

*Tạo từ EF Code First SEHUB — Jul 2026. Không bao gồm `PaymentVerificationMethods`.*
