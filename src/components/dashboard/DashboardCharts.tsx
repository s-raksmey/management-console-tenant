"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Building2,
  Eye,
  FileText,
  Globe,
  Shield,
  Users,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

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
    noTenantActivity: "No sub-tenant activity yet.",
    created: "Created",
    published: "Published",
    articles: "articles",
    users: "users",
    sites: "sites",
    views: "views",
    tenants: "Sub-tenants",
    publicSites: "Public sites",
    mainTenantUsers: "Super Admins",
    auditEvents: "Audit events",
    drafts: "Drafts",
    mainTenantCharts: "Console overview",
    tenantCharts: "Website performance",
    mainTenantDescription:
      "Operations across sub-tenants, public sites, Super Admins, and console activity.",
    tenantDescription: (tenantName?: string | null) =>
      `Content, team, and public performance for ${tenantName || "this website"}.`,
    tenantActivity: "Sub-tenant comparison",
    tenantActivityDescription: "Team size and public sites for each sub-tenant.",
    tenantHealth: "Tenant status",
    tenantHealthDescription: "Active, suspended, and archived sub-tenants.",
    mainTenantRoles: "Console operators",
    mainTenantRolesDescription: "Super Admins on the management console.",
    operations: "Operations over time",
    operationsDescription: "Audit events and new sub-tenants over the last 6 months.",
    auditActivity: "Audit events",
    newTenants: "New sub-tenants",
    teamMembers: "Team",
    contentTimeline: "Publishing over time",
    timelineDescription: "Articles created and published in the last 6 months.",
    articleStatus: "Content mix",
    articleStatusDescription: "How this website’s articles are split by status.",
    tenantRoles: "Team mix",
    tenantRolesDescription: "Active members by role.",
    viewsByCategory: "Audience by category",
    viewsByCategoryDescription: "Share of public views across categories.",
    share: "share",
    peak: "Peak",
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
    articles: "អត្ថបទ",
    users: "អ្នកប្រើ",
    sites: "គេហទំព័រ",
    views: "ចំនួនមើល",
    tenants: "គេហទំព័រ",
    publicSites: "គេហទំព័រសាធារណៈ",
    mainTenantUsers: "អ្នកគ្រប់គ្រងកំពូល",
    auditEvents: "កំណត់ត្រាសវនកម្ម",
    drafts: "ព្រាង",
    mainTenantCharts: "ទិដ្ឋភាពកុងសូល",
    tenantCharts: "ប្រសិទ្ធភាពគេហទំព័រ",
    mainTenantDescription:
      "ប្រតិបត្តិការលើគេហទំព័ររង គេហទំព័រសាធារណៈ អ្នកគ្រប់គ្រងកំពូល និងសកម្មភាពកុងសូល។",
    tenantDescription: (tenantName?: string | null) =>
      `មាតិកា ក្រុម និងប្រសិទ្ធភាពសាធារណៈសម្រាប់ ${tenantName || "គេហទំព័រនេះ"}។`,
    tenantActivity: "ប្រៀបធៀបគេហទំព័រ",
    tenantActivityDescription: "ទំហំក្រុម និងគេហទំព័រសាធារណៈតាមគេហទំព័ររង។",
    tenantHealth: "ស្ថានភាពគេហទំព័រ",
    tenantHealthDescription: "គេហទំព័រសកម្ម ផ្អាក និងដាក់ប័ណ្ណសារ។",
    mainTenantRoles: "អ្នកដំណើរការកុងសូល",
    mainTenantRolesDescription: "អ្នកគ្រប់គ្រងកំពូលនៅលើកុងសូលគ្រប់គ្រង។",
    operations: "ប្រតិបត្តិការតាមពេលវេលា",
    operationsDescription: "ព្រឹត្តិការណ៍សវនកម្ម និងគេហទំព័រថ្មីក្នុង 6 ខែចុងក្រោយ។",
    auditActivity: "ព្រឹត្តិការណ៍សវនកម្ម",
    newTenants: "គេហទំព័រថ្មី",
    teamMembers: "ក្រុម",
    contentTimeline: "ការផ្សព្វផ្សាយតាមពេលវេលា",
    timelineDescription: "អត្ថបទបានបង្កើត និងបានផ្សព្វផ្សាយក្នុង 6 ខែចុងក្រោយ។",
    articleStatus: "សមាសភាពមាតិកា",
    articleStatusDescription: "ការបែងចែកអត្ថបទតាមស្ថានភាព។",
    tenantRoles: "សមាសភាពក្រុម",
    tenantRolesDescription: "សមាជិកសកម្មតាមតួនាទី។",
    viewsByCategory: "ទស្សនិកជនតាមប្រភេទ",
    viewsByCategoryDescription: "ចំណែកចំនួនមើលសាធារណៈតាមប្រភេទ។",
    share: "ចំណែក",
    peak: "កំពូល",
  },
};

