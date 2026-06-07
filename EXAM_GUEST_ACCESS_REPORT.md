# Exam Guest Access Report

Per-endpoint PASS/FAIL for Guest (no `Authorization` header).

**PASS** = Guest cannot obtain question text, option text, correct answers, solutions, attempt data, or results.  
**FAIL** = Guest can access restricted content or endpoint violates metadata-only rule.  
**PARTIAL** = Safe from content leak but missing required metadata or wrong UX message.

---

## Public Exam API — `ExamsController` (`/api/v1/exams`)

| # | Method | URL | Auth Policy | Guest | Content leak? | Status |
|---|--------|-----|-------------|-------|---------------|--------|
| 1 | GET | `/api/v1/exams` | AllowAnonymous | ✅ Allowed | No — `ExamListItemDto` metadata | **PASS** |
| 2 | GET | `/api/v1/exams/{id}` | AllowAnonymous | ✅ Allowed | No — `ExamDetailDto` metadata | **PASS** |
| 3 | GET | `/api/v1/exams/{id}/questions` | AllowAnonymous | ✅ Allowed | **Yes** — `QuestionPublicDto.content`, `options[].text` | **FAIL** |
| 4 | GET | `/api/v1/exams/{id}/questions/{questionId}` | RequirePremium | ❌ 401/403 | Would expose `correctOptionId` | **PASS** |
| 5 | POST | `/api/v1/exams/questions/{questionId}/ai-explain` | RequireAuthenticated | ❌ 401 | Would expose solution | **PASS** |
| 6 | POST | `/api/v1/exams/{id}/attempts` | RequirePremium | ❌ 401/403 | Attempt data | **PASS** |
| 7 | GET | `/api/v1/exams/{id}/attempts/current` | RequirePremium | ❌ 401/403 | In-progress answers | **PASS** |
| 8 | GET | `/api/v1/exams/{id}/attempts/{attemptId}` | RequirePremium | ❌ 401/403 | Attempt + answers | **PASS** |
| 9 | PUT | `/api/v1/exams/{id}/attempts/{attemptId}/answers` | RequirePremium | ❌ 401/403 | Answer save | **PASS** |
| 10 | POST | `/api/v1/exams/{id}/attempts/{attemptId}/submit` | RequirePremium | ❌ 401/403 | Submit | **PASS** |
| 11 | GET | `/api/v1/exams/{id}/attempts/{attemptId}/result` | RequirePremium | ❌ 401/403 | Scores + `correctOptionId` | **PASS** |

---

## Practice Submissions — `PracticeSubmissionsController`

| # | Method | URL | Auth Policy | Guest | Status |
|---|--------|-----|-------------|-------|--------|
| 12 | POST | `/api/v1/exams/{examId}/practice-submissions` | RequirePremium | ❌ | **PASS** |
| 13 | GET | `/api/v1/exams/{examId}/practice-submissions/me` | RequirePremium | ❌ | **PASS** |
| 14 | GET | `/api/v1/exams/{examId}/practice-submissions` | RequireModerator | ❌ | **PASS** |
| 15 | PATCH | `/api/v1/exams/{examId}/practice-submissions/{id}` | RequireModerator | ❌ | **PASS** |

---

## Admin Exam API — `Admin/ExamsController` (`/api/v1/admin/exams`)

| # | Method | URL | Auth Policy | Guest | Status |
|---|--------|-----|-------------|-------|--------|
| 16 | GET | `/api/v1/admin/exams` | RequireModerator | ❌ | **PASS** |
| 17 | POST | `/api/v1/admin/exams` | RequireModerator | ❌ | **PASS** |
| 18 | GET | `/api/v1/admin/exams/{id}` | RequireModerator | ❌ | **PASS** |
| 19 | PUT | `/api/v1/admin/exams/{id}` | RequireAdmin | ❌ | **PASS** |
| 20 | POST | `/api/v1/admin/exams/{id}/approve` | RequireAdmin | ❌ | **PASS** |
| 21 | POST | `/api/v1/admin/exams/ocr` | RequireAdmin | ❌ | **PASS** |

---

## Related Guest Endpoints (context)

| # | Method | URL | Guest | Exam-related | Status |
|---|--------|-----|-------|--------------|--------|
| 22 | GET | `/api/v1/premium/plans` | ✅ | Pricing for exam upsell | **PASS** |
| 23 | GET | `/api/v1/documents/*` | ❌ 401 | Separate restriction | **PASS** |

---

## DTO Exposure — Guest perspective

| DTO | Reachable by Guest today? | Question text | Options | Correct answer | Verdict |
|-----|---------------------------|---------------|---------|----------------|---------|
| `ExamListItemDto` | ✅ via #1 | — | — | — | **PASS** |
| `ExamDetailDto` | ✅ via #2 | — | — | — | **PASS** |
| `QuestionPublicDto` | ✅ via #3 | ✅ LEAK | ✅ LEAK | — | **FAIL** |
| `QuestionAnswerDto` | ❌ | — | — | — | **PASS** |
| `ExamAttemptDto` | ❌ | — | — | — | **PASS** |
| `ExamResultDto` | ❌ | — | — | — | **PASS** |
| `AiExplainResponse` | ❌ | — | — | solution | **PASS** |
| `AdminExamDto` | ❌ | — | — | — | **PASS** |

