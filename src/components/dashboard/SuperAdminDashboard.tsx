"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  Clock,
  ExternalLink,
  Loader2,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Tenant, TenantService } from "@/services/tenant.gql";
import { AuditService } from "@/services/audit.gql";
import { UserService } from "@/services/user.gql";
import type { AuditLog } from "@/types/audit";
import type { UserStats } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStableLoading } from "@/hooks/useStableLoading";
import { useAdminLocale } from "@/hooks/useAdminLocale";

function getTenantScopedMemberships(tenant: Tenant) {
  return tenant.memberships.filter(
    (membership) =>
      membership.role !== "SUPER_ADMIN" &&
      membership.user.role !== "SUPER_ADMIN",
  );
}

export default function SuperAdminDashboard() {
  const { locale } = useAdminLocale();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoading = useStableLoading(loading);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      TenantService.listTenants(),
      UserService.getUserStats(),
      AuditService.listAuditLogs(0, 5),
    ])
      .then(([tenantResult, userResult, auditResult]) => {
        if (!mounted) return;

        if (tenantResult.status === "fulfilled") {
          setTenants(tenantResult.value);
        }

        if (userResult.status === "fulfilled") {
          setUserStats(userResult.value);
        }

        if (auditResult.status === "fulfilled") {
          setAuditLogs(auditResult.value.logs);
        }

      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const activeTenants = tenants.filter(
    (tenant) => tenant.status === "ACTIVE",
  ).length;
  const siteCount = tenants.reduce(
    (total, tenant) => total + tenant.sites.length,
    0,
  );
  const memberCount = tenants.reduce(
    (total, tenant) => total + getTenantScopedMemberships(tenant).length,
    0,
  );
  const recentAuditCount = auditLogs.length;
  const suspendedTenants = tenants.filter(
    (tenant) => tenant.status === "SUSPENDED",
  ).length;
  const copy = locale === "km"
    ? {
        eyebrow: "ផ្ទាំងគ្រប់គ្រង",
        title: "ផ្ទាំងគ្រប់គ្រងប្រព័ន្ធ",
        description: "តាមដាន tenant websites, អ្នកប្រើវេទិកា, system logs និង settings។",
        manageTenants: "គ្រប់គ្រង Tenants",
        activeTenants: "Tenants សកម្ម",
        platformUsers: "អ្នកប្រើវេទិកា",
        publicSites: "គេហទំព័រសាធារណៈ",
        recentLogs: "កំណត់ត្រាថ្មីៗ",
        actions: [
          {
            title: "គ្រប់គ្រង Tenants",
            description: "បង្កើតគេហទំព័រ គ្រប់គ្រង domains និងកំណត់ tenant admins។",
          },
          {
            title: "គ្រប់គ្រងអ្នកប្រើ",
            description: "ពិនិត្យអ្នកប្រើវេទិកា និងគ្រប់គ្រងសិទ្ធិចូលប្រើ។",
          },
          {
            title: "Logs",
            description: "ពិនិត្យសកម្មភាព audit ទូទាំងវេទិកា។",
          },
          {
            title: "Analytics",
            description: "ពិនិត្យ charts និង performance trends របស់វេទិកា។",
          },
          {
            title: "Settings",
            description: "គ្រប់គ្រង configuration របស់វេទិកា។",
          },
        ],
        recentTenants: "Tenants ថ្មីៗ",
        tenantStatusSummary: (active: number, suspended: number) =>
          `សកម្ម: ${active} | ផ្អាក: ${suspended}`,
        loadingTenants: "កំពុងផ្ទុក tenants...",
        open: "បើក",
        noTenants: "មិនទាន់មាន tenant ត្រូវបានបង្កើត។",
        recentLogsTitle: "កំណត់ត្រាថ្មីៗ",
        recentLogsDescription: "សកម្មភាពវេទិកាចុងក្រោយពី audit logs។",
        loadingLogs: "កំពុងផ្ទុក logs...",
        noLogs: "រកមិនឃើញ audit logs។",
        systemEvent: "ព្រឹត្តិការណ៍ប្រព័ន្ធ",
        system: "ប្រព័ន្ធ",
      }
    : {
        eyebrow: "Management Console",
        title: "System Dashboard",
        description: "Monitor tenant websites, platform users, system logs, and settings.",
        manageTenants: "Manage Tenants",
        activeTenants: "Active tenants",
        platformUsers: "Platform users",
        publicSites: "Public sites",
        recentLogs: "Recent logs",
        actions: [
          {
            title: "Tenant Management",
            description: "Create websites, manage domains, and assign tenant admins.",
          },
          {
            title: "User Management",
            description: "Review platform users and manage access.",
          },
          {
            title: "Logs",
            description: "Inspect audit activity across the platform.",
          },
          {
            title: "Analytics",
            description: "Review platform-wide charts and performance trends.",
          },
          {
            title: "Settings",
            description: "Control platform configuration.",
          },
        ],
        recentTenants: "Recent Tenants",
        tenantStatusSummary: (active: number, suspended: number) =>
          `Active: ${active} | Suspended: ${suspended}`,
        loadingTenants: "Loading tenants...",
        open: "Open",
        noTenants: "No tenants have been created yet.",
        recentLogsTitle: "Recent Logs",
        recentLogsDescription: "Latest platform activity captured by audit logs.",
        loadingLogs: "Loading logs...",
        noLogs: "No audit logs found.",
        systemEvent: "System Event",
        system: "System",
      };

  const platformActions = [
    {
      title: copy.actions[0].title,
      description: copy.actions[0].description,
      href: "/tenants",
      icon: Building2,
    },
    {
      title: copy.actions[1].title,
      description: copy.actions[1].description,
      href: "/users",
      icon: Users,
    },
    {
      title: copy.actions[2].title,
      description: copy.actions[2].description,
      href: "/audit",
      icon: Activity,
    },
    {
      title: copy.actions[3].title,
      description: copy.actions[3].description,
      href: "/analytics",
      icon: BarChart3,
    },
    {
      title: copy.actions[4].title,
      description: copy.actions[4].description,
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 p-6 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-blue-600">
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-100">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {copy.description}
          </p>
        </div>
        <Button asChild>
          <Link href="/tenants">
            <Building2 className="mr-2 h-4 w-4" />
            {copy.manageTenants}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{copy.activeTenants}</CardDescription>
            <CardTitle className="text-3xl">{activeTenants}</CardTitle>
          </CardHeader>
          <CardContent>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{copy.platformUsers}</CardDescription>
            <CardTitle className="text-3xl">
              {userStats?.totalUsers ?? memberCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Users className="h-5 w-5 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{copy.publicSites}</CardDescription>
            <CardTitle className="text-3xl">{siteCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <ExternalLink className="h-5 w-5 text-violet-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{copy.recentLogs}</CardDescription>
            <CardTitle className="text-3xl">{recentAuditCount}</CardTitle>
          </CardHeader>
          <CardContent>
          <Activity className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {platformActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/60 dark:hover:bg-slate-800"
            >
              <Icon className="h-5 w-5 text-blue-600" />
              <h2 className="mt-3 font-semibold text-slate-950 dark:text-slate-100">
                {action.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader>
          <CardTitle>{copy.recentTenants}</CardTitle>
          <CardDescription>
              {copy.tenantStatusSummary(activeTenants, suspendedTenants)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showLoading ? (
            <div className="flex items-center py-8 text-slate-500 dark:text-slate-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {copy.loadingTenants}
            </div>
          ) : (
            <div className="divide-y divide-slate-200 rounded-md border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
              {tenants.slice(0, 5).map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950 dark:text-slate-100">
                        {tenant.name}
                      </h2>
                      <Badge variant="outline">{tenant.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      /{tenant.slug}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/tenants">{copy.open}</Link>
                  </Button>
                </div>
              ))}
              {tenants.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {copy.noTenants}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.recentLogsTitle}</CardTitle>
            <CardDescription>
              {copy.recentLogsDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showLoading ? (
              <div className="flex items-center py-8 text-slate-500 dark:text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {copy.loadingLogs}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {copy.noLogs}
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant={log.success ? "outline" : "destructive"}>
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                      <span className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {log.resourceName || log.resourceType || copy.systemEvent}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {log.userEmail || copy.system}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
