"use client";

import { BarChart3, Building2, Eye, FileText, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  DashboardAnalytics,
  DashboardChartPoint,
  DashboardTenantMetric,
} from "@/services/dashboard-analytics.gql";
import { useAdminLocale } from "@/hooks/useAdminLocale";

type DashboardChartsProps = {
  analytics: DashboardAnalytics | null;
  loading?: boolean;
};

const chartCopy = {
  en: {
    charts: "Charts",
    loadingCharts: "Loading dashboard chart data...",
    dataUnavailable: "Dashboard chart data is not available.",
    noAnalytics: "No analytics data available.",
    noChartData: "No chart data yet.",
    noMonthlyActivity: "No monthly activity yet.",
    noTenantActivity: "No tenant activity yet.",
    created: "Created",
    published: "Published",
    createdTitle: (value: number) => `${value} created`,
    publishedTitle: (value: number) => `${value} published`,
    articles: "articles",
    users: "users",
    sites: "sites",
    views: "views",
    items: "items",
    tenants: "Tenants",
    platformUsers: "Platform Users",
    auditEvents: "Audit Events",
    drafts: "Drafts",
    platformCharts: "Platform Charts",
    tenantCharts: "Tenant Charts",
    platformDescription:
      "Super admin view across tenants, public sites, platform users, and activity.",
    tenantDescription: (tenantName?: string | null) =>
      `Tenant view for ${tenantName || "this website"} content, users, and public performance.`,
    tenantActivity: "Tenant Activity",
    tenantActivityDescription: "Article volume and active membership per tenant.",
    platformRoles: "Platform Roles",
    platformRolesDescription: "Super admins and tenant admins only.",
    contentTimeline: "Content Timeline",
    timelineDescription: "Created vs published articles over the last 6 months.",
    articleStatus: "Article Status",
    articleStatusDescription:
      "Draft, review, published, and archived content for this tenant.",
    tenantRoles: "Tenant Roles",
    tenantRolesDescription: "Active team members by tenant role.",
    viewsByCategory: "Views By Category",
    viewsByCategoryDescription: "Public article views grouped by category.",
  },
  km: {
    charts: "ក្រាហ្វ",
    loadingCharts: "កំពុងផ្ទុកទិន្នន័យក្រាហ្វ...",
    dataUnavailable: "មិនមានទិន្នន័យក្រាហ្វសម្រាប់ផ្ទាំងគ្រប់គ្រង។",
    noAnalytics: "មិនមានទិន្នន័យវិភាគ។",
    noChartData: "មិនទាន់មានទិន្នន័យក្រាហ្វ។",
    noMonthlyActivity: "មិនទាន់មានសកម្មភាពប្រចាំខែ។",
    noTenantActivity: "មិនទាន់មានសកម្មភាពគេហទំព័រ។",
    created: "បានបង្កើត",
    published: "បានផ្សព្វផ្សាយ",
    createdTitle: (value: number) => `${value} បានបង្កើត`,
    publishedTitle: (value: number) => `${value} បានផ្សព្វផ្សាយ`,
    articles: "អត្ថបទ",
    users: "អ្នកប្រើ",
    sites: "គេហទំព័រ",
    views: "ចំនួនមើល",
    items: "ធាតុ",
    tenants: "គេហទំព័រ",
    platformUsers: "អ្នកប្រើវេទិកា",
    auditEvents: "កំណត់ត្រាសវនកម្ម",
    drafts: "ព្រាង",
    platformCharts: "ក្រាហ្វវេទិកា",
    tenantCharts: "ក្រាហ្វគេហទំព័រ",
    platformDescription:
      "ទិដ្ឋភាពអ្នកគ្រប់គ្រងកំពូលសម្រាប់គេហទំព័រ គេហទំព័រសាធារណៈ អ្នកប្រើវេទិកា និងសកម្មភាព។",
    tenantDescription: (tenantName?: string | null) =>
      `ទិដ្ឋភាពគេហទំព័រសម្រាប់ ${tenantName || "គេហទំព័រនេះ"} លើមាតិកា អ្នកប្រើ និងប្រសិទ្ធភាពសាធារណៈ។`,
    tenantActivity: "សកម្មភាពគេហទំព័រ",
    tenantActivityDescription: "បរិមាណអត្ថបទ និងសមាជិកសកម្មតាមគេហទំព័រ។",
    platformRoles: "តួនាទីវេទិកា",
    platformRolesDescription: "អ្នកគ្រប់គ្រងកំពូល និងអ្នកគ្រប់គ្រងគេហទំព័រប៉ុណ្ណោះ។",
    contentTimeline: "ពេលវេលាមាតិកា",
    timelineDescription: "អត្ថបទបានបង្កើត និងបានផ្សព្វផ្សាយក្នុង 6 ខែចុងក្រោយ។",
    articleStatus: "ស្ថានភាពអត្ថបទ",
    articleStatusDescription: "មាតិកាព្រាង រង់ចាំពិនិត្យ បានផ្សព្វផ្សាយ និងបានដាក់ប័ណ្ណសារសម្រាប់គេហទំព័រនេះ។",
    tenantRoles: "តួនាទីគេហទំព័រ",
    tenantRolesDescription: "សមាជិកសកម្មតាមតួនាទីគេហទំព័រ។",
    viewsByCategory: "ចំនួនមើលតាមប្រភេទ",
    viewsByCategoryDescription: "ចំនួនមើលអត្ថបទសាធារណៈតាមប្រភេទ។",
  },
};

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-emerald-500",
  DRAFT: "bg-slate-500",
  REVIEW: "bg-amber-500",
  ARCHIVED: "bg-zinc-400",
  SUPER_ADMIN: "bg-violet-500",
  ADMIN: "bg-red-500",
  EDITOR: "bg-blue-500",
  AUTHOR: "bg-emerald-500",
};

function formatLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function maxPointValue(points: DashboardChartPoint[]) {
  return Math.max(
    1,
    ...points.map((point) =>
      Math.max(point.value || 0, point.secondaryValue || 0),
    ),
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-md border border-dashed text-sm text-slate-500">
      {label}
    </div>
  );
}

function LoadingChart() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="animate-pulse space-y-2">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-6 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function HorizontalBars({
  points,
  valueLabel = "items",
  emptyLabel,
  locale,
}: {
  points: DashboardChartPoint[];
  valueLabel?: string;
  emptyLabel: string;
  locale: string;
}) {
  const numberLocale = locale === "km" ? "km-KH" : undefined;
  const maxValue = maxPointValue(points);
  const visiblePoints = points.filter(
    (point) => point.value > 0 || (point.secondaryValue ?? 0) > 0,
  );

  if (visiblePoints.length === 0) {
    return <EmptyChart label={emptyLabel} />;
  }

  return (
    <div className="space-y-4">
      {visiblePoints.map((point) => {
        const percent = Math.max(4, Math.round((point.value / maxValue) * 100));

        return (
          <div key={point.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">
                {formatLabel(point.label)}
              </span>
              <span className="text-slate-500">
                {point.value.toLocaleString(numberLocale)} {valueLabel}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  statusColors[point.label] || "bg-indigo-500"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyBars({
  points,
  copy,
}: {
  points: DashboardChartPoint[];
  copy: typeof chartCopy.en;
}) {
  const maxValue = maxPointValue(points);

  if (points.length === 0) {
    return <EmptyChart label={copy.noMonthlyActivity} />;
  }

  return (
    <div className="flex h-56 items-end gap-3 pt-4">
      {points.map((point) => {
        const createdHeight = Math.max(6, (point.value / maxValue) * 180);
        const publishedHeight = Math.max(
          6,
          ((point.secondaryValue || 0) / maxValue) * 180,
        );

        return (
          <div
            key={point.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div className="flex h-44 items-end gap-1.5">
              <div
                className="w-4 rounded-t bg-blue-500"
                style={{ height: `${createdHeight}px` }}
                title={copy.createdTitle(point.value)}
              />
              <div
                className="w-4 rounded-t bg-emerald-500"
                style={{ height: `${publishedHeight}px` }}
                title={copy.publishedTitle(point.secondaryValue || 0)}
              />
            </div>
            <span className="text-xs font-medium text-slate-500">
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TenantActivity({
  tenants,
  copy,
}: {
  tenants: DashboardTenantMetric[];
  copy: typeof chartCopy.en;
}) {
  const maxArticles = Math.max(1, ...tenants.map((tenant) => tenant.articles));

  if (tenants.length === 0) {
    return <EmptyChart label={copy.noTenantActivity} />;
  }

  return (
    <div className="space-y-3">
      {tenants.map((tenant) => {
        const percent = Math.max(
          4,
          Math.round((tenant.articles / maxArticles) * 100),
        );

        return (
          <div key={tenant.id} className="rounded-md border p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {tenant.name}
                </p>
                <p className="text-xs text-slate-500">/{tenant.slug}</p>
              </div>
              <Badge variant="outline">{tenant.status}</Badge>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500">
              <span>{tenant.articles} {copy.articles}</span>
              <span>{tenant.users} {copy.users}</span>
              <span>{tenant.publicSites} {copy.sites}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryStrip({
  analytics,
  copy,
  locale,
}: {
  analytics: DashboardAnalytics;
  copy: typeof chartCopy.en;
  locale: string;
}) {
  const numberLocale = locale === "km" ? "km-KH" : undefined;
  const isPlatform = analytics.scope === "PLATFORM";
  const items = isPlatform
    ? [
        {
          label: copy.tenants,
          value: analytics.summary.activeTenants,
          icon: Building2,
        },
        {
          label: copy.platformUsers,
          value: analytics.summary.totalUsers,
          icon: Users,
        },
        {
          label: copy.articles,
          value: analytics.summary.totalArticles,
          icon: FileText,
        },
        {
          label: copy.auditEvents,
          value: analytics.summary.auditEvents,
          icon: BarChart3,
        },
      ]
    : [
        {
          label: copy.published,
          value: analytics.summary.publishedArticles,
          icon: FileText,
        },
        {
          label: copy.drafts,
          value: analytics.summary.draftArticles,
          icon: FileText,
        },
        {
          label: copy.views,
          value: analytics.summary.totalViews,
          icon: Eye,
        },
        {
          label: copy.users,
          value: analytics.summary.activeUsers,
          icon: Users,
        },
      ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label} className="rounded-md border bg-slate-50 p-3">
            <Icon className="h-4 w-4 text-blue-600" />
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {item.value.toLocaleString(numberLocale)}
            </p>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardCharts({ analytics, loading }: DashboardChartsProps) {
  const { locale } = useAdminLocale();
  const copy = chartCopy[locale];

  if (loading && !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{copy.charts}</CardTitle>
          <CardDescription>{copy.loadingCharts}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingChart />
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{copy.charts}</CardTitle>
          <CardDescription>{copy.dataUnavailable}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyChart label={copy.noAnalytics} />
        </CardContent>
      </Card>
    );
  }

  const isPlatform = analytics.scope === "PLATFORM";

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            {isPlatform ? copy.platformCharts : copy.tenantCharts}
          </CardTitle>
          <CardDescription>
            {isPlatform
              ? copy.platformDescription
              : copy.tenantDescription(analytics.tenantName)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SummaryStrip analytics={analytics} copy={copy} locale={locale} />
        </CardContent>
      </Card>

      {isPlatform ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <CardHeader>
              <CardTitle>{copy.tenantActivity}</CardTitle>
              <CardDescription>
                {copy.tenantActivityDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TenantActivity tenants={analytics.tenantActivity} copy={copy} />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{copy.platformRoles}</CardTitle>
                <CardDescription>
                  {copy.platformRolesDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HorizontalBars points={analytics.userRoles} valueLabel={copy.users} emptyLabel={copy.noChartData} locale={locale} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{copy.contentTimeline}</CardTitle>
                <CardDescription>
                  {copy.timelineDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyBars points={analytics.monthlyContent} copy={copy} />
                <div className="mt-3 flex gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    {copy.created}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    {copy.published}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{copy.articleStatus}</CardTitle>
              <CardDescription>
                {copy.articleStatusDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HorizontalBars points={analytics.articleStatus} valueLabel={copy.articles} emptyLabel={copy.noChartData} locale={locale} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{copy.tenantRoles}</CardTitle>
              <CardDescription>
                {copy.tenantRolesDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HorizontalBars points={analytics.userRoles} valueLabel={copy.users} emptyLabel={copy.noChartData} locale={locale} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{copy.contentTimeline}</CardTitle>
              <CardDescription>
                {copy.timelineDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyBars points={analytics.monthlyContent} copy={copy} />
              <div className="mt-3 flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  {copy.created}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  {copy.published}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{copy.viewsByCategory}</CardTitle>
              <CardDescription>
                {copy.viewsByCategoryDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HorizontalBars points={analytics.categoryViews} valueLabel={copy.views} emptyLabel={copy.noChartData} locale={locale} />
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
