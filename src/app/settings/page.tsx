"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  BarChart3,
  Brush,
  Code2,
  FileText,
  Globe2,
  HardDrive,
  Mail,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  Users,
} from "lucide-react";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import {
  M_RESET_SETTING,
  M_UPDATE_SETTING,
  Q_SETTINGS,
  Setting,
  SETTING_CATEGORIES,
  SettingType,
  UpdateSettingInput,
} from "@/services/settings.gql";
import { SettingsCategory } from "@/components/settings";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Permission } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";

const CATEGORY_ICONS = {
  [SettingType.SITE]: Globe2,
  [SettingType.EMAIL]: Mail,
  [SettingType.SEO]: BarChart3,
  [SettingType.CONTENT]: FileText,
  [SettingType.USER_MANAGEMENT]: Users,
  [SettingType.API]: Code2,
  [SettingType.THEME]: Brush,
  [SettingType.MAINTENANCE]: HardDrive,
};

const HIDDEN_SETTING_KEYS = new Set(["site.name"]);

function getCategoryShortLabel(type: SettingType) {
  if (type === SettingType.USER_MANAGEMENT) return "Users";
  if (type === SettingType.MAINTENANCE) return "Maintenance";

  return SETTING_CATEGORIES[type].label.split(" ")[0];
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { activeTenant, refreshTenants } = useTenant();
  const userRole = user?.role?.toString().toUpperCase();
  const { hasPermission } = usePermissions();
  const canAccessSettings = hasPermission(Permission.VIEW_SETTINGS);
  const [settings, setSettings] = React.useState<Setting[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<SettingType>(
    SettingType.SITE,
  );

  const loadSettings = React.useCallback(async () => {
    if (!canAccessSettings) {
      setLoading(false);
      setSettings([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getAuthenticatedGqlClient().request(Q_SETTINGS);

      if (response && typeof response === "object" && "settings" in response) {
        const visibleSettings = ((response.settings as Setting[]) || []).filter(
          (setting) => !HIDDEN_SETTING_KEYS.has(setting.key),
        );
        setSettings(visibleSettings);
      } else {
        setSettings([]);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError(err instanceof Error ? err.message : "Failed to load settings");
      setSettings([]);
    } finally {
      setLoading(false);
    }
  }, [canAccessSettings]);

  React.useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleUpdateSetting = async (input: UpdateSettingInput) => {
    const response = await getAuthenticatedGqlClient().request(M_UPDATE_SETTING, {
      input,
    });

    setSettings((prev) =>
      prev.map((setting) =>
        setting.key === input.key
          ? { ...setting, ...(response as any).updateSetting }
          : setting,
      ),
    );

    if (
      [
        "site.description",
        "site.logo_url",
        "site.public_base_url",
      ].includes(input.key)
    ) {
      await refreshTenants();
    }
  };

  const handleResetSetting = async (key: string) => {
    const response = await getAuthenticatedGqlClient().request(M_RESET_SETTING, {
      key,
    });

    setSettings((prev) =>
      prev.map((setting) =>
        setting.key === key
          ? { ...setting, ...(response as any).resetSetting }
          : setting,
      ),
    );

    if (
      [
        "site.description",
        "site.logo_url",
        "site.public_base_url",
      ].includes(key)
    ) {
      await refreshTenants();
    }
  };

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const pageTitle = isSuperAdmin ? "Management Console Settings" : "Settings";
  const pageDescription = isSuperAdmin
    ? "Configure platform defaults used outside tenant-specific websites."
    : `Configure ${activeTenant?.name || "this tenant"} public website identity, SEO, content, users, and integrations.`;
  const visibleCategories = React.useMemo(
    () =>
      Object.entries(SETTING_CATEGORIES).filter(([key]) => {
        if (!isSuperAdmin) return true;

        return [
          SettingType.SITE,
          SettingType.EMAIL,
          SettingType.API,
          SettingType.MAINTENANCE,
        ].includes(key as SettingType);
      }),
    [isSuperAdmin],
  );

  const filteredSettings = React.useMemo(() => {
    if (!searchQuery.trim()) return settings;

    const query = searchQuery.toLowerCase();
    return settings.filter(
      (setting) =>
        setting.label.toLowerCase().includes(query) ||
        setting.key.toLowerCase().includes(query) ||
        setting.description?.toLowerCase().includes(query),
    );
  }, [settings, searchQuery]);

  const getCategoryCount = (category: SettingType) =>
    filteredSettings.filter((setting) => setting.type === category).length;
  const requiredCount = settings.filter((setting) => setting.isRequired).length;
  const publicCount = settings.filter((setting) => setting.isPublic).length;
  const selectedCategoryInfo = SETTING_CATEGORIES[selectedCategory];
  const SelectedCategoryIcon = CATEGORY_ICONS[selectedCategory] || SettingsIcon;

  if (!canAccessSettings) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-slate-400" />
            <h1 className="text-2xl font-bold text-slate-950">Settings Unavailable</h1>
            <p className="mt-2 text-slate-600">
              Settings are available only for admin accounts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-6 h-10 w-72 animate-pulse rounded bg-slate-100" />
          <div className="h-12 animate-pulse rounded-md bg-slate-100" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-lg border bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">{pageTitle}</h1>
          <p className="mt-2 text-slate-600">{pageDescription}</p>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-500" />
            <h3 className="mb-2 text-lg font-medium text-slate-950">
              Failed to Load Settings
            </h3>
            <p className="mb-4 text-slate-600">{error}</p>
            <Button onClick={() => void loadSettings()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {isSuperAdmin ? "Management Console" : "Tenant Website"}
                </p>
                <h1 className="text-3xl font-bold text-slate-950">
                  {pageTitle}
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {pageDescription}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[420px]">
            {[
              ["Settings", settings.length],
              ["Public", publicCount],
              ["Required", requiredCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 bg-white pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isSuperAdmin && activeTenant ? (
              <Badge variant="outline" className="bg-white">
                {activeTenant.name} / {activeTenant.slug}
              </Badge>
            ) : null}
            <Badge variant="outline" className="bg-white">
              {searchQuery
                ? `${filteredSettings.length} matching`
                : `${getCategoryCount(selectedCategory)} settings`}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadSettings()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      <Tabs
        value={selectedCategory}
        onValueChange={(value) => setSelectedCategory(value as SettingType)}
        className="space-y-6"
      >
        <TabsList className="flex h-auto w-full justify-start gap-2 overflow-x-auto rounded-lg border bg-white p-2">
          {visibleCategories.map(([key]) => {
            const categoryKey = key as SettingType;
            const count = getCategoryCount(categoryKey);
            const Icon = CATEGORY_ICONS[categoryKey] || SettingsIcon;

            return (
              <TabsTrigger
                key={key}
                value={key}
                disabled={count === 0}
                className="min-w-max gap-2 rounded-md px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white"
              >
                <Icon className="h-4 w-4" />
                <span>{getCategoryShortLabel(categoryKey)}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 data-[state=active]:bg-white/15 data-[state=active]:text-white">
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <section className="rounded-lg border bg-white p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <SelectedCategoryIcon className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-950">
                  {selectedCategoryInfo.label}
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {selectedCategoryInfo.description}
              </p>
            </div>
          </div>

          {visibleCategories.map(([category]) => (
            <TabsContent key={category} value={category} className="mt-0">
              <SettingsCategory
                category={category as SettingType}
                settings={filteredSettings}
                onUpdateSetting={handleUpdateSetting}
                onResetSetting={handleResetSetting}
                loading={loading}
              />
            </TabsContent>
          ))}
        </section>
      </Tabs>
    </div>
  );
}
