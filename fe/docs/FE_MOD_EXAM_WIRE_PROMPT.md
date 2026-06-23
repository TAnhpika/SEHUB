# SEHUB — Wire Moderator & Exam Approval (Cursor prompt)

> Dùng file này làm prompt cho Cursor Agent khi **gắn API** cho luồng Mod đóng góp đề + Admin duyệt + Mod chấm bài thực hành.  
> Nguồn: **CodeGraph** · `SEHUB_PhanTichNghiepVu.md` §2.4, §3.4, §4.1 · `ARCHITECTURE-BE.md` §4.3–4.8 · audit branch `Hau_Authen_BE`

---

## Mục tiêu

Wire các luồng **Moderator ↔ Admin ↔ Exam** còn mock sang BE, **giữ nguyên UI/routes hiện có**. Sinh viên làm đề thi đã wire — task này chỉ tập trung **đóng góp đề** và **chấm GitHub**.

**Không** refactor layout, **không** phá module đã wire (Auth, Feed, Profile, Student Exams, Documents, Premium).

---

## Trước khi sửa — dùng CodeGraph

```bash
codegraph sync
codegraph query "Admin ExamsController" --kind route
codegraph query "PracticeSubmissionsController" --kind route
codegraph query "adminExamData"
codegraph query "moderatorExamContributionStore"
codegraph query "practiceExamSubmissions"
codegraph impact "adminExamData.js"
codegraph impact "moderatorExamContributionStore.js"
codegraph impact "practiceExamSubmissions.js"
```

Đọc thêm (theo thứ tự):

1. `be/src/SEHub.API/Controllers/Admin/ExamsController.cs`
2. `be/src/SEHub.Application/Admin/AdminExamService.cs`
3. `be/src/SEHub.Infrastructure/Persistence/Repositories/ExamRepository.cs` — **lưu ý filter `Published`**
4. `be/src/SEHub.Contracts/Admin/CreateExamRequest.cs`
5. `fe/src/features/admin/exams/adminExamData.js` — mock `pendingStore`, `approvePendingExam`
6. `fe/src/features/moderator/exams/moderatorExamContributionStore.js`
7. `fe/src/features/admin/exams/AdminExamPendingPage.jsx`
8. `fe/src/features/moderator/finalExams/` (wizard) + `AddPracticeExamPage.jsx`
9. `fe/src/features/exams/practiceExamSubmissions.js` + `fe/src/api/practiceSubmissionMapper.js`
10. `fe/src/api/adminApi.js` — `listExams`, `createExam`, `approveExam`, `updateExam` **đã có**, chưa dùng cho pending flow

Báo cáo file sẽ sửa **trước** khi apply changes.

---

## Trạng thái hiện tại (CodeGraph audit)

| Luồng | BE | FE |
| ----- | -- | -- |
| Mod gửi đề cuối kỳ / thực hành → chờ Admin | ✅ `POST /api/v1/admin/exams` → `PendingApproval` | ❌ Mock — `submitModeratorFinalExam` / `submitModeratorPracticeExam` → `pendingStore` (memory) |
| Admin hàng chờ duyệt | ✅ Exam `PendingApproval` trong DB | ❌ `AdminExamPendingPage` dùng `getAdminPendingExams()` mock |
| Admin duyệt đề | ✅ `POST /admin/exams/{id}/approve` (Admin only) | ❌ `approvePendingExam()` mock |
| Admin từ chối đề | ⚠️ Không có endpoint reject riêng — dùng `PUT` + `Status` | ❌ `rejectPendingExam()` mock (session history) |
| Mod chấm GitHub Pass/Fail | ✅ `PATCH .../practice-submissions/{id}` | ✅ `savePracticeSubmissionReview` → API |
| Mod chấm **"Đã xem"** | ⚠️ Enum có `Reviewed` nhưng `ReviewAsync` chỉ nhận `Passed`/`Failed` | ⚠️ FE fallback mock khi `mapFeReviewStatusToApi` trả `null` |
| SV làm đề / nộp GitHub | ✅ wired | ✅ wired |

### Mock files chính (Mod/Exam)

