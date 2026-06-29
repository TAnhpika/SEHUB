export const TOKEN_KEY = "sehubs_token";
export const REFRESH_TOKEN_KEY = "sehubs_refresh_token";
const REFRESH_LOCK_KEY = "sehubs_refresh_lock";
const REFRESH_LOCK_MAX_MS = 15000;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5006";

export { buildQuery } from "./queryUtils";

const API_ERROR_MESSAGES = {
  STORAGE_NOT_CONFIGURED:
    "Chưa cấu hình Google Drive trên server. Dev: restart BE (Development) để dùng lưu file local; prod: thêm GoogleDrive trong appsettings.",
  EMAIL_NOT_CONFIRMED:
    "Vui lòng xác minh email trước khi đăng nhập. Kiểm tra hộp thư hoặc yêu cầu gửi lại mã.",
  AUTH_RATE_LIMIT_EXCEEDED: "Đăng nhập quá nhiều lần. Vui lòng thử lại sau vài phút.",
  ACCOUNT_BANNED: "Tài khoản của bạn đã bị khóa.",
  GOOGLE_TOKEN_INVALID: "Không xác thực được tài khoản Google.",
  OTP_INVALID: "Mã OTP không hợp lệ hoặc đã hết hạn.",
  STORAGE_UPLOAD_FAILED: "Không upload được file lên storage. Kiểm tra cấu hình Google Drive hoặc thử lại.",
  REFRESH_TOKEN_REUSE_DETECTED:
    "Phiên đăng nhập đã hết hạn (có thể do mở nhiều tab). Vui lòng đăng nhập lại.",
  REFRESH_TOKEN_INVALID: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
  REFRESH_TOKEN_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
};

const AUTH_SESSION_ERROR_CODES = new Set([
  "REFRESH_TOKEN_REUSE_DETECTED",
  "REFRESH_TOKEN_INVALID",
  "REFRESH_TOKEN_EXPIRED",
]);

/** Message thô từ BE (tiếng Anh) → tiếng Việt cho người dùng */
const API_MESSAGE_ALIASES = {
  "Invalid credentials.": "Email hoặc mật khẩu không đúng.",
  "Invalid credentials": "Email hoặc mật khẩu không đúng.",
  "Unable to authenticate with Google.": "Không thể đăng nhập bằng Google.",
  "Email is already registered.": "Email đã được đăng ký.",
  "Username is already taken.": "Tên đăng nhập đã được sử dụng.",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorCode(payload, error) {
  return payload?.errors?.[0]?.code ?? payload?.message ?? error?.errors?.[0]?.code ?? error?.message;
}

function localizeApiMessage(message) {
  if (!message || typeof message !== "string") {
    return message;
  }

  const trimmed = message.trim();
  if (API_MESSAGE_ALIASES[trimmed]) {
    return API_MESSAGE_ALIASES[trimmed];
  }

  if (trimmed.toLowerCase() === "invalid credentials.") {
    return API_MESSAGE_ALIASES["Invalid credentials."];
  }

  return message;
}

export function isAuthSessionError(error) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  const code = error.errors?.[0]?.code;
  return error.status === 401 || (code && AUTH_SESSION_ERROR_CODES.has(code));
}

function resolveApiErrorMessage(payload, status) {
  const firstError = payload?.errors?.[0];
  const code = firstError?.code ?? payload?.message;
  if (code && API_ERROR_MESSAGES[code]) {
    return API_ERROR_MESSAGES[code];
  }

  const message = payload?.message || firstError?.message || firstError?.code;
  if (message) {
    return localizeApiMessage(message);
  }

  if (status === 403) {
    return "Tính năng yêu cầu gói Premium.";
  }

  return "Yêu cầu thất bại.";
}

export class ApiError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors ?? [];
  }
}

export function getAccessToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || token === "mock-jwt-token") {
    return null;
  }
  return token;
}

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function clearAuthTokens() {
  setAccessToken(null);
  setRefreshToken(null);
}

function notifyForcedLogout() {
  clearAuthTokens();
  window.dispatchEvent(new CustomEvent("auth:forced-logout"));
}

function readRefreshedSessionFromStorage(refreshTokenAtStart) {
  const currentRefresh = getRefreshToken();
  const currentAccess = getAccessToken();
  if (
    currentRefresh
    && currentRefresh !== refreshTokenAtStart
    && currentAccess
  ) {
    return { accessToken: currentAccess, refreshToken: currentRefresh };
  }
  return null;
}

