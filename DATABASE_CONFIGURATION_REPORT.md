# SEHub — Database Configuration Report

> **Ngày:** 2026-06-05  
> **Phạm vi:** Cập nhật Database Infrastructure & Configuration (không thay đổi Domain/Application/Business Logic)

---

## Executive Summary

Backend SEHub đã được cấu hình kết nối **SQL Server** instance `DESKTOP-AN9LFU8\SQL2019`, database **`SEHubDb`**, authentication **SQL Server (sa)**. Migration `InitialCreate` đã apply thành công, **DbSeeder** chạy thành công khi khởi động API ở môi trường Development.

| Hạng mục | Trạng thái |
|----------|------------|
| EF Core Code First + SqlServer provider | ✅ |
| Connection string Development | ✅ |
| `UseSqlServer(...)` trong DI | ✅ |
| DesignTimeDbContextFactory | ✅ (đọc appsettings) |
| `dotnet ef database update` | ✅ |
| Database `SEHubDb` tạo + 31 bảng | ✅ |
| Seeder (roles, levels, plans, admin) | ✅ |

---

## SQL Server Configuration

| Thuộc tính | Giá trị |
|------------|---------|
| **Server** | `DESKTOP-AN9LFU8\SQL2019` |
| **Database** | `SEHubDb` |
| **Authentication** | SQL Server Authentication |
| **User** | `sa` |
| **Provider** | `Microsoft.EntityFrameworkCore.SqlServer` v8.0.11 |
| **Strategy** | Entity Framework Core Code First |

---

## Connection String

