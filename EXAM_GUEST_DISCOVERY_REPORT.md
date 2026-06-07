# Exam Guest Discovery Report

**Date:** 2026-06-05  
**Method:** CodeGraph + Business Analysis + BE/FE source audit  
**Status:** Analysis only — no code changes

---

## 1. Business Requirement — Guest Discovery Flow

```
Landing Page
    ↓
Browse Exams          GET /api/v1/exams
    ↓
View Exam Details     GET /api/v1/exams/{id}
    ↓
See Locked Content    Preview (Option A or B)
    ↓
CTA                   "Đăng nhập / Đăng ký để làm bài"
```

**Guest must understand before signup:**

| Discovery goal | BA source (`SEHUB_PhanTichNghiepVu.md` §2.1) |
|----------------|-----------------------------------------------|
| What the exam is | Title, description, type |
| Number of questions | `questionCount` |
| Difficulty | Not in current model |
| Duration | Not in current model |
| Category | Partially via `major`, `examType` |
| Benefits of taking exam | FE marketing copy + Premium CTA |

> BA luồng: *"Vào trang → Xem feed/đề thi → Thấy nội dung bị khóa → CTA đăng ký tài khoản."*

---

## 2. CodeGraph Symbol Map

| Symbol | Layer | File |
|--------|-------|------|
| `ExamsController` | API | `Controllers/ExamsController.cs` |
| `ExamQueryService` | Application | `Exams/ExamQueryService.cs` |
| `ExamAttemptService` | Application | `Exams/ExamAttemptService.cs` |
| `IExamQueryService` | Application | `Exams/IExamQueryService.cs` |
| `Exam` | Domain | `Entities/Exam.cs` |
| `Question` | Domain | `Entities/Question.cs` |
| `QuestionOption` | Domain | `Entities/QuestionOption.cs` |
| `ExamAttempt` | Domain | `Entities/ExamAttempt.cs` |
| `ExamListItemDto` | Contracts | `Contracts/Exams/ExamListItemDto.cs` |
| `ExamDetailDto` | Contracts | `Contracts/Exams/ExamDetailDto.cs` |
| `QuestionPublicDto` | Contracts | `Contracts/Exams/QuestionPublicDto.cs` |
| `ExamDetailPage` | FE | `features/exams/ExamDetailPage/ExamDetailPage.jsx` |

**Not found in codebase:** `ExamGuestDto`, `ExamGuestDetailDto`, `ExamService` (uses `ExamQueryService`), dedicated preview endpoint.

---

## 3. Guest-Visible Fields vs Locked Fields

### 3.1 Target contract (`ExamGuestDto` / `ExamGuestDetailDto` — proposed)

| Field | Guest CAN see | Current BE | Current FE |
|-------|---------------|------------|------------|
| `id` | ✅ | ✅ `ExamListItemDto` | ✅ mock `exam.id` |
| `title` | ✅ | ✅ | ✅ |
| `description` | ✅ | ✅ detail only | ⚠️ partial |
| `category` | ✅ | ❌ (use `major`/`examType` proxy) | ❌ |
| `difficulty` | ✅ | ❌ not in `Exam` entity | ❌ |
| `durationMinutes` | ✅ | ❌ not in entity | ❌ (hardcoded 30/45 min in FE do page) |
| `questionCount` | ✅ | ✅ | ✅ |
| `createdAt` | ✅ | ❌ not in public DTO | ❌ |
| `tags` | ✅ | ❌ not in entity | ❌ |
| `examType` | ✅ (discovery) | ✅ | ✅ |
| `code` / subject | ✅ | ✅ `code`, `major` | ✅ `courseCode` |
| `semester` | ✅ (filter) | ✅ | ✅ FE filter |
| `benefitsCopy` | ✅ (UI) | N/A — static FE | ❌ |
| `totalAttempts` | ✅ (social proof) | ❌ | ❌ |

### 3.2 Locked fields (Guest MUST NOT see)

