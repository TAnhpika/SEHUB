import React from "react";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/context/ThemeProvider";
import { useTheme, useThemeOptional } from "@/hooks/useTheme";
import { THEME_STORAGE_KEY } from "@/utils/themeStorage";

function createThemeWrapper() {
  return function ThemeWrapper({ children }) {
    return React.createElement(ThemeProvider, null, children);
  };
}

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  describe("useTheme", () => {
    it("throws when used outside ThemeProvider", () => {
      expect(() => renderHook(() => useTheme())).toThrow(
        "useTheme must be used within ThemeProvider",
      );
    });

    it("returns theme state and updates via setTheme", () => {
      const { result } = renderHook(() => useTheme(), { wrapper: createThemeWrapper() });

      expect(["light", "dark", "system"]).toContain(result.current.theme);
      expect(result.current.resolvedTheme).toMatch(/^(light|dark)$/);

      act(() => {
        result.current.setTheme("dark");
      });

      expect(result.current.theme).toBe("dark");
      expect(result.current.resolvedTheme).toBe("dark");
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
      expect(document.documentElement.dataset.theme).toBe("dark");
    });
  });

  describe("useThemeOptional", () => {
    it("returns null outside provider", () => {
      const { result } = renderHook(() => useThemeOptional());
      expect(result.current).toBeNull();
    });

    it("returns context value inside provider", () => {
      const { result } = renderHook(() => useThemeOptional(), { wrapper: createThemeWrapper() });
      expect(result.current?.theme).toBeTruthy();
      expect(typeof result.current?.setTheme).toBe("function");
    });
  });
});