### Development (`appsettings.Development.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=DESKTOP-AN9LFU8\\SQL2019;Database=SEHubDb;User Id=sa;Password=123456;TrustServerCertificate=True;MultipleActiveResultSets=True"
  }
}
```

**File:** [SEHub.Backend/src/SEHub.API/appsettings.Development.json](SEHub.Backend/src/SEHub.API/appsettings.Development.json)

### Base (`appsettings.json`)

Vẫn giữ connection string LocalDB làm fallback khi không chạy Development environment:

```
Server=(localdb)\mssqllocaldb;Database=SEHubDb;Trusted_Connection=True;...
```

> Khi chạy `ASPNETCORE_ENVIRONMENT=Development` (mặc định trong `launchSettings.json`), **Development.json override** connection string SQL Server ở trên.

---

## Infrastructure Configuration

### 1. `SEHubDbContext`

- **File:** [SEHub.Backend/src/SEHub.Infrastructure/Persistence/SEHubDbContext.cs](SEHub.Backend/src/SEHub.Infrastructure/Persistence/SEHubDbContext.cs)
- Kế thừa `IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>`
- Global query filter soft-delete: `Post`, `Comment`, `Document`
- **31 DbSet** cho toàn bộ domain entities + Identity tables

### 2. Dependency Injection — `UseSqlServer`

**File:** [SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs](SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs)

```csharp
services.AddDbContext<SEHubDbContext>((sp, options) =>
{
    var interceptor = sp.GetRequiredService<SoftDeleteInterceptor>();
    options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));
    options.AddInterceptors(interceptor);
});
```

> `Program.cs` gọi `builder.Services.AddInfrastructure(builder.Configuration)` — **tương đương** yêu cầu `AddDbContext` + `UseSqlServer` trong Program, không duplicate registration.

**File:** [SEHub.Backend/src/SEHub.API/Program.cs](SEHub.Backend/src/SEHub.API/Program.cs)

```csharp
builder.Services.AddInfrastructure(builder.Configuration);
// ...
await DbSeeder.SeedAsync(app.Services); // Development/Production (trừ Testing)
```

### 3. `DesignTimeDbContextFactory`

**File:** [SEHub.Backend/src/SEHub.Infrastructure/Persistence/DesignTimeDbContextFactory.cs](SEHub.Backend/src/SEHub.Infrastructure/Persistence/DesignTimeDbContextFactory.cs)

- Đọc `appsettings.json` + `appsettings.{Environment}.json` từ project `SEHub.API`
- Dùng `options.UseSqlServer(connectionString)` — đồng bộ với runtime DI
- Packages bổ sung: `Microsoft.Extensions.Configuration.Json`, `.FileExtensions`, `.EnvironmentVariables`

### 4. EF Tools

- `Microsoft.EntityFrameworkCore.Tools` 8.0.11 — trong `SEHub.Infrastructure`
- `Microsoft.EntityFrameworkCore.Design` 8.0.11 — **thêm vào** `SEHub.API` (startup project) để `dotnet ef` hoạt động

---

## Migration Status

### Migrations trong solution

| Migration ID | Tên | Trạng thái |
|--------------|-----|------------|
| `20260605033348` | `InitialCreate` | **Applied** |

### Lệnh thực thi

```bash
cd SEHub.Backend
$env:ASPNETCORE_ENVIRONMENT="Development"
dotnet ef database update --project src/SEHub.Infrastructure --startup-project src/SEHub.API
```

**Kết quả:**

```
Applying migration '20260605033348_InitialCreate'.
Done.
```

```bash
dotnet ef migrations list --project src/SEHub.Infrastructure --startup-project src/SEHub.API
```

**Kết quả:**

```
20260605033348_InitialCreate
```

### Compile status

- `SEHub.Infrastructure` build: **SUCCESS** (0 errors)
- Migration C# files compile: **SUCCESS**

---

## Database Creation Status

**Verification qua `sqlcmd`:**

```sql
SELECT name FROM sys.tables ORDER BY name;
```

| Metric | Kết quả |
|--------|---------|
| Database tồn tại | ✅ `SEHubDb` |
| Số bảng | **31** (gồm `__EFMigrationsHistory`) |
| EF Provider log | `Microsoft.EntityFrameworkCore.SqlServer:8.0.11` |
| Server kết nối | `DESKTOP-AN9LFU8\SQL2019` |

### Bảng chính đã tạo

`AspNetUsers`, `AspNetRoles`, `UserProfiles`, `Posts`, `Comments`, `PostLikes`, `PostReports`, `Exams`, `Questions`, `QuestionOptions`, `ExamAttempts`, `PracticeSubmissions`, `Documents`, `DocumentCategories`, `SubscriptionPlans`, `Subscriptions`, `PaymentOrders`, `PaymentAuditLogs`, `LevelConfigs`, `Badges`, `UserBadges`, `AiTokenDailyUsages`, `UserBans`, `RefreshTokens`, `OtpVerifications`, ...

---

## Seeder Status

**File:** [SEHub.Backend/src/SEHub.Infrastructure/Persistence/DbSeeder.cs](SEHub.Backend/src/SEHub.Infrastructure/Persistence/DbSeeder.cs)

Seeder chạy tự động khi API start (trừ environment `Testing`), gọi `context.Database.MigrateAsync()` trước khi seed.

### Log khi chạy API (Development)

| Hạng mục | Log | DB verify |
|----------|-----|-----------|
| Roles | Created role Student, Moderator, Admin | `AspNetRoles` = **3** |
| LevelConfigs | Seeded 4 level configs | `LevelConfigs` = **4** |
| SubscriptionPlans | Seeded 3 subscription plans | `SubscriptionPlans` = **3** |
| Admin user | Seeded admin user `admin@sehub.local` | Email tồn tại trong `AspNetUsers` |

### Dev admin credentials (seed)

| Field | Value |
|-------|-------|
| Email | `admin@sehub.local` |
| Password | `Admin@123` |
| Role | Admin |

**Trạng thái Seeder: ✅ SUCCESS**

---

## Files Changed (Configuration Only)

| File | Thay đổi |
|------|----------|
| `src/SEHub.API/appsettings.Development.json` | Connection string SQL Server |
| `src/SEHub.Infrastructure/Persistence/DesignTimeDbContextFactory.cs` | Đọc appsettings + `UseSqlServer` |
| `src/SEHub.Infrastructure/SEHub.Infrastructure.csproj` | +Configuration packages |
| `src/SEHub.API/SEHub.API.csproj` | +`Microsoft.EntityFrameworkCore.Design` 8.0.11 |

**Không thay đổi:** Domain, Application services, Controllers, Business logic.

---

## Warnings & Notes (Non-blocking)

| # | Mô tả | Mức độ |
|---|-------|--------|
| 1 | EF warning: `Post` global query filter vs `PostLike`/`PostReport` required relationship | Info — có sẵn từ trước, không liên quan DB config |
| 2 | `appsettings.json` base vẫn dùng LocalDB — chỉ Development trỏ SQL Server | By design — override khi `ASPNETCORE_ENVIRONMENT=Development` |
| 3 | Mật khẩu `sa` lưu plaintext trong `appsettings.Development.json` | **Security risk** — nên chuyển sang User Secrets / Key Vault cho staging/prod |
| 4 | `AutoMapper` 12.0.1 NU1903 vulnerability warning khi build | Không liên quan DB — existing package warning |

---

## Errors Encountered During Setup

| Lỗi | Nguyên nhân | Cách xử lý |
|-----|-------------|------------|
| `Startup project doesn't reference Microsoft.EntityFrameworkCore.Design` | Thiếu package trên `SEHub.API` | Đã thêm `Microsoft.EntityFrameworkCore.Design` 8.0.11 |
| Build file lock `SEHub.API (27528)` | API process còn chạy sau `dotnet run` test seeder | Đã `Stop-Process` — không ảnh hưởng migration/seed |

**Không có lỗi kết nối SQL Server** sau khi cấu hình connection string.

---

## Quick Reference Commands

```bash
# Apply migrations
cd SEHub.Backend
$env:ASPNETCORE_ENVIRONMENT="Development"
dotnet ef database update --project src/SEHub.Infrastructure --startup-project src/SEHub.API

# List migrations
dotnet ef migrations list --project src/SEHub.Infrastructure --startup-project src/SEHub.API

# Run API (triggers seeder)
dotnet run --project src/SEHub.API
```

---

## Final Status

| Deliverable | Status |
|-------------|--------|
| SQL Server configuration | ✅ Complete |
| Connection string Development | ✅ Complete |
| `UseSqlServer` in infrastructure | ✅ Verified |
| Migration compile & apply | ✅ Success |
| Database `SEHubDb` created | ✅ 31 tables |
| Seeder executed | ✅ Roles, Levels, Plans, Admin |

**Database configuration: READY for Development on `DESKTOP-AN9LFU8\SQL2019`.**
