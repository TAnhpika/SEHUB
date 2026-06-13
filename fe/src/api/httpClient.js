export const TOKEN_KEY = "sehubs_token";
export const REFRESH_TOKEN_KEY = "sehubs_refresh_token";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5006";

let refreshInFlight = null;
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

async function parseResponse(response) {
  let payload = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    payload = await response.json();
  }

  const isEnvelope = payload && typeof payload === "object" && "success" in payload;
  const isSuccess = isEnvelope ? payload.success : response.ok;

  if (!response.ok || isSuccess === false) {
    const firstError = payload?.errors?.[0];
    const message =
      payload?.message ||
      firstError?.message ||
      firstError?.code ||
      "Yêu cầu thất bại.";
    throw new ApiError(message, {
      status: response.status,
      errors: payload?.errors ?? [],
    });
  }

  if (isEnvelope) {
    return payload.data;
  }

  return payload;
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

async function performRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError("Phiên đăng nhập đã hết hạn.", { status: 401 });
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await parseResponse(response);
  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);
  return data;
}

export async function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiRequest(path, { method = "GET", body, auth = true, retryOnUnauthorized = true } = {}) {
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
    });
    return parseResponse(response);
  }

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