"use client";

import { AlertCircle, CheckCircle2, ListChecks } from "lucide-react";
import type { OutputData } from "@editorjs/editorjs";
import { useAdminLocale } from "@/hooks/useAdminLocale";

type ArticleReadinessCardProps = {
  title: string;
  slug: string;
  excerpt?: string | null;
  categorySlug?: string | null;
  hasBodyContent: boolean;
};

export type ReadinessItem = {
  label: string;
  ready: boolean;
};

const readinessCopy = {
  en: {
    titleReady: "Title is specific and readable",
    slugReady: "Slug is ready for the public URL",
    excerptReady: "Excerpt is useful for cards and SEO",
    categoryReady: "Category is selected",
    bodyReady: "Story body has content",
    heading: "Article Readiness",
  },
  km: {
    titleReady: "Title ច្បាស់ និងអានងាយ",
    slugReady: "Slug រួចរាល់សម្រាប់ public URL",
    excerptReady: "Excerpt មានប្រយោជន៍សម្រាប់ cards និង SEO",
    categoryReady: "បានជ្រើស Category",
    bodyReady: "Story body មានមាតិកា",
    heading: "ភាពរួចរាល់អត្ថបទ",
  },
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

function hasMeaningfulValue(value: unknown): boolean {
  if (typeof value === "string") return stripHtml(value).length > 0;
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  if (!value || typeof value !== "object") return false;

  return Object.values(value as Record<string, unknown>).some(hasMeaningfulValue);
}

export function hasMeaningfulArticleContent(content?: OutputData | null) {
  return Boolean(
    content?.blocks?.some((block) => hasMeaningfulValue(block.data)),
  );
}

export function getArticleReadinessItems({
  title,
  slug,
  excerpt,
  categorySlug,
  hasBodyContent,
}: ArticleReadinessCardProps, locale: "en" | "km" = "en"): ReadinessItem[] {
  const normalizedSlug = slug.trim();
  const cleanExcerpt = excerpt?.trim() || "";
  const copy = readinessCopy[locale];

  return [
    {
      label: copy.titleReady,
      ready: title.trim().length >= 12 && title.trim().length <= 90,
    },
    {
      label: copy.slugReady,
      ready:
        normalizedSlug.length > 0 &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug),
    },
    {
      label: copy.excerptReady,
      ready: cleanExcerpt.length >= 50 && cleanExcerpt.length <= 180,
    },
    {
      label: copy.categoryReady,
      ready: Boolean(categorySlug?.trim()),
    },
    {
      label: copy.bodyReady,
      ready: hasBodyContent,
    },
  ];
}

export function getArticleReadinessIssues(
  props: ArticleReadinessCardProps,
  locale: "en" | "km" = "en",
): string[] {
  return getArticleReadinessItems(props, locale)
    .filter((item) => !item.ready)
    .map((item) => item.label);
}

export function ArticleReadinessCard({
  title,
  slug,
  excerpt,
  categorySlug,
  hasBodyContent,
}: ArticleReadinessCardProps) {
  const { locale } = useAdminLocale();
  const copy = readinessCopy[locale];
  const items = getArticleReadinessItems({
    title,
    slug,
    excerpt,
    categorySlug,
    hasBodyContent,
  }, locale);
  const readyCount = items.filter((item) => item.ready).length;
  const allReady = readyCount === items.length;

  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-800">
            {copy.heading}
          </h3>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            allReady
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {readyCount}/{items.length}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2">
            {item.ready ? (
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
            ) : (
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                aria-hidden="true"
              />
            )}
            <span className="text-sm text-slate-700">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