| File | Vai trò |
| ---- | ------- |
| `fe/src/features/admin/exams/adminExamData.js` | `pendingStore`, submit/approve/reject mock; `loadAdminExams()` đã gọi API nhưng **chỉ thấy Published** |
| `fe/src/features/moderator/exams/moderatorExamContributionStore.js` | localStorage audit + gọi mock submit |
| `fe/src/features/moderator/finalExams/` | Wizard UI — câu hỏi trong context, chưa map sang `CreateExamRequest` |
| `fe/src/features/moderator/practiceExams/AddPracticeExamPage/` | Form + `submitExamForApproval` mock |
| `fe/src/features/exams/practiceExamSubmissions.js` | API wired trừ status `reviewed` |

### Contract BE (tham chiếu)

```csharp
// POST /api/v1/admin/exams  (RequireModerator)
CreateExamRequest {
  Code, Title, ExamType,  // "Final" | "Practice"
  Semester, Major, Description,
  Questions[] { OrderIndex, Content, Options[] { Id, Label, Text }, CorrectOptionId }
}
// → Status = PendingApproval

// GET /api/v1/admin/exams?type=&semester=&major=&page=&pageSize=
// ⚠️ Hiện tại repository CHỈ trả Published — xem Phase 0 bên dưới

// POST /api/v1/admin/exams/{id}/approve  (RequireAdmin)

// PUT /api/v1/admin/exams/{id}  (RequireAdmin) — reject: Status = "Archived" (+ ghi lý do vào Description)

// PATCH /api/v1/exams/{examId}/practice-submissions/{submissionId}
ReviewPracticeRequest { Status, ReviewerComment }  // Status: Passed | Failed (Reviewed bị chặn)
```

**Lưu ý:** BE **không** lưu `submittedBy` (Moderator) trên Exam. UI pending hiện hiển thị tên Mod — API mode: dùng audit localStorage nếu có `pendingId`/`examId`, không thì `"—"`.

---

## Phạm vi IN / OUT

### ✅ IN (làm trong task này)

1. **Phase 0 (BE tối thiểu)** — bắt buộc để Admin pending hoạt động
2. **Mod submit final exam** — wizard → `POST /admin/exams` + mapper `CreateExamRequest`
3. **Mod submit practice exam** — form → `POST /admin/exams` (`Questions: []`, mô tả trong `Description`)
4. **Admin pending page** — load pending từ API + `approveExam(id)` + reject qua `updateExam`
5. **Practice review "Đã xem"** — BE cho phép `Reviewed` **hoặc** FE ẩn trong API mode (chọn một, ghi rõ trong PR)
6. **`moderatorExamContributionStore`** — giữ localStorage audit; enrich status từ API khi có `examApiId`
7. **Mock fallback** — `VITE_USE_MOCK=true` giữ behavior cũ
8. **Mapper** — sửa `mapExamStatus`: `PendingApproval` → `pending_approval` (không gom vào `draft`)

### ❌ OUT (không làm)

| Không làm | Lý do |
| --------- | ----- |
| Sửa `fe/src/app/App.jsx` routes | Ràng buộc dự án |
| Wire OCR Admin (`POST /admin/exams/ocr`) | Admin-only, task riêng |
| Upload file đề thực hành lên BE / `AssetUrl` | BE chưa có upload flow Mod |
| Content pre-moderation mock (`contentModerationStore`) | Phạm vi khác |
| Mod tự duyệt đề | Nghiệp vụ: chỉ Admin (`§2.4`) |
| Chat, question comments, notifications | G2 — không có BE |
| Refactor wizard UI / Admin pending layout | Chỉ đổi **nguồn data** + async |
| Thêm Redux / axios mới | Dùng `httpClient.js` + pattern hiện có |

---

## Phase 0 — BE prerequisite (bắt buộc)

`ExamRepository.GetPagedAsync` hiện **hardcode** `e.Status == Published` → Admin **không thấy** đề `PendingApproval`.

### Sửa tối thiểu (khuyến nghị)