async function waitForCrossTabRefresh(refreshTokenAtStart) {
  const deadline = Date.now() + REFRESH_LOCK_MAX_MS;
  while (Date.now() < deadline) {
    const recovered = readRefreshedSessionFromStorage(refreshTokenAtStart);
    if (recovered) {
      return recovered;
    }

    if (!localStorage.getItem(REFRESH_LOCK_KEY)) {
      await sleep(50);
      const afterWait = readRefreshedSessionFromStorage(refreshTokenAtStart);
      if (afterWait) {
        return afterWait;
      }
      break;
    }

    await sleep(50);
  }

  return null;
}

async function parseResponse(response) {
  let payload = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    payload = await response.json();
  }

  const isEnvelope = payload && typeof payload === "object" && "success" in payload;
  const isSuccess = isEnvelope ? payload.success : response.ok;

  if (!response.ok || isSuccess === false) {
    throw new ApiError(resolveApiErrorMessage(payload, response.status), {
      status: response.status,
      errors: payload?.errors ?? [],
    });
  }

  if (isEnvelope) {
    return payload.data;
  }

  return payload;
}

let refreshInFlight = null;

async function withAuthRetry(path, { auth = true, retryOnUnauthorized = true, executeRequest }) {
  try {
    return await executeRequest();
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw new ApiError(
        `Không kết nối được máy chủ (${API_BASE_URL}). Hãy chạy SEHub.API rồi thử lại.`,
        { status: 0 },
      );
    }

    const shouldRefresh =
      retryOnUnauthorized &&
      auth &&
      error.status === 401 &&
      getRefreshToken() &&
      !path.includes("/api/v1/auth/refresh");

    if (!shouldRefresh) {
      throw error;
    }

    await refreshSession();
    return executeRequest();
  }
}

export async function apiFormRequest(path, { method = "POST", formData, auth = true, retryOnUnauthorized = true } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  async function executeRequest() {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: formData,
    });
    return parseResponse(response);
  }

  return withAuthRetry(path, { auth, retryOnUnauthorized, executeRequest });
}

async function performRefresh() {
  const refreshTokenAtStart = getRefreshToken();
  if (!refreshTokenAtStart) {
    throw new ApiError("Phiên đăng nhập đã hết hạn.", { status: 401 });
  }

  if (localStorage.getItem(REFRESH_LOCK_KEY)) {
    const recovered = await waitForCrossTabRefresh(refreshTokenAtStart);
    if (recovered) {
      return recovered;
    }
  }

  localStorage.setItem(REFRESH_LOCK_KEY, String(Date.now()));
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: refreshTokenAtStart }),
    });

    try {
      const data = await parseResponse(response);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        const code = getErrorCode(null, error);
        if (code === "REFRESH_TOKEN_REUSE_DETECTED") {
          const recovered = await waitForCrossTabRefresh(refreshTokenAtStart);
          if (recovered) {
            return recovered;
          }
          notifyForcedLogout();
        } else if (AUTH_SESSION_ERROR_CODES.has(code)) {
          notifyForcedLogout();
        }
      }
      throw error;
    }
  } finally {
    localStorage.removeItem(REFRESH_LOCK_KEY);
  }
}

export async function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiRequest(path, { method = "GET", body, auth = true, retryOnUnauthorized = true, signal, cache } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  async function executeRequest() {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      ...(cache ? { cache } : {}),
    });
    return parseResponse(response);
  }

  return withAuthRetry(path, { auth, retryOnUnauthorized, executeRequest });
}

export async function apiUploadRequest(path, formData, { auth = true, retryOnUnauthorized = true } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  async function executeRequest() {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
    return parseResponse(response);
  }

  return withAuthRetry(path, { auth, retryOnUnauthorized, executeRequest });
}

export async function downloadCsv(path, { auth = true, retryOnUnauthorized = true } = {}) {
  const headers = {
    Accept: "text/csv",
  };

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  async function executeRequest() {
    const response = await fetch(`${API_BASE_URL}${path}`, { method: "GET", headers });
    if (!response.ok) {
      throw new ApiError("Không tải được file xuất.", { status: response.status });
    }

    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") ?? "";
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const fileName = match?.[1] ?? "export.csv";
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return withAuthRetry(path, { auth, retryOnUnauthorized, executeRequest });
}
