# SEHub Backend — Architecture Refactor Decision

> **Ngày:** 2026-06-05  
> **Input:** [DEPENDENCY_GRAPH_AUDIT.md](DEPENDENCY_GRAPH_AUDIT.md)  
> **Phạm vi:** 4 violations chính (V-01 → V-04) + 4 advisory dependencies  
> **Bối cảnh:** Backend đạt compliance nghiệp vụ **92/100**, **16/16 tests pass**, chuẩn bị tích hợp FE — ưu tiên ổn định runtime hơn purity kiến trúc.

---

# Executive Recommendation

| Chiến lược | Phạm vi |
|------------|---------|
| **Fix Now** | Không có — không violation nào gây lỗi runtime hoặc block FE |
| **Fix Later** | V-03, V-04 — refactor nhỏ, ROI kiến trúc rõ, regression kiểm soát được |
| **Do Not Fix** | V-01, V-02 — composition root pattern chuẩn ASP.NET Core; A-01 → A-04 — shared kernel hợp lý |

**Quyết định tổng thể:** Chấp nhận **FAIL** trên giấy tờ audit rule #4; **không block release**. Lên kế hoạch sprint kiến trúc riêng sau khi FE integration ổn định.

---

# Classification Legend

| Class | Ý nghĩa |
|-------|---------|
| **1. Critical Architecture Violation** | Phá boundary có thể dẫn đến logic leak, cycle, hoặc khó test — cần sửa trước scale |
| **2. Acceptable Pragmatic Dependency** | Lệch strict rule nhưng phổ biến, an toàn, có lý do kỹ thuật rõ |
| **3. Future Refactoring Candidate** | Đúng là nợ kỹ thuật; sửa khi có capacity, không gấp |

## Risk Scales

| Metric | Low | Medium | High |
|--------|-----|--------|------|
| **Risk of fixing** | < 1 ngày, ít file | 1–3 ngày, nhiều touchpoint | > 3 ngày, đổi wiring/DI/migration |
| **Business value** | Không cải thiện feature/UX | Cải thiện gián tiếp (maintainability) | Trực tiếp (security, correctness) |
| **Regression risk** | Unit test đủ cover | Cần chạy lại integration auth/error | Startup, DI, migration, toàn API surface |

---

# Formal Violations

## V-01 — `SEHub.API.csproj` → `SEHub.Infrastructure`

| Field | Assessment |
|-------|------------|
| **Classification** | **2. Acceptable Pragmatic Dependency** |
| **Lý do** | Trong ASP.NET Core, **Host/API là composition root** — project cuối cùng *phải* biết Infrastructure để gọi `AddInfrastructure()`. Đây là pattern Microsoft docs và hầu hết Clean Architecture .NET templates (API references Infrastructure, không ngược lại). Vi phạm rule #4 audit nhưng **không** tạo cycle (`Infrastructure ↛ API`). |
| **Risk of fixing** | **High** — cần tách `SEHub.Composition` / assembly load / đổi EF Design-time factory path |
| **Business value** | **Low** — zero impact user, FE, PayOS, Premium |
| **Regression risk** | **High** — DI registration, `dotnet ef`, `DbSeeder`, integration tests |
| **Recommendation** | **Do Not Fix** |

**Ghi chú:** Nếu team muốn audit **PASS** trên giấy, đây là **3. Future Refactoring Candidate** khi có sprint riêng — không phải Critical vì boundary Application↔Infrastructure vẫn nguyên vẹn.

---

## V-02 — `Program.cs` imports `SEHub.Infrastructure` + `DbSeeder`

| Field | Assessment |
|-------|------------|
| **Classification** | **2. Acceptable Pragmatic Dependency** |
| **Lý do** | Symptom của V-01. `AddInfrastructure()` và `DbSeeder.SeedAsync()` **thuộc bootstrap**, không phải business logic trong controller. 2 dòng `using` — coupling tối thiểu. |
| **Risk of fixing** | **High** (gắn với V-01) |
| **Business value** | **Low** |
| **Regression risk** | **High** — startup seed, first-run admin account |
| **Recommendation** | **Do Not Fix** |

**Fix Later alternative (nếu V-01 được xử lý):** Gộp `AddInfrastructure()` + `SeedAsync()` vào một extension `AddSeHubBackend()` trong composition project — `Program.cs` chỉ 1 dòng, không `using Infrastructure`.

---

## V-03 — `AuthorizationPolicies.cs` → `SEHub.Infrastructure.Identity`

