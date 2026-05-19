"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Settings as SettingsIcon,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import {
  Q_SETTINGS,
  M_UPDATE_SETTING,
  M_RESET_SETTING,
} from "@/services/settings.gql";
import {
  SettingType,
  SETTING_CATEGORIES,
  Setting,
  UpdateSettingInput,
} from "@/services/settings.gql";
import { SettingsCategory } from "@/components/settings";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";

export default function SettingsPage() {
  const { user } = useAuth();
  const { activeTenant, refreshTenants } = useTenant();
  const [settings, setSettings] = React.useState<Setting[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<SettingType>(
    SettingType.SITE,
  );

  // Load settings on component mount
  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const client = getAuthenticatedGqlClient();
      const response = await client.request(Q_SETTINGS);

      if (!response) {
        console.warn("GraphQL response is null or undefined");
        setSettings([]);
        return;
      }

      // Check if response has the expected structure
      if (typeof response === "object" && "settings" in response) {
        setSettings(response.settings || []);
      } else {
        console.warn(
          "GraphQL response does not have expected structure:",
          response,
        );
        setSettings([]);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError(err instanceof Error ? err.message : "Failed to load settings");
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (input: UpdateSettingInput) => {
    try {
      const client = getAuthenticatedGqlClient();
      const response = await client.request(M_UPDATE_SETTING, { input });

      // Update the setting in local state
      setSettings((prev) =>
        prev.map((setting) =>
          setting.key === input.key
            ? { ...setting, ...response.updateSetting }
            : setting,
        ),
      );

      if (
        ["site.name", "site.description", "site.logo_url", "site.public_base_url"].includes(
          input.key,
        )
      ) {
        await refreshTenants();
      }
    } catch (err) {
      console.error("Failed to update setting:", err);
      throw err; // Re-throw to let the component handle the error
    }
  };

  const handleResetSetting = async (key: string) => {
    try {
      const client = getAuthenticatedGqlClient();
      const response = await client.request(M_RESET_SETTING, { key });

      // Update the setting in local state
      setSettings((prev) =>
        prev.map((setting) =>
          setting.key === key
            ? { ...setting, ...response.resetSetting }
            : setting,
        ),
      );

      if (
        ["site.name", "site.description", "site.logo_url", "site.public_base_url"].includes(
          key,
        )
      ) {
        await refreshTenants();
      }
    } catch (err) {
      console.error("Failed to reset setting:", err);
      throw err; // Re-throw to let the component handle the error
    }
  };

  // Filter settings based on search query
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

  // Get settings count for each category
  const getCategoryCount = (category: SettingType) => {
    return filteredSettings.filter((setting) => setting.type === category)
      .length;
  };
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const pageTitle = isSuperAdmin ? "Platform Settings" : "Website Settings";
  const pageDescription = isSuperAdmin
    ? "Configure platform-level defaults used outside tenant-specific websites."
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {pageTitle}
          </h1>
          <p className="text-slate-600">{pageDescription}</p>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Loading settings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {pageTitle}
          </h1>
          <p className="text-slate-600">{pageDescription}</p>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Failed to Load Settings
            </h3>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={loadSettings} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-slate-700" />
          <h1 className="text-3xl font-bold text-slate-900">{pageTitle}</h1>
        </div>
        <p className="text-slate-600">{pageDescription}</p>
      </div>

      {isSuperAdmin && (
        <Card className="border-blue-100 bg-blue-50/60">
          <CardContent className="p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-950">
                  Platform mode
                </p>
                <p className="text-sm text-blue-800">
                  Tenant website branding, SEO, content, and user policies are managed inside each tenant.
                </p>
              </div>
              <Badge variant="outline" className="w-fit bg-white">
                Super Admin
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Settings Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={(value) => setSelectedCategory(value as SettingType)}
      >
        <TabsList
          className={
            isSuperAdmin
              ? "grid w-full grid-cols-2 lg:grid-cols-4"
              : "grid w-full grid-cols-4 lg:grid-cols-8"
          }
        >
          {visibleCategories.map(([key, info]) => {
            const count = getCategoryCount(key as SettingType);
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="flex flex-col items-center space-y-1 h-auto py-3"
                disabled={count === 0}
              >
                <span className="text-lg">{info.icon}</span>
                <span className="text-xs font-medium">
                  {info.label.split(" ")[0]}
                </span>
                {count > 0 && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {visibleCategories.map(([category]) => (
          <TabsContent key={category} value={category} className="mt-6">
            <SettingsCategory
              category={category as SettingType}
              settings={filteredSettings}
              onUpdateSetting={handleUpdateSetting}
              onResetSetting={handleResetSetting}
              loading={loading}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Footer Info */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center space-x-4">
              <span>Total Settings: {settings.length}</span>
              <span>•</span>
              <span>
                Required: {settings.filter((s) => s.isRequired).length}
              </span>
              <span>•</span>
              <span>Public: {settings.filter((s) => s.isPublic).length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
