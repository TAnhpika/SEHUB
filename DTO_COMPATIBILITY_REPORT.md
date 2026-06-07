# DTO Compatibility Report

Compares frontend informal shapes (`authMapper.js`, page forms) vs backend `SEHub.Contracts` DTOs.

---

## Auth DTOs

### LoginRequest

| Field | BE | FE (`authApi.login`) | Match |
|-------|-----|----------------------|-------|
| `emailOrUsername` | string | `credentials.username` mapped | **Matched** |
| `password` | string | `credentials.password` | **Matched** |

### RegisterRequest

| Field | BE | FE | Match |
|-------|-----|-----|-------|
| `email` | string | `email.trim()` | **Matched** |
| `username` | string, 3–50, `^[a-zA-Z0-9_]+$` | `deriveUsernameFromEmail()` | **Matched** |
| `password` | string, 8–128 | validated client-side (complexity added) | **Matched** |
| `displayName` | string?, max 100 | `fullName` or username | **Matched** |

**Mismatch:** BE register validator does not require password complexity; FE enforces uppercase/lowercase/digit/special (stricter — acceptable).

### GoogleAuthRequest

| Field | BE | FE | Match |
|-------|-----|-----|-------|
| `idToken` | string | GIS `credential` | **Matched** |

### RefreshTokenRequest

| Field | BE | FE | Match |
|-------|-----|-----|-------|
| `refreshToken` | string, max 256 | `localStorage sehubs_refresh_token` | **Matched** (Phase 6) |

### ForgotPassword / VerifyOtp / ResetPassword

| DTO | BE Fields | FE Fields | Match |
|-----|-----------|-----------|-------|
| ForgotPasswordRequest | `email` | `email` | **Matched** |
| VerifyOtpRequest | `email`, `code` | `email`, `code` | **Matched** |
| ResetPasswordRequest | `email`, `code`, `newPassword` | same | **Matched** |

**Reset password:** BE requires complexity regex; FE `ForgotPasswordPage` `isValidResetPassword` aligned.

### LoginResponse

| Field | BE | FE Storage | Match |
|-------|-----|------------|-------|
| `accessToken` | string | `sehubs_token` | **Matched** |
| `expiresIn` | int (seconds) | Not stored | **Missing** (not used for proactive refresh) |
| `refreshToken` | string | `sehubs_refresh_token` | **Matched** (Phase 6) |
| `refreshExpiresIn` | int | Not stored | **Missing** |
| `user` | `AuthUserDto` | mapped via `mapApiUser` | **Matched** |

### AuthUserDto / MeResponse

| Field | BE | FE `user` object | Match |
|-------|-----|------------------|-------|
| `id` | Guid | `id` | **Matched** |
| `username` | string | `username` | **Matched** |
| `email` | string | `email` | **Matched** |
| `displayName` | string | `displayName` | **Matched** |
| `role` | string (`Student`/`Moderator`/`Admin`) | lowercased `role` | **Matched** (case transform) |
| `isPremium` | bool | `isPremium` | **Matched** |
| `avatarUrl` | string? | `avatarUrl` | **Matched** |
| `points` | int | `points` | **Matched** |
| `levelName` | string? | `level` (renamed) | **Matched** (rename only) |

**FE-only fields (defaults):** `streak`, `unreadNotifications`, `levelProgress`, `pointsToNext`, `initial`, `roleLabel` — not from BE.

### ApiResponse Envelope

| Field | BE | FE `httpClient` | Match |
|-------|-----|-----------------|-------|
| `success` | bool | checked | **Matched** |
| `data` | T | returned | **Matched** |
| `message` | string? | used in errors | **Matched** |
| `errors[]` | `{ field, message }` | `ApiError.errors` | **Matched** |

---

## Feed / Documents / Exams (Guest Features)

| DTO Area | FE Types | BE Contracts | Status |
|----------|----------|--------------|--------|
| Posts | Mock objects in `feedData.js` | `PostListItemDto`, `PostDetailDto` | **Missing** — no FE types |
| Documents | Mock in `reviewData.js` | `DocumentListItemDto` | **Missing** |
| Exams | Mock in `examDetailData.js` | `ExamListItemDto`, `QuestionPublicDto` | **Missing** |
| Pagination | Local arrays | `PagedResult<T>` (`items`, `page`, `totalCount`, …) | **Missing** |

---

## Enum Compatibility

| Enum | BE | FE | Match |
|------|-----|-----|-------|
| `role` | `Student`, `Moderator`, `Admin` | `student`, `moderator`, `admin` | **Matched** (tolower in mapper) |
| `PostStatus` | enum | mock strings | **N/A** |
| `ExamType` | enum | mock strings | **N/A** |
| `AccessTier` | enum | mock strings | **N/A** |

---

## Summary

| Category | Matched | Mismatched | Missing |
|----------|---------|------------|---------|
| Auth request DTOs | 10 | 0 | 0 |
| Auth response DTOs | 8 | 0 | 2 (`expiresIn`, `refreshExpiresIn` unused) |
| Auth user mapping | 8 | 0 | 4 FE-only UI fields |
| Domain DTOs (posts/docs/exams) | 0 | 0 | All |
| ApiResponse envelope | 4 | 0 | 0 |

**Auth DTO compatibility: Strong.** Domain feature DTOs not yet integrated on frontend.
