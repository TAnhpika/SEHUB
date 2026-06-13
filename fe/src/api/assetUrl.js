const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5006";

export function resolveAssetUrl(path) {
  if (!path) return null;

  const raw = String(path).trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return `${API_BASE_URL}${raw.startsWith("/") ? raw : `/${raw}`}`;
}
