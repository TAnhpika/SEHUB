# Exam Guest Security Audit

**Date:** 2026-06-05  
**Method:** CodeGraph symbol index + source audit (no code changes)  
**Scope:** Guest exam access — metadata only, no question/content leakage

---

## Business Requirement Summary

| Guest **CAN** | Guest **CANNOT** |
|---------------|------------------|
| Exam list | Questions, options, correct answers |
| Exam metadata (title, description, subject, duration, question count, type, …) | Exam content, attempts, results, solutions |
| Search / filter exams | Start / submit exam |

**Source documents:**

- `SEHUB_PhanTichNghiepVu.md` §2.1 — Guest: *"Chỉ xem metadata – không làm bài"*
- `BACKEND_DEMO_GUEST_AUTH.md` — Demo flow documents guest exam browse
- `BUSINESS_RULE_AUDIT.md` — Exam rules (mask answers, Premium attempts)

> **BA inconsistency:** `SEHUB_PhanTichNghiepVu.md` §6 matrix row 358 lists Guest ✅ for *"Xem câu hỏi (không đáp án)"*, while §2.1 says metadata only. **This audit follows the stricter requirement** (Guest = metadata only, no question text).

---

## CodeGraph Evidence

Indexed nodes (`.codegraph/codegraph.db`):

| Symbol | File |
|--------|------|
| `ExamsController` (public) | `SEHub.API/Controllers/ExamsController.cs` |
| `ExamsController` (admin) | `SEHub.API/Controllers/Admin/ExamsController.cs` |
| `ExamQueryService` | `SEHub.Application/Exams/ExamQueryService.cs` |
| `GetQuestionsAsync` | `ExamQueryService.cs` + `IExamQueryService.cs` |
| `PracticeSubmissionsController` | `SEHub.API/Controllers/PracticeSubmissionsController.cs` |

Call chain (public read path):

```
GET /api/v1/exams
  → ExamsController.GetExams
  → ExamQueryService.GetExamsAsync
  → ExamRepository.GetPagedAsync (Published only)

GET /api/v1/exams/{id}
  → ExamsController.GetById
  → ExamQueryService.GetByIdAsync (Published guard)

GET /api/v1/exams/{id}/questions  ⚠️
  → ExamsController.GetQuestions [AllowAnonymous]
  → ExamQueryService.GetQuestionsAsync
  → maps Question.Content + QuestionOption.Text → QuestionPublicDto
```

---

## 1. Endpoints That Expose Question Data

| Endpoint | Auth | Exposes question text? | Exposes options? | Exposes correct answer? |
|----------|------|------------------------|------------------|-------------------------|
| `GET /api/v1/exams/{id}/questions` | **AllowAnonymous** | ✅ `Content` | ✅ `Options[].Text` | ❌ (no `CorrectOptionId`) |
| `GET /api/v1/exams/{id}/questions/{qid}` | RequirePremium | ✅ | ✅ | ✅ `CorrectOptionId` |
| `GET /api/v1/exams/{id}/attempts/{id}/result` | RequirePremium | Indirect via `ExamResultAnswerDto` | — | ✅ `CorrectOptionId` |
| `GET /api/v1/admin/exams/{id}` | RequireModerator | ✅ full | ✅ full | ✅ `CorrectOptionId` |
| `POST /api/v1/admin/exams/ocr` | RequireAdmin | ✅ parsed OCR output | ✅ | ✅ (draft) |
| `POST /api/v1/exams/questions/{id}/ai-explain` | RequireAuthenticated | Solution text in `AiExplainResponse` | — | — |

**Critical finding:** `GET /api/v1/exams/{id}/questions` is the **only public (Guest-accessible) endpoint** that leaks exam content.

---

## 2. DTOs — Content Exposure Matrix

### Safe for Guest (metadata only)

| DTO | Fields | Safe? |
|-----|--------|-------|
| `ExamListItemDto` | `id`, `code`, `title`, `examType`, `semester`, `major`, `questionCount`, `status` | ✅ |
| `ExamDetailDto` | above + `description`, `assetUrl` | ✅ (no questions) |
| `ExamQueryParams` | `type`, `semester`, `major`, `page`, `pageSize` | ✅ (filter only) |

