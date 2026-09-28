"use client";

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";

export type AdminLocale = "en" | "km";

export const ADMIN_LOCALE_CHANGED_EVENT = "tenant-console-locale-changed";

type AdminLocaleContextValue = {
  locale: AdminLocale;
  selectLocale: (nextLocale: AdminLocale) => void;
};

const AdminLocaleContext = createContext<AdminLocaleContextValue | null>(null);

export function getInitialAdminLocale(): AdminLocale {
  if (typeof document === "undefined") return "en";
  return document.documentElement.dataset.locale === "km" ? "km" : "en";
}

export function setAdminLocale(nextLocale: AdminLocale) {
  document.cookie = `locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = nextLocale;
  document.documentElement.dataset.locale = nextLocale;
  document.documentElement.classList.remove("locale-en", "locale-km");
  document.documentElement.classList.add(`locale-${nextLocale}`);
  window.dispatchEvent(new CustomEvent(ADMIN_LOCALE_CHANGED_EVENT, { detail: nextLocale }));
}

export function AdminLocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: AdminLocale;
}) {
  const [locale, setLocale] = useState<AdminLocale>(initialLocale);

  useEffect(() => {
    const documentLocale = getInitialAdminLocale();
    if (documentLocale !== locale) {
      setLocale(documentLocale);
    }

    const handleLocaleChange = (event: Event) => {
      const nextLocale =
        event instanceof CustomEvent && event.detail === "km" ? "km" : getInitialAdminLocale();
      setLocale(nextLocale);
    };

    window.addEventListener(ADMIN_LOCALE_CHANGED_EVENT, handleLocaleChange);
    return () => window.removeEventListener(ADMIN_LOCALE_CHANGED_EVENT, handleLocaleChange);
  }, [locale]);

  const selectLocale = (nextLocale: AdminLocale) => {
    setLocale(nextLocale);
    setAdminLocale(nextLocale);
  };

  return createElement(
    AdminLocaleContext.Provider,
    { value: { locale, selectLocale } },
    children,
  );
}

export function useAdminLocale() {
  const context = useContext(AdminLocaleContext);

  if (context) {
    return context;
  }

  const locale = getInitialAdminLocale();
  const selectLocale = (nextLocale: AdminLocale) => {
    setAdminLocale(nextLocale);
  };

  return { locale, selectLocale };
}
