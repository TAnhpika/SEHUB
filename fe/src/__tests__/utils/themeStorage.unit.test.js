import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
} from "@/utils/themeStorage";

describe("themeStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  describe("readStoredTheme", () => {
    it("returns stored light, dark, or system preference", () => {
      localStorage.setItem(THEME_STORAGE_KEY, "dark");
      expect(readStoredTheme()).toBe("dark");

      localStorage.setItem(THEME_STORAGE_KEY, "light");
      expect(readStoredTheme()).toBe("light");

      localStorage.setItem(THEME_STORAGE_KEY, "system");
      expect(readStoredTheme()).toBe("system");
    });

    it("defaults to system for missing or invalid values", () => {
      expect(readStoredTheme()).toBe("system");
      localStorage.setItem(THEME_STORAGE_KEY, "neon");
      expect(readStoredTheme()).toBe("system");
    });
  });

  describe("writeStoredTheme", () => {
    it("persists valid theme to localStorage", () => {
      writeStoredTheme("dark");
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    });
  });

  describe("resolveTheme", () => {
    it("returns explicit light or dark without consulting media query", () => {
      expect(resolveTheme("light")).toBe("light");
      expect(resolveTheme("dark")).toBe("dark");
    });

    it("follows system preference when theme is system", () => {
      vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
      expect(resolveTheme("system")).toBe("dark");

      vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
      expect(resolveTheme("system")).toBe("light");
    });
  });

  describe("applyThemeToDocument", () => {
    it("sets data-theme on document element", () => {
      applyThemeToDocument("dark");
      expect(document.documentElement.dataset.theme).toBe("dark");

      applyThemeToDocument("light");
      expect(document.documentElement.dataset.theme).toBe("light");
    });
  });
});
