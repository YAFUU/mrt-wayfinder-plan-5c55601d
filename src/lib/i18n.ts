import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import th from "@/locales/th.json";
import en from "@/locales/en.json";

const LANG_KEY = "mrt-quickpass:lang";

function applyDocumentLanguage(language: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language.startsWith("en") ? "en" : "th";
  }
}

function initialLang(): "th" | "en" {
  if (typeof window === "undefined") return "th";
  const saved = window.localStorage.getItem(LANG_KEY);
  return saved === "en" ? "en" : "th";
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: { th: { translation: th }, en: { translation: en } },
    lng: initialLang(),
    fallbackLng: { en: ["en"], default: ["th"] },
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  i18n.on("languageChanged", applyDocumentLanguage);
  applyDocumentLanguage(i18n.language);
}

export function setLanguage(lang: "th" | "en") {
  i18n.changeLanguage(lang);
  if (typeof window !== "undefined") window.localStorage.setItem(LANG_KEY, lang);
}

export default i18n;
