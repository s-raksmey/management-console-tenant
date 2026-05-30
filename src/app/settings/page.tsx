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
  CheckCircle2,
  Circle,
  Code2,
  ExternalLink,
  FileText,
  Globe2,
  HardDrive,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  Settings as SettingsIcon,
  Users,
} from "lucide-react";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import {
  M_RESET_SETTING,
  M_TEST_EMAIL_SETTINGS,
  M_UPDATE_SETTING,
  Q_SETTINGS,
  EmailTestResult,
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
import {
  notifyThemeSettingsChanged,
} from "@/lib/tweakcn-theme";

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
const SUPER_ADMIN_HIDDEN_SETTING_KEYS = new Set([
  "site.description",
  "site.logo_url",
  "site.dashboard_favicon_url",
  "site.favicon_url",
  "site.contact_email",
  "site.contact_phone",
  "site.contact_address",
  "site.contact_hours",
  "site.facebook_url",
  "site.twitter_url",
  "site.instagram_url",
  "site.timezone",
  "site.public_base_url",
  "seo.meta_title",
  "seo.meta_description",
  "seo.meta_keywords",
  "seo.google_analytics_id",
  "seo.google_search_console_verification",
  "seo.sitemap_enabled",
  "content.require_approval",
  "content.auto_save_interval",
  "content.max_article_length",
  "content.featured_articles_limit",
  "content.breaking_news_duration",
  "content.comments_enabled",
  "content.privacy_policy",
  "content.terms_of_service",
  "content.cookies_policy",
  "content.legal_updated_date",
  "theme.admin_tweakcn",
  "theme.editor_tweakcn",
  "theme.author_tweakcn",
  "theme.public_tweakcn",
  "theme.primary_color",
  "theme.secondary_color",
  "theme.dark_mode_enabled",
  "theme.custom_css",
  "maintenance.mode_enabled",
  "maintenance.message",
]);
const TENANT_HIDDEN_SETTING_KEYS = new Set(["site.management_favicon_url"]);
const ROLE_THEME_SETTING_KEYS = new Set([
  "theme.super_admin_tweakcn",
  "theme.admin_tweakcn",
  "theme.editor_tweakcn",
  "theme.author_tweakcn",
  "theme.public_tweakcn",
  "theme.primary_color",
  "theme.secondary_color",
  "theme.custom_css",
]);

function getCategoryShortLabel(type: SettingType) {
  if (type === SettingType.USER_MANAGEMENT) return "Users";
  if (type === SettingType.MAINTENANCE) return "Maintenance";

  return SETTING_CATEGORIES[type].label.split(" ")[0];
}

function hasSettingValue(settings: Setting[], key: string): boolean {
  const value = settings.find((setting) => setting.key === key)?.value;

  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;

  return Boolean(value);
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
  const [testEmail, setTestEmail] = React.useState(user?.email || "");
  const [testingEmail, setTestingEmail] = React.useState(false);
  const [emailTestResult, setEmailTestResult] = React.useState<EmailTestResult | null>(null);

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
        const roleHiddenSettings =
          userRole === "SUPER_ADMIN"
            ? SUPER_ADMIN_HIDDEN_SETTING_KEYS
            : TENANT_HIDDEN_SETTING_KEYS;
        const visibleSettings = ((response.settings as Setting[]) || []).filter(
          (setting) =>
            !HIDDEN_SETTING_KEYS.has(setting.key) &&
            !roleHiddenSettings.has(setting.key),
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
  }, [canAccessSettings, userRole]);

  React.useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  React.useEffect(() => {
    if (!testEmail && user?.email) {
      setTestEmail(user.email);
    }
  }, [testEmail, user?.email]);

  function getMutationSetting(
    response: unknown,
    field: "updateSetting" | "resetSetting",
  ): Setting {
    if (!response || typeof response !== "object") {
      throw new Error("The setting could not be saved. Please check the value and try again.");
    }

    const value = (response as Record<string, unknown>)[field];
    if (!value || typeof value !== "object") {
      throw new Error("The setting could not be saved. Please check the value and try again.");
    }

    return value as Setting;
  }

  const handleUpdateSetting = async (input: UpdateSettingInput) => {
    const response = await getAuthenticatedGqlClient().request(M_UPDATE_SETTING, {
      input,
    });
    const updatedSetting = getMutationSetting(response, "updateSetting");

    setSettings((prev) =>
      prev.map((setting) =>
        setting.key === input.key
          ? { ...setting, ...updatedSetting }
          : setting,
      ),
    );

    if (ROLE_THEME_SETTING_KEYS.has(input.key)) {
      notifyThemeSettingsChanged();
    }

    if (
      [
        "site.description",
        "site.logo_url",
        "site.dashboard_favicon_url",
        "site.management_favicon_url",
        "site.favicon_url",
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
    const resetSetting = getMutationSetting(response, "resetSetting");

    setSettings((prev) =>
      prev.map((setting) =>
        setting.key === key
          ? { ...setting, ...resetSetting }
          : setting,
      ),
    );

    if (ROLE_THEME_SETTING_KEYS.has(key)) {
      notifyThemeSettingsChanged();
    }

    if (
      [
        "site.description",
        "site.logo_url",
        "site.dashboard_favicon_url",
        "site.management_favicon_url",
        "site.favicon_url",
        "site.public_base_url",
      ].includes(key)
    ) {
      await refreshTenants();
    }
  };

  const handleTestEmailSettings = async () => {
    try {
      setTestingEmail(true);
      setEmailTestResult(null);

      const response = await getAuthenticatedGqlClient().request<{
        testEmailSettings: EmailTestResult;
      }>(M_TEST_EMAIL_SETTINGS, {
        input: { recipientEmail: testEmail },
      });

      setEmailTestResult(response.testEmailSettings);
    } catch (err) {
      setEmailTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to send test email.",
      });
    } finally {
      setTestingEmail(false);
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
          SettingType.THEME,
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
  const setupChecklist = React.useMemo(() => {
    const primarySite = activeTenant?.sites?.find((site) => site.isPrimary) || activeTenant?.sites?.[0];
    const hasPublicUrl = Boolean(primarySite?.publicBaseUrl) || hasSettingValue(settings, "site.public_base_url");
    const hasAdminUrl = Boolean(primarySite?.adminBaseUrl);
    const hasBranding =
      hasSettingValue(settings, "site.logo_url") || hasSettingValue(settings, "site.favicon_url");
    const hasContact =
      hasSettingValue(settings, "site.contact_email") &&
      (hasSettingValue(settings, "site.contact_phone") ||
        hasSettingValue(settings, "site.contact_address"));
    const hasSeo =
      hasSettingValue(settings, "seo.meta_title") &&
      hasSettingValue(settings, "seo.meta_description");
    const hasEmail =
      hasSettingValue(settings, "email.notifications_enabled") &&
      hasSettingValue(settings, "email.smtp_host") &&
      hasSettingValue(settings, "email.from_address");
    const hasUserPolicy =
      hasSettingValue(settings, "users.default_role") &&
      hasSettingValue(settings, "users.password_min_length");
    const hasLegal =
      hasSettingValue(settings, "content.privacy_policy") &&
      hasSettingValue(settings, "content.terms_of_service") &&
      hasSettingValue(settings, "content.cookies_policy");

    return [
      {
        label: "Public website URL",
        description: "Set the public URL used for links, SEO, and article sharing.",
        complete: hasPublicUrl,
        category: SettingType.SITE,
      },
      {
        label: "Admin dashboard URL",
        description: "Add the tenant admin URL so emails point users to the right console.",
        complete: hasAdminUrl,
        category: SettingType.SITE,
      },
      {
        label: "Branding",
        description: "Add a logo or public favicon for a finished site identity.",
        complete: hasBranding,
        category: SettingType.SITE,
      },
      {
        label: "Contact details",
        description: "Publish an email plus phone or address for the public contact page.",
        complete: hasContact,
        category: SettingType.SITE,
      },
      {
        label: "SEO basics",
        description: "Add meta title and description for search and social previews.",
        complete: hasSeo,
        category: SettingType.SEO,
      },
      {
        label: "Email delivery",
        description: "Configure SMTP and use the Email Health Check to verify delivery.",
        complete: hasEmail,
        category: SettingType.EMAIL,
      },
      {
        label: "User registration policy",
        description: "Confirm the default role and password minimum for new users.",
        complete: hasUserPolicy,
        category: SettingType.USER_MANAGEMENT,
      },
      {
        label: "Legal pages",
        description: "Publish privacy, terms, and cookie policy content.",
        complete: hasLegal,
        category: SettingType.CONTENT,
      },
    ];
  }, [activeTenant?.sites, settings]);
  const completedSetupItems = setupChecklist.filter((item) => item.complete).length;
  const setupProgress = Math.round((completedSetupItems / setupChecklist.length) * 100);

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
      <section className="rounded-lg border bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white sm:h-11 sm:w-11">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {isSuperAdmin ? "Management Console" : "Tenant Website"}
                </p>
                <h1 className="break-words text-2xl font-bold text-slate-950 sm:text-3xl">
                  {pageTitle}
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {pageDescription}
            </p>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-3 xl:w-auto xl:min-w-[420px]">
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

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {!isSuperAdmin && activeTenant ? (
              <Badge variant="outline" className="max-w-full truncate bg-white">
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

      <section className="rounded-lg border bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-950">
                Setup Checklist
              </h2>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Track the essentials that make this site ready for public launch and daily operations.
            </p>
          </div>

          <div className="min-w-[180px] rounded-md border bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium uppercase text-slate-500">
                Readiness
              </span>
              <span className="text-sm font-semibold text-slate-950">
                {completedSetupItems}/{setupChecklist.length}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${setupProgress}%` }}
              />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {setupProgress}%
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {setupChecklist.map((item) => {
            const Icon = item.complete ? CheckCircle2 : Circle;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setSelectedCategory(item.category)}
                className="flex min-h-24 gap-3 rounded-md border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40"
              >
                <Icon
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    item.complete ? "text-green-600" : "text-slate-300"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-950">
                      {item.label}
                    </span>
                    <Badge
                      variant={item.complete ? "secondary" : "outline"}
                      className={
                        item.complete
                          ? "bg-green-50 text-green-700"
                          : "bg-white text-slate-600"
                      }
                    >
                      {item.complete ? "Done" : "Needs setup"}
                    </Badge>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    {item.description}
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                    Open {SETTING_CATEGORIES[item.category].label}
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </span>
              </button>
            );
          })}
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

        <section className="rounded-lg border bg-white p-4 sm:p-6">
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

          {selectedCategory === SettingType.EMAIL ? (
            <Card className="mb-6 border-blue-100 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <h3 className="font-semibold text-slate-950">Email Health Check</h3>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Send a real test message using the current SMTP settings for this scope.
                    </p>
                    {emailTestResult ? (
                      <div
                        className={`mt-3 rounded-md border px-3 py-2 text-sm ${
                          emailTestResult.success
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        <p>{emailTestResult.message}</p>
                        {emailTestResult.host ? (
                          <p className="mt-1 text-xs opacity-80">
                            SMTP: {emailTestResult.host}
                            {emailTestResult.port ? `:${emailTestResult.port}` : ""} · From:{" "}
                            {emailTestResult.fromAddress || "not configured"}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(event) => setTestEmail(event.target.value)}
                      placeholder="recipient@example.com"
                      className="bg-white sm:w-72"
                      disabled={testingEmail}
                    />
                    <Button
                      type="button"
                      onClick={() => void handleTestEmailSettings()}
                      disabled={testingEmail || !testEmail.trim()}
                    >
                      {testingEmail ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

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
