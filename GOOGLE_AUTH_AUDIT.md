# Google Auth Audit

## Current Behavior

### Endpoint

`POST /api/v1/auth/google` — `AuthController.GoogleAuth`

**Request DTO:** `GoogleAuthRequest { IdToken }` (unchanged contract)

### `AuthService.GoogleAuthAsync` (current)

```csharp
var email = request.IdToken.Contains('@')
    ? request.IdToken
    : $"google_{request.IdToken}@stub.sehub.local";

var user = await _userRepository.FindOrCreateGoogleUserAsync(email, email.Split('@')[0], cancellationToken);
```

| Step | Behavior |
|------|----------|
| 1 | If `IdToken` contains `@`, treat the **entire string as email** |
| 2 | Otherwise, fabricate `google_{IdToken}@stub.sehub.local` |
| 3 | `FindOrCreateGoogleUserAsync` — match by email or auto-create Student |
| 4 | Check `RequireConfirmedEmail` (new Google users have `EmailConfirmed = false`) |
| 5 | `BuildLoginResponseAsync` — same JWT + refresh pipeline as email login |

### Validation

- **No `GoogleAuthRequestValidator`** registered in `DependencyInjection.cs`
- **No cryptographic verification** of the token
- **No rate limiting** on `/auth/google` (login/register are rate-limited)

### User Creation (`FindOrCreateGoogleUserAsync`)

- Role: **Student** (via `CreateAsync` → `AddToRoleAsync`)
- Username: derived from email local-part with numeric suffix for collisions
- Password: random `Google!{Guid}`
- **EmailConfirmed: false** (Identity default)
- DisplayName: email local-part only (not Google name)

### Frontend

- `LoginPage.jsx` / `RegisterPage.jsx` — Google button shows toast: *"chưa được kết nối API"*
- No Google Sign-In SDK integration on FE yet

### Tokens

- Uses `BuildLoginResponseAsync` ✓ (access + refresh + rotation on refresh)
- Reuses `JwtTokenService` ✓

---

## Security Risks

| Risk | Severity | Detail |
|------|----------|--------|
| **No ID token validation** | **Critical** | Any client can send an arbitrary string; if it contains `@`, it becomes a login email |
| **Account impersonation** | **Critical** | Attacker sends `{ "idToken": "victim@gmail.com" }` → logs in as victim if account exists |
| **Arbitrary account creation** | **Critical** | Attacker sends any email-shaped string → auto-creates account without proof of ownership |
| **Stub email fallback** | **High** | Non-email tokens create `google_{token}@stub.sehub.local` accounts — predictable namespace |
| **No issuer/audience/signature check** | **Critical** | Google JWT claims (iss, aud, exp, sub) are never inspected |
| **No `email_verified` check** | **High** | Even with real tokens, unverified Google emails could be trusted |
| **EmailConfirmed false for Google users** | **Medium** | Breaks when `Auth:RequireConfirmedEmail = true` |
| **No rate limiting** | **Medium** | Brute-force / abuse vector on open endpoint |

### Is `IdToken` Treated as Plain Email?

**Yes.** When `IdToken.Contains('@')` is true, the raw client-supplied string is used directly as the user email with zero verification.

---

## Required Fixes

1. **Validate Google ID Token** using official Google libraries (`Google.Apis.Auth`)
   - Verify signature (Google JWKS)
   - Validate issuer (`accounts.google.com` / `https://accounts.google.com`)
   - Validate audience (`GoogleAuthSettings.ClientId`)
   - Validate expiration
2. **Extract claims only from validated token** — `email`, `name`, `sub`; never trust client beyond `idToken`
3. **Require `email_verified == true`** from Google payload
4. **New Google users:** `EmailConfirmed = true`
5. **Existing users:** auto-confirm email on successful Google login (proves ownership)
6. **Add `GoogleAuthSettings`** (`ClientId`, `ClientSecret`) with User Secrets support
7. **Add `GoogleAuthRequestValidator`** (non-empty `IdToken`)
8. **Add `ErrorCodes.GoogleTokenInvalid`** with proper 403 mapping
9. **Apply login rate limiting** to `/auth/google`
10. **Unit + integration tests** with mock token validator

### Preserved (no changes)

- `GoogleAuthRequest` contract (`{ "idToken": "..." }`)
- Email/password login, OTP, forgot password, email verification
- `BuildLoginResponseAsync`, refresh token rotation/reuse detection
- Role system (Student default for new Google users)