| Field / data | Entity / DTO | Currently exposed to Guest? |
|--------------|--------------|---------------------------|
| Full question list | `QuestionPublicDto[]` via `GET .../questions` | **YES — FAIL** |
| Question text | `Question.Content` | **YES** |
| Option text | `QuestionOption.Text` | **YES** |
| Correct answer | `Question.CorrectOptionId` | No (not in `QuestionPublicDto`) |
| Attempt data | `ExamAttemptDto` | No (Premium) |
| Submission data | `PracticeSubmissionDto` | No (Premium) |
| Results / scores | `ExamResultDto` | No (Premium) |
| AI solutions | `AiExplainResponse` | No (Auth) |

---

## 4. Guest API Access (Current)

| Endpoint | Policy | Purpose for Guest | Discovery fit |
|----------|--------|-------------------|---------------|
| `GET /api/v1/exams` | AllowAnonymous | Browse + filter | ✅ **Required** |
| `GET /api/v1/exams/{id}` | AllowAnonymous | Detail metadata | ✅ **Required** |
| `GET /api/v1/exams/{id}/questions` | AllowAnonymous | Full question bank | ❌ **Over-exposes** (not preview-safe) |

**Filter support (browse):**

| Param | Supported | Maps to discovery |
|-------|-----------|-------------------|
| `type` | ✅ Final / Practice | Category |
| `semester` | ✅ | Academic term |
| `major` | ✅ | Subject area |
| `page`, `pageSize` | ✅ | Pagination |
| `search` | ❌ | Text search missing |

---

## 5. Preview Mode Analysis

Business allows **Option A** OR **Option B**:

### Option A — First question only

| Aspect | Assessment |
|--------|------------|
| BE | Needs new endpoint e.g. `GET /exams/{id}/preview` returning **one** `QuestionPreviewDto` (content + options, **no** `correctOptionId`) |
| Security | Guest sees 1/N questions — acceptable teaser |
| Student Free | Full list via `GET /questions` with `RequireAuthenticated` |

### Option B — Placeholder cards (recommended for Guest)

| Aspect | Assessment |
|--------|------------|
| BE | `ExamGuestDetailDto` includes `questionSlots: [{ index, locked: true }]` — **no API call for content** |
| FE | Render card 1 visible teaser OR all locked placeholders |
| Security | Safest — zero content leak from API |

### Current implementation vs target

| Mode | Current BE | Current FE |
|------|------------|------------|
| Option A | Returns **all** questions anonymously | Shows Q1 + navigates all via mock |
| Option B | Not implemented | Partial overlay on Q1 only; Q2+ still navigable with full text |

**Recommendation:** Implement **Option B on FE immediately** (no BE dependency); add **Option A** via dedicated preview endpoint later if product wants a real teaser question.

---

## 6. Authorization Matrix (Target)

| Action | Guest | Free Student | Premium |
|--------|-------|--------------|---------|
| Browse exams | ✅ | ✅ | ✅ |
| View detail metadata | ✅ | ✅ | ✅ |
| Preview (1 Q or placeholders) | ✅ | ✅ | ✅ |
| Full question list | ❌ | ✅ (no answers) | ✅ |
| View correct answers | ❌ | ❌ | ✅ |
| Start / submit exam | ❌ | ❌ | ✅ |
| View results | ❌ | ❌ | ✅ |

---

## 7. Frontend Guest Flow (Current)

| Step | Route | Component | Wired to API? | Discovery UX |
|------|-------|-----------|---------------|--------------|
| Landing | `/` | `LandingPage` | ❌ | ✅ Marketing features |
| Browse catalog | `/community/final-exam` | `ReviewQuestionsPage` → `CourseCatalogPage` | ❌ mock | ⚠️ No real exams |
| Browse by subject | `/community/final-exam/:courseCode` | `SubjectDetailPage` | ❌ mock | ⚠️ Click requires login |
| Exam detail | `/community/final-exam/:courseCode/:examId` | `ExamDetailPage` | ❌ mock | **FAIL** — shows full Q&A |
| Start exam | `.../do` | `ExamDoPage` | — | ✅ `PremiumRoute` blocks |

### FE gaps vs requirement

| Requirement | Current | Gap |
|-------------|---------|-----|
| Show title, description, difficulty, duration, question count | Partial metadata card | Missing difficulty, duration |
| Lock banner *"Đăng nhập để làm bài..."* | Premium overlay only | Wrong message for Guest |
| Login / Register buttons | Link to `/home/premium` | Should be `/login`, `/register` |
| Start Exam → `/login` for Guest | `requirePremium()` | Should `requireAuth()` first |
| Preview Option B locked cards | Not implemented | All mock questions visible |
| Guest can open detail without login | ✅ public route | Good for discovery |
| `SubjectDetailPage` blocks list click | `requireAuth` on click | **Blocks browse → detail** for Guest |

