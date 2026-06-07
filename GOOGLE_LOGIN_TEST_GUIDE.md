# Google Login Test Guide

## 1. Google Cloud Console Configuration

### Create OAuth 2.0 Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
4. Application type:
   - **Web application** (for SPA / Vite frontend)
   - Optionally separate **Web** client for backend-only Swagger testing

### Enable APIs

- Ensure **Google Identity Services** is available (no separate API key needed for ID token flow)

### Configure Consent Screen

- **APIs & Services → OAuth consent screen**
- Add test users while in **Testing** mode
- Scopes: `openid`, `email`, `profile` (default for Sign-In)

---

## 2. Required Redirect URIs

Add to OAuth client **Authorized JavaScript origins**:

```
http://localhost:5173
http://localhost:5174
http://localhost:5175
```

Add to **Authorized redirect URIs** (if using redirect flow):

```
http://localhost:5173
http://localhost:5173/login
http://localhost:5174
http://localhost:5175
```

Production (when deployed):

```
https://your-production-domain.com
```

> **ID Token flow (GIS button):** Primarily needs **JavaScript origins**. Redirect URIs required only for OAuth code/redirect flows.

---

## 3. Backend Configuration

### appsettings.Development.Local.json

```json
{
  "Google": {
    "ClientId": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "ClientSecret": "YOUR_CLIENT_SECRET"
  }
}
```

### User Secrets (alternative)

```bash
cd SEHub.Backend/src/SEHub.API
dotnet user-secrets set "Google:ClientId" "YOUR_CLIENT_ID.apps.googleusercontent.com"
dotnet user-secrets set "Google:ClientSecret" "YOUR_CLIENT_SECRET"
```

**Important:** `ClientId` must match the OAuth client used by the frontend to obtain the ID token. Backend validates `aud` claim against this value.

---

## 4. Frontend Google Sign-In Flow (Not Yet Wired)

Current state: `LoginPage.jsx` / `RegisterPage.jsx` show toast *"chưa được kết nối API"* — button is UI-only.

### Recommended integration (Google Identity Services)

```html
<!-- index.html -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

```javascript
// Initialize
google.accounts.id.initialize({
  client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  callback: handleCredentialResponse,
});

function handleCredentialResponse(response) {
  const idToken = response.credential;
  // POST to backend
  authApi.googleLogin({ idToken });
}
```

### New FE env variable needed

```
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:5006
```

### API call (to implement in `authApi.js`)

```
POST /api/v1/auth/google
{ "idToken": "<credential from GIS>" }
```

Store `accessToken` + `refreshToken` same as email login.

---

## 5. How to Obtain a Real Google ID Token

### Option A — Browser console (quick Swagger test)

1. Configure GIS on a test HTML page with your `client_id`
2. Sign in with Google test account
3. Copy `response.credential` from callback — this is the JWT ID token

### Option B — OAuth 2.0 Playground (limited)

Google OAuth Playground produces access tokens, not ID tokens for your client. **Not recommended** for this endpoint.

### Option C — Frontend dev build

Wire GIS button → copy token from network tab → paste into Swagger.

### Option D — Integration test tokens (automated only)

Test suite uses `FakeGoogleTokenValidator` — **not valid in production**.

---

## 6. Swagger Test Steps

Base URL: `http://localhost:5006/swagger`

### Prerequisites

- API running with `Google:ClientId` configured
- Real ID token from a Google test user

### Step 1 — Google Login

```
POST /api/v1/auth/google
{
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Expected 200:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "expiresIn": 3600,
    "refreshToken": "abc...",
    "refreshExpiresIn": 604800,
    "user": {
      "id": "...",
      "email": "user@gmail.com",
      "role": "Student",
      "isPremium": false
    }
  }
}
```

### Step 2 — Authorize Swagger

1. Click **Authorize**
2. Enter `Bearer <accessToken>`
3. Call `GET /api/v1/auth/me` → should return profile

### Step 3 — Refresh

```
POST /api/v1/auth/refresh
{ "refreshToken": "<from step 1>" }
```

**Expected 200** with new token pair; old refresh token revoked.

### Step 4 — Negative cases

| Request | Expected |
|---------|----------|
| `{ "idToken": "" }` | 400 validation |
| `{ "idToken": "not-a-jwt" }` | 403 `GOOGLE_TOKEN_INVALID` |
| `{ "idToken": "user@gmail.com" }` | 403 (no longer accepts raw email) |
| Missing `Google:ClientId` config | 403 `GOOGLE_TOKEN_INVALID` |

### Step 5 — Account linking test

1. Register user with `user@gmail.com` via `POST /register`
2. Google login with same email ID token
3. **Expected:** Same user returned; `emailConfirmed` may flip to true

---

## 7. Automated Test Reference

```bash
cd SEHub.Backend
dotnet test --filter "FullyQualifiedName~GoogleAuth"
dotnet test --filter "FullyQualifiedName~Auth"
dotnet test --filter "FullyQualifiedName~ForgotPassword"
```

Last known result: **46/46 PASS** (21 unit + 25 integration).
