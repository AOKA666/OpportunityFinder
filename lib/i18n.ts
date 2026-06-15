import { cookies } from "next/headers";

import { LOCALE_COOKIE, type Locale } from "@/lib/i18n-shared";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return value === "zh" ? "zh" : "en";
}

export { localizeValue, pick, type Locale } from "@/lib/i18n-shared";
