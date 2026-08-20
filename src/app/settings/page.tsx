"use client";

import React from "react";
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
import { useAdminLocale } from "@/hooks/useAdminLocale";
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
const TENANT_HIDDEN_SETTING_KEYS = new Set([
  "site.management_favicon_url",
  "theme.super_admin_tweakcn",
  "theme.primary_color",
  "theme.secondary_color",
]);
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

const settingsCopy = {
  en: {
    loadSettingsFailed: "Failed to load settings",
    saveSettingFailed: "The setting could not be saved. Please check the value and try again.",
    tenantUpdateBlocked: "Tenant users cannot update super admin theme settings.",
    tenantResetBlocked: "Tenant users cannot reset super admin theme settings.",
    sendTestFailed: "Failed to send test email.",
    pageTitleSuper: "Management Console Settings",
    pageTitleTenant: "Settings",
    pageDescriptionSuper: "Configure platform defaults used outside tenant-specific websites.",
    pageDescriptionTenant: (name?: string | null) =>
      `Configure ${name || "this tenant"} public website identity, SEO, content, users, and integrations.`,
    publicWebsiteUrl: "Public website URL",
    publicWebsiteUrlDescription: "Set the public URL used for links, SEO, and article sharing.",
    adminDashboardUrl: "Admin dashboard URL",
    adminDashboardUrlDescription: "Add the tenant admin URL so emails point users to the right console.",
    branding: "Branding",
    brandingDescription: "Add a logo or public favicon for a finished site identity.",
    contactDetails: "Contact details",
    contactDetailsDescription: "Publish an email plus phone or address for the public contact page.",
    seoBasics: "SEO basics",
    seoBasicsDescription: "Add meta title and description for search and social previews.",
    emailDelivery: "Email delivery",
    emailDeliveryDescription: "Configure SMTP and use the Email Health Check to verify delivery.",
    userRegistrationPolicy: "User registration policy",
    userRegistrationPolicyDescription: "Confirm the default role and password minimum for new users.",
    legalPages: "Legal pages",
    legalPagesDescription: "Publish privacy, terms, and cookie policy content.",
    settingsUnavailable: "Settings Unavailable",
    settingsUnavailableDescription: "Settings are available only for admin accounts.",
    failedToLoadSettings: "Failed to Load Settings",
    tryAgain: "Try Again",
    managementConsole: "Management Console",
    tenantWebsite: "Tenant Website",
    settings: "Settings",
    public: "Public",
    required: "Required",
    searchSettings: "Search settings",
    refresh: "Refresh",
    sections: "Sections",
    found: (count: number) => `${count} found`,
    shown: (count: number) => `${count} shown`,
    readiness: "Readiness",
    essentialsComplete: (done: number, total: number) => `${done} of ${total} essentials complete`,
    coreComplete: "Core settings are complete.",
    emailHealthCheck: "Email Health Check",
    emailHealthDescription: "Send a real test message using the current SMTP settings.",
    notConfigured: "not configured",
    sendTest: "Send Test",
    categoryLabels: {
      [SettingType.SITE]: "Site",
      [SettingType.EMAIL]: "Email",
      [SettingType.SEO]: "SEO",
      [SettingType.CONTENT]: "Content",
      [SettingType.USER_MANAGEMENT]: "User Management",
      [SettingType.API]: "API",
      [SettingType.THEME]: "Theme",
      [SettingType.MAINTENANCE]: "Maintenance",
    },
  },
  km: {
    loadSettingsFailed: "មិនអាចផ្ទុកការកំណត់បានទេ",
    saveSettingFailed: "មិនអាចរក្សាទុកការកំណត់បានទេ។ សូមពិនិត្យតម្លៃ ហើយព្យាយាមម្តងទៀត។",
    tenantUpdateBlocked: "អ្នកប្រើគេហទំព័រមិនអាចកែការកំណត់រូបរាងរបស់អ្នកគ្រប់គ្រងកំពូលបានទេ។",
    tenantResetBlocked: "អ្នកប្រើគេហទំព័រមិនអាចកំណត់ការកំណត់រូបរាងរបស់អ្នកគ្រប់គ្រងកំពូលឡើងវិញបានទេ។",
    sendTestFailed: "មិនអាចផ្ញើអ៊ីមែលសាកល្បងបានទេ។",
    pageTitleSuper: "ការកំណត់ផ្ទាំងគ្រប់គ្រង",
    pageTitleTenant: "ការកំណត់",
    pageDescriptionSuper: "កំណត់លំនាំដើមវេទិកាសម្រាប់ផ្នែកក្រៅគេហទំព័រជាក់លាក់។",
    pageDescriptionTenant: (name?: string | null) =>
      `កំណត់អត្តសញ្ញាណ SEO មាតិកា អ្នកប្រើ និងការតភ្ជាប់សម្រាប់ ${name || "គេហទំព័រនេះ"}។`,
    publicWebsiteUrl: "URL គេហទំព័រសាធារណៈ",
    publicWebsiteUrlDescription: "កំណត់ URL សាធារណៈសម្រាប់តំណ SEO និងការចែករំលែកអត្ថបទ។",
    adminDashboardUrl: "URL ផ្ទាំងគ្រប់គ្រង",
    adminDashboardUrlDescription: "បន្ថែម URL ផ្នែកគ្រប់គ្រងគេហទំព័រ ដើម្បីឱ្យអ៊ីមែលនាំអ្នកប្រើទៅផ្ទាំងត្រឹមត្រូវ។",
    branding: "អត្តសញ្ញាណម៉ាក",
    brandingDescription: "បន្ថែម logo ឬ favicon សាធារណៈសម្រាប់អត្តសញ្ញាណគេហទំព័រ។",
    contactDetails: "ព័ត៌មានទំនាក់ទំនង",
    contactDetailsDescription: "ផ្សព្វផ្សាយអ៊ីមែល លេខទូរសព្ទ ឬអាសយដ្ឋានសម្រាប់ទំព័រទំនាក់ទំនងសាធារណៈ។",
    seoBasics: "មូលដ្ឋាន SEO",
    seoBasicsDescription: "បន្ថែមចំណងជើងមេតា និងសេចក្ដីពិពណ៌នាសម្រាប់ការមើលជាមុននៅស្វែងរក/បណ្តាញសង្គម។",
    emailDelivery: "ការផ្ញើអ៊ីមែល",
    emailDeliveryDescription: "កំណត់ SMTP ហើយប្រើការពិនិត្យសុខភាពអ៊ីមែលដើម្បីផ្ទៀងផ្ទាត់។",
    userRegistrationPolicy: "គោលការណ៍ចុះឈ្មោះអ្នកប្រើ",
    userRegistrationPolicyDescription: "ពិនិត្យតួនាទីលំនាំដើម និងប្រវែងពាក្យសម្ងាត់អប្បបរមាសម្រាប់អ្នកប្រើថ្មី។",
    legalPages: "ទំព័រច្បាប់",
    legalPagesDescription: "ផ្សព្វផ្សាយមាតិកាគោលការណ៍ឯកជនភាព លក្ខខណ្ឌ និងគោលការណ៍ខូគី។",
    settingsUnavailable: "ការកំណត់មិនអាចប្រើបាន",
    settingsUnavailableDescription: "ការកំណត់មានសម្រាប់គណនីអ្នកគ្រប់គ្រងប៉ុណ្ណោះ។",
    failedToLoadSettings: "ផ្ទុកការកំណត់មិនបាន",
    tryAgain: "ព្យាយាមម្តងទៀត",
    managementConsole: "ផ្ទាំងគ្រប់គ្រង",
    tenantWebsite: "គេហទំព័រ",
    settings: "ការកំណត់",
    public: "សាធារណៈ",
    required: "ត្រូវការ",
    searchSettings: "ស្វែងរកការកំណត់",
    refresh: "ផ្ទុកឡើងវិញ",
    sections: "ផ្នែក",
    found: (count: number) => `រកឃើញ ${count}`,
    shown: (count: number) => `បង្ហាញ ${count}`,
    readiness: "ភាពរួចរាល់",
    essentialsComplete: (done: number, total: number) => `${done} ក្នុងចំណោម ${total} បានបញ្ចប់`,
    coreComplete: "ការកំណត់ស្នូលបានបញ្ចប់ហើយ។",
    emailHealthCheck: "ពិនិត្យសុខភាពអ៊ីមែល",
    emailHealthDescription: "ផ្ញើសារសាកល្បងដោយប្រើការកំណត់ SMTP បច្ចុប្បន្ន។",
    notConfigured: "មិនទាន់កំណត់",
    sendTest: "ផ្ញើសាកល្បង",
    categoryLabels: {
      [SettingType.SITE]: "គេហទំព័រ",
      [SettingType.EMAIL]: "អ៊ីមែល",
      [SettingType.SEO]: "SEO",
      [SettingType.CONTENT]: "មាតិកា",
      [SettingType.USER_MANAGEMENT]: "គ្រប់គ្រងអ្នកប្រើ",
      [SettingType.API]: "API",
      [SettingType.THEME]: "រូបរាង",
      [SettingType.MAINTENANCE]: "ថែទាំ",
    },
  },
};