### Unsafe if returned to Guest

| DTO | Leaking fields |
|-----|----------------|
| `QuestionPublicDto` | `content`, `options[].label`, `options[].text` |
| `QuestionAnswerDto` | above + `correctOptionId` |
| `QuestionOptionDto` | `label`, `text` |
| `ExamAttemptDto` | `answers` (selected options) |
| `ExamResultDto` | `answers[].correctOptionId`, `isCorrect` |
| `ExamResultAnswerDto` | `correctOptionId` |
| `AdminExamDto` / `AdminExamQuestionDto` | full question bank + answers |
| `AiExplainResponse` | `explanation` (solution) |
| `PracticeSubmissionDto` | submission content (Premium only) |

### Domain entities (never serialized directly to Guest)

| Entity | Sensitive fields |
|--------|------------------|
| `Question` | `Content`, `CorrectOptionId` |
| `QuestionOption` | `Text` |
| `ExamAttempt` | `AnswersJson`, `Score` |

---

## 3. Guest-Accessible Endpoints (Public `ExamsController`)

| Endpoint | Current policy | Returns metadata only? | Verdict |
|----------|----------------|------------------------|---------|
| `GET /api/v1/exams` | AllowAnonymous | ✅ Published list | **PASS** |
| `GET /api/v1/exams/{id}` | AllowAnonymous | ✅ No questions embedded | **PASS** |
| `GET /api/v1/exams/{id}/questions` | AllowAnonymous | ❌ Full question bank | **FAIL** |

Filter/search support on list:

| Capability | BE support | Notes |
|------------|--------------|-------|
| Filter by type | ✅ `?type=Final\|Practice` | |
| Filter by semester | ✅ `?semester=` | |
| Filter by major | ✅ `?major=` | |
| Pagination | ✅ `page`, `pageSize` | |
| Full-text search | ❌ | No `search` query param |

---

## 4. Metadata Gap vs Business Spec

Required Guest metadata (from requirement) vs `ExamListItemDto` / `ExamDetailDto`:

| Field | Required | In DTO / Entity | Status |
|-------|----------|-----------------|--------|
| Exam Title | ✅ | `title` | ✅ |
| Description | ✅ | `description` (detail only) | ⚠️ not in list |
| Subject / Course Code | ✅ | `code`, `major` | ⚠️ partial |
| Category | ✅ | — | ❌ missing |
| Difficulty | ✅ | — | ❌ missing |
| Duration (minutes) | ✅ | — | ❌ missing in `Exam` entity |
| Total Questions | ✅ | `questionCount` | ✅ |
| Exam Type | ✅ | `examType` | ✅ |
| Created Date | ✅ | entity `CreatedAt` | ❌ not in public DTO |
| Author | optional | — | ❌ missing |
| Total Attempts / Views | ✅ | — | ❌ not computed |

---

## 5. Authorization Policies

| Policy | Definition | Used for exams |
|--------|------------|----------------|
| `AllowAnonymous` | No JWT | List, detail, **questions (FAIL)** |
| `RequireAuthenticated` | Valid JWT | AI explain |
| `RequirePremium` | JWT + active subscription | Answers, attempts, results, practice submit |
| `RequireModerator` | Mod/Admin role | Admin exam CRUD, practice review queue |
| `RequireAdmin` | Admin role | Exam update, OCR, approve |

`ExamQueryService.ShouldMaskAnswers()` exists but **`maskAnswers` is never used** in `GetQuestionsAsync` — answers are omitted from `QuestionPublicDto` by DTO shape, not by masking logic.

`GetQuestionsAsync` does **not** verify `exam.Status == Published` (unlike `GetByIdAsync`).

---

## 6. Frontend Exam / Guest Pages