1. **`be/src/SEHub.Contracts/Exams/ExamQueryParams.cs`** — thêm `public string? Status { get; init; }`
2. **`ExamRepository.GetPagedAsync`** — khi `query.Status` có giá trị và parse được `ExamStatus`, filter theo status; **khi không có Status**, admin list trả **mọi** status (hoặc chỉ `PendingApproval` + `Published` — document rõ)
3. **`ExamListItemDto`** (optional nhưng khuyến nghị) — thêm `CreatedAt`, `Description` cho hàng chờ Admin
4. **`PracticeSubmissionService.ReviewAsync`** — cho phép `PracticeSubmissionStatus.Reviewed` (enum đã có; align `§3.4` MVP)

Chạy `dotnet test -c Release` sau Phase 0.

---

## Ràng buộc BẮT BUỘC

### ĐƯỢC sửa / thêm

**BE (Phase 0 only):**

- `ExamQueryParams.cs`, `ExamRepository.cs`, `ExamListItemDto.cs` (+ AutoMapper profile nếu cần)
- `PracticeSubmissionService.cs` — allow `Reviewed`

**FE:**

- `fe/src/api/adminMapper.js` — `mapCreateExamRequestFromWizard`, `mapPendingExamListItem`, fix `mapExamStatus`
- `fe/src/api/practiceSubmissionMapper.js` — `mapFeReviewStatusToApi`: thêm `"reviewed" → "Reviewed"` (nếu BE đã sửa)
- `fe/src/features/admin/exams/adminExamData.js` — async loaders: `loadAdminPendingExams`, `submitModeratorFinalExam`, `submitModeratorPracticeExam`, `approvePendingExam`, `rejectPendingExam`
- `fe/src/features/moderator/exams/moderatorExamContributionStore.js` — gọi API qua adminExamData; lưu `examApiId` trong audit
- `fe/src/features/admin/exams/AdminExamPendingPage.jsx` — `useEffect` fetch; loading/error; detail gọi `loadAdminExamById` / `getExam` thay `MOCK_OCR_QUESTIONS` khi API mode
- `fe/src/features/moderator/finalExams/steps/FinalExamReviewStep.jsx` — async submit + toast lỗi API (Conflict duplicate SHA)
- `fe/src/features/moderator/practiceExams/AddPracticeExamPage/AddPracticeExamPage.jsx` — async submit
- `fe/src/features/exams/practiceExamSubmissions.js` — fix nhánh `reviewed` (không fallback mock khi đã có `apiExamId`)

### KHÔNG được

- Đổi props/CSS className của wizard, `AdminExamPendingPage`, `PracticeSubmissionGrader`
- Xóa `pendingStore` / mock constants — giữ cho `VITE_USE_MOCK=true`
- Gọi `approveExam` từ Moderator UI
- Commit `appsettings.Development.Local.json` hoặc secrets

---

## Pattern chuẩn (giữ như Auth/Feed/Profile)

### 1) Mapper — wizard question → `CreateExamRequest`

Câu hỏi wizard (`finalExamData.js`):

```javascript
{ id, content, answers: { A, B, C, D }, correctAnswer: "A" | "B" | "C" | "D" }
```

BE cần `Guid` cho mỗi option + `CorrectOptionId`:

```javascript
// adminMapper.js — ví dụ
import { randomUUID } from "crypto"; // hoặc crypto.randomUUID() browser

export function mapWizardQuestionsToCreateItems(questions) {
  return questions
    .filter((q) => q.content?.trim() && ANSWER_KEYS.some((k) => q.answers[k]?.trim()))
    .map((q, index) => {
      const options = ANSWER_KEYS.map((key) => ({
        id: crypto.randomUUID(),
        label: key,
        text: q.answers[key]?.trim() ?? "",
      }));
      const correct = options.find((o) => o.label === q.correctAnswer) ?? options[0];
      return {
        orderIndex: index + 1,
        content: q.content.trim(),
        options,
        correctOptionId: correct.id,
      };
    });
}

export function mapFinalExamWizardToCreateRequest(examInfo, questions) {
  return {
    code: examInfo.subjectCode.trim(),
    title: examInfo.examCode?.trim() || `${examInfo.subjectCode} — Cuối kỳ`,
    examType: "Final",
    semester: String(parseSemester(examInfo.semesterLabel)),
    major: "SE",
    description: examInfo.subjectName ?? "",
    questions: mapWizardQuestionsToCreateItems(questions),
  };
}

export function mapPracticeExamFormToCreateRequest(form) {
  return {
    code: form.subjectCode.trim(),
    title: form.title.trim(),
    examType: "Practice",
    semester: String(parseSemester(form.semester)),
    major: "SE",
    description: [form.description, form.githubGuide].filter(Boolean).join("\n\n"),
    questions: [],
  };
}
```