---

## Metadata Completeness — Guest list/detail

| Required field | In API response? | Status |
|----------------|------------------|--------|
| Title | ✅ | **PASS** |
| Description | ✅ (detail only) | **PARTIAL** |
| Subject / course code | ⚠️ `code`, `major` | **PARTIAL** |
| Category | ❌ | **FAIL** |
| Difficulty | ❌ | **FAIL** |
| Duration | ❌ | **FAIL** |
| Total questions | ✅ `questionCount` | **PASS** |
| Exam type | ✅ `examType` | **PASS** |
| Created date | ❌ | **FAIL** |
| Total attempts | ❌ | **FAIL** |
| Search | ❌ no `search` param | **FAIL** |
| Filter (type/semester/major) | ✅ | **PASS** |

---

## Frontend Routes — Guest (`/community/...`)

| Route | Page | Question content visible? | Start exam CTA | Status |
|-------|------|---------------------------|----------------|--------|
| `/community/final-exam` | `ReviewQuestionsPage` | No (catalog) | N/A | **PASS** |
| `/community/final-exam/:courseCode` | `SubjectDetailPage` | No (list); click → login toast | Login required on click | **PASS** |
| `/community/final-exam/:courseCode/:examId` | `ExamDetailPage` | **Yes** — mock Q&A preview | "Premium để làm bài" (no login msg) | **FAIL** |
| `/community/final-exam/.../do` | `ExamDoPage` | PremiumRoute blocks | — | **PASS** |
| `/community/final-exam/.../result` | `ExamResultPage` | PremiumRoute blocks | — | **PASS** |
| `/community/pratical-exam/...` | Same pattern | Same | Same | **FAIL** (detail) |
| `/community/documents/...` | Documents | N/A | Login on click | **PASS** |

---

## Summary Counts

| Category | PASS | PARTIAL | FAIL |
|----------|------|---------|------|
| Public exam API endpoints (11) | 10 | 0 | **1** |
| Practice API (4) | 4 | 0 | 0 |
| Admin exam API (6) | 6 | 0 | 0 |
| DTO exposure (8) | 7 | 0 | **1** |
| Metadata fields (11) | 3 | 2 | **6** |
| FE Guest routes (7) | 5 | 0 | **2** |

---

## Critical Failures (must fix)

### Backend

| ID | Issue | Fix |
|----|-------|-----|
| **B1** | `GET /exams/{id}/questions` AllowAnonymous | → `RequireAuthenticated` (min) or `RequirePremium` |
| **B2** | `GetQuestionsAsync` no Published check | Add status guard |
| **B3** | Metadata incomplete (duration, attempts, createdAt, search) | Extend entity + DTO + service |

### Frontend

| ID | Issue | Fix |
|----|-------|-----|
| **F1** | `ExamDetailPage` public on community shows question text | Hide question panel for Guest; metadata only |
| **F2** | No API client — mock data includes full questions | `examsApi.js` + metadata-only rendering |
| **F3** | Start button messaging | Guest → login CTA; logged-in Free → Premium CTA |

---

## Recommended Safe Guest API Contract

### `GET /api/v1/exams`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "guid",
        "title": "Đề thi cuối kỳ PRN212 - C# và WPF",
        "code": "PRN212",
        "examType": "Final",
        "major": "SE",
        "semester": "1",
        "description": "…",
        "durationMinutes": 90,
        "questionCount": 40,
        "totalAttempts": 1234,
        "createdAt": "2025-11-17T10:00:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 1
  }
}
```

### `GET /api/v1/exams/{id}`

Same fields as list item + `assetUrl` for practice exams. **No `questions` array.**

### `GET /api/v1/exams/{id}/questions`

**Not callable by Guest** → `401 Unauthorized`.

---

## Build Status

| Project | Result | Note |
|---------|--------|------|
| `SEHub.Domain` | ✅ Build OK | |
| `SEHub.Contracts` | ✅ Build OK | |
| `SEHub.Application` | ✅ Build OK | |
| `SEHub.Infrastructure` | ✅ Build OK | |
| `SEHub.API` | ⚠️ Copy failed | DLL locked by running `SEHub.API` (PID 3176) |

**No code modified in this audit** — no breaking changes introduced.

---

## Next Steps (implementation phase)

1. Apply **B1** + **B2** (authorization hardening) — smallest security win.
2. Apply **B3** (metadata enrichment) — product completeness.
3. Apply **F1–F3** + wire `examsApi.js`.
4. Add integration tests for Guest exam security regression.
5. Reconcile `SEHUB_PhanTichNghiepVu.md` §6 row 358 with §2.1 Guest policy.