| Page | Route (Guest) | Data source | Shows question content? |
|------|---------------|-------------|-------------------------|
| `ReviewQuestionsPage` | `/community/final-exam` | `reviewData.js` mock | ❌ catalog only |
| `PracticeQuestionsPage` | `/community/pratical-exam` | mock | ❌ catalog only |
| `SubjectDetailPage` | `/community/.../ :courseCode` | `subjectDetailData.js` mock | ❌ list only; click requires login |
| `ExamDetailPage` | `/community/.../:examId` | **mock** `buildExamQuestions()` | **✅ YES** — question text + options rendered |
| `ExamDoPage` | `/community/.../do` | behind `PremiumRoute` | ✅ blocked |
| `ExamResultPage` | `/community/.../result` | behind `PremiumRoute` | ✅ blocked |

**No `examsApi.js`** — FE does not call `/api/v1/exams` yet.

**FE security issues:**

1. `ExamDetailPage` on **community routes is public** (no `PrivateRoute`) — Guest can open URL directly.
2. Review exam preview shows **full question text** even when `!canUsePremiumFeatures` (only answers overlay hidden).
3. `handleStartExam` calls `requirePremium()` — message says *"Premium để làm bài"*, not *"Please login"* for unauthenticated Guest.
4. `SubjectDetailPage.handleExamClick` blocks navigation with login toast — **good**, but bypassable via direct URL.

---

## 7. Service Layer Summary

| Service | Guest-relevant behavior |
|---------|-------------------------|
| `ExamQueryService` | List/detail safe; `GetQuestionsAsync` leaks content |
| `ExamAttemptService` | Premium-gated (safe for Guest) |
| `ExamGradingService` | Internal on submit |
| `PracticeSubmissionService` | Premium-gated |
| `AdminExamService` | Moderator+ only |
| `AiExplanationApplicationService` | Auth required |

---

## 8. Security Score

| Area | Score |
|------|-------|
| Attempt / result / answer endpoints | **PASS** (Premium-gated) |
| Admin / OCR endpoints | **PASS** (role-gated) |
| Guest list + detail metadata | **PASS** (content-safe, incomplete metadata) |
| Guest question access | **FAIL** |
| FE Guest exam pages | **FAIL** (mock content visible) |
| Metadata completeness | **PARTIAL** |

**Overall Guest exam security: FAIL** — one public API endpoint + public FE page leak question content.

---

## Required Backend Changes

1. **`GET /api/v1/exams/{id}/questions`** → change to `[Authorize(Policy = RequireAuthenticated)]`  
   - Aligns Guest ❌ / Free Student ✅ per original BA matrix, OR `RequirePremium` if only Premium may preview questions.
2. **`GetQuestionsAsync`** → add `exam.Status == Published` check (parity with `GetByIdAsync`).
3. **Extend metadata DTOs** → add `durationMinutes`, `createdAt`, `totalAttempts` (computed), optional `subjectCode`, `difficulty`, `category`.
4. **Add `search` query** on `GET /exams` if product requires text search.
5. **Integration tests** → `GetQuestions_WithoutToken_Returns401`, `GetExams_WithoutToken_ReturnsOk`.
6. **Update `BACKEND_DEMO_GUEST_AUTH.md`** — remove Guest ✅ for `/questions` (currently documents Guest can call it).

## Required Frontend Changes

1. **Create `examsApi.js`** — `getExams`, `getExamById` only for Guest; no `getQuestions` without auth.
2. **`ExamDetailPage` (Guest / community)** — metadata card only; hide question panel entirely.
3. **Guest "Start Exam"** → `requireAuth("Vui lòng đăng nhập để làm bài.")` before Premium upsell.
4. **Block `/community/.../do` and `/result`** — already behind `PremiumRoute`; add login guard for unauthenticated.
5. **Wire `SubjectDetailPage`** to API list (replace mock) — Guest can browse without login.
6. **Remove / gate `buildExamQuestions()`** on community scope until user is authenticated Free+.

---

## Build Verification

```
dotnet build SEHub.Application  → SUCCESS (compile clean)
dotnet build SEHub.API          → FAILED copy step (SEHub.API process PID 3176 locking DLLs)
```

No source changes in this audit — failure is environmental (running API instance), not a code defect.
