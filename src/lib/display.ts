export type LocalizedName = {
  nameTh?: string | null;
  nameEn?: string | null;
  code?: string | null;
};

export function isEnglishLanguage(language: string | undefined) {
  return language?.toLowerCase().startsWith("en") ?? false;
}

export function getLocalizedName(
  item: LocalizedName | null | undefined,
  language: string | undefined,
) {
  if (!item) return "";

  const primary = isEnglishLanguage(language) ? item.nameEn : item.nameTh;
  const fallback = isEnglishLanguage(language) ? item.nameTh : item.nameEn;
  return primary?.trim() || fallback?.trim() || item.code?.trim() || "";
}

export function getSecondaryLocalizedName(
  item: LocalizedName | null | undefined,
  language: string | undefined,
) {
  if (!item) return "";
  return isEnglishLanguage(language) ? "" : item.nameEn?.trim() || "";
}
