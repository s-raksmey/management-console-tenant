"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { useInitialPageReady } from "@/lib/use-initial-page-ready";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { Tenant, TenantService } from "@/services/tenant.gql";
import { useAuth } from "@/contexts/AuthContext";
import { Permission, PermissionGuard } from "@/components/permissions/PermissionGuard";
import { useAdminLocale } from "@/hooks/useAdminLocale";
import {
  AnalyticsDateRangePreset,
  AnalyticsGroupBy,
  DashboardAnalytics,
  DashboardAnalyticsService,
  TenantTimeAnalytics,
  TenantTimeAnalyticsInput,
} from "@/services/dashboard-analytics.gql";

const analyticsCopy = {
  en: {
    loadAnalyticsFailed: "Failed to load analytics.",
    noActiveTenants: "No active sub-tenants are available for analytics.",
    loadTenantsFailed: "Failed to load sub-tenants.",
    mainTenantAnalytics: "Main Tenant Analytics",
    tenantAnalytics: "Sub-tenant Analytics",
    title: "Analytics",
    mainTenantDescription: "Track sub-tenants, public sites, Super Admins, and console activity.",
    tenantDescription: (name: string) => `Track content, users, and public performance for ${name}.`,
    fallbackTenant: "this sub-tenant website",
    loadingTenants: "Loading sub-tenants...",
    selectTenant: "Select tenant",
    mainTenantOption: "Main Tenant",
    tenantView: "Sub-tenant View",
    dateRange: "Date range",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    last3Months: "Last 3 months",
    last6Months: "Last 6 months",
    last12Months: "Last 12 months",
    customRange: "Custom range",
    from: "From",
    to: "To",
    apply: "Apply",
    invalidCustomRange: "Choose a valid start and end date.",
    loadTimeAnalyticsFailed: "Failed to load analytics for this period.",
  },
  km: {
    loadAnalyticsFailed: "ផ្ទុកទិន្នន័យវិភាគមិនបានសម្រេច។",
    noActiveTenants: "មិនមានគេហទំព័រសកម្មសម្រាប់វិភាគទេ។",
    loadTenantsFailed: "ផ្ទុកគេហទំព័រមិនបានសម្រេច។",
    mainTenantAnalytics: "វិភាគអ្នកជួលមេ",
    tenantAnalytics: "វិភាគគេហទំព័រ",
    title: "វិភាគ",
    mainTenantDescription: "តាមដានគេហទំព័ររង គេហទំព័រសាធារណៈ អ្នកគ្រប់គ្រងកំពូល និងសកម្មភាពកុងសូល។",
    tenantDescription: (name: string) => `តាមដានមាតិកា អ្នកប្រើ និងប្រសិទ្ធភាពសាធារណៈសម្រាប់ ${name}។`,
    fallbackTenant: "គេហទំព័រនេះ",
    loadingTenants: "កំពុងផ្ទុកគេហទំព័រ...",
    selectTenant: "ជ្រើសអ្នកជួល",
    mainTenantOption: "អ្នកជួលមេ",
    tenantView: "ទិដ្ឋភាពគេហទំព័រ",
    dateRange: "រយៈពេល",
    last7Days: "7 ថ្ងៃចុងក្រោយ",
    last30Days: "30 ថ្ងៃចុងក្រោយ",
    last3Months: "3 ខែចុងក្រោយ",
    last6Months: "6 ខែចុងក្រោយ",
    last12Months: "12 ខែចុងក្រោយ",
    customRange: "កំណត់រយៈពេល",
    from: "ចាប់ពី",
    to: "ដល់",
    apply: "អនុវត្ត",
    invalidCustomRange: "សូមជ្រើសរើសថ្ងៃចាប់ផ្តើម និងថ្ងៃបញ្ចប់ត្រឹមត្រូវ។",
    loadTimeAnalyticsFailed: "មិនអាចផ្ទុកការវិភាគតាមរយៈពេលនេះបានទេ។",
  },
} as const;

