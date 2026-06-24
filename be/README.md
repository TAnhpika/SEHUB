# be

ASP.NET Core 8 Web API — Clean Architecture backend for SEHub MVP (Giai đoạn 1).

## Solution structure

| Project | Layer |
|---------|-------|
| `SEHub.API` | Presentation — controllers, middleware, filters |
| `SEHub.Application` | Business logic — services, validators |
| `SEHub.Domain` | Entities, enums, domain exceptions |
| `SEHub.Infrastructure` | EF Core, Identity, PayOS, file storage |
| `SEHub.Contracts` | Request/Response DTOs, `ApiResponse<T>` |
| `SEHub.Shared` | Constants (`RoleNames`, `ErrorCodes`, `PolicyNames`) |

## Prerequisites

- .NET 8 SDK
- [Supabase](https://supabase.com) project (PostgreSQL) — use **Session pooler** connection string

## Quick start

```bash
cd be
dotnet restore
```

Copy `src/SEHub.API/appsettings.Development.Local.json.example` → `appsettings.Development.Local.json` and fill your Supabase pooler connection string (`Host`, `Username`, `Password`).

```bash
dotnet ef database update --project src/SEHub.Infrastructure --startup-project src/SEHub.API
dotnet run --project src/SEHub.API --launch-profile http
```

- Swagger: `https://localhost:7xxx/swagger`
- Health: `GET /health`
- API base: `/api/v1`

## Dev seed credentials

Seeded automatically in **Development** (`DbSeeder` + `DemoDataSeeder`).

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | `admin@sehub.local` | `Admin@123` | DbSeeder |
| Student (Premium) | `demo.student@sehub.local` | `Demo@12345` | Active 1-month subscription |
| Student (Free) | `free.student@sehub.local` | `Free@12345` | No premium |
| Moderator | `moderator@sehub.local` | `Mod@12345` | Moderation APIs |

Demo data also includes 5+ community posts, 2 pending post reports, final/practice exams, and one PDF document. See `SEHub.API.http` for smoke requests.

## Configuration

Copy `appsettings.Development.json` values or use user secrets:

```bash
dotnet user-secrets set "Jwt:Key" "your-256-bit-secret-key-here-min-32-chars" --project src/SEHub.API
```

Key sections: `ConnectionStrings` (Supabase PostgreSQL), `Jwt`, `PayOS`, `FileStorage`, `Cors`, `Ai`.

## Tests

```bash
dotnet test
```

- **Unit tests:** `tests/SEHub.Application.UnitTests`
- **Integration tests:** `tests/SEHub.API.IntegrationTests`

## FE integration (Swagger / Postman)

| Resource | Path |
| -------- | ---- |
| Swagger UI | `http://localhost:5006/swagger` (dev) |
| FE quickstart | [docs/FE_API_QUICKSTART.md](docs/FE_API_QUICKSTART.md) |
| REST Client | [src/SEHub.API/SEHub.API.http](src/SEHub.API/SEHub.API.http) |
| Postman collection | [postman/SEHub-FE.postman_collection.json](postman/SEHub-FE.postman_collection.json) |

**Register password:** min 8 chars, uppercase + lowercase + digit + special character (e.g. `Student@123`).

## Documentation

- Architecture: [ARCHITECTURE-BE.md](../ARCHITECTURE-BE.md)
- Implementation plan: [BACKEND_IMPLEMENTATION_PLAN.md](../BACKEND_IMPLEMENTATION_PLAN.md)