const donutStroke: Record<string, string> = {
  SUPER_ADMIN: "#8b5cf6",
  ADMIN: "#f43f5e",
  EDITOR: "#38bdf8",
  AUTHOR: "#34d399",
  ACTIVE: "#34d399",
  SUSPENDED: "#f59e0b",
  ARCHIVED: "#94a3b8",
  PUBLISHED: "#34d399",
  DRAFT: "#64748b",
  REVIEW: "#f59e0b",
};

const categoryPalette = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#06b6d4", "#f43f5e"];

function formatLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value: number, locale: string) {
  return value.toLocaleString(locale === "km" ? "km-KH" : undefined);
}

function maxPointValue(points: DashboardChartPoint[]) {
  return Math.max(
    1,
    ...points.map((point) => Math.max(point.value || 0, point.secondaryValue || 0)),
  );
}

function peakPoint(points: DashboardChartPoint[]) {
  return points.reduce((highest, point) => {
    const current = Math.max(point.value, point.secondaryValue || 0);
    const best = Math.max(highest.value, highest.secondaryValue || 0);
    return current >= best ? point : highest;
  }, points[0]);
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {label}
    </div>
  );
}

function LoadingChart() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const width = 88;
  const height = 28;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const path = values
    .map((value, index) => {
      const x = index * step;
      const y = height - 3 - (value / max) * (height - 6);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-[88px] overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DonutChart({
  points,
  centerValue,
  centerLabel,
  emptyLabel,
  showZeros = true,
}: {
  points: DashboardChartPoint[];
  centerValue: string;
  centerLabel: string;
  emptyLabel: string;
  showZeros?: boolean;
}) {
  const visible = points.filter((point) => point.value > 0);
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const legend = showZeros ? points : visible;

  if (total === 0) {
    return <EmptyChart label={emptyLabel} />;
  }

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative h-48 w-48 shrink-0">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth="18"
          />
          {visible.length === 1 ? (
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={donutStroke[visible[0].label] || categoryPalette[0]}
              strokeWidth="18"
            />
          ) : (
            visible.map((point) => {
              const dash = (point.value / total) * circumference;
              const circle = (
                <circle
                  key={point.label}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={donutStroke[point.label] || categoryPalette[0]}
                  strokeWidth="18"
                  strokeDasharray={`${Math.max(dash - 4, 1)} ${circumference - dash + 4}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return circle;
            })
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-slate-950 dark:text-white">{centerValue}</p>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">{centerLabel}</p>
        </div>
      </div>
      <div className="w-full min-w-0 space-y-3">
        {legend.map((point) => {
          const percent = total > 0 ? Math.round((point.value / total) * 100) : 0;
          return (
            <div key={point.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: donutStroke[point.label] || categoryPalette[0] }}
                />
                {formatLabel(point.label)}
              </span>
              <span className="tabular-nums text-slate-500">
                <strong className="text-slate-900 dark:text-white">{point.value}</strong>
                <span className="ml-2 text-xs">{percent}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupedBarChart({
  points,
  primaryLabel,
  secondaryLabel,
  emptyLabel,
  locale,
  peakLabel,
}: {
  points: DashboardChartPoint[];
  primaryLabel: string;
  secondaryLabel: string;
  emptyLabel: string;
  locale: string;
  peakLabel: string;
}) {
  const maxValue = maxPointValue(points);
  const peak = peakPoint(points);
  const hasData = points.some((point) => point.value > 0 || (point.secondaryValue || 0) > 0);

  if (!hasData) {
    return <EmptyChart label={emptyLabel} />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" />
            {primaryLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
            {secondaryLabel}
          </span>
        </div>
        {peak ? (
          <span>
            {peakLabel} {peak.label}: {formatNumber(Math.max(peak.value, peak.secondaryValue || 0), locale)}
          </span>
        ) : null}
      </div>
      <div className="flex h-[280px] items-end gap-3 sm:gap-5">
        {points.map((point) => {
          const createdHeight = (point.value / maxValue) * 220;
          const publishedHeight = ((point.secondaryValue || 0) / maxValue) * 220;

          return (
            <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-3">
              <div className="flex h-[232px] w-full items-end justify-center gap-1.5 sm:gap-2">
                <div className="flex h-full w-[46%] max-w-12 flex-col items-center justify-end">
                  {point.value > 0 ? (
                    <span className="mb-1 text-[11px] font-semibold text-sky-300">
                      {formatNumber(point.value, locale)}
                    </span>
                  ) : null}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(createdHeight, point.value > 0 ? 8 : 0)}px` }}
                    className="w-full rounded-t-md bg-gradient-to-t from-blue-700 to-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.25)]"
                  />
                </div>
                <div className="flex h-full w-[46%] max-w-12 flex-col items-center justify-end">
                  {(point.secondaryValue || 0) > 0 ? (
                    <span className="mb-1 text-[11px] font-semibold text-emerald-300">
                      {formatNumber(point.secondaryValue || 0, locale)}
                    </span>
                  ) : null}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{
                      height: `${Math.max(publishedHeight, (point.secondaryValue || 0) > 0 ? 8 : 0)}px`,
                    }}
                    className="w-full rounded-t-md bg-gradient-to-t from-emerald-700 to-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.25)]"
                  />
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500">{point.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AreaTrendChart({
  points,
  primaryLabel,
  secondaryLabel,
  emptyLabel,
  locale,
  independentSecondary = false,
}: {
  points: DashboardChartPoint[];
  primaryLabel: string;
  secondaryLabel: string;
  emptyLabel: string;
  locale: string;
  independentSecondary?: boolean;
}) {
  const gradientId = useId();
  const width = 720;
  const height = 260;
  const padX = 28;
  const padY = 24;
  const hasData = points.some((point) => point.value > 0 || (point.secondaryValue || 0) > 0);

  if (!hasData) {
    return <EmptyChart label={emptyLabel} />;
  }

  const maxPrimary = Math.max(1, ...points.map((point) => point.value));
  const maxSecondary = Math.max(1, ...points.map((point) => point.secondaryValue || 0));
  const step = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;
  const coords = points.map((point, index) => {
    const x = padX + index * step;
    const y = height - padY - (point.value / maxPrimary) * (height - padY * 2);
    const secondaryMax = independentSecondary ? maxSecondary : maxPrimary;
    const secondaryY =
      height - padY - ((point.secondaryValue || 0) / secondaryMax) * (height - padY * 2);
    return { x, y, secondaryY, point };
  });

  const toCurve = (key: "y" | "secondaryY") =>
    coords
      .map((coord, index) => {
        if (index === 0) return `M${coord.x},${coord[key]}`;
        const prev = coords[index - 1];
        const cx = (prev.x + coord.x) / 2;
        return `C${cx},${prev[key]} ${cx},${coord[key]} ${coord.x},${coord[key]}`;
      })
      .join(" ");

  const line = toCurve("y");
  const area = `${line} L${coords[coords.length - 1].x},${height - padY} L${coords[0].x},${height - padY} Z`;
  const secondaryLine = toCurve("secondaryY");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {coords.map((coord) => (
          <line
            key={coord.point.label}
            x1={coord.x}
            x2={coord.x}
            y1={padY}
            y2={height - padY}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeDasharray="2 8"
          />
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
        <path
          d={secondaryLine}
          fill="none"
          stroke="#34d399"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="7 6"
        />
        {coords.map((coord) => (
          <g key={coord.point.label}>
            <circle cx={coord.x} cy={coord.y} r="5" fill="#38bdf8" />
            <text
              x={coord.x}
              y={coord.y - 12}
              textAnchor="middle"
              className="fill-current text-[10px] text-slate-400"
            >
              {formatNumber(coord.point.value, locale)}
            </text>
            {(coord.point.secondaryValue || 0) > 0 ? (
              <circle cx={coord.x} cy={coord.secondaryY} r="4" fill="#34d399" />
            ) : null}
          </g>
        ))}
      </svg>
      <div className="mt-1 grid grid-cols-6 text-center text-xs font-medium text-slate-500">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
          {primaryLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          {secondaryLabel}
        </span>
      </div>
    </div>
  );
}

function ShareBars({
  points,
  valueLabel,
  emptyLabel,
  locale,
}: {
  points: DashboardChartPoint[];
  valueLabel: string;
  emptyLabel: string;
  locale: string;
}) {
  const visible = points.filter((point) => point.value > 0);
  const total = visible.reduce((sum, point) => sum + point.value, 0);

  if (total === 0) {
    return <EmptyChart label={emptyLabel} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {visible.map((point, index) => (
          <div
            key={point.label}
            className="h-full"
            style={{
              width: `${(point.value / total) * 100}%`,
              backgroundColor: categoryPalette[index % categoryPalette.length],
            }}
            title={`${point.label}: ${point.value}`}
          />
        ))}
      </div>
      <div className="space-y-4">
        {visible.map((point, index) => {
          const percent = Math.round((point.value / total) * 100);
          return (
            <div key={point.label} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: categoryPalette[index % categoryPalette.length] }}
                  />
                  {point.label}
                </span>
                <span className="tabular-nums text-slate-500">
                  {formatNumber(point.value, locale)} {valueLabel}
                  <span className="ml-2 text-xs font-semibold text-slate-400">{percent}%</span>
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(percent, 6)}%` }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: categoryPalette[index % categoryPalette.length] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TenantComparison({
  tenants,
  copy,
  locale,
}: {
  tenants: DashboardTenantMetric[];
  copy: typeof chartCopy.en;
  locale: string;
}) {
  if (tenants.length === 0) {
    return <EmptyChart label={copy.noTenantActivity} />;
  }

  const maxUsers = Math.max(1, ...tenants.map((tenant) => tenant.users));
  const maxSites = Math.max(1, ...tenants.map((tenant) => tenant.publicSites));

  return (
    <div className="space-y-5">
      {tenants.map((tenant, index) => (
        <motion.div
          key={tenant.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900 dark:text-white">{tenant.name}</p>
              <p className="text-xs text-slate-500">/{tenant.slug}</p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "border-transparent",
                tenant.status === "ACTIVE"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400",
              )}
            >
              {tenant.status}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>{copy.teamMembers}</span>
                <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-200">
                  {formatNumber(tenant.users, locale)}
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400"
                  style={{ width: `${Math.max(8, (tenant.users / maxUsers) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>{copy.sites}</span>
                <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-200">
                  {formatNumber(tenant.publicSites, locale)}
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-sky-400"
                  style={{ width: `${Math.max(8, (tenant.publicSites / maxSites) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
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
  const isMainTenantView = analytics.scope === "PLATFORM";
  const monthly = analytics.monthlyContent;
  const items = isMainTenantView
    ? [
        {
          label: copy.tenants,
          value: analytics.summary.activeTenants,
          icon: Building2,
          color: "#38bdf8",
          spark: monthly.map((point) => point.secondaryValue || 0),
        },
        {
          label: copy.publicSites,
          value: analytics.summary.publicSites,
          icon: Globe,
          color: "#22d3ee",
          spark: monthly.map((point) => point.secondaryValue || 0),
        },
        {
          label: copy.mainTenantUsers,
          value: analytics.summary.totalUsers,
          icon: Shield,
          color: "#a78bfa",
          spark: monthly.map(() => analytics.summary.totalUsers),
        },
        {
          label: copy.auditEvents,
          value: analytics.summary.auditEvents,
          icon: Activity,
          color: "#f59e0b",
          spark: monthly.map((point) => point.value),
        },
      ]
    : [
        {
          label: copy.published,
          value: analytics.summary.publishedArticles,
          icon: FileText,
          color: "#34d399",
          spark: monthly.map((point) => point.secondaryValue || 0),
        },
        {
          label: copy.drafts,
          value: analytics.summary.draftArticles,
          icon: FileText,
          color: "#94a3b8",
          spark: monthly.map((point) => Math.max(point.value - (point.secondaryValue || 0), 0)),
        },
        {
          label: copy.views,
          value: analytics.summary.totalViews,
          icon: Eye,
          color: "#38bdf8",
          spark: monthly.map((point) => point.value),
        },
        {
          label: copy.users,
          value: analytics.summary.activeUsers,
          icon: Users,
          color: "#a78bfa",
          spark: monthly.map(() => analytics.summary.activeUsers),
        },
      ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0b1220]"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className="inline-flex rounded-xl p-2"
                style={{ backgroundColor: `${item.color}22`, color: item.color }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <Sparkline values={item.spark} color={item.color} />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              {formatNumber(item.value, locale)}
            </p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
          </motion.div>
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

  const isMainTenantView = analytics.scope === "PLATFORM";
  const tenantHealthPoints: DashboardChartPoint[] = [
    {
      label: "ACTIVE",
      value: analytics.tenantActivity.filter((tenant) => tenant.status === "ACTIVE").length,
    },
    {
      label: "SUSPENDED",
      value: analytics.tenantActivity.filter((tenant) => tenant.status === "SUSPENDED").length,
    },
    {
      label: "ARCHIVED",
      value: analytics.tenantActivity.filter((tenant) => tenant.status === "ARCHIVED").length,
    },
  ];

  return (
    <section className="space-y-6">
      <SummaryStrip analytics={analytics} copy={copy} locale={locale} />

      {isMainTenantView ? (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{copy.tenantActivity}</CardTitle>
                <CardDescription>{copy.tenantActivityDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <TenantComparison tenants={analytics.tenantActivity} copy={copy} locale={locale} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{copy.tenantHealth}</CardTitle>
                <CardDescription>{copy.tenantHealthDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart
                  points={tenantHealthPoints}
                  centerValue={String(analytics.summary.totalTenants)}
                  centerLabel={copy.tenants}
                  emptyLabel={copy.noTenantActivity}
                />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{copy.operations}</CardTitle>
              <CardDescription>{copy.operationsDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <AreaTrendChart
                points={analytics.monthlyContent}
                primaryLabel={copy.auditActivity}
                secondaryLabel={copy.newTenants}
                emptyLabel={copy.noMonthlyActivity}
                locale={locale}
                independentSecondary
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{copy.articleStatus}</CardTitle>
                <CardDescription>{copy.articleStatusDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart
                  points={analytics.articleStatus}
                  centerValue={String(analytics.summary.totalArticles)}
                  centerLabel={copy.articles}
                  emptyLabel={copy.noChartData}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{copy.tenantRoles}</CardTitle>
                <CardDescription>{copy.tenantRolesDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart
                  points={analytics.userRoles}
                  centerValue={String(analytics.summary.activeUsers)}
                  centerLabel={copy.users}
                  emptyLabel={copy.noChartData}
                />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{copy.contentTimeline}</CardTitle>
              <CardDescription>{copy.timelineDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <GroupedBarChart
                points={analytics.monthlyContent}
                primaryLabel={copy.created}
                secondaryLabel={copy.published}
                emptyLabel={copy.noMonthlyActivity}
                locale={locale}
                peakLabel={copy.peak}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{copy.viewsByCategory}</CardTitle>
              <CardDescription>{copy.viewsByCategoryDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <ShareBars
                points={analytics.categoryViews}
                valueLabel={copy.views}
                emptyLabel={copy.noChartData}
                locale={locale}
              />
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
