"use client";

import { useAdminLocale } from "@/hooks/useAdminLocale";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  const { locale } = useAdminLocale();
  const copy = {
    en: { title: "Something went wrong", tryAgain: "Try again" },
    km: { title: "មានបញ្ហាកើតឡើង", tryAgain: "ព្យាយាមម្ដងទៀត" },
  }[locale];

  return (
    <main className="mx-auto max-w-3xl px-4 py-20 space-y-3">
      <h1 className="text-2xl font-bold">{copy.title}</h1>
      <pre className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs overflow-auto">{error.message}</pre>
      <button className="underline text-sm" onClick={() => reset()}>{copy.tryAgain}</button>
    </main>
  );
}
