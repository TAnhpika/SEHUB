# Google Authorization Audit

## Role Assignment at Creation

`UserRepository.FindOrCreateGoogleUserAsync` → `CreateAsync` → `AddToRoleAsync(user, RoleNames.Student)`.

| Property | Value for new Google users |
|----------|---------------------------|
| Role | **Student** |
| EmailConfirmed | **true** |
| Level | Lowest `LevelConfig` (Bronze) |
| Profile | `UserProfile` created |

Existing users linked by email retain their current role (Student/Moderator/Admin).

---

## JWT Role Claim

`JwtTokenService.GenerateAccessToken` embeds `ClaimTypes.Role` from `UserAccount.Role`.

`UserRepository.MapUserAsync` resolves role:

```
Admin > Moderator > Student (default)
```

Google-created users get `Role = "Student"` in JWT.

---

## Authorization Policies

| Policy | Requirement | Google Student |
|--------|-------------|----------------|
| `RequireAuthenticated` | Valid JWT | **Allowed** |
| `RequirePremium` | JWT + active subscription | **Allowed** if subscribed |
| `RequireModerator` | Role Moderator or Admin | **Denied** (403) |
| `RequireAdmin` | Role Admin | **Denied** (403) |

Policies defined in `AuthorizationPolicies.cs`. Role checked via `RequireRole` — standard ASP.NET Core JWT role claims.

---

## Endpoint Access Matrix (Google Student)

### Allowed — Student / Authenticated

| Area | Endpoint pattern | Policy |
|------|------------------|--------|
| Auth | `GET /api/v1/auth/me`, `POST /logout` | `RequireAuthenticated` |
| Posts | `POST /posts`, `POST /posts/{id}/like`, comments | `RequireAuthenticated` |
| Posts (read) | `GET /posts`, `GET /posts/{id}` | `AllowAnonymous` |
| Documents | `GET /documents/*` (authenticated reads) | `RequireAuthenticated` |
| Exams (basic) | `GET /exams`, published exam queries | Mostly `AllowAnonymous` / `RequireAuthenticated` |
| Profiles | `GET/PUT /profiles/me` | `RequireAuthenticated` |
| Premium (own) | subscription status, orders | `RequireAuthenticated` |

Integration evidence: `PostsEndpointsTests` uses Student JWT from `CustomWebApplicationFactory.FreeUserEmail` — same token path as Google login output.

### Denied — Moderator / Admin Only

| Area | Policy | Google Student |
|------|--------|----------------|
| `Admin/*` controllers | `RequireAdmin` | **403 Forbidden** |
| `Admin/ModerationController` | `RequireModerator` | **403 Forbidden** |
| `PostsController` moderation actions | `RequireModerator` | **403 Forbidden** |
| `PracticeSubmissionsController` grading | `RequireModerator` | **403 Forbidden** |
| Premium exam AI features | `RequirePremium` | **403** without subscription (not role-based) |

### Additional Gate: Banned Users

`BannedUserMiddleware` runs after authentication. Banned Google users receive `403 ACCOUNT_BANNED` on all authenticated routes — same as email users. `GoogleAuthAsync` also calls `EnsureNotBannedAsync` at login.

---

## Verification Method

| Check | Evidence |
|-------|----------|
| Role = Student on create | `UserRepository.CreateAsync` line 83 |
| JWT contains role | `JwtTokenService` claims |
| Moderator policy requires role | `AuthorizationPolicies.cs` |
| Admin policy requires role | `AuthorizationPolicies.cs` |
| Google user integration test asserts role | `GoogleAuth_WithValidToken_NewUser` — `Role.Should().Be("Student")` |

---

## Summary

| Access | Google-created Student | Verdict |
|--------|------------------------|---------|
| Student endpoints | Yes | **PASS** |
| Posts (create, interact) | Yes | **PASS** |
| Documents (authenticated) | Yes | **PASS** |
| Exams (non-premium) | Yes | **PASS** |
| Moderator endpoints | No | **PASS** |
| Admin endpoints | No | **PASS** |

**Overall: PASS** — Google-created users are standard Students with correct authorization boundaries.