| Field | Assessment |
|-------|------------|
| **Classification** | **3. Future Refactoring Candidate** |
| **Lý do** | API biết concrete `PremiumAuthorizationHandler` và `PremiumRequirement` (cả hai nằm Infrastructure). Policy **names** đã ở Shared; handler implementation đúng chỗ Infrastructure — chỉ **registration** đang leak ra API. Không gây cycle; auth vẫn hoạt động đúng (DB-backed premium). |
| **Risk of fixing** | **Medium** — move `AddAuthorizationPolicies` body vào `Infrastructure.DependencyInjection` hoặc `Application` facade (~30–60 LOC) |
| **Business value** | **Low** — maintainability, audit PASS |
| **Regression risk** | **Medium** — `RequirePremium` trên 15+ endpoints; cần integration test auth |
| **Recommendation** | **Fix Later** |

**Đề xuất fix (sprint sau):**
```
Infrastructure.DependencyInjection.AddInfrastructure()
  └── gọi nội bộ AddAuthorizationHandlers()
API.Extensions
  └── chỉ AddPolicy names, KHÔNG register PremiumAuthorizationHandler
```

---

## V-04 — `ExceptionHandlingMiddleware.cs` → `SEHub.Domain.Exceptions`

| Field | Assessment |
|-------|------------|
| **Classification** | **3. Future Refactoring Candidate** |
| **Lý do** | Middleware map `NotFoundException`, `ForbiddenException`, `ConflictException`, `DomainException` → HTTP status. Domain exceptions là **pure POCO**, không EF/HTTP — leak nhẹ, không kéo persistence vào API. Trùng MIN-01 trong compliance report. |
| **Risk of fixing** | **Medium** — di chuyển exception hierarchy sang `Contracts` hoặc tạo `IApiException` marker + mapper (~5 exception types, 1 middleware, có thể ảnh hưởng Application throw sites) |
| **Business value** | **Low** — API contract ổn định qua `ApiResponse` envelope |
| **Regression risk** | **Medium** — mọi error path (403 Premium, 409 Attempt, 404, 429 AI token) |
| **Recommendation** | **Fix Later** |

**Đề xuất fix (ưu tiên sau V-03):**
1. Tạo `SEHub.Contracts.Exceptions` (hoặc base trong Contracts)
2. Application/Domain throw types implement/mirror Contracts exceptions
3. Middleware chỉ `using SEHub.Contracts.*`

**Không phải Critical** vì không có logic nghiệp vụ trong middleware — chỉ mapping.

---

# Advisory Dependencies

Các item dưới **không** vi phạm 4 rule audit chính nhưng được ghi trong dependency audit.

## A-01 — Infrastructure → Contracts (3 repositories)

| Files | `PostRepository`, `ExamRepository`, `DocumentRepository` |
|-------|----------------------------------------------------------|
| **Classification** | **2. Acceptable Pragmatic Dependency** |
| **Lý do** | Repositories dùng query param types (`ExamQueryParams`, feed filters) từ Contracts — read-model sharing, tránh duplicate DTO. Application vẫn là orchestrator. |
| **Risk of fixing** | **Medium** — duplicate types hoặc move params vào Application |
| **Business value** | **Low** |
| **Regression risk** | **Medium** — paging/filter APIs |
| **Recommendation** | **Do Not Fix** |

---

## A-02 — Infrastructure → Shared (3 files)

| Files | `CurrentUserService`, `UserRepository`, `DbSeeder` |
|-------|-----------------------------------------------------|
| **Classification** | **2. Acceptable Pragmatic Dependency** |
| **Lý do** | `RoleNames`, seed constants — shared kernel. Infrastructure đã reference Shared qua csproj (hợp lệ). |
| **Risk of fixing** | **Low** nhưng **không cần** |
| **Business value** | **None** |
| **Regression risk** | **Low** |
| **Recommendation** | **Do Not Fix** — **codify** Shared như layer được phép cho mọi tầng |

---

## A-03 — API → Shared (17 files)

| Usage | `PolicyNames`, `ErrorCodes` trong controllers/middleware |
|-------|----------------------------------------------------------|
| **Classification** | **2. Acceptable Pragmatic Dependency** |
| **Lý do** | Constants không chứa logic. Alternative (duplicate trong Contracts) tăng drift. |
| **Risk of fixing** | **Low** |
| **Business value** | **None** |
| **Regression risk** | **Low** |
| **Recommendation** | **Do Not Fix** |

