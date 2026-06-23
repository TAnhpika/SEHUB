# SEHub — Template cấu hình bí mật (AN TOÀN để commit)

> Copy file này thành **`LOCAL_SECRETS.private.md`** (đã gitignore), điền giá trị thật, **không commit** bản private.

**Cập nhật mẫu:** 2026-06-21 · **Branch:** `Hau_BE`

---

## Checklist setup local

1. Tạo `be/src/SEHub.API/appsettings.Development.Local.json` (JSON mục 2).
2. Tạo `LOCAL_SECRETS.private.md` — backup key ra ngoài repo.
3. Kiểm tra `fe/.env.development` — `VITE_GOOGLE_CLIENT_ID` khớp `Google:ClientId` BE.
4. `dotnet ef database update` nếu thiếu bảng.
5. **Restart BE** (`http://localhost:5006`) sau mọi thay đổi config.
6. Restart FE (`http://localhost:5173`).
7. PayOS webhook: cập nhật ngrok nếu subdomain đổi.

---

## 1. File cấu hình (gitignored / local)

| File | Mục đích |
|------|----------|
| `be/src/SEHub.API/appsettings.Development.Local.json` | DB, SMTP, Google, Drive, Cloudinary, PayOS, OpenRouter |
| `LOCAL_SECRETS.private.md` | Backup markdown (secret thật) |
| `fe/.env.development` | `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID` |
| `be/secrets/` | Service account Google Drive (optional) |

**Mẫu JSON:** `be/src/SEHub.API/appsettings.Development.Local.json.example`

---

## 2. Backend — `appsettings.Development.Local.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_INSTANCE;Database=SEHubDb;User Id=...;Password=...;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "Email": {
    "Provider": "Smtp",
    "Smtp": {
      "Host": "smtp.gmail.com",
      "Port": 587,
      "Username": "your-noreply@gmail.com",
      "Password": "xxxx xxxx xxxx xxxx",
      "From": "your-noreply@gmail.com",
      "FromDisplayName": "SEHub",
      "EnableSsl": true
    }
  },
  "Google": {
    "ClientId": "your-google-oauth-client-id.apps.googleusercontent.com"
  },
  "GoogleDrive": {
    "FolderId": "your-drive-folder-id",
    "OAuthClientId": "your-oauth-client-id.apps.googleusercontent.com",
    "OAuthClientSecret": "your-oauth-client-secret",
    "RefreshToken": "your-drive-refresh-token",
    "ServiceAccountPath": "../../secrets/sehub-drive-service.json",
    "ImpersonateUser": ""
  },
  "Cloudinary": {
    "CloudName": "your_cloud_name",
    "ApiKey": "your_api_key",
    "ApiSecret": "your_api_secret",
    "Secure": true,
    "AvatarFolder": "sehub/avatars",
    "PostFolder": "sehub/posts",
    "ChatFolder": "sehub/chat"
  },
  "PayOS": {
    "ClientId": "your-payos-client-id",
    "ApiKey": "your-payos-api-key",
    "ChecksumKey": "your-payos-checksum-key",
    "FrontendBaseUrl": "http://localhost:5173",
    "ReturnUrl": "http://localhost:5173/home/premium/payment-return?orderId={orderId}",
    "CancelUrl": "http://localhost:5173/home/premium?cancelled=1",
    "WebhookUrl": "https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app/api/v1/premium/webhooks/payos"
  },
  "Ai": {
    "Provider": "OpenRouter",
    "ApiKey": "your-openrouter-api-key",
    "Model": "poolside/laguna-m.1:free",
    "BaseUrl": "https://openrouter.ai/api/v1",
    "HttpReferer": "http://localhost:5173",
    "SiteTitle": "SEHub",
    "RequestTimeoutSeconds": 120,
    "MaxTokens": 1024,
    "DailyTokenLimitFree": 10,
    "DailyTokenLimitPremium": 1000,
    "TokenCostExplain": 10,
    "TokenCostChat": 10
  }
}
```

| Key | Ghi chú |
|-----|---------|
| `Ai:Provider` | `OpenRouter` + `ApiKey` → AI thật · thiếu key → `Mock` |
| `Ai:Model` | `poolside/laguna-m.1:free` · không fallback model khác |
| `Ai:RequestTimeoutSeconds` | 120 (giây) |
| `Cloudinary:*` | Avatar / post / chat |
| `GoogleDrive:*` | PDF đề, tài liệu |
| `PayOS:WebhookUrl` | ngrok + `/api/v1/premium/webhooks/payos` |

---

## 3. Frontend — `fe/.env.development`

```env
VITE_API_BASE_URL=http://localhost:5006
VITE_GOOGLE_CLIENT_ID=<same-as-google-client-id>
```

### Chuyển khoản Premium (FE)

`fe/src/features/landing/PricingModal/pricingData.js` → `PAYMENT_INFO`:

| Field | Dev |
|-------|-----|
| Ngân hàng | MB Bank |
| Số TK | `0001137880784` |
| Chủ TK | MAC TU HAU |

---

## 4. JWT dev (trong repo)

`be/src/SEHub.API/appsettings.json` → `Jwt:Secret = SEHub-Dev-Secret-Key-Min-32-Chars-Long!`

---

## 5. Tài khoản dev (seed)

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | `admin@sehub.local` | `Admin@123` |
| Demo Premium | `demo.student@sehub.local` | `Demo@12345` |
| Free | `free.student@sehub.local` | `Free@12345` |
| Moderator | `moderator@sehub.local` | `Mod@12345` |

---

## 6. URL dev

| Dịch vụ | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5006 |
| Swagger | http://localhost:5006/swagger |

---

## 7. Lệnh chạy

```powershell
cd be\src\SEHub.API; dotnet run --launch-profile http
cd fe; npm run dev
```
