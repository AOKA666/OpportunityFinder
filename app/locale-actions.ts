"use server";

import { cookies } from "next/headers";

import {
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n-shared";

export async function setLocalePreference(locale: Locale) {
  if (locale !== "en" && locale !== "zh") {
    return;
  }

  (await cookies()).set(LOCALE_COOKIE, locale, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}
