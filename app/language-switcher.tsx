"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setLocalePreference } from "@/app/locale-actions";
import type { Locale } from "@/lib/i18n-shared";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLocale(nextLocale: Locale) {
    startTransition(async () => {
      await setLocalePreference(nextLocale);
      router.refresh();
    });
  }

  return (
    <div
      className="flex rounded-full border border-white/15 bg-white/5 p-1 text-xs"
      aria-label={locale === "zh" ? "切换语言" : "Switch language"}
    >
      {(["zh", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          disabled={pending}
          onClick={() => setLocale(item)}
          className={`rounded-full px-3 py-1.5 transition ${
            locale === item
              ? "bg-[#d9ff62] font-semibold text-[#132a24]"
              : "text-emerald-50 hover:bg-white/10"
          } disabled:opacity-60`}
          aria-pressed={locale === item}
        >
          {item === "zh" ? "中文" : "EN"}
        </button>
      ))}
    </div>
  );
}
