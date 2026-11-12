import type { LanguageSwitcherDict } from "../fr/language-switcher";

// Each language names itself in its own tongue regardless of the current
// UI locale — only the aria-label changes per locale.
export const languageSwitcher: LanguageSwitcherDict = {
  label: "Cambiar idioma",
  names: {
    fr: "Français",
    en: "English",
    es: "Español",
  },
};
