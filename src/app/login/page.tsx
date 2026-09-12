"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileText,
  LockKeyhole,
  LogIn,
  Moon,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { COLOR_SCHEME_CHANGED_EVENT } from "@/lib/tweakcn-theme";
import { useAdminLocale } from "@/hooks/useAdminLocale";

const loginPageCopy = {
  en: {
    brand: "Management Console",
    badge: "Secure editorial operations",
    headline: "Management Console",
    description:
      "A focused workspace for newsroom operations, sub-tenant administration, and main-tenant security.",
    statusOnline: "System online",
    auditEnabled: "Audit logging enabled",
    authorized: "Authorized access only",
    verified: "Email verified successfully. You can now sign in.",
    signInTitle: "Sign in",
    signInDescription:
      "Access the newsroom workspace with your authorized admin account.",
    signInButton: "Sign in",
    protection:
      "Protected by secure cookies, short sessions, and two-factor verification.",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    language: "Language",
    loading: "Loading...",
    capabilities: [
      {
        title: "Editorial control",
        detail: "Review articles, publishing states, carousel stories, and media.",
        icon: FileText,
      },
      {
        title: "Sub-tenant operations",
        detail: "Manage sub-tenant spaces, team access, roles, and configuration.",
        icon: Users,
      },
      {
        title: "Protected access",
        detail: "Secure sessions, two-factor verification, and audit visibility.",
        icon: ShieldCheck,
      },
    ],
  },
  km: {
    brand: "ផ្ទាំងគ្រប់គ្រង",
    badge: "ប្រតិបត្តិការព័ត៌មានមានសុវត្ថិភាព",
    headline: "ផ្ទាំងគ្រប់គ្រង",
    description:
      "កន្លែងធ្វើការសម្រាប់ប្រតិបត្តិការព័ត៌មាន ការគ្រប់គ្រងអង្គភាព និងសុវត្ថិភាពប្រព័ន្ធ។",
    statusOnline: "ប្រព័ន្ធកំពុងដំណើរការ",
    auditEnabled: "បានបើកកំណត់ហេតុសវនកម្ម",
    authorized: "សម្រាប់អ្នកមានសិទ្ធិចូលប៉ុណ្ណោះ",
    verified: "បានផ្ទៀងផ្ទាត់អ៊ីមែលដោយជោគជ័យ។ ឥឡូវនេះអ្នកអាចចូលបាន។",
    signInTitle: "ចូល",
    signInDescription:
      "ចូលទៅកាន់កន្លែងធ្វើការព័ត៌មានដោយប្រើគណនីគ្រប់គ្រងដែលមានសិទ្ធិ។",
    signInButton: "ចូល",
    protection:
      "ការពារដោយឃុកគីសុវត្ថិភាព វគ្គចូលប្រើខ្លី និងការផ្ទៀងផ្ទាត់ពីរជាន់។",
    darkMode: "ផ្ទៃងងឹត",
    lightMode: "ផ្ទៃភ្លឺ",
    language: "ភាសា",
    loading: "កំពុងផ្ទុក...",
    capabilities: [
      {
        title: "ការគ្រប់គ្រងមាតិកា",
        detail: "ពិនិត្យអត្ថបទ ស្ថានភាពផ្សព្វផ្សាយ រឿងរំកិល និងមេឌៀ។",
        icon: FileText,
      },
      {
        title: "ប្រតិបត្តិការអង្គភាព",
        detail: "គ្រប់គ្រងអង្គភាព ការចូលប្រើរបស់ក្រុម តួនាទី និងការកំណត់។",
        icon: Users,
      },
      {
        title: "ការចូលមានសុវត្ថិភាព",
        detail: "ការពារវគ្គចូលប្រើ ការផ្ទៀងផ្ទាត់ពីរជាន់ និងកំណត់ហេតុសវនកម្ម។",
        icon: ShieldCheck,
      },
    ],
  },
};

