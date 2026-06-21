# SEHub — Template cấu hình bí mật (AN TOÀN để commit)

> Copy file này thành **`LOCAL_SECRETS.private.md`** (đã gitignore), điền giá trị thật, **không commit** bản private.

**Cập nhật mẫu:** 2026-06-21

---

## Checklist sau merge `main`

1. Tạo lại `be/src/SEHub.API/appsettings.Development.Local.json` từ `.example` hoặc từ backup private.
2. Cấu hình **Email SMTP** (mục dưới) nếu cần gửi OTP / mail Premium trên local.
3. Kiểm tra `fe/.env.development`.
4. `dotnet ef database update` nếu cần.
5. **Restart BE** sau khi đổi config Email.
6. Restart FE.

---

## Backend local JSON

Copy cấu trúc từ `be/src/SEHub.API/appsettings.Development.Local.json.example`, thêm `ConnectionStrings` nếu cần:

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
    "RefreshToken": "your-drive-refresh-token"
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
    "Model": "nex-agi/nex-n2-pro:free",
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

### Bảng key — điền placeholder

| Key | Ghi chú |
|-----|---------|
| `ConnectionStrings:DefaultConnection` | SQL Server instance + user/pass |
| `Email:Provider` | `Smtp` (gửi thật) hoặc bỏ block → mặc định `Logging` (chỉ console) |
| `Email:Smtp:Username` / `From` | Cùng một Gmail (ví dụ `sehub.noreply@gmail.com`) |
| `Email:Smtp:Password` | **App Password 16 ký tự** — copy 4 nhóm từ Google, có thể giữ dấu cách |
| `Google:ClientId` | OAuth Web client — trùng FE |
| `GoogleDrive:*` | FolderId, OAuth hoặc service account |
| `Cloudinary:*` | Cloud name, API key, secret |
| `PayOS:*` | ClientId, ApiKey, ChecksumKey, WebhookUrl (ngrok) |
| `Ai:Provider` | `OpenRouter` hoặc `Mock` |
| `Ai:ApiKey` | OpenRouter API key (openrouter.ai/keys) |
| `Ai:Model` | Ví dụ `nex-agi/nex-n2-pro:free` — không fallback model khác |
| `Ai:RequestTimeoutSeconds` | Timeout gọi OpenRouter (mặc định 120) |

### Email SMTP — hướng dẫn nhanh

1. Đăng nhập đúng tài khoản Gmail dùng làm `Username` / `From`.
2. Bật **Xác minh 2 bước** → tạo [App Password](https://myaccount.google.com/apppasswords).
3. Dán vào `Email:Smtp:Password` (khuyên dùng dạng `"abcd efgh ijkl mnop"`).
4. Restart BE — log: `SMTP email configuration present for host smtp.gmail.com:587`.
5. Test quên MK với **Gmail thật đã đăng ký** (không dùng `@sehub.local`).

| Luồng | Subject email |
|-------|----------------|
| OTP quên mật khẩu | `SEHub - Ma xac thuc OTP` |
| Xác nhận Premium | `SEHub - Xac nhan thanh toan Premium thanh cong` |

---

## Frontend `.env.development`

```env
VITE_API_BASE_URL=http://localhost:5006
VITE_GOOGLE_CLIENT_ID=<same-as-google-client-id>
```

---

## Tài khoản dev (seed — trong repo)

| Email | Password | Vai trò |
|-------|----------|---------|
| admin@sehub.local | Admin@123 | Admin |
| demo.student@sehub.local | Demo@12345 | Demo Premium |
| free.student@sehub.local | Free@12345 | Free |
| moderator@sehub.local | Mod@12345 | Moderator |

---

## URL dev

| Dịch vụ | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5006 |
| Swagger | http://localhost:5006/swagger |

---

## Lệnh chạy nhanh

```powershell
cd be\src\SEHub.API
dotnet run --launch-profile http

cd fe
npm run dev
```
