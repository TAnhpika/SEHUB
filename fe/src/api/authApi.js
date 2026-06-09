import { apiRequest } from "./httpClient";

export function login({ emailOrUsername, password }) {
  return apiRequest("/api/v1/auth/login", {
    method: "POST",
    auth: false,
    body: { emailOrUsername, password },
  });
}

export function register({ email, username, password, displayName }) {
  return apiRequest("/api/v1/auth/register", {
    method: "POST",
    auth: false,
    body: { email, username, password, displayName },
  });
}

export function getMe() {
  return apiRequest("/api/v1/auth/me");
}

export function logout() {
  return apiRequest("/api/v1/auth/logout", { method: "POST" });
}

export function forgotPassword({ email }) {
  return apiRequest("/api/v1/auth/forgot-password", {
    method: "POST",
    auth: false,
    body: { email },
  });
}

export function verifyOtp({ email, code }) {
  return apiRequest("/api/v1/auth/verify-otp", {
    method: "POST",
    auth: false,
    body: { email, code },
  });
}

export function resetPassword({ email, code, newPassword }) {
  return apiRequest("/api/v1/auth/reset-password", {
    method: "POST",
    auth: false,
    body: { email, code, newPassword },
  });
}

export function googleLogin({ idToken }) {
  return apiRequest("/api/v1/auth/google", {
    method: "POST",
    auth: false,
    body: { idToken },
  });
}

export function refresh({ refreshToken }) {
  return apiRequest("/api/v1/auth/refresh", {
    method: "POST",
    auth: false,
    retryOnUnauthorized: false,
    body: { refreshToken },
  });
}

export function sendEmailVerification({ email }) {
  return apiRequest("/api/v1/auth/send-email-verification", {
    method: "POST",
    auth: false,
    body: { email },
  });
}

export function verifyEmail({ email, code }) {
  return apiRequest("/api/v1/auth/verify-email", {
    method: "POST",
    auth: false,
    body: { email, code },
  });
}