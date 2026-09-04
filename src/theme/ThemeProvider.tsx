"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { defaultThemeConfig, ThemeConfig } from "./theme.config";

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  updateThemeColors: (colors: Partial<ThemeConfig["colors"]>) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultThemeConfig,
  setTheme: () => {},
  updateThemeColors: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({
  initialTheme = defaultThemeConfig,
  children,
}: {
  initialTheme?: ThemeConfig;
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme);

  useEffect(() => {
    // Injects CSS variables directly onto document element for instant real-time theming
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", theme.colors.primary);
    root.style.setProperty("--brand-secondary", theme.colors.secondary);
    root.style.setProperty("--brand-accent", theme.colors.accent);
    root.style.setProperty("--brand-ink", theme.colors.ink);
    root.style.setProperty("--brand-muted-ink", theme.colors.mutedInk);
    root.style.setProperty("--brand-surface", theme.colors.surface);
    root.style.setProperty("--brand-subtle", theme.colors.subtle);
    root.style.setProperty("--brand-muted", theme.colors.muted);
    root.style.setProperty("--brand-border", theme.colors.border);
    root.style.setProperty("--brand-rating", theme.colors.rating);
    root.style.setProperty("--brand-discount", theme.colors.discount);
    root.style.setProperty("--brand-urgent", theme.colors.urgent);
    root.style.setProperty("--brand-radius", theme.styling.borderRadius);
    root.style.setProperty("--font-heading", theme.typography.fontHeading);
    root.style.setProperty("--font-body", theme.typography.fontBody);
  }, [theme]);

  const updateThemeColors = (colors: Partial<ThemeConfig["colors"]>) => {
    setTheme((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        ...colors,
      },
    }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, updateThemeColors }}>
      {children}
    </ThemeContext.Provider>
  );
}