**Duplicate SHA:** BE trả `409` + `DuplicateExam`. FE hiển thị confirm → gọi lại `createExam(body, true)` với `confirmDuplicate=true` (query param đã có trong `adminApi.createExam`).

### 2) Data layer — `adminExamData.js`

Giữ **export name & signature** mà pages đang import. Đổi implementation:

```javascript
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function loadAdminPendingExams() {
  if (USE_MOCK) return getAdminPendingExams();
  const page = await adminApi.listExams({ status: "PendingApproval", pageSize: 100 });
  return (page.items ?? []).map(mapPendingExamListItem);
}

export async function submitModeratorFinalExam(payload, createRequest) {
  if (USE_MOCK) { /* existing mock */ }
  const dto = await adminApi.createExam(createRequest);
  return mapPendingExamFromCreate(dto, payload);
}

export async function approvePendingExam(pendingId) {
  if (USE_MOCK) { /* existing mock */ }
  await adminApi.approveExam(pendingId);
  return loadAdminExamById(pendingId);
}

export async function rejectPendingExam(pendingId, reasonPayload) {
  if (USE_MOCK) { /* existing mock */ }
  await adminApi.updateExam(pendingId, {
    status: "Archived",
    description: reasonPayload.reasonFull,
  });
  return { id: pendingId, ...reasonPayload };
}
```

**Session history** (approved/rejected trong phiên): giữ state local trên `AdminExamPendingPage` sau action thành công — **không** cần BE audit log P1.

### 3) Contribution store — audit + API id

```javascript
export async function submitExamForApproval(payload, createRequest) {
  if (USE_MOCK) { /* existing */ }

  const pending = payload.examType === "final"
    ? await submitModeratorFinalExam(payload, createRequest)
    : await submitModeratorPracticeExam(payload, createRequest);

  return appendEntry({
    ...payload,
    action: "submitted",
    pendingId: pending.id,
    examApiId: pending.apiId ?? pending.id,
  });
}
```

`resolvePendingStatus(pendingId)` — API mode:

- Gọi `loadAdminExamById(pendingId)` hoặc cache status từ submit response
- `PendingApproval` → `pending_admin`; `Published` → `approved`; `Archived` → `rejected`

### 4) Admin pending page — async

```javascript
const [pending, setPending] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  let cancelled = false;
  loadAdminPendingExams()
    .then((items) => { if (!cancelled) setPending(items); })
    .catch(() => showToast("Không tải hàng chờ duyệt."))
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
}, [refreshKey]);
```

Detail panel — final exam:

- API mode: `loadAdminExamById(selected.id)` → render `questionsData` thật
- Mock mode: giữ `MOCK_OCR_QUESTIONS`

### 5) Practice review — "Đã xem"

**Khuyến nghị (align nghiệp vụ §3.4):** sửa BE `ReviewAsync` chấp nhận `Reviewed`.

```csharp
// PracticeSubmissionService.ReviewAsync
|| status is not (PracticeSubmissionStatus.Reviewed
    or PracticeSubmissionStatus.Passed
    or PracticeSubmissionStatus.Failed)
```

FE:

```javascript
export function mapFeReviewStatusToApi(status) {
  if (status === "reviewed") return "Reviewed";
  if (status === "pass") return "Passed";
  if (status === "fail") return "Failed";
  return null;
}
```

**Fallback (chỉ FE, nếu không sửa BE):** trong API mode, ẩn option "Đã xem" trong `PracticeSubmissionGrader` hoặc toast *"Chỉ hỗ trợ Đạt/Không đạt qua API"* — **không** fallback `gradePracticeSubmission` mock.