export default function AnalyticsPage() {
  const { locale } = useAdminLocale();
  const copy = analyticsCopy[locale];
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const MAIN_TENANT_ANALYTICS_ID = "__main__";
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [tenantTimeAnalytics, setTenantTimeAnalytics] = useState<TenantTimeAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<TenantTimeAnalyticsInput["dateRange"]>({
    preset: "LAST_6_MONTHS",
  });
  const [groupBy, setGroupBy] = useState<AnalyticsGroupBy>("MONTH");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [timeLoading, setTimeLoading] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [tenantOptions, setTenantOptions] = useState<Tenant[]>([]);
  const [selectedAnalyticsTenantId, setSelectedAnalyticsTenantId] = useState<string>(
    MAIN_TENANT_ANALYTICS_ID,
  );
  const [loading, setLoading] = useState(true);
  const pageReady = useInitialPageReady(loading);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (tenantId?: string) => {
    try {
      setError(null);
      const scopedTenantId =
        tenantId && tenantId !== MAIN_TENANT_ANALYTICS_ID ? tenantId : null;
      const data = await DashboardAnalyticsService.getDashboardAnalytics(scopedTenantId);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError(locale === "en" && err instanceof Error ? err.message : copy.loadAnalyticsFailed);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [copy.loadAnalyticsFailed, locale]);

  const loadTenantTimeAnalytics = useCallback(async (
    selectedRange: TenantTimeAnalyticsInput["dateRange"],
    selectedGroupBy: AnalyticsGroupBy,
  ) => {
    setTimeLoading(true);
    setTimeError(null);
    try {
      const data = await DashboardAnalyticsService.getTenantTimeAnalytics({
        dateRange: selectedRange,
        groupBy: selectedGroupBy,
      });
      setTenantTimeAnalytics(data);
    } catch (err) {
      console.error("Failed to load tenant time analytics:", err);
      setTimeError(locale === "en" && err instanceof Error ? err.message : copy.loadTimeAnalyticsFailed);
    } finally {
      setTimeLoading(false);
    }
  }, [copy.loadTimeAnalyticsFailed, locale]);

  useEffect(() => {
    let mounted = true;

    const initializeAnalytics = async () => {
      if (!isSuperAdmin) {
        await Promise.all([
          loadAnalytics(),
          loadTenantTimeAnalytics({ preset: "LAST_6_MONTHS" }, "MONTH"),
        ]);
        return;
      }

      setLoading(true);
      setLoadingTenants(true);

      try {
        const tenants = await TenantService.listTenants();
        if (!mounted) return;

        const activeTenants = tenants.filter(
          (tenant) => tenant.status === "ACTIVE" && tenant.isMainTenant !== true,
        );
        setTenantOptions(activeTenants);
        setSelectedAnalyticsTenantId(MAIN_TENANT_ANALYTICS_ID);
        await loadAnalytics(MAIN_TENANT_ANALYTICS_ID);
      } catch (err) {
        console.error("Failed to load tenants for analytics:", err);
        if (!mounted) return;
        setError(locale === "en" && err instanceof Error ? err.message : copy.loadTenantsFailed);
        setLoading(false);
      } finally {
        if (mounted) setLoadingTenants(false);
      }
    };

    void initializeAnalytics();

    return () => {
      mounted = false;
    };
  }, [copy.loadTenantsFailed, isSuperAdmin, loadAnalytics, loadTenantTimeAnalytics, locale]);

  const handleTenantChange = async (tenantId: string) => {
    setSelectedAnalyticsTenantId(tenantId);
    setLoading(true);
    await loadAnalytics(tenantId);
  };

  const handleDateRangeChange = (value: AnalyticsDateRangePreset) => {
    if (value === "CUSTOM") {
      setDateRange({ preset: value, from: customFrom, to: customTo });
      return;
    }
    const nextRange = { preset: value };
    setDateRange(nextRange);
    void loadTenantTimeAnalytics(nextRange, groupBy);
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo || customFrom > customTo) {
      setTimeError(copy.invalidCustomRange);
      return;
    }
    const nextRange = { preset: "CUSTOM" as const, from: customFrom, to: customTo };
    setDateRange(nextRange);
    void loadTenantTimeAnalytics(nextRange, groupBy);
  };

  const handleGroupByChange = (value: AnalyticsGroupBy) => {
    setGroupBy(value);
    void loadTenantTimeAnalytics(dateRange, value);
  };

  const isMainTenantView = analytics?.scope === "PLATFORM";
  const selectedTenant = tenantOptions.find(
    (tenant) => tenant.id === selectedAnalyticsTenantId,
  );

  if (!pageReady) {
    return <PageSkeleton />;
  }

  return (
    <PermissionGuard permissions={[Permission.VIEW_ANALYTICS]} showError>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-sky-400">
                {isMainTenantView ? copy.mainTenantAnalytics : copy.tenantAnalytics}
              </p>
              <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
                <BarChart3 className="h-6 w-6 shrink-0 text-blue-600 sm:h-7 sm:w-7 dark:text-sky-400" />
                {copy.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                {isMainTenantView
                  ? copy.mainTenantDescription
                  : copy.tenantDescription(analytics?.tenantName || copy.fallbackTenant)}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 lg:w-auto lg:items-end">
              <div className="flex w-full flex-wrap items-center gap-2 lg:justify-end">
                {isSuperAdmin ? (
                  <Select
                    value={selectedAnalyticsTenantId}
                    onValueChange={handleTenantChange}
                    disabled={loadingTenants || tenantOptions.length === 0}
                  >
                    <SelectTrigger className="w-full bg-white sm:w-[240px] dark:bg-slate-950">
                      <SelectValue placeholder={loadingTenants ? copy.loadingTenants : copy.selectTenant} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MAIN_TENANT_ANALYTICS_ID}>{copy.mainTenantOption}</SelectItem>
                      {tenantOptions.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}

                {!isSuperAdmin && (
                  <Select
                    value={dateRange.preset}
                    onValueChange={(value) => handleDateRangeChange(value as AnalyticsDateRangePreset)}
                  >
                    <SelectTrigger aria-label={copy.dateRange} className="w-full bg-white sm:w-[190px] dark:bg-slate-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LAST_7_DAYS">{copy.last7Days}</SelectItem>
                      <SelectItem value="LAST_30_DAYS">{copy.last30Days}</SelectItem>
                      <SelectItem value="LAST_3_MONTHS">{copy.last3Months}</SelectItem>
                      <SelectItem value="LAST_6_MONTHS">{copy.last6Months}</SelectItem>
                      <SelectItem value="LAST_12_MONTHS">{copy.last12Months}</SelectItem>
                      <SelectItem value="CUSTOM">{copy.customRange}</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {isSuperAdmin && selectedTenant && (
                  <Badge variant="outline" className="max-w-full truncate bg-white">/{selectedTenant.slug}</Badge>
                )}
              </div>

              {!isSuperAdmin && dateRange.preset === "CUSTOM" && (
                <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                  <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-slate-500">
                    {copy.from}
                    <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" />
                  </label>
                  <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-slate-500">
                    {copy.to}
                    <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" />
                  </label>
                  <Button type="button" variant="outline" onClick={applyCustomRange}>{copy.apply}</Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        <DashboardCharts
          analytics={analytics}
          loading={loading}
          tenantTimeAnalytics={!isSuperAdmin ? tenantTimeAnalytics : null}
          timeLoading={timeLoading}
          timeError={timeError}
          groupBy={groupBy}
          onGroupByChange={handleGroupByChange}
          rangeLabel={copy[dateRange.preset === "LAST_7_DAYS" ? "last7Days" : dateRange.preset === "LAST_30_DAYS" ? "last30Days" : dateRange.preset === "LAST_3_MONTHS" ? "last3Months" : dateRange.preset === "LAST_12_MONTHS" ? "last12Months" : dateRange.preset === "CUSTOM" ? "customRange" : "last6Months"]}
        />
      </div>
    </PermissionGuard>
  );
}
