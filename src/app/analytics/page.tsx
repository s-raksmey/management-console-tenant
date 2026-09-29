"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import {
  DashboardAnalytics,
  DashboardAnalyticsService,
} from "@/services/dashboard-analytics.gql";
import { Tenant, TenantService } from "@/services/tenant.gql";
import { useAuth } from "@/contexts/AuthContext";
import { Permission, PermissionGuard } from "@/components/permissions/PermissionGuard";
import { useAdminLocale } from "@/hooks/useAdminLocale";

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
    refresh: "Refresh",
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
    refresh: "ធ្វើបច្ចុប្បន្នភាព",
  },
} as const;

export default function AnalyticsPage() {
  const { locale } = useAdminLocale();
  const copy = analyticsCopy[locale];
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const MAIN_TENANT_ANALYTICS_ID = "__main__";
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [tenantOptions, setTenantOptions] = useState<Tenant[]>([]);
  const [selectedAnalyticsTenantId, setSelectedAnalyticsTenantId] = useState<string>(
    MAIN_TENANT_ANALYTICS_ID,
  );
  const [loading, setLoading] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
      setRefreshing(false);
    }
  }, [copy.loadAnalyticsFailed, locale]);

  useEffect(() => {
    let mounted = true;

    const initializeAnalytics = async () => {
      if (!isSuperAdmin) {
        await loadAnalytics();
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
  }, [copy.loadTenantsFailed, isSuperAdmin, loadAnalytics, locale]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics(selectedAnalyticsTenantId || undefined);
  };

  const handleTenantChange = async (tenantId: string) => {
    setSelectedAnalyticsTenantId(tenantId);
    setLoading(true);
    await loadAnalytics(tenantId);
  };

  const isMainTenantView = analytics?.scope === "PLATFORM";
  const selectedTenant = tenantOptions.find(
    (tenant) => tenant.id === selectedAnalyticsTenantId,
  );

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

          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
            {isSuperAdmin ? (
              <Select
                value={selectedAnalyticsTenantId}
                onValueChange={handleTenantChange}
                disabled={loadingTenants || tenantOptions.length === 0}
              >
                <SelectTrigger className="w-full bg-white sm:w-[240px] dark:bg-slate-950">
                  <SelectValue
                    placeholder={
                      loadingTenants ? copy.loadingTenants : copy.selectTenant
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MAIN_TENANT_ANALYTICS_ID}>
                    {copy.mainTenantOption}
                  </SelectItem>
                  {tenantOptions.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : analytics ? (
              <Badge variant="outline" className="bg-white">
                {analytics.tenantName || copy.tenantView}
              </Badge>
            ) : null}
            {isSuperAdmin && selectedTenant && (
              <Badge variant="outline" className="max-w-full truncate bg-white">
                /{selectedTenant.slug}
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              {refreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {copy.refresh}
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <DashboardCharts analytics={analytics} loading={loading} />
      </div>
    </PermissionGuard>
  );
}
