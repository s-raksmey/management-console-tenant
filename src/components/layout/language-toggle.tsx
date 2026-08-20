"use client";

import { useAdminLocale, type AdminLocale } from "@/hooks/useAdminLocale";
import { cn } from "@/lib/utils";

const languages: Array<{ locale: AdminLocale; label: "EN" | "KH" }> = [
  { locale: "en", label: "EN" },
  { locale: "km", label: "KH" },
];

export function AdminLanguageToggle({ className }: { className?: string }) {
  const { locale, selectLocale } = useAdminLocale();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800",
        className,
      )}
      role="group"
      aria-label={locale === "km" ? "ជ្រើសរើសភាសា" : "Select language"}
    >
      {languages.map((language) => {
        const isActive = locale === language.locale;
        return (
          <button
            key={language.locale}
            type="button"
            onClick={() => selectLocale(language.locale)}
            className={cn(
              "rounded px-2 py-1 transition-colors",
              isActive
                ? "bg-[#385CF5] text-white"
                : "text-slate-700 hover:text-[#385CF5] dark:text-slate-300 dark:hover:text-blue-300",
            )}
            aria-pressed={isActive}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}
