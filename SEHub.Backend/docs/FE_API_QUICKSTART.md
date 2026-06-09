# SEHub — FE API Quickstart (Backend)

> Nguồn: [ARCHITECTURE-BE.md](../../ARCHITECTURE-BE.md) · [BACKEND_IMPLEMENTATION_PLAN.md](../../BACKEND_IMPLEMENTATION_PLAN.md)  
> Branch backend: `Hau_Authen_BE` (chưa merge `main`)

## Dev URLs

| Mục | URL |
| --- | --- |
| API base | `http://localhost:5006/api/v1` |
| Swagger | `http://localhost:5006/swagger` |
| Health | `http://localhost:5006/health` |
| OpenAPI JSON | `http://localhost:5006/swagger/v1/swagger.json` |

## Chạy backend

```powershell
cd SEHub.Backend
dotnet run --project src/SEHub.API --launch-profile http
```

## Response envelope

Mọi endpoint (trừ `/health`, PayOS webhook) trả:

```json
{
  "success": true,
  "data": { },
  "message": null,
  "errors": []
}
```

- **400** — validation (`message`: "Dữ liệu không hợp lệ", `errors[].field` camelCase, `errors[].message`)
- **401** — thiếu/hết hạn JWT → FE logout + redirect login
- **403** — `PREMIUM_REQUIRED`, `ACCOUNT_BANNED`, …
- **409** — conflict (email/username trùng, active exam attempt, …)

## Auth (wire FE đầu tiên)

### Register

`POST /api/v1/auth/register`

**Password policy (bắt buộc):**

- Tối thiểu 8 ký tự
- Ít nhất 1 chữ HOA, 1 chữ thường, 1 số, 1 ký tự đặc biệt

Ví dụ hợp lệ: `Student@123`, `Demo@12345`, `Admin@123`  
Ví dụ **không** hợp lệ: `hauvip123` → **400**:

```json
{
  "success": false,
  "data": null,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    { "field": "password", "message": "Password must contain an uppercase letter." },
    { "field": "password", "message": "Password must contain a special character." }
  ]
}
```

```json
{
  "email": "student@fpt.edu.vn",
  "username": "student01",
  "password": "Student@123",
  "displayName": "Nguyen Van A"
}
```

Response `data` giống login: `accessToken`, `refreshToken`, `user`, …

### Login

`POST /api/v1/auth/login`

```json
{
  "emailOrUsername": "admin@sehub.local",
  "password": "Admin@123"
}
```

### Axios

```javascript
axios.defaults.baseURL = "http://localhost:5006/api/v1";
axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
```

## Tài khoản dev

| Email | Password | Role |
| --- | --- | --- |
| admin@sehub.local | Admin@123 | Admin |
| demo.student@sehub.local | Demo@12345 | Student |

## Test không cần FE

| Công cụ | File |
| --- | --- |
| REST Client | `src/SEHub.API/SEHub.API.http` |
| Postman | `postman/SEHub-FE.postman_collection.json` |
| Swagger UI | `/swagger` → Authorize Bearer |

## Thứ tự tích hợp FE (gợi ý)

1. Auth — register, login, me, logout, refresh  
2. Feed — GET posts, featured, like, comment  
3. Exams — list, questions, attempts (Premium)  
4. Documents — list, preview (PrivateRoute)  
5. Premium — plans, orders, subscription  
6. Profile — GET `/{username}`, PUT `/me`, GET `/me/stats`  
7. Admin — sau cùng  

## Export Swagger cho codegen (tuỳ chọn)

```powershell
curl http://localhost:5006/swagger/v1/swagger.json -o swagger.json
```
