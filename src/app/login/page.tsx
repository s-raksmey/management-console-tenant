"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileText,
  LockKeyhole,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const capabilities = [
  {
    title: "Editorial control",
    detail: "Review articles, publishing states, carousel stories, and media.",
    icon: FileText,
  },
  {
    title: "Tenant operations",
    detail: "Manage tenant spaces, staff access, roles, and configuration.",
    icon: Users,
  },
  {
    title: "Protected access",
    detail: "Secure sessions, two-factor verification, and audit visibility.",
    icon: ShieldCheck,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isInitializing } = useAuth();
  const verified = searchParams.get("verified");

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isInitializing, router]);

  const handleAuthSuccess = () => {
    router.push("/");
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-sky-300" />
          <p className="text-sm text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="min-w-0 py-6 lg:py-10"
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/10 shadow-sm backdrop-blur">
              <RadioTower className="h-5 w-5 text-sky-200" />
            </div>
            <div>
              <p className="text-base font-semibold leading-5">
                Management Console
              </p>
            </div>
          </div>

          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-sm font-medium text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              Secure editorial operations
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Management Console
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              A focused workspace for newsroom operations, tenant
              administration, and platform security.
            </p>
          </div>

          <div className="mt-10 max-w-2xl space-y-3">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-sm backdrop-blur"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-slate-950/30 text-sky-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-white">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex max-w-2xl flex-wrap items-center gap-3 text-sm text-slate-400">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/30 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Platform online
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/30 px-3 py-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Audit logging enabled
            </div>
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="relative z-10 w-full justify-self-center pb-6 lg:pb-0"
        >
          <div className="mb-4 rounded-lg border border-white/12 bg-white/[0.08] px-4 py-3 text-sm text-slate-200 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-amber-200" />
              <span>Authorized staff only</span>
              <Sparkles className="ml-auto h-4 w-4 text-sky-200" />
            </div>
          </div>

          {verified === "true" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg border border-emerald-200/40 bg-emerald-300/15 p-4 text-center text-sm text-emerald-50"
            >
              Email verified successfully. You can now sign in.
            </motion.div>
          )}

          <LoginForm onSuccess={handleAuthSuccess} />

          <p className="mt-6 text-center text-xs text-slate-400">
            Protected by secure cookies, short sessions, and two-factor
            verification.
          </p>
        </motion.aside>
      </section>
    </main>
  );
}
