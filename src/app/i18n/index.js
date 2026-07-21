import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, supportedLanguages } from "./translations";

export const LANGUAGE_STORAGE_KEY = "quottery.language";
const supportedCodes = new Set(supportedLanguages.map((language) => language.code));

function getInitialLanguage() {
  try {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return supportedCodes.has(savedLanguage) ? savedLanguage : "en";
  } catch {
    return "en";
  }
}

const initialLanguage = typeof window === "undefined" ? "en" : getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: "en",
    supportedLngs: supportedLanguages.map((language) => language.code),
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

function persistLanguage(language) {
  const normalizedLanguage = String(language || "").split("-")[0];
  const nextLanguage = supportedCodes.has(normalizedLanguage) ? normalizedLanguage : "en";

  if (typeof document !== "undefined") {
    document.documentElement.lang = nextLanguage;
  }

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  } catch {
    // Language still changes for the current session when storage is unavailable.
  }
}

persistLanguage(initialLanguage);
i18n.on("languageChanged", persistLanguage);

export default i18n;
