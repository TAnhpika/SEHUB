import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./themeContextValue";
import {
  applyThemeToDocument,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
} from "@/utils/themeStorage";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(readStoredTheme()));

  const setTheme = useCallback((next) => {
    setThemeState(next);
    writeStoredTheme(next);
    const resolved = resolveTheme(next);
    setResolvedTheme(resolved);
    applyThemeToDocument(resolved);
  }, []);

  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyThemeToDocument(resolved);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange() {
      const resolved = resolveTheme("system");
      setResolvedTheme(resolved);
      applyThemeToDocument(resolved);
    }

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
