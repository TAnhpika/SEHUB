# Exam Guest Security Report

**Date:** 2026-06-05  
**Method:** CodeGraph + endpoint/DTO audit  
**Scope:** Verify no Guest-accessible surface returns correct answers, full exam content, or submission data

---

## 1. Threat Model

**Guest** = HTTP request **without** `Authorization: Bearer` header.

**Must NOT receive:**

- Correct answers (`CorrectOptionId`, `correctAnswer`, graded results)
- Full exam content (all questions + all options)
- Exam attempt / submission / result payloads

**May receive (discovery):**

- Exam metadata (title, description, counts, duration, category, tags)
- Preview teaser per product rules (Option A: 1 question; Option B: no content)

---

## 2. CodeGraph Call Chain — Content Leak Path

```
Guest HTTP
  → ExamsController.GetQuestions [AllowAnonymous]     ← SECURITY BREACH
  → ExamQueryService.GetQuestionsAsync
  → Question.Content + QuestionOption.Text
  → QuestionPublicDto (× N questions)
```

Safe paths:

```
Guest → GetExams → ExamQueryService.GetExamsAsync → ExamListItemDto (metadata)
Guest → GetById  → ExamQueryService.GetByIdAsync  → ExamDetailDto (metadata)
Guest → *Attempt* → 401/403 (RequirePremium)
```

---

## 3. Endpoint Security Matrix

### Public `ExamsController` (`/api/v1/exams`)

| Endpoint | Guest HTTP | Returns correct answers? | Returns full content? | Returns submission data? | Status |
|----------|------------|--------------------------|----------------------|--------------------------|--------|
| `GET /exams` | 200 | No | No | No | **PASS** |
| `GET /exams/{id}` | 200 | No | No | No | **PASS** |
| `GET /exams/{id}/questions` | 200 | No* | **Yes — all Q + options** | No | **FAIL** |
| `GET /exams/{id}/questions/{qid}` | 401/403 | Would: Yes | Would: Yes | No | **PASS** |
| `POST /exams/questions/{qid}/ai-explain` | 401 | Would: solution | — | No | **PASS** |
| `POST /exams/{id}/attempts` | 401/403 | — | — | No | **PASS** |
| `GET /exams/{id}/attempts/current` | 401/403 | — | — | Yes (answers) | **PASS** |
| `GET /exams/{id}/attempts/{attemptId}` | 401/403 | — | — | Yes | **PASS** |
| `PUT /exams/{id}/attempts/{id}/answers` | 401/403 | — | — | Yes | **PASS** |
| `POST /exams/{id}/attempts/{id}/submit` | 401/403 | — | — | Yes | **PASS** |
| `GET /exams/{id}/attempts/{id}/result` | 401/403 | **Yes** (`correctOptionId`) | — | Yes | **PASS** |

\*`QuestionPublicDto` omits `CorrectOptionId` but still exposes **full question text and option text** — violates locked-content policy.

### `PracticeSubmissionsController`

| Endpoint | Guest HTTP | Status |
|----------|------------|--------|
| `POST .../practice-submissions` | 401/403 | **PASS** |
| `GET .../practice-submissions/me` | 401/403 | **PASS** |
| `GET .../practice-submissions` | 401/403 | **PASS** |
| `PATCH .../practice-submissions/{id}` | 401/403 | **PASS** |

### `Admin/ExamsController`

| Endpoint | Guest HTTP | Status |
|----------|------------|--------|
| All admin exam routes | 401/403 | **PASS** |

---

## 4. DTO Security Classification

| DTO | Guest reachable today? | Correct answers | Full content | Submission data | Status |
|-----|------------------------|-----------------|--------------|-----------------|--------|
| `ExamListItemDto` | ✅ | — | — | — | **PASS** |
| `ExamDetailDto` | ✅ | — | — | — | **PASS** |
| `QuestionPublicDto` | ✅ | No | **Yes** | — | **FAIL** |
| `QuestionOptionDto` | ✅ (nested) | — | **Yes** (`text`) | — | **FAIL** |
| `QuestionAnswerDto` | ❌ | Yes | Yes | — | **PASS** (blocked) |
| `ExamAttemptDto` | ❌ | — | — | Yes | **PASS** |
| `ExamResultDto` | ❌ | Yes | — | Yes | **PASS** |
| `ExamResultAnswerDto` | ❌ | Yes | — | Yes | **PASS** |
| `PracticeSubmissionDto` | ❌ | — | — | Yes | **PASS** |
| `AiExplainResponse` | ❌ | solution | — | — | **PASS** |
| `AdminExamDto` | ❌ | Yes | Yes | — | **PASS** |

**Proposed safe DTOs (not in codebase):**

| DTO | Guest safe? |
|-----|-------------|
| `ExamGuestDto` | ✅ metadata only |
| `ExamGuestDetailDto` | ✅ + locked slots |
| `QuestionPreviewDto` | ⚠️ Option A only — 1 question, no `correctOptionId` |
| `ExamQuestionSlotDto` | ✅ Option B — `{ index, isLocked }` only |

---

## 5. Entity Exposure (via API mapping)

