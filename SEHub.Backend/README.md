# SEHub.Backend

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
- SQL Server (LocalDB on Windows, or Docker SQL Server)

## Quick start

```bash
cd SEHub.Backend
dotnet restore
dotnet ef database update --project src/SEHub.Infrastructure --startup-project src/SEHub.API
dotnet run --project src/SEHub.API
```

- Swagger: `https://localhost:7xxx/swagger`
- Health: `GET /health`
- API base: `/api/v1`

## Dev seed credentials

| Field | Value |
|-------|-------|
| Email | `admin@sehub.local` |
| Password | `Admin@123` |
| Role | Admin |

## Configuration

Copy `appsettings.Development.json` values or use user secrets:

```bash
dotnet user-secrets set "Jwt:Key" "your-256-bit-secret-key-here-min-32-chars" --project src/SEHub.API
```

Key sections: `ConnectionStrings`, `Jwt`, `PayOS`, `FileStorage`, `Cors`, `Ai`.

## Tests

```bash
dotnet test
```

- **Unit tests:** `tests/SEHub.Application.UnitTests` (11 tests)
- **Integration tests:** `tests/SEHub.API.IntegrationTests` (5 tests)

## Documentation

- Architecture: [ARCHITECTURE-BE.md](../ARCHITECTURE-BE.md)
- Implementation plan: [BACKEND_IMPLEMENTATION_PLAN.md](../BACKEND_IMPLEMENTATION_PLAN.md)
