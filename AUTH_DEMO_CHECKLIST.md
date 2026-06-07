# Auth Demo Checklist

Pre-demo setup and walkthrough for guest and authenticated flows.

---

## Environment Setup

| Variable | Location | Value |
|----------|----------|-------|
| `VITE_API_BASE_URL` | `fe/.env.development` | `http://localhost:5006` |
| `VITE_GOOGLE_CLIENT_ID` | `fe/.env.development` | Google OAuth Web Client ID (**required for Google demo**) |
| `Google:ClientId` | `SEHub.API` appsettings | Same client ID as FE |
| `Jwt:Secret` | BE appsettings | Min 32 chars |
| SMTP / OTP | BE Development config | Email OTP for forgot-password & verify-email |

**Start services:**

```bash
# Backend (port 5006)
dotnet run --project SEHub.Backend/src/SEHub.API

# Frontend
cd fe && npm run dev
```

**Swagger:** `http://localhost:5006/swagger`

---

## Test Accounts

| Account | Email | Password | Role | Source |
|---------|-------|----------|------|--------|
| Admin (seeded) | `admin@sehub.local` | `Admin@123` | Admin | `DbSeeder.cs` |
| Student (register) | Create via `/register` | User-defined | Student | Live register |
| Integration test user | `free@test.local` | `Free@Test123` | Student | Test factory only |

> Production DB only seeds **admin**. Register a student account before student demo.

---

## Guest Demo

| Step | Route | Expected | API | Ready? |
|------|-------|----------|-----|--------|
| 1 | `/` | Landing page loads | — | ✅ |
| 2 | `/community` | Feed UI (mock data) | `GET /posts` not wired | ⚠️ UI only |
| 3 | `/community/documents` | Documents UI (mock) | BE requires auth | ⚠️ UI only |
| 4 | `/community/final-exam` | Exam catalog (mock) | `GET /exams` available | ⚠️ UI only |
| 5 | `/login` | Login form | `POST /auth/login` | ✅ |
| 6 | `/register` | Register form | `POST /auth/register` | ✅ |
| 7 | `/forgot-password` | 3-step reset flow | forgot/verify/reset | ✅ |
| 8 | Google button | GIS prompt → login | `POST /auth/google` | ⚠️ needs Client ID |

---

## Student Demo

| Step | Action | API | Ready? |
|------|--------|-----|--------|
| 1 | Register new account | `POST /auth/register` | ✅ |
| 2 | Auto-login after register | tokens stored | ✅ |
| 3 | Redirect to `/home` | PrivateRoute passes | ✅ |
| 4 | Session restore (refresh page) | `GET /auth/me` | ✅ |
| 5 | Token refresh (wait for JWT expiry or force 401) | `POST /auth/refresh` | ✅ (Phase 6) |
| 6 | Logout | `POST /auth/logout` | ✅ |
| 7 | Login again | `POST /auth/login` | ✅ |
| 8 | Google login | `POST /auth/google` | ⚠️ config |
| 9 | Verify email | send + verify endpoints | ❌ no FE page |

---

## Required Backend Data

| Feature | Minimum Data |
|---------|--------------|
| Auth login | Any registered user |
| Posts feed (API) | Published posts in DB |
| Documents (API) | Document catalog + auth user |
| Exams (API) | Published exams + questions |
| Forgot password | SMTP or dev email capture |
| Google login | Valid Google OAuth client + `Google:ClientId` |

---

## Swagger Endpoints to Demo

| Endpoint | Demo purpose |
|----------|--------------|
| `POST /api/v1/auth/register` | Create user |
| `POST /api/v1/auth/login` | Get tokens |
| `GET /api/v1/auth/me` | Authorize with Bearer |
| `POST /api/v1/auth/refresh` | Rotate tokens |
| `POST /api/v1/auth/logout` | Revoke session |
| `POST /api/v1/auth/forgot-password` | Trigger OTP |
| `POST /api/v1/auth/verify-otp` | Validate OTP |
| `POST /api/v1/auth/reset-password` | Complete reset |
| `POST /api/v1/auth/google` | Paste test idToken |
| `GET /api/v1/posts` | Guest feed (when FE wired) |
| `GET /api/v1/exams` | Guest exam catalog |

---

## Pre-Demo Verification

- [ ] Backend running on 5006
- [ ] `dotnet test` — 46/46 pass
- [ ] FE `VITE_API_BASE_URL` set
- [ ] Register + login manually once
- [ ] Forgot-password email delivery works
- [ ] `VITE_GOOGLE_CLIENT_ID` + BE `Google:ClientId` aligned (if demoing Google)
- [ ] CORS allows FE origin
