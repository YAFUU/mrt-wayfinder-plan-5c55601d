import { useEffect } from "react";
import { useProfile } from "./useStore";
import { setLanguage } from "@/lib/i18n";
import { storage } from "@/services/storageService";
import i18n from "@/lib/i18n";

/** Applies the persisted profile to <html> (font-size, contrast, motion, language). */
export function useApplyProfile() {
  const p = useProfile();
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.documentElement;
    el.dataset.fontSize = p.fontSize;
    el.dataset.contrast = p.highContrast ? "high" : "normal";
    el.dataset.reduceMotion = p.reduceMotion ? "true" : "false";
    if (i18n.language !== p.preferredLanguage) setLanguage(p.preferredLanguage);
  }, [p.fontSize, p.highContrast, p.reduceMotion, p.preferredLanguage]);
}

export function toggleLang() {
  const p = storage.getProfile();
  const next = p.preferredLanguage === "th" ? "en" : "th";
  storage.updateProfile({ preferredLanguage: next });
  setLanguage(next);
}
