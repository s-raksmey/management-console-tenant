"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Loader2,
  Minus,
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
  AnalyticsGroupBy,
  DashboardAnalytics,
  DashboardChartPoint,
  DashboardTenantMetric,
  TenantCategoryView,
  TenantPublishingPoint,
  TenantTimeAnalytics,
} from "@/services/dashboard-analytics.gql";
import { useAdminLocale } from "@/hooks/useAdminLocale";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DashboardChartsProps = {
  analytics: DashboardAnalytics | null;
  loading?: boolean;
  tenantTimeAnalytics?: TenantTimeAnalytics | null;
  timeLoading?: boolean;
  timeError?: string | null;
  groupBy?: AnalyticsGroupBy;
  onGroupByChange?: (groupBy: AnalyticsGroupBy) => void;
  rangeLabel?: string;
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
    viewsByCategoryDescription: "Share of public views across categories and subcategories.",
    share: "share",
    monthly: "Monthly",
    daily: "Daily",
    weekly: "Weekly",
    currentState: "Current state",
    selectedPeriod: "Selected period",
    noPublishingActivity: "No publishing activity in this period.",
    noViewsInPeriod: "No views in this period.",
    periodViews: "Views in selected period",
    categories: "Categories",
    noPublicViews: "No public views during this period.",
    ofAllViews: "of all views",
    ofParentViews: (name: string) => `of ${name} views`,
    showAllTopics: (count: number) => `Show all ${count} subcategories`,
    showFewerTopics: "Show fewer",
    comparisonUnavailable: "Comparison unavailable",
    previousSixMonths: "vs previous 6 months",
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
    viewsByCategoryDescription: "ចំណែកការមើលសាធារណៈតាមប្រភេទ និងប្រភេទរង។",
    share: "ចំណែក",
    monthly: "ប្រចាំខែ",
    daily: "ប្រចាំថ្ងៃ",
    weekly: "ប្រចាំសប្តាហ៍",
    currentState: "ស្ថានភាពបច្ចុប្បន្ន",
    selectedPeriod: "រយៈពេលដែលបានជ្រើស",
    noPublishingActivity: "មិនមានសកម្មភាពផ្សព្វផ្សាយក្នុងរយៈពេលនេះទេ។",
    noViewsInPeriod: "មិនមានការមើលក្នុងរយៈពេលនេះទេ។",
    periodViews: "ការមើលក្នុងរយៈពេលដែលបានជ្រើស",
    categories: "ប្រភេទ",
    noPublicViews: "មិនមានការមើលសាធារណៈក្នុងរយៈពេលនេះទេ។",
    ofAllViews: "នៃការមើលទាំងអស់",
    ofParentViews: (name: string) => `នៃការមើលក្នុង ${name}`,
    showAllTopics: (count: number) => `បង្ហាញប្រភេទរងទាំង ${count}`,
    showFewerTopics: "បង្ហាញតិច",
    comparisonUnavailable: "មិនមានទិន្នន័យប្រៀបធៀប",
    previousSixMonths: "ធៀបនឹង 6 ខែមុន",
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

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {label}
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

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative h-40 w-40 shrink-0">
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
  const secondaryGradientId = `${gradientId}-secondary`;
  const width = 1200;
  const height = 240;
  const padX = 52;
  const padRight = 12;
  const padY = 16;
  const hasData = points.some((point) => point.value > 0 || (point.secondaryValue || 0) > 0);

  if (!hasData) {
    return <EmptyChart label={emptyLabel} />;
  }

  const rawMax = Math.max(1, ...points.map((point) => Math.max(point.value, point.secondaryValue || 0)));
  const axisMax = Math.max(8, Math.ceil(rawMax / 2) * 2);
  const maxPrimary = axisMax;
  const maxSecondary = independentSecondary
    ? Math.max(1, ...points.map((point) => point.secondaryValue || 0))
    : axisMax;
  const step = points.length > 1 ? (width - padX - padRight) / (points.length - 1) : 0;
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
  const secondaryArea = `${secondaryLine} L${coords[coords.length - 1].x},${height - padY} L${coords[0].x},${height - padY} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={secondaryGradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((tick) => {
          const value = axisMax - (tick / 4) * axisMax;
          const y = padY + (tick / 4) * (height - padY * 2);
          return (
            <g key={tick}>
              <line
                x1={padX}
                x2={width - padRight}
                y1={y}
                y2={y}
                className="stroke-slate-200 dark:stroke-slate-800"
              />
              <text x={padX - 12} y={y + 4} textAnchor="end" className="fill-slate-500 text-[11px]">
                {formatNumber(Math.round(value), locale)}
              </text>
            </g>
          );
        })}
        {coords.map((coord) => (
          <line
            key={`grid-${coord.point.label}`}
            x1={coord.x}
            x2={coord.x}
            y1={padY}
            y2={height - padY}
            className="stroke-slate-100 dark:stroke-slate-800/70"
          />
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={secondaryArea} fill={`url(#${secondaryGradientId})`} />
        <path d={line} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
        <path
          d={secondaryLine}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {coords.map((coord) => (
          <g key={coord.point.label}>
            <circle cx={coord.x} cy={coord.y} r="4" fill="#3b82f6">
              <title>{`${coord.point.label} · ${primaryLabel}: ${formatNumber(coord.point.value, locale)}`}</title>
            </circle>
            {(coord.point.secondaryValue || 0) > 0 ? (
              <circle cx={coord.x} cy={coord.secondaryY} r="4" fill="#22c55e">
                <title>{`${coord.point.label} · ${secondaryLabel}: ${formatNumber(coord.point.secondaryValue || 0, locale)}`}</title>
              </circle>
            ) : null}
          </g>
        ))}
        {(() => {
          const latest = coords[coords.length - 1];
          const tooltipWidth = 116;
          const tooltipHeight = 66;
          const x = Math.max(padX + 4, latest.x - tooltipWidth + 10);
          const y = Math.max(padY + 4, Math.min(latest.y - tooltipHeight - 10, height - padY - tooltipHeight));
          return (
            <g pointerEvents="none">
              <rect x={x} y={y} width={tooltipWidth} height={tooltipHeight} rx="8" fill="#172033" />
              <text x={x + 10} y={y + 16} fill="#f8fafc" fontSize="10" fontWeight="600">
                {latest.point.label} {new Date().getFullYear()}
              </text>
              <circle cx={x + 14} cy={y + 31} r="3.5" fill="#3b82f6" />
              <text x={x + 23} y={y + 34} fill="#e2e8f0" fontSize="10">{primaryLabel}</text>
              <text x={x + tooltipWidth - 10} y={y + 34} fill="#f8fafc" fontSize="10" textAnchor="end">
                {formatNumber(latest.point.value, locale)}
              </text>
              <circle cx={x + 14} cy={y + 49} r="3.5" fill="#22c55e" />
              <text x={x + 23} y={y + 52} fill="#e2e8f0" fontSize="10">{secondaryLabel}</text>
              <text x={x + tooltipWidth - 10} y={y + 52} fill="#f8fafc" fontSize="10" textAnchor="end">
                {formatNumber(latest.point.secondaryValue || 0, locale)}
              </text>
            </g>
          );
        })()}
      </svg>
      <div className="mt-1 grid grid-cols-6 text-center text-xs font-medium text-slate-500">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}


function publishingPeriodLabel(point: TenantPublishingPoint, groupBy: AnalyticsGroupBy, locale: string) {
  const language = locale === "km" ? "km-KH" : "en-US";
  const start = new Date(point.start);
  if (groupBy === "MONTH") return new Intl.DateTimeFormat(language, { month: "long", year: "numeric", timeZone: "UTC" }).format(start);
  if (groupBy === "DAY") return new Intl.DateTimeFormat(language, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(start);
  const end = new Date(new Date(point.endExclusive).getTime() - 86400000);
  const shortDate = (date: Date) => new Intl.DateTimeFormat(language, { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
  const fullDate = (date: Date) => new Intl.DateTimeFormat(language, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
  return start.getUTCFullYear() === end.getUTCFullYear()
    ? `${shortDate(start)} – ${shortDate(end)}, ${end.getUTCFullYear()}`
    : `${fullDate(start)} – ${fullDate(end)}`;
}

function publishingAxisLabel(point: TenantPublishingPoint, groupBy: AnalyticsGroupBy, locale: string) {
  const language = locale === "km" ? "km-KH" : "en-US";
  const start = new Date(point.start);
  if (groupBy === "MONTH") return new Intl.DateTimeFormat(language, { month: "short", timeZone: "UTC" }).format(start);
  if (groupBy === "DAY") return new Intl.DateTimeFormat(language, { month: "short", day: "numeric", timeZone: "UTC" }).format(start);
  const end = new Date(new Date(point.endExclusive).getTime() - 86400000);
  const format = (date: Date) => new Intl.DateTimeFormat(language, { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
  return `${format(start)}–${format(end)}`;
}

function TenantPublishingChart({ points, groupBy, locale, loading, emptyLabel }: {
  points: TenantPublishingPoint[];
  groupBy: AnalyticsGroupBy;
  locale: string;
  loading: boolean;
  emptyLabel: string;
}) {
  const [hoveredPoint, setHoveredPoint] = useState<{ seriesKey: string; index: number } | null>(null);
  const seriesKey = `${groupBy}:${points.map(point => `${point.start}:${point.endExclusive}:${point.created}:${point.published}`).join("|")}`;
  const activeIndex = hoveredPoint?.seriesKey === seriesKey ? hoveredPoint.index : null;
  const width = 1200, height = 260, left = 56, right = 14, top = 20, bottom = 38;
  const plotHeight = height - top - bottom;
  const maxValue = Math.max(8, Math.ceil(Math.max(0, ...points.map(p => Math.max(p.created, p.published))) / 2) * 2);
  const step = points.length > 1 ? (width - left - right) / (points.length - 1) : width - left - right;
  const coords = points.map((point, index) => ({
    point, index,
    x: points.length > 1 ? left + index * step : left + (width - left - right) / 2,
    createdY: top + plotHeight - point.created / maxValue * plotHeight,
    publishedY: top + plotHeight - point.published / maxValue * plotHeight,
  }));
  const pathFor = (key: "createdY" | "publishedY") => coords.map((c, i) => `${i ? "L" : "M"}${c.x},${c[key]}`).join(" ");
  const active = activeIndex === null ? null : coords[activeIndex];

  return (
    <div className="relative">
      {loading && <div className="absolute right-2 top-2 z-10 rounded-md bg-white/90 p-1.5 text-slate-500 shadow-sm dark:bg-slate-900/90"><Loader2 className="h-3.5 w-3.5 animate-spin" /></div>}
      <svg viewBox={`0 0 ${width} ${height}`} className={cn("h-auto w-full overflow-visible", loading && "opacity-60")}>
        {[0, 1, 2, 3, 4].map(tick => {
          const y = top + tick / 4 * plotHeight;
          return <g key={tick}><line x1={left} x2={width - right} y1={y} y2={y} className="stroke-slate-200 dark:stroke-slate-800" /><text x={left - 12} y={y + 4} textAnchor="end" className="fill-slate-500 text-[11px]">{Math.round(maxValue - tick / 4 * maxValue)}</text></g>;
        })}
        {active && <line x1={active.x} x2={active.x} y1={top} y2={height - bottom} stroke="#94a3b8" strokeDasharray="4 4" />}
        {coords.map(c => {
          const band = points.length > 1 ? step : width - left - right;
          const x = Math.max(left, c.x - band / 2);
          return <rect key={`hit-${c.index}`} x={x} y={top} width={Math.min(band, width - right - x)} height={plotHeight} fill="transparent" tabIndex={0} role="button"
            aria-label={`${publishingPeriodLabel(c.point, groupBy, locale)}. Created ${c.point.created}. Published ${c.point.published}`}
            onMouseEnter={() => setHoveredPoint({ seriesKey, index: c.index })} onMouseLeave={() => setHoveredPoint(null)}
            onFocus={() => setHoveredPoint({ seriesKey, index: c.index })} onBlur={() => setHoveredPoint(null)} />;
        })}
        <path pointerEvents="none" d={pathFor("createdY")} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path pointerEvents="none" d={pathFor("publishedY")} fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map(c => <g key={`dot-${c.index}`} pointerEvents="none"><circle cx={c.x} cy={c.createdY} r={activeIndex === c.index ? 5 : 3.5} fill="#3b82f6" /><circle cx={c.x} cy={c.publishedY} r={activeIndex === c.index ? 5 : 3.5} fill="#22c55e" /></g>)}
        {active && (() => {
          const tw = 174, th = 78;
          const x = Math.max(left, Math.min(active.x - tw / 2, width - right - tw));
          const y = active.createdY < top + th + 14 ? top + 8 : active.createdY - th - 12;
          return <motion.g
            key={active.point.start}
            pointerEvents="none"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <rect x={x} y={y} width={tw} height={th} rx="8" fill="#172033" />
            <text x={x + 12} y={y + 20} fill="#f8fafc" fontSize="12" fontWeight="600">{publishingPeriodLabel(active.point, groupBy, locale)}</text>
            <circle cx={x + 15} cy={y + 42} r="4" fill="#3b82f6" /><text x={x + 26} y={y + 46} fill="#e2e8f0" fontSize="11">Created</text><text x={x + tw - 12} y={y + 46} fill="#f8fafc" fontSize="11" textAnchor="end">{formatNumber(active.point.created, locale)}</text>
            <circle cx={x + 15} cy={y + 62} r="4" fill="#22c55e" /><text x={x + 26} y={y + 66} fill="#e2e8f0" fontSize="11">Published</text><text x={x + tw - 12} y={y + 66} fill="#f8fafc" fontSize="11" textAnchor="end">{formatNumber(active.point.published, locale)}</text>
          </motion.g>;
        })()}
      </svg>
      {points.length > 0 && <div className="mt-2 grid text-center text-[11px] font-medium text-slate-500" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
        {points.map((point, index) => {
          const every = Math.max(1, Math.ceil((points.length - 1) / 5));
          const visible = index % every === 0 || index === points.length - 1;
          return <span key={point.start} className={visible ? "whitespace-nowrap" : "invisible"}>{publishingAxisLabel(point, groupBy, locale)}</span>;
        })}
      </div>}
      {!loading && points.length > 0 && points.every(p => p.created === 0 && p.published === 0) && <p className="mt-2 text-center text-xs text-slate-500">{emptyLabel}</p>}
      {!loading && points.length === 0 && <EmptyChart label={emptyLabel} />}
    </div>
  );
}

function TrendLegend({ primaryLabel, secondaryLabel, monthlyLabel }: {
  primaryLabel: string;
  secondaryLabel: string;
  monthlyLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
        {primaryLabel}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        {secondaryLabel}
      </span>
      <span className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
        {monthlyLabel}
        <ChevronDown className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

function AudienceByCategory({
  categories,
  rangeLabel,
  loading,
  error,
  copy,
  locale,
}: {
  categories: TenantCategoryView[];
  rangeLabel?: string;
  loading: boolean;
  error?: string | null;
  copy: typeof chartCopy.en;
  locale: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [showAll, setShowAll] = useState<Set<string>>(() => new Set());
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const totalViews = categories.reduce((sum, category) => sum + category.views, 0);
  const circumference = 2 * Math.PI * 52;

  const toggleSet = (setter: (update: Set<string> | ((current: Set<string>) => Set<string>)) => void, id: string) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute right-0 top-0 z-10 flex items-center gap-2 rounded-md bg-white/90 px-2 py-1 text-xs text-slate-500 shadow-sm dark:bg-slate-900/90">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="sr-only">{copy.loadingCharts}</span>
        </div>
      )}
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(180px,0.7fr)_minmax(0,1.3fr)]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-44 w-44 shrink-0">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label={`${formatNumber(totalViews, locale)} ${copy.views}`}>
              <circle cx="70" cy="70" r="52" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="16" />
              {categories.map((category, index) => {
                if (category.views <= 0 || totalViews === 0) return null;
                const dash = (category.views / totalViews) * circumference;
                const offset =
                  (categories.slice(0, index).reduce((sum, item) => sum + item.views, 0) / totalViews) *
                  circumference;
                const circle = (
                  <circle
                    key={category.categoryId}
                    cx="70"
                    cy="70"
                    r="52"
                    fill="none"
                    stroke={categoryPalette[index % categoryPalette.length]}
                    strokeWidth={hoveredCategory === category.categoryId ? 20 : 16}
                    strokeDasharray={`${Math.max(dash - 2, 1)} ${circumference - dash + 2}`}
                    strokeDashoffset={-offset}
                    className="transition-[stroke-width] duration-150"
                  >
                    <title>{`${category.name}: ${formatNumber(category.views, locale)} ${copy.views} (${Math.round(category.percentage)}%)`}</title>
                  </circle>
                );
                return circle;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-slate-950 dark:text-white">{formatNumber(totalViews, locale)}</span>
              <span className="text-[11px] uppercase tracking-wide text-slate-500">{copy.views}</span>
            </div>
          </div>
          {totalViews === 0 && !error && <p className="text-center text-xs text-slate-500">{copy.noPublicViews}</p>}
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{copy.categories}</h3>
            {rangeLabel && <span className="truncate text-xs text-slate-500">{rangeLabel}</span>}
          </div>
          {error ? (
            <EmptyChart label={error} />
          ) : categories.length === 0 ? (
            <EmptyChart label={copy.noChartData} />
          ) : (
            <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
              {categories.map((category, index) => {
                const isExpanded = expanded.has(category.categoryId);
                const showAllTopics = showAll.has(category.categoryId);
                const hasTopics = category.topics.length > 0;
                const shownTopics = showAllTopics ? category.topics : category.topics.slice(0, 4);
                const color = categoryPalette[index % categoryPalette.length];
                const categoryTitle = `${category.name}\n${formatNumber(category.views, locale)} ${copy.views}\n${Math.round(category.percentage)}% ${copy.ofAllViews}`;
                return (
                  <div key={category.categoryId}>
                    {hasTopics ? (
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        title={categoryTitle}
                        onClick={() => toggleSet(setExpanded, category.categoryId)}
                        onMouseEnter={() => setHoveredCategory(category.categoryId)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        onFocus={() => setHoveredCategory(category.categoryId)}
                        onBlur={() => setHoveredCategory(null)}
                        className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800/60"
                      >
                        {categoryLabel(category.name, color)}
                        <span className="whitespace-nowrap text-right text-xs tabular-nums text-slate-500">{formatNumber(category.views, locale)} {copy.views}</span>
                        <span className="w-10 text-right text-xs tabular-nums text-slate-500">{Math.round(category.percentage)}%</span>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                      </button>
                    ) : (
                      <div title={categoryTitle} onMouseEnter={() => setHoveredCategory(category.categoryId)} onMouseLeave={() => setHoveredCategory(null)} className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2 rounded-md px-2 py-2">
                        {categoryLabel(category.name, color)}
                        <span className="whitespace-nowrap text-right text-xs tabular-nums text-slate-500">{formatNumber(category.views, locale)} {copy.views}</span>
                        <span className="w-10 text-right text-xs tabular-nums text-slate-500">{Math.round(category.percentage)}%</span>
                        <span className="h-4 w-4" />
                      </div>
                    )}
                    {hasTopics && isExpanded && (
                      <div className="ml-7 border-l border-slate-200 pl-3 dark:border-slate-700">
                        {shownTopics.map((topic) => {
                          const topicTitle = `${topic.name}\n${formatNumber(topic.views, locale)} ${copy.views}\n${Math.round(topic.percentage)}% ${copy.ofAllViews}\n${topic.parentPercentage.toFixed(1)}% ${copy.ofParentViews(category.name)}`;
                          return (
                            <div key={topic.slug} title={topicTitle} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex min-w-0 items-center gap-2 truncate"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />{topic.name}</span>
                              <span className="whitespace-nowrap text-right tabular-nums">{formatNumber(topic.views, locale)} {copy.views}</span>
                              <span className="w-10 text-right tabular-nums">{Math.round(topic.percentage)}%</span>
                            </div>
                          );
                        })}
                        {category.topics.length > 4 && (
                          <button type="button" onClick={() => toggleSet(setShowAll, category.categoryId)} className="ml-2 px-2 py-1.5 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                            {showAllTopics ? copy.showFewerTopics : copy.showAllTopics(category.topics.length)}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function categoryLabel(name: string, color: string) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${color}18`, color }}>
        <FolderTree className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="truncate">{name}</span>
    </span>
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
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex min-h-[96px] items-start gap-3">
              <div
                className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${item.color}22`, color: item.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                      {formatNumber(item.value, locale)}
                    </p>
                  </div>
                  <Sparkline values={item.spark} color={item.color} />
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                  <span className="font-semibold">—</span> {copy.comparisonUnavailable}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{copy.previousSixMonths}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function DashboardCharts({ analytics, loading, tenantTimeAnalytics, timeLoading, timeError, groupBy = "MONTH", onGroupByChange, rangeLabel }: DashboardChartsProps) {
  const { locale } = useAdminLocale();
  const copy = chartCopy[locale];

  if (loading && !analytics) {
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
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{copy.operations}</CardTitle>
                <CardDescription>{copy.operationsDescription}</CardDescription>
              </div>
              <TrendLegend
                primaryLabel={copy.auditActivity}
                secondaryLabel={copy.newTenants}
                monthlyLabel={copy.monthly}
              />
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
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{copy.contentTimeline}</CardTitle>
                <CardDescription>{copy.timelineDescription}</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />{copy.created}</span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{copy.published}</span>
                <Select value={groupBy} onValueChange={value => onGroupByChange?.(value as AnalyticsGroupBy)}>
                  <SelectTrigger aria-label={copy.monthly} className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="DAY">{copy.daily}</SelectItem><SelectItem value="WEEK">{copy.weekly}</SelectItem><SelectItem value="MONTH">{copy.monthly}</SelectItem></SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {timeError ? <EmptyChart label={timeError} /> : <TenantPublishingChart points={tenantTimeAnalytics?.publishing || []} groupBy={groupBy} locale={locale} loading={Boolean(timeLoading)} emptyLabel={copy.noPublishingActivity} />}
              {rangeLabel && <span className="sr-only">{rangeLabel}</span>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{copy.viewsByCategory}</CardTitle>
              <CardDescription>{copy.viewsByCategoryDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <AudienceByCategory
                categories={tenantTimeAnalytics?.categoryViews || []}
                rangeLabel={rangeLabel}
                loading={Boolean(timeLoading)}
                error={timeError}
                copy={copy}
                locale={locale}
              />
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
