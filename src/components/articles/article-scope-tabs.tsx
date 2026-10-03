"use client";

import { Permission } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useAdminLocale } from "@/hooks/useAdminLocale";

const labels = {
  en: { all: "All Articles", mine: "My Articles" },
  km: { all: "អត្ថបទទាំងអស់", mine: "អត្ថបទរបស់ខ្ញុំ" },
};

export type ArticleScope = "all" | "mine";

export function ArticleScopeTabs({
  scope,
  onScopeChange,
}: {
  scope: ArticleScope;
  onScopeChange: (scope: ArticleScope) => void;
}) {
  const { hasPermission } = usePermissions();
  const { locale } = useAdminLocale();
  const copy = labels[locale];
  const tabs = [
    ...(hasPermission(Permission.VIEW_ALL_ARTICLES)
      ? [{ scope: "all" as const, label: copy.all }]
      : []),
    ...(hasPermission(Permission.UPDATE_OWN_ARTICLE)
      ? [{ scope: "mine" as const, label: copy.mine }]
      : []),
  ];

  if (tabs.length < 2) return null;

  return (
    <nav
      role="tablist"
      aria-label={locale === "en" ? "Article views" : "ទិដ្ឋភាពអត្ថបទ"}
      className="flex gap-2 overflow-x-auto"
    >
      {tabs.map((tab) => {
        const active = scope === tab.scope;
        return (
          <button
            key={tab.scope}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onScopeChange(tab.scope)}
            className={`inline-flex h-9 shrink-0 items-center rounded-md px-4 text-sm font-medium transition-colors ${
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
