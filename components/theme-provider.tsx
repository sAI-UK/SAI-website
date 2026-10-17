"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { defaultTheme, themes, themeStorageKey, type ThemeId } from "@/lib/themes";

const ThemeContext = createContext<{ theme: ThemeId; setTheme: (theme: ThemeId) => void }>({
  theme: defaultTheme,
  setTheme: () => {},
});

const isTheme = (value: string | null | undefined): value is ThemeId => themes.some((theme) => theme.id === value);

/** Sets the theme on <html data-theme> so every colour on the page updates, and remembers it in this browser only. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(defaultTheme);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (isTheme(current)) setThemeState(current);
  }, []);

  function setTheme(next: ThemeId) {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(themeStorageKey, next);
    } catch {
      // Storage can be blocked; the theme still applies for this visit.
    }
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Runs before the page paints so a returning visitor never sees the wrong theme flash. */
export const themeBootScript = `try{var t=localStorage.getItem("${themeStorageKey}");if(${JSON.stringify(themes.map((theme) => theme.id))}.indexOf(t)>-1)document.documentElement.dataset.theme=t;}catch(e){}`;
