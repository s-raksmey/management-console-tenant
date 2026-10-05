"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminLocale } from "@/hooks/useAdminLocale";
import { resolveCmsMediaSrc, shouldBypassImageOptimizer } from "@/lib/cms-media";
import { COLOR_SCHEME_CHANGED_EVENT, COLOR_SCHEME_STORAGE_KEY } from "@/lib/tweakcn-theme";
import { getGqlClient } from "@/services/graphql-client";
import { gql } from "graphql-request";
import { Moon, Sun } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const loginPageCopy = {
  en: {
    brand: "Tenant Console",
    signIn: "Sign in",
    signInHint: "Use your newsroom account to continue.",
    verified: "Email verified successfully. You can now sign in.",
    protection: "Protected by secure cookies, short sessions, and two-factor verification.",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    language: "Language",
    loading: "Loading...",
  },
  km: {
    brand: "កុងសូលគេហទំព័រ",
    signIn: "ចូល",
    signInHint: "ប្រើគណនីរបស់អ្នកដើម្បីបន្ត។",
    verified: "បានផ្ទៀងផ្ទាត់អ៊ីមែលដោយជោគជ័យ។ ឥឡូវនេះអ្នកអាចចូលបាន។",
    protection: "ការពារដោយឃុកគីសុវត្ថិភាព វគ្គចូលប្រើខ្លី និងការផ្ទៀងផ្ទាត់ពីរជាន់។",
    darkMode: "ផ្ទៃងងឹត",
    lightMode: "ផ្ទៃភ្លឺ",
    language: "ភាសា",
    loading: "កំពុងផ្ទុក...",
  },
};

type ConsoleBrand = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
};

const Q_CONSOLE_BRAND = gql`
  query TenantConsoleBrand {
    tenantConsoleBrand {
      name
      description
      logoUrl
      faviconUrl
    }
  }
`;

function brandInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "PN";
}

function applyFavicon(url?: string | null) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (!url) {
    link?.remove();
    return;
  }

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  link.href = resolveCmsMediaSrc(url);
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isInitializing } = useAuth();
  const nextPath = searchParams.get("next");
  const redirectTo =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  const verified = searchParams.get("verified");
  const { locale, selectLocale } = useAdminLocale();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [brand, setBrand] = useState<ConsoleBrand | null>(null);
  const [brandReady, setBrandReady] = useState(false);
  const copy = loginPageCopy[locale];
  const siteName = brand?.name || copy.brand;

  const toggleDarkMode = () => {
    const nextIsDark = !isDarkMode;
    setIsDarkMode(nextIsDark);
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, nextIsDark ? "dark" : "light");
    window.dispatchEvent(new Event(COLOR_SCHEME_CHANGED_EVENT));
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyScheme = () => {
      const savedScheme = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY) || "system";
      const nextIsDark = savedScheme === "dark" || (savedScheme === "system" && mediaQuery.matches);
      document.documentElement.classList.toggle("dark", nextIsDark);
      setIsDarkMode(nextIsDark);
    };

    applyScheme();
    mediaQuery.addEventListener("change", applyScheme);
    return () => mediaQuery.removeEventListener("change", applyScheme);
  }, []);

  useEffect(() => {
    let cancelled = false;

    getGqlClient()
      .request<{ tenantConsoleBrand: ConsoleBrand | null }>(Q_CONSOLE_BRAND)
      .then((result) => {
        if (!cancelled) setBrand(result.tenantConsoleBrand);
      })
      .catch(() => {
        if (!cancelled) setBrand(null);
      })
      .finally(() => {
        if (!cancelled) setBrandReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!brand) return;
    document.title = brand.name;
    applyFavicon(brand.faviconUrl);
  }, [brand]);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isInitializing, redirectTo, router]);

  const handleAuthSuccess = () => {
    router.push(redirectTo);
  };

  if (isInitializing || !brandReady) {
    return (
      <div data-auth-screen className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
          <p className="text-sm">{copy.loading}</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const logoSrc = brand?.logoUrl ? resolveCmsMediaSrc(brand.logoUrl) : null;

  return (
    <main data-auth-screen className="relative min-h-screen overflow-hidden bg-[#eef3fb] text-slate-950 dark:bg-[#07111f] dark:text-white">
      <div className="pointer-events-none absolute -left-24 top-0 h-[34rem] w-[34rem] rounded-full bg-sky-400/25 blur-3xl dark:bg-sky-500/20" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-400/10" />

      <header className="relative z-20 flex items-center justify-end px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-0.5 rounded-md border border-slate-300 bg-slate-100/80 p-0.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]"
            aria-label={copy.language}
          >
            {(["en", "km"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => selectLocale(item)}
                className={`h-7 min-w-8 rounded px-2 text-[11px] font-semibold transition ${
                  locale === item
                    ? "bg-sky-200/70 text-sky-800 dark:bg-sky-300/20 dark:text-sky-100"
                    : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {item === "en" ? "EN" : "KH"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/70 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            aria-label={isDarkMode ? copy.lightMode : copy.darkMode}
            title={isDarkMode ? copy.lightMode : copy.darkMode}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-4.5rem)] w-full max-w-6xl items-center gap-8 px-5 pb-10 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,420px)] lg:gap-14">
        <div className="min-w-0 py-4 lg:py-10">
          <div className="relative mb-8 h-36 w-36 sm:h-44 sm:w-44">
            <div className="absolute inset-3 rounded-full bg-sky-400/30 blur-2xl" />
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={siteName}
                fill
                priority
                sizes="176px"
                unoptimized={shouldBypassImageOptimizer(logoSrc)}
                className="object-contain drop-shadow-[0_18px_30px_rgba(14,116,220,0.35)]"
              />
            ) : (
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-3xl font-semibold text-white dark:bg-slate-800">
                {brandInitials(siteName)}
              </div>
            )}
          </div>

          <h1 className="max-w-xl font-[family-name:var(--font-kantumruy-pro)] text-5xl font-semibold leading-[0.95] tracking-tight text-slate-950 dark:text-white sm:text-7xl">
            {siteName}
          </h1>
          <div className="mt-6 h-px w-28 bg-gradient-to-r from-sky-500 to-transparent" />
          {brand?.description ? (
            <p className="mt-6 max-w-md font-[family-name:var(--font-kantumruy-pro)] text-lg leading-8 text-slate-600 dark:text-slate-300">
              {brand.description}
            </p>
          ) : null}
          <p className="mt-8 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
            {copy.protection}
          </p>
        </div>

        <div className="relative w-full rounded-[28px] border border-sky-200/80 bg-[#f8fbff] p-6 text-slate-950 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.28)] sm:p-8 dark:border-white/10 dark:bg-[#122033] dark:text-slate-100 dark:shadow-none">
          {verified === "true" && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
              {copy.verified}
            </div>
          )}
          <LoginForm
            onSuccess={handleAuthSuccess}
            locale={locale}
            appearance="editorial"
            heading={copy.signIn}
            subheading={copy.signInHint}
          />
        </div>
      </section>
    </main>
  );
}
