"use client";

import * as React from "react";
import themesJson from "./color-themes.json";

export type ColorTheme = {
  name: string;
  background: string;
  "text-borders": string;
  bubbles: string;
};

const THEMES = themesJson as ColorTheme[];

type ThemeContextValue = {
  themes: ColorTheme[];
  activeTheme: ColorTheme;
  setActiveThemeByName: (name: string) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function applyThemeToDom(theme: ColorTheme) {
  const root = document.documentElement;
  root.style.setProperty("--background", theme.background);
  root.style.setProperty("--text-borders", theme["text-borders"]);
  root.style.setProperty("--bubbles", theme.bubbles);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const defaultTheme = THEMES[0] ?? {
    name: "Dark",
    background: "#050505",
    "text-borders": "#e7c9a2",
    bubbles: "#5a160c",
  };

  const [activeThemeName, setActiveThemeName] = React.useState<string>(
    defaultTheme.name
  );

  const activeTheme =
    THEMES.find((t) => t.name === activeThemeName) ?? defaultTheme;

  React.useEffect(() => {
    applyThemeToDom(activeTheme);
  }, [activeTheme]);

  const setActiveThemeByName = React.useCallback((name: string) => {
    if (THEMES.some((t) => t.name === name)) setActiveThemeName(name);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ themes: THEMES, activeTheme, setActiveThemeByName }),
    [activeTheme, setActiveThemeByName]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

