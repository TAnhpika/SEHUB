# Google Account Linking Audit

## Linking Strategy (Current)

Account matching is **email-only** via `UserRepository.GetByEmailAsync` / `FindOrCreateGoogleUserAsync`. Google `sub` (subject) is validated but **not persisted** in the database.

---

## Case A: Email/Password Register → Later Google Login (Same Email)

### Flow

```
Register(email) → User created (EmailConfirmed=false by default)
       ↓
Google Login(valid idToken, same email)
       ↓
FindOrCreateGoogleUserAsync(email)
  → GetByEmailAsync finds existing user
  → returns existing (no CreateAsync)
       ↓
if !EmailConfirmed → ConfirmEmailAsync
       ↓
BuildLoginResponseAsync → login
```

### Verification

| Check | Result |
|-------|--------|
| Duplicate account created? | **No** — `GetByEmailAsync` short-circuits before `CreateAsync` |
| Same user ID reused? | **Yes** |
| Email auto-confirmed via Google? | **Yes** — `ConfirmEmailAsync` when `EmailConfirmed=false` |
| Password preserved? | **Yes** — Identity password hash unchanged |
| User can still email/password login? | **Yes** — `ValidatePasswordAsync` unchanged |
| Integration test | `GoogleAuth_WithValidToken_ExistingUser_ReturnsLoginResponse` uses seeded email user |

**Verdict: PASS**

---

## Case B: Google Register → Later Google Login Again

### Flow

```
First Google Login → FindOrCreateGoogleUserAsync
  → no user → CreateAsync(EmailConfirmed=true, Role=Student)
       ↓
Second Google Login (same email)
  → GetByEmailAsync → existing user returned
       ↓
BuildLoginResponseAsync
```

### Verification

| Check | Result |
|-------|--------|
| Duplicate account? | **No** |
| Integration test | `GoogleAuth_DuplicateLogin_DoesNotCreateDuplicateAccounts` — DB count = 1 |

**Verdict: PASS**

---

## Case C: Google Register → Forgot Password

### Flow

```
Google user created with:
  - Email = payload.Email
  - Password = random Google!{Guid} (unknown to user)
  - EmailConfirmed = true

Forgot Password:
  SendForgotPasswordOtpAsync
    → GetByEmailAsync finds Google user
    → OTP sent

Verify OTP → Reset Password
  → UpdatePasswordAsync (Identity ResetPasswordAsync)
  → Refresh tokens revoked
```

### Verification

| Check | Result |
|-------|--------|
| OTP sent for Google user email? | **Yes** — user exists in Identity store |
| Password reset works? | **Yes** — `UpdatePasswordAsync` uses Identity reset token |
| User can login with new password? | **Yes** — standard email/password path |
| User can still Google login? | **Yes** — Google path independent of password |
| Google-only user blocked from forgot-password? | **No** — flow is supported |

**Verdict: PASS**

---

## Edge Cases

| Scenario | Behavior | Risk |
|----------|----------|------|
| Register email already used by Google user | `409 Conflict` — `Email is already registered` | **PASS** — no duplicate |
| Google login, email exists, different Google `sub` | Email match links to same account | **MAJOR** — no `sub` storage; account takeover if email ownership changes at Google |
| Google `sub` stored | Not implemented | **MINOR** — future enhancement |
| DisplayName update on re-login | Not updated for existing users | **MINOR** — name from first registration kept |
| Username collision | Suffix increment (`user1`, `user2`) on Google create only | **PASS** |

---

## Summary

| Case | Expected | Actual | Verdict |
|------|----------|--------|---------|
| A — Email user → Google same email | Reuse account | Reuse + auto-confirm | **PASS** |
| B — Google → Google re-login | No duplicate | No duplicate | **PASS** |
| C — Google → Forgot Password | Works | Full OTP reset path works | **PASS** |

**Account linking by email works correctly.** Primary gap: no persistent Google `sub` for strong OAuth identity binding.