---

## Kiểm tra regression (BẮT BUỘC)

### Moderator — đóng góp đề

- [ ] Login `moderator@sehub.local` / `Mod@12345`
- [ ] Final wizard: gửi duyệt ≥1 câu hoàn chỉnh → toast thành công; audit localStorage có `examApiId`
- [ ] Practice form: gửi duyệt → exam `Practice` + `PendingApproval` trong DB
- [ ] Mod **không** thấy đề vừa gửi trên feed SV (chưa Published)
- [ ] `VITE_USE_MOCK=true`: wizard + practice vẫn dùng mock pending như cũ

### Admin — duyệt

- [ ] Login `admin@sehub.local` / `Admin@123`
- [ ] `/admin/exams/pending` load danh sách từ API (không chỉ mock seed)
- [ ] Duyệt final → `POST approve` → SV Premium thấy đề trong list exams
- [ ] Duyệt practice → SV Premium nộp GitHub được
- [ ] Từ chối → exam `Archived` (hoặc status đã chọn); biến mất khỏi hàng chờ
- [ ] Detail final: preview câu hỏi từ API (không hardcode `MOCK_OCR_QUESTIONS` khi API mode)

### Moderator — chấm GitHub

- [ ] `/moderator/practice-submissions` — list từ API
- [ ] "Đã xem" persist sau reload (nếu BE Reviewed đã bật)
- [ ] Đạt / Không đạt + điểm + nhận xét → PATCH API; SV thấy kết quả trên panel nộp bài

### Không phá module khác

- [ ] Login / logout / refresh token
- [ ] SV làm đề cuối kỳ + nộp practice (đã wire)
- [ ] Profile, Feed, Premium checkout
- [ ] `loadAdminExams()` admin kho đề vẫn hoạt động
- [ ] `npm run build` pass
- [ ] `dotnet test -c Release` pass

### Tài khoản test

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | `admin@sehub.local` | `Admin@123` |
| Moderator | `moderator@sehub.local` | `Mod@12345` |
| Student Premium | `demo.student@sehub.local` | `Demo@12345` |

BE: `http://localhost:5006/api/v1` · FE: `http://localhost:5173`

---

## Thứ tự implement gợi ý

1. **BE Phase 0** — status filter + Reviewed (1 commit nếu user yêu cầu)
2. `adminMapper.js` — create request mappers + pending list + fix status map
3. `adminExamData.js` — async submit / pending / approve / reject
4. `moderatorExamContributionStore.js` + wizard pages — truyền `createRequest`, async submit
5. `AdminExamPendingPage.jsx` — fetch + detail API
6. `practiceSubmissionMapper.js` + `practiceExamSubmissions.js` — reviewed
7. Regression checklist

---

## Checklist hoàn thành

- [ ] Mod submit → BE `PendingApproval` (verify Swagger hoặc DB)
- [ ] Admin pending → load + approve/reject qua API
- [ ] Mock mode không bị hỏng
- [ ] Không sửa `App.jsx` routes
- [ ] "Đã xem" không còn silently fallback mock khi API mode
- [ ] Build + test pass

---

## Prompt ngắn (copy vào Cursor)

```
Wire Moderator & Exam approval theo fe/docs/FE_MOD_EXAM_WIRE_PROMPT.md.

Trước tiên chạy CodeGraph (sync + query adminExamData, moderatorExamContributionStore,
PracticeSubmissionsController) và đọc các file BE/FE liệt kê trong doc.

Phase 0 BE: ExamQueryParams.Status + ExamRepository không chỉ Published;
PracticeSubmissionService cho phép Reviewed.

FE: Mod wizard/form → POST /admin/exams (mapper CreateExamRequest với Guid options);
Admin pending → list PendingApproval + approveExam + reject updateExam;
fix practice "Đã xem" qua API; giữ localStorage audit + VITE_USE_MOCK fallback.

Ràng buộc: không sửa App.jsx routes, không phá SV exams/Profile/Feed/Premium đã wire,
npm run build + dotnet test pass. Báo cáo file sẽ sửa trước khi code.
```
