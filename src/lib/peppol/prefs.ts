import { create } from "zustand";
import type { Lang } from "./i18n";

type Theme = "light" | "dark";

type Prefs = {
  lang: Lang;
  theme: Theme;
  hydrated: boolean;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  hydrate: () => void;
};

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const usePrefs = create<Prefs>((set) => ({
  lang: "en",
  theme: "light",
  hydrated: false,
  setLang: (lang) => {
    try {
      localStorage.setItem("peppol.lang", lang);
    } catch {
      /* ignore */
    }
    set({ lang });
  },
  setTheme: (theme) => {
    try {
      localStorage.setItem("peppol.theme", theme);
    } catch {
      /* ignore */
    }
    applyTheme(theme);
    set({ theme });
  },
  hydrate: () => {
    let lang: Lang = "en";
    let theme: Theme = "light";
    try {
      const l = localStorage.getItem("peppol.lang");
      if (l === "fr" || l === "nl" || l === "en") lang = l;
      const t = localStorage.getItem("peppol.theme");
      if (t === "dark" || t === "light") theme = t;
    } catch {
      /* ignore */
    }
    applyTheme(theme);
    set({ lang, theme, hydrated: true });
  },
}));
