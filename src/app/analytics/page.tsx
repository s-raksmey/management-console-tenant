"use client";

import { useEffect, useState } from "react";
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
import { getSelectedTenantId, setSelectedTenantId } from "@/services/graphql-client";
import { Tenant, TenantService } from "@/services/tenant.gql";
import { useAuth } from "@/contexts/AuthContext";
import { Permission, PermissionGuard } from "@/components/permissions/PermissionGuard";
import { useAdminLocale } from "@/hooks/useAdminLocale";

const analyticsCopy = {
  en: {
    loadAnalyticsFailed: "Failed to load analytics.",
    noActiveTenants: "No active tenants are available for analytics.",
    loadTenantsFailed: "Failed to load tenants.",
    platformAnalytics: "Platform Analytics",
    tenantAnalytics: "Tenant Analytics",
    title: "Analytics",
    platformDescription: "Track platform-wide tenants, users, content, and operational activity.",
    tenantDescription: (name: string) => `Track content, users, and public performance for ${name}.`,
    fallbackTenant: "this tenant website",
    loadingTenants: "Loading tenants...",
    selectTenant: "Select tenant",
    tenantView: "Tenant View",
    refresh: "Refresh",
  },
  km: {
    loadAnalyticsFailed: "ផ្ទុកទិន្នន័យវិភាគមិនបានសម្រេច។",
    noActiveTenants: "មិនមានគេហទំព័រសកម្មសម្រាប់វិភាគទេ។",
    loadTenantsFailed: "ផ្ទុកគេហទំព័រមិនបានសម្រេច។",
    platformAnalytics: "វិភាគវេទិកា",
    tenantAnalytics: "វិភាគគេហទំព័រ",
    title: "វិភាគ",
    platformDescription: "តាមដានគេហទំព័រ អ្នកប្រើ មាតិកា និងសកម្មភាពប្រតិបត្តិការទូទាំងវេទិកា។",
    tenantDescription: (name: string) => `តាមដានមាតិកា អ្នកប្រើ និងប្រសិទ្ធភាពសាធារណៈសម្រាប់ ${name}។`,
    fallbackTenant: "គេហទំព័រនេះ",
    loadingTenants: "កំពុងផ្ទុកគេហទំព័រ...",
    selectTenant: "ជ្រើសគេហទំព័រ",
    tenantView: "ទិដ្ឋភាពគេហទំព័រ",
    refresh: "ធ្វើបច្ចុប្បន្នភាព",
  },
} as const;

export default function AnalyticsPage() {
  const { locale } = useAdminLocale();
  const copy = analyticsCopy[locale];
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [tenantOptions, setTenantOptions] = useState<Tenant[]>([]);
  const [selectedAnalyticsTenantId, setSelectedAnalyticsTenantId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async (tenantId?: string) => {
    try {
      setError(null);
      if (isSuperAdmin && tenantId) {
        setSelectedTenantId(tenantId);
      }
      const data = await DashboardAnalyticsService.getDashboardAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError(locale === "en" && err instanceof Error ? err.message : copy.loadAnalyticsFailed);
      setAnalytics(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

        const activeTenants = tenants.filter((tenant) => tenant.status === "ACTIVE");
        setTenantOptions(activeTenants);

        const storedTenantId = getSelectedTenantId();
        const nextTenant =
          activeTenants.find((tenant) => tenant.id === storedTenantId) ||
          activeTenants[0] ||
          null;

        if (nextTenant) {
          setSelectedAnalyticsTenantId(nextTenant.id);
          await loadAnalytics(nextTenant.id);
        } else {
          setAnalytics(null);
          setError(copy.noActiveTenants);
          setLoading(false);
        }
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
  }, [isSuperAdmin]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics(selectedAnalyticsTenantId || undefined);
  };

  const handleTenantChange = async (tenantId: string) => {
    setSelectedAnalyticsTenantId(tenantId);
    setLoading(true);
    await loadAnalytics(tenantId);
  };

  const isPlatform = analytics?.scope === "PLATFORM";
  const selectedTenant = tenantOptions.find(
    (tenant) => tenant.id === selectedAnalyticsTenantId,
  );

  return (
    <PermissionGuard permissions={[Permission.VIEW_ANALYTICS]} showError>
      <div className="space-y-6">
      <section className="rounded-lg border bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {isPlatform ? copy.platformAnalytics : copy.tenantAnalytics}
            </p>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-950 sm:text-3xl">
              <BarChart3 className="h-6 w-6 shrink-0 text-blue-600 sm:h-7 sm:w-7" />
              {copy.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isPlatform
                ? copy.platformDescription
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
                <SelectTrigger className="w-full bg-white sm:w-[240px]">
                  <SelectValue
                    placeholder={
                      loadingTenants ? copy.loadingTenants : copy.selectTenant
                    }
                  />
                </SelectTrigger>
                <SelectContent>
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