**Discovery conflict:** `SubjectDetailPage.handleExamClick` requires login **before** viewing detail — contradicts Guest discovery flow that should allow **View Exam Details** without auth.

---

## 8. Proposed Backend DTOs (not yet implemented)

### `ExamGuestDto` (list item)

```csharp
public sealed class ExamGuestDto
{
    public Guid Id { get; init; }
    public string Title { get; init; }
    public string? Description { get; init; }
    public string Category { get; init; }      // map from ExamType or new field
    public string? Difficulty { get; init; }   // new field
    public int DurationMinutes { get; init; }  // new field
    public int QuestionCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public IReadOnlyList<string> Tags { get; init; }
    public string Code { get; init; }
    public string? Major { get; init; }
}
```

### `ExamGuestDetailDto` (detail + preview slots)

```csharp
public sealed class ExamGuestDetailDto : ExamGuestDto
{
    public string? AssetUrl { get; init; }     // practice exam template link
    public IReadOnlyList<ExamQuestionSlotDto> QuestionSlots { get; init; }
}

public sealed class ExamQuestionSlotDto
{
    public int Index { get; init; }
    public bool IsLocked { get; init; }
    public QuestionPreviewDto? Preview { get; init; }  // null when locked; Option A only for index 1
}
```

Use **separate DTOs** — do not reuse `QuestionPublicDto` on Guest endpoints to prevent accidental full-bank exposure.

---

## 9. Security Validation (Discovery lens)

| Check | Result |
|-------|--------|
| Guest can discover exam value (metadata) | **PARTIAL** — missing duration, difficulty, tags |
| Guest sees locked content pattern | **FAIL** — full questions via BE + FE mock |
| Guest CTA drives login/register | **FAIL** — Premium CTA instead |
| Guest cannot start/submit/view results | **PASS** on API; **PASS** on FE `/do` routes |
| No `ExamGuestDto` separation | **FAIL** — reuses generic DTOs + leaks via `/questions` |

---

## 10. Required Changes Summary

### Backend

1. Add `ExamGuestDto`, `ExamGuestDetailDto`, `ExamQuestionSlotDto`.
2. Map `GET /exams` and `GET /exams/{id}` to guest DTOs (or enrich existing DTOs with new fields).
3. Add entity fields: `DurationMinutes`, `Difficulty`, `Tags` (or JSON column).
4. **Remove or restrict** `GET /exams/{id}/questions` for Guest → `RequireAuthenticated`.
5. Optional: `GET /exams/{id}/preview` for Option A (single question, no answer).
6. Add `GET /exams?search=` for discovery search.
7. Integration tests for Guest discovery contract.

### Frontend

1. Create `examsApi.js` — `getExams`, `getExamById` for Guest.
2. **Remove login gate** on `SubjectDetailPage` exam list click (Guest can view detail).
3. `ExamDetailPage` Guest mode:
   - Metadata header (title, description, difficulty, duration, question count)
   - Lock banner + Đăng nhập / Đăng ký buttons
   - Option B placeholder cards for Q2…N
4. `handleStartExam`: Guest → `navigate('/login')`; authenticated Free → Premium upsell.
5. Wire `ReviewQuestionsPage` / `SubjectDetailPage` to API.

---

## 11. Build Compatibility

```
dotnet build SEHub.Application → SUCCESS (0 errors, NU1903 AutoMapper warning only)
```

No code modified in this analysis — build confirms current codebase compiles.

---

## 12. Verdict

| Dimension | Score |
|-----------|-------|
| Guest browse API | **PARTIAL** |
| Guest detail API | **PARTIAL** |
| Preview mode | **FAIL** |
| Discovery FE flow | **FAIL** |
| CTA / login redirect | **FAIL** |
| Attempt/result lock | **PASS** |

**Guest discovery readiness: 35/100** — APIs exist for list/detail but metadata incomplete; preview and FE flow contradict discovery requirements.