function getInitialDarkMode() {
  if (typeof window === "undefined") return true;

  const savedScheme = localStorage.getItem("pulse-news-color-scheme") || "system";
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return savedScheme === "dark" || (savedScheme === "system" && prefersDark);
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isInitializing } = useAuth();
  const nextPath = searchParams.get("next");
  const redirectTo =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  const verified = searchParams.get("verified");
  const [showLoginForm, setShowLoginForm] = useState(verified === "true");
  const { locale, selectLocale } = useAdminLocale();
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);
  const copy = loginPageCopy[locale];

  const toggleDarkMode = () => {
    const nextIsDark = !isDarkMode;
    setIsDarkMode(nextIsDark);
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem("pulse-news-color-scheme", nextIsDark ? "dark" : "light");
    window.dispatchEvent(new Event(COLOR_SCHEME_CHANGED_EVENT));
  };

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isInitializing, redirectTo, router]);

  const handleAuthSuccess = () => {
    router.push(redirectTo);
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-sky-300" />
          <p className="text-sm text-slate-300">{copy.loading}</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-200 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.09),transparent_32%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)]" />
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
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
              {item === "en" ? "EN" : "ខ្មែរ"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-slate-100/80 text-slate-700 shadow-sm backdrop-blur transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
          aria-label={isDarkMode ? copy.lightMode : copy.darkMode}
          title={isDarkMode ? copy.lightMode : copy.darkMode}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="min-w-0 py-6 lg:py-10"
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-slate-100/80 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/10">
              <RadioTower className="h-5 w-5 text-sky-600 dark:text-sky-200" />
            </div>
            <div>
              <p className="text-base font-semibold leading-5">
                {copy.brand}
              </p>
            </div>
          </div>

          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              {copy.badge}
            </div>
            <h1 className="text-4xl font-bold leading-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
              {copy.headline}
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              {copy.description}
            </p>
          </div>

          <div className="mt-10 max-w-2xl space-y-3">
            {copy.capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-lg border border-slate-300 bg-slate-100/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.055]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-slate-200/80 text-sky-700 dark:border-white/10 dark:bg-slate-950/30 dark:text-sky-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-950 dark:text-white">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex max-w-2xl flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100/70 px-3 py-1.5 dark:border-white/10 dark:bg-slate-950/30">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              {copy.statusOnline}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100/70 px-3 py-1.5 dark:border-white/10 dark:bg-slate-950/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              {copy.auditEnabled}
            </div>
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="relative z-10 w-full justify-self-center pb-6 lg:pb-0"
        >
          <div className="mb-4 rounded-lg border border-slate-300 bg-slate-100/80 px-4 py-3 text-sm text-slate-700 shadow-sm backdrop-blur dark:border-white/12 dark:bg-white/[0.08] dark:text-slate-200">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-amber-200" />
              <span>{copy.authorized}</span>
              <Sparkles className="ml-auto h-4 w-4 text-sky-200" />
            </div>
          </div>

          {verified === "true" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg border border-emerald-200/40 bg-emerald-300/15 p-4 text-center text-sm text-emerald-50"
            >
              {copy.verified}
            </motion.div>
          )}

          {showLoginForm ? (
            <LoginForm onSuccess={handleAuthSuccess} locale={locale} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-lg border border-slate-300 bg-slate-100/80 p-6 text-center shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/[0.06]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-sky-500/15 bg-sky-500/10 text-sky-600 dark:border-sky-200/20 dark:bg-sky-300/10 dark:text-sky-200">
                <LogIn className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">
                {copy.signInTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-600 dark:text-slate-400">
                {copy.signInDescription}
              </p>
              <button
                type="button"
                onClick={() => setShowLoginForm(true)}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-md border border-sky-500/25 bg-sky-500/10 px-5 text-sm font-semibold text-sky-700 transition hover:border-sky-500/40 hover:bg-sky-500/15 focus:outline-none focus:ring-2 focus:ring-sky-300/40 dark:border-sky-300/25 dark:bg-sky-300/10 dark:text-sky-100 dark:hover:border-sky-200/40 dark:hover:bg-sky-300/15"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {copy.signInButton}
              </button>
            </motion.div>
          )}

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {copy.protection}
          </p>
        </motion.aside>
      </section>
    </main>
  );
}