---

## A-04 — Application → Shared (4 files)

| **Classification** | **2. Acceptable Pragmatic Dependency** |
| **Recommendation** | **Do Not Fix** |

---

# Decision Matrix (Summary)

| ID | Violation | Class | Fix risk | Business value | Regression | **Decision** |
|----|-----------|-------|----------|----------------|------------|--------------|
| **V-01** | API csproj → Infrastructure | Acceptable Pragmatic | High | Low | High | **Do Not Fix** |
| **V-02** | Program.cs → Infrastructure | Acceptable Pragmatic | High | Low | High | **Do Not Fix** |
| **V-03** | AuthorizationPolicies → Infra.Identity | Future Refactor | Medium | Low | Medium | **Fix Later** |
| **V-04** | ExceptionMiddleware → Domain.Exceptions | Future Refactor | Medium | Low | Medium | **Fix Later** |
| **A-01** | Infra repos → Contracts DTOs | Acceptable Pragmatic | Medium | Low | Medium | **Do Not Fix** |
| **A-02** | Infra → Shared | Acceptable Pragmatic | Low | None | Low | **Do Not Fix** |
| **A-03** | API → Shared | Acceptable Pragmatic | Low | None | Low | **Do Not Fix** |
| **A-04** | Application → Shared | Acceptable Pragmatic | Low | None | Low | **Do Not Fix** |

```mermaid
quadrantChart
    title Refactor Priority (Business Value vs Regression Risk)
    x-axis Low Regression Risk --> High Regression Risk
    y-axis Low Business Value --> High Business Value
    quadrant-1 Fix Later (careful)
    quadrant-2 Fix Now
    quadrant-3 Do Not Fix
    quadrant-4 Defer indefinitely
    V-03: [0.55, 0.15]
    V-04: [0.60, 0.15]
    V-01: [0.85, 0.10]
    V-02: [0.85, 0.10]
    A-01: [0.50, 0.10]
    A-02: [0.20, 0.05]
    A-03: [0.20, 0.05]
```

---

# Critical Violations: None Actionable Now

Không có violation nào đạt **Critical Architecture Violation** *và* đủ **business value** để **Fix Now**:

| Tiêu chí Critical (nếu có) | Thực tế SEHub |
|----------------------------|---------------|
| Circular dependency | **Không có** |
| Domain → Infrastructure/API | **Không có** |
| Application → Infrastructure (import) | **Không có** |
| Business logic trong API do leak | **Không** — controllers mỏng, gọi Application services |
| API → Infrastructure | Có, nhưng **one-way composition root** — industry standard |

Audit **FAIL** phản ánh **strict rule #4** (API chỉ Application + Contracts), không phản ánh **failure thực tế** của kiến trúc runtime.

---

# Suggested Roadmap (Fix Later items)

| Sprint | Item | Effort | Exit criteria |
|--------|------|--------|---------------|
| Arch-1 | V-03 — move auth handler registration to Infrastructure DI | 0.5 day | API không `using Infrastructure.Identity`; `RequirePremium` integration tests pass |
| Arch-2 | V-04 — exception types → Contracts | 1 day | Middleware không `using Domain`; all error codes unchanged |
| Arch-3 *(optional)* | V-01/V-02 — `SEHub.Composition` project | 2 days | API csproj chỉ Application + Contracts; audit rule #4 PASS |

**Không lên kế hoạch** cho A-01 → A-04 trừ khi mở rộng rule book chính thức cho `Shared`.

---

# Rule Book Update (đề xuất)

Để audit và runtime align, cập nhật rule #4:

```
API may reference:
  - Application
  - Contracts
  - Infrastructure  ← composition root only (DI bootstrap, no business imports in controllers)
  - Shared          ← constants/kernel
```

Với rule mở rộng này:

| Layer | Verdict |
|-------|---------|
| Domain | **PASS** |
| Application | **PASS** |
| Infrastructure | **PASS** |
| API | **PASS** (chỉ V-04 Domain import trong middleware còn lệch) |

---

# Final Verdict

| Question | Answer |
|----------|--------|
| Có Critical cần Fix Now? | **No** |
| Block FE integration? | **No** |
| Fix Later? | **V-03, V-04** |
| Do Not Fix? | **V-01, V-02, A-01 → A-04** |
| Audit FAIL có cần panic? | **No** — chấp nhận composition root; ưu tiên FE + MINOR backlog |
