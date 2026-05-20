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

type DashboardChartsProps = {
  analytics: DashboardAnalytics | null;
  loading?: boolean;
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
}: {
  points: DashboardChartPoint[];
  valueLabel?: string;
}) {
  const maxValue = maxPointValue(points);
  const visiblePoints = points.filter(
    (point) => point.value > 0 || (point.secondaryValue ?? 0) > 0,
  );

  if (visiblePoints.length === 0) {
    return <EmptyChart label="No chart data yet." />;
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
                {point.value.toLocaleString()} {valueLabel}
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

function MonthlyBars({ points }: { points: DashboardChartPoint[] }) {
  const maxValue = maxPointValue(points);

  if (points.length === 0) {
    return <EmptyChart label="No monthly activity yet." />;
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
                title={`${point.value} created`}
              />
              <div
                className="w-4 rounded-t bg-emerald-500"
                style={{ height: `${publishedHeight}px` }}
                title={`${point.secondaryValue || 0} published`}
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

function TenantActivity({ tenants }: { tenants: DashboardTenantMetric[] }) {
  const maxArticles = Math.max(1, ...tenants.map((tenant) => tenant.articles));

  if (tenants.length === 0) {
    return <EmptyChart label="No tenant activity yet." />;
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
              <span>{tenant.articles} articles</span>
              <span>{tenant.users} users</span>
              <span>{tenant.publicSites} sites</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryStrip({ analytics }: { analytics: DashboardAnalytics }) {
  const isPlatform = analytics.scope === "PLATFORM";
  const items = isPlatform
    ? [
        {
          label: "Tenants",
          value: analytics.summary.activeTenants,
          icon: Building2,
        },
        {
          label: "Platform Users",
          value: analytics.summary.totalUsers,
          icon: Users,
        },
        {
          label: "Articles",
          value: analytics.summary.totalArticles,
          icon: FileText,
        },
        {
          label: "Audit Events",
          value: analytics.summary.auditEvents,
          icon: BarChart3,
        },
      ]
    : [
        {
          label: "Published",
          value: analytics.summary.publishedArticles,
          icon: FileText,
        },
        {
          label: "Drafts",
          value: analytics.summary.draftArticles,
          icon: FileText,
        },
        {
          label: "Views",
          value: analytics.summary.totalViews,
          icon: Eye,
        },
        {
          label: "Users",
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
              {item.value.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardCharts({ analytics, loading }: DashboardChartsProps) {
  if (loading && !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Charts</CardTitle>
          <CardDescription>Loading dashboard chart data...</CardDescription>
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
          <CardTitle>Charts</CardTitle>
          <CardDescription>Dashboard chart data is not available.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyChart label="No analytics data available." />
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
            {isPlatform ? "Platform Charts" : "Tenant Charts"}
          </CardTitle>
          <CardDescription>
            {isPlatform
              ? "Super admin view across tenants, public sites, platform users, and activity."
              : `Tenant view for ${analytics.tenantName || "this website"} content, users, and public performance.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SummaryStrip analytics={analytics} />
        </CardContent>
      </Card>

      {isPlatform ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Activity</CardTitle>
              <CardDescription>
                Article volume and active membership per tenant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TenantActivity tenants={analytics.tenantActivity} />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Roles</CardTitle>
                <CardDescription>
                  Super admins and tenant admins only.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HorizontalBars points={analytics.userRoles} valueLabel="users" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Content Timeline</CardTitle>
                <CardDescription>
                  Created vs published articles over the last 6 months.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyBars points={analytics.monthlyContent} />
                <div className="mt-3 flex gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Created
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Published
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
              <CardTitle>Article Status</CardTitle>
              <CardDescription>
                Draft, review, published, and archived content for this tenant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HorizontalBars points={analytics.articleStatus} valueLabel="articles" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tenant Roles</CardTitle>
              <CardDescription>
                Active team members by tenant role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HorizontalBars points={analytics.userRoles} valueLabel="users" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Content Timeline</CardTitle>
              <CardDescription>
                Created vs published articles over the last 6 months.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyBars points={analytics.monthlyContent} />
              <div className="mt-3 flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Created
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Published
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Views By Category</CardTitle>
              <CardDescription>
                Public article views grouped by category.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HorizontalBars points={analytics.categoryViews} valueLabel="views" />
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