| Entity field | Mapped to Guest? | Via |
|--------------|------------------|-----|
| `Exam.Title`, `Description`, `QuestionCount` | ✅ | `ExamDetailDto` |
| `Question.Content` | ✅ **LEAK** | `QuestionPublicDto` |
| `Question.CorrectOptionId` | ❌ | Not in public DTO |
| `QuestionOption.Text` | ✅ **LEAK** | `QuestionOptionDto` |
| `ExamAttempt.AnswersJson` | ❌ | Premium endpoints |
| `ExamAttempt.Score` | ❌ | Result endpoint |
| `PracticeSubmission.*` | ❌ | Premium |

---

## 6. Authorization Policy Validation

| Policy | Exams usage | Blocks Guest correctly? |
|--------|-------------|-------------------------|
| `AllowAnonymous` | List, detail, **questions** | ⚠️ List/detail OK; **questions FAIL** |
| `RequireAuthenticated` | AI explain | ✅ |
| `RequirePremium` | Answers, attempts, results, practice | ✅ |
| `RequireModerator` | Admin exams, practice review | ✅ |
| `RequireAdmin` | Exam update, OCR | ✅ |

`ExamQueryService.GetQuestionsAsync`:

- Does **not** check `exam.Status == Published` (draft leak risk)
- `ShouldMaskAnswers()` computed but **unused** (`maskAnswers` dead variable)

---

## 7. Frontend Security (Client-Side)

| Surface | Guest access | Exposes content? | Status |
|---------|--------------|------------------|--------|
| `examDetailData.js` | Bundled in JS | Mock Q + options + `correctAnswer` in source | **FAIL** (devtools) |
| `ExamDetailPage` community | Public URL | Renders question text + options | **FAIL** |
| `ExamDoPage` | `PremiumRoute` | Blocked | **PASS** |
| `ExamResultPage` | `PremiumRoute` | Blocked | **PASS** |
| No `examsApi` | N/A | FE not calling leaky API yet | **Latent risk** |

> When FE wires API, calling `GET /questions` without auth guard will reproduce BE leak in UI.

---

## 8. Preview Mode Security

| Option | Guest API exposure | Meets locked-content rule? |
|--------|-------------------|----------------------------|
| **A** — 1st question only | Single `QuestionPreviewDto`, no answer | ✅ If endpoint is new + capped at 1 |
| **B** — Placeholder cards | No question API; slot metadata only | ✅ **Safest** |
| **Current** — full `/questions` | All questions + options | ❌ **FAIL** |

---

## 9. Regression Checklist (for implementation)

After fixes, verify Guest receives **401** for:

- [ ] `GET /exams/{id}/questions`
- [ ] All `/attempts/*` routes
- [ ] All `/practice-submissions/*` routes
- [ ] `GET /exams/{id}/questions/{qid}`

Verify Guest receives **200** with **no** `content`, `options`, `correctOptionId`, `answers`, `score` for:

- [ ] `GET /exams`
- [ ] `GET /exams/{id}`

Verify preview endpoint (if Option A):

- [ ] Returns max 1 question
- [ ] No `correctOptionId` in response
- [ ] `RequireAnonymous` allowed

---

## 10. Summary

| Category | PASS | FAIL |
|----------|------|------|
| Public exam endpoints | 10 | **1** |
| DTOs reachable by Guest | 2 | **2** |
| Attempt/submission/result | 8 | 0 |
| Admin endpoints | 6 | 0 |
| FE exam pages | 2 | **2** |

### Critical finding

**Single failure point:** `GET /api/v1/exams/{id}/questions` with `[AllowAnonymous]` returns the **entire** `QuestionPublicDto` collection.

### Required security fixes (priority order)

1. Change `GetQuestions` to `[Authorize(RequireAuthenticated)]` — Guest gets 401; Free Student retains access.
2. Add `Published` status guard in `GetQuestionsAsync`.
3. Introduce `ExamGuestDetailDto` — never include `Question` entities on Guest responses.
4. Optional `GET /exams/{id}/preview` — strictly one question, no answer fields.
5. FE: Guest detail page must not call `/questions`; use placeholder cards (Option B).
6. Remove or gate mock `correctAnswer` in client bundles for Guest routes.

---

## 11. Build Verification

| Command | Result |
|---------|--------|
| `dotnet build SEHub.Application` | ✅ **SUCCESS** (0 errors) |
| `dotnet build SEHub.API` | Not run — DLL lock from running API process (environmental) |

**Compatibility:** No breaking changes introduced by this audit (read-only analysis).

---

## 12. Overall Security Verdict

| Area | Verdict |
|------|---------|
| Guest metadata endpoints | **PASS** |
| Guest content endpoints | **FAIL** |
| Premium-gated exam actions | **PASS** |
| Admin isolation | **PASS** |
| FE Guest exam detail | **FAIL** |
| Preview mode readiness | **FAIL** |

**Guest exam security: FAIL** — one anonymous endpoint exposes full question bank; FE amplifies via mock data on public routes.

**Recommended preview strategy:** **Option B** (placeholder cards) for Guest + authenticated preview; Option A as optional authenticated teaser after login.
