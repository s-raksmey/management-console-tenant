"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Globe2,
  ImageIcon,
  Search,
  Share2,
} from "lucide-react";
import { useAdminLocale } from "@/hooks/useAdminLocale";

type SeoPreviewCardProps = {
  title: string;
  excerpt?: string | null;
  slug?: string | null;
  categorySlug?: string | null;
  topicSlug?: string | null;
  siteName?: string | null;
  publicBaseUrl?: string | null;
  coverImageUrl?: string | null;
};

function cleanSegment(value: string | null | undefined, fallback: string) {
  const segment = value?.trim().replace(/^\/+|\/+$/g, "");
  return segment || fallback;
}

function getFallbackBaseUrl() {
  if (typeof window === "undefined") return "https://example.com";
  return window.location.origin.replace(":3002", ":3000").replace(":3001", ":3000");
}

function buildArticleUrl({
  publicBaseUrl,
  categorySlug,
  topicSlug,
  slug,
}: Pick<
  SeoPreviewCardProps,
  "publicBaseUrl" | "categorySlug" | "topicSlug" | "slug"
>) {
  const base = (publicBaseUrl?.trim() || getFallbackBaseUrl()).replace(/\/+$/, "");
  const category = cleanSegment(categorySlug, "news");
  const topic = cleanSegment(topicSlug, "latest");
  const articleSlug = cleanSegment(slug, "article-slug");

  return `${base}/${category}/${topic}/${articleSlug}`;
}

function truncate(value: string, limit: number) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1).trim()}...`;
}

export function SeoPreviewCard({
  title,
  excerpt,
  slug,
  categorySlug,
  topicSlug,
  siteName,
  publicBaseUrl,
  coverImageUrl,
}: SeoPreviewCardProps) {
  const { locale } = useAdminLocale();
  const copy = locale === "km"
    ? {
        articleTitle: "ចំណងជើងអត្ថបទ",
        excerpt: "សេចក្ដីសង្ខេបអត្ថបទនឹងបង្ហាញទីនេះសម្រាប់លទ្ធផលស្វែងរក និងតំណដែលបានចែករំលែក។",
        heading: "មើលជាមុន SEO",
        copyUrl: "ចម្លង URL អត្ថបទ",
        openUrl: "បើក URL អត្ថបទ",
      }
    : {
        articleTitle: "Article title",
        excerpt: "Article excerpt will appear here for search results and shared links.",
        heading: "SEO Preview",
        copyUrl: "Copy article URL",
        openUrl: "Open article URL",
      };
  const [copied, setCopied] = useState(false);
  const displayTitle = title.trim() || copy.articleTitle;
  const displayExcerpt =
    excerpt?.trim() || copy.excerpt;
  const displaySiteName = siteName?.trim() || "Website";
  const articleUrl = buildArticleUrl({
    publicBaseUrl,
    categorySlug,
    topicSlug,
    slug,
  });

  const copyArticleUrl = async () => {
    if (!navigator.clipboard) return;

    await navigator.clipboard.writeText(articleUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const openArticleUrl = () => {
    window.open(articleUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-800">{copy.heading}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void copyArticleUrl()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
            aria-label={copy.copyUrl}
            title={copy.copyUrl}
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={openArticleUrl}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
            aria-label={copy.openUrl}
            title={copy.openUrl}
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="truncate">{articleUrl}</span>
        </div>
        <p className="mt-2 text-base font-medium leading-snug text-blue-700">
          {truncate(displayTitle, 70)}
        </p>
        <p className="mt-1 text-sm leading-5 text-slate-600">
          {truncate(displayExcerpt, 160)}
        </p>
      </div>

      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-[160px_1fr]">
        <div className="flex aspect-[1.91/1] items-center justify-center overflow-hidden rounded-md bg-slate-100">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-7 w-7 text-slate-400" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{displaySiteName}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
            {displayTitle}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
            {displayExcerpt}
          </p>
        </div>
      </div>
    </section>
  );
}