function hasSettingValue(settings: Setting[], key: string): boolean {
  const value = settings.find((setting) => setting.key === key)?.value;

  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;

  return Boolean(value);
}

export default function SettingsPage() {
  const { locale } = useAdminLocale();
  const copy = settingsCopy[locale];
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
      setError(locale === "en" && err instanceof Error ? err.message : copy.loadSettingsFailed);
      setSettings([]);
    } finally {
      setLoading(false);
    }
  }, [canAccessSettings, copy.loadSettingsFailed, locale, userRole]);

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
      throw new Error(copy.saveSettingFailed);
    }

    const value = (response as Record<string, unknown>)[field];
    if (!value || typeof value !== "object") {
      throw new Error(copy.saveSettingFailed);
    }

    return value as Setting;
  }

  const handleUpdateSetting = async (input: UpdateSettingInput) => {
    if (userRole !== "SUPER_ADMIN" && TENANT_HIDDEN_SETTING_KEYS.has(input.key)) {
      throw new Error(copy.tenantUpdateBlocked);
    }

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
    if (userRole !== "SUPER_ADMIN" && TENANT_HIDDEN_SETTING_KEYS.has(key)) {
      throw new Error(copy.tenantResetBlocked);
    }

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
        message: locale === "en" && err instanceof Error ? err.message : copy.sendTestFailed,
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const pageTitle = isSuperAdmin ? copy.pageTitleSuper : copy.pageTitleTenant;
  const pageDescription = isSuperAdmin
    ? copy.pageDescriptionSuper
    : copy.pageDescriptionTenant(activeTenant?.name);
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
  const visibleCategoryKeys = React.useMemo(
    () => new Set(visibleCategories.map(([key]) => key as SettingType)),
    [visibleCategories],
  );
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
        label: copy.publicWebsiteUrl,
        description: copy.publicWebsiteUrlDescription,
        complete: hasPublicUrl,
        category: SettingType.SITE,
      },
      {
        label: copy.adminDashboardUrl,
        description: copy.adminDashboardUrlDescription,
        complete: hasAdminUrl,
        category: SettingType.SITE,
      },
      {
        label: copy.branding,
        description: copy.brandingDescription,
        complete: hasBranding,
        category: SettingType.SITE,
      },
      {
        label: copy.contactDetails,
        description: copy.contactDetailsDescription,
        complete: hasContact,
        category: SettingType.SITE,
      },
      {
        label: copy.seoBasics,
        description: copy.seoBasicsDescription,
        complete: hasSeo,
        category: SettingType.SEO,
      },
      {
        label: copy.emailDelivery,
        description: copy.emailDeliveryDescription,
        complete: hasEmail,
        category: SettingType.EMAIL,
      },
      {
        label: copy.userRegistrationPolicy,
        description: copy.userRegistrationPolicyDescription,
        complete: hasUserPolicy,
        category: SettingType.USER_MANAGEMENT,
      },
      {
        label: copy.legalPages,
        description: copy.legalPagesDescription,
        complete: hasLegal,
        category: SettingType.CONTENT,
      },
    ];
  }, [activeTenant?.sites, copy, settings]);
  const visibleSetupChecklist = React.useMemo(
    () =>
      setupChecklist.filter(
        (item) =>
          visibleCategoryKeys.has(item.category) &&
          settings.some((setting) => setting.type === item.category),
      ),
    [settings, setupChecklist, visibleCategoryKeys],
  );
  const completedSetupItems = visibleSetupChecklist.filter((item) => item.complete).length;
  const setupProgress =
    visibleSetupChecklist.length > 0
      ? Math.round((completedSetupItems / visibleSetupChecklist.length) * 100)
      : 100;
  const incompleteSetupItems = visibleSetupChecklist.filter((item) => !item.complete);

  if (!canAccessSettings) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-slate-400" />
            <h1 className="text-2xl font-bold text-slate-950">{copy.settingsUnavailable}</h1>
            <p className="mt-2 text-slate-600">
              {copy.settingsUnavailableDescription}
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
              {copy.failedToLoadSettings}
            </h3>
            <p className="mb-4 text-slate-600">{error}</p>
            <Button onClick={() => void loadSettings()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {copy.tryAgain}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1480px] space-y-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-md border border-slate-200 bg-white p-4 sm:p-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] xl:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-white">
                  {isSuperAdmin ? copy.managementConsole : activeTenant?.name || copy.tenantWebsite}
                </Badge>
                {!isSuperAdmin && activeTenant?.slug ? (
                  <span className="font-mono text-xs text-slate-400">{activeTenant.slug}</span>
                ) : null}
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {pageTitle}
              </h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                {pageDescription}
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                {[
                  [copy.settings, settings.length],
                  [copy.public, publicCount],
                  [copy.required, requiredCount],
                ].map(([label, value]) => (
                  <div key={label} className="border-r border-slate-200 px-3 py-2 last:border-r-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder={copy.searchSettings}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 border-slate-200 bg-white pl-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void loadSettings()}
                  className="h-10 shrink-0 bg-white"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {copy.refresh}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[292px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <section className="rounded-md border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between px-2 py-2">
                <h2 className="text-sm font-semibold text-slate-950">{copy.sections}</h2>
                <Badge variant="outline" className="bg-white text-xs">
                  {searchQuery ? copy.found(filteredSettings.length) : copy.shown(getCategoryCount(selectedCategory))}
                </Badge>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
                {visibleCategories.map(([key]) => {
                  const categoryKey = key as SettingType;
                  const count = getCategoryCount(categoryKey);
                  const Icon = CATEGORY_ICONS[categoryKey] || SettingsIcon;
                  const selected = selectedCategory === categoryKey;

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={count === 0}
                      onClick={() => setSelectedCategory(categoryKey)}
                      className={`flex min-w-max items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors lg:w-full ${
                        selected
                          ? "bg-slate-950 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      } disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        {copy.categoryLabels[categoryKey] || SETTING_CATEGORIES[categoryKey].label}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          selected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">{copy.readiness}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {copy.essentialsComplete(completedSetupItems, visibleSetupChecklist.length)}
                  </p>
                </div>
                <span className="text-lg font-semibold text-slate-950">{setupProgress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${setupProgress}%` }}
                />
              </div>
              <div className="mt-4 space-y-1">
                {(incompleteSetupItems.length > 0 ? incompleteSetupItems : visibleSetupChecklist).slice(0, 5).map((item) => {
                  const Icon = item.complete ? CheckCircle2 : Circle;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setSelectedCategory(item.category)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-50"
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          item.complete ? "text-emerald-600" : "text-slate-300"
                        }`}
                      />
                      <span className="min-w-0 flex-1 truncate text-slate-700">
                        {item.label}
                      </span>
                      {!item.complete ? (
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                      ) : null}
                    </button>
                  );
                })}
                {incompleteSetupItems.length === 0 ? (
                  <p className="px-2 py-1.5 text-sm text-emerald-700">
                    {copy.coreComplete}
                  </p>
                ) : null}
              </div>
            </section>
          </aside>

          <main className="min-w-0 space-y-4">
            <section className="rounded-md border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <SelectedCategoryIcon className="h-5 w-5 text-slate-600" />
                      <h2 className="text-lg font-semibold text-slate-950">
                        {copy.categoryLabels[selectedCategory] || selectedCategoryInfo.label}
                      </h2>
                    </div>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                      {selectedCategoryInfo.description}
                    </p>
                  </div>
                  {!isSuperAdmin && activeTenant ? (
                    <Badge variant="outline" className="max-w-full truncate bg-white">
                      {activeTenant.slug}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="p-4 sm:p-5">
                {selectedCategory === SettingType.EMAIL ? (
                  <div className="mb-5 rounded-md border border-sky-200 bg-sky-50/70 p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-sky-700" />
                          <h3 className="font-semibold text-slate-950">{copy.emailHealthCheck}</h3>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {copy.emailHealthDescription}
                        </p>
                        {emailTestResult ? (
                          <div
                            className={`mt-3 rounded-md border px-3 py-2 text-sm ${
                              emailTestResult.success
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                            }`}
                          >
                            <p>{emailTestResult.message}</p>
                            {emailTestResult.host ? (
                              <p className="mt-1 text-xs opacity-80">
                                SMTP: {emailTestResult.host}
                                {emailTestResult.port ? `:${emailTestResult.port}` : ""} · From:{" "}
                                {emailTestResult.fromAddress || copy.notConfigured}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
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
                          {copy.sendTest}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <SettingsCategory
                  category={selectedCategory}
                  settings={filteredSettings}
                  onUpdateSetting={handleUpdateSetting}
                  onResetSetting={handleResetSetting}
                  loading={loading}
                />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
