export const THEME_STORAGE_KEY = "sehub-theme";

/** @typedef {"light" | "dark" | "system"} ThemePreference */

/** @returns {ThemePreference} */
export function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return "system";
}

/** @param {ThemePreference} theme */
export function writeStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** @param {ThemePreference} theme */
export function resolveTheme(theme) {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

/** @param {"light" | "dark"} resolved */
export function applyThemeToDocument(resolved) {
  document.documentElement.dataset.theme = resolved;
}
