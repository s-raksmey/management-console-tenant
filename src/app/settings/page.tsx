"use client";

import React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  BarChart3,
  Brush,
  Code2,
  FileText,
  Globe2,
  HardDrive,
  ChevronDown,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  Settings as SettingsIcon,
  Users,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { getTenantDisplayName, isSubTenantDisplay } from "@/lib/tenant-display";
import { presentSetting } from "@/lib/setting-display";
import { Permission } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useAdminLocale } from "@/hooks/useAdminLocale";
import {
  notifyThemeSettingsChanged,
} from "@/lib/tweakcn-theme";

const EmailDeliveryLogs = dynamic(
  () =>
    import("@/app/settings/_components/EmailDeliveryLogs").then(
      (module) => module.EmailDeliveryLogs,
    ),
  { ssr: false },
);

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
const BRANDING_SETTING_KEYS = [
  "site.dashboard_logo_url",
  "site.logo_url",
  "site.og_image_url",
  "site.favicon_url",
] as const;
const MAIN_TENANT_BRANDING_SETTING_KEYS = [
  "site.management_logo_url",
  "site.management_og_image_url",
  "site.management_favicon_url",
] as const;

const SUPER_ADMIN_HIDDEN_SETTING_KEYS = new Set([
  "site.description",
  "site.logo_url",
  "site.og_image_url",
  "site.favicon_url",
  "site.dashboard_favicon_url",
  "site.contact_email",
  "site.contact_phone",
  "site.contact_address",
  "site.contact_hours",
  "site.facebook_url",
  "site.telegram_url",
  "site.instagram_url",
  "site.timezone",
  "site.base_url",
  "site.public_base_url",
  "site.admin_base_url",
  "site.web_base_url",
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
  "site.dashboard_favicon_url",
  "site.management_logo_url",
  "site.management_og_image_url",
  "site.management_favicon_url",
  "theme.super_admin_tweakcn",
  "theme.primary_color",
  "theme.secondary_color",
  "site.public_base_url",
  "site.base_url",
  "site.web_base_url",
  "site.admin_base_url",
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
    tenantUpdateBlocked: "Sub-tenant users cannot update main-tenant theme settings.",
    tenantResetBlocked: "Sub-tenant users cannot reset main-tenant theme settings.",
    sendTestFailed: "Failed to send test email.",
    pageTitleSuper: "Management Console Settings",
    pageTitleTenant: "Settings",
    pageDescriptionSuper:
      "Configure the management console. Public website branding, SEO, and content policy are edited in each sub-tenant admin.",
    pageDescriptionTenant: (name?: string | null) =>
      `Configure ${name || "this sub-tenant"} branding, SEO, content, users, and integrations. Production domains are set by Super Admin on Tenants.`,
    publicWebsiteUrl: "Public website URL",
    publicWebsiteUrlDescription: "Set the public URL used for links, SEO, and article sharing.",
    adminDashboardUrl: "Admin dashboard URL",
    adminDashboardUrlDescription: "Add the sub-tenant admin URL so emails point users to the right console.",
    branding: "Branding",
    brandingDescription: "Upload a square logo, Open Graph image, or favicon from this device.",
    brandingSection: "Website branding",
    brandingSectionDescription:
      "Upload this admin dashboard logo, the public website logo, an Open Graph image, and one favicon. The Open Graph image and favicon are used on this sub-tenant console and on the public website.",
    consoleBrandingSection: "Management Console branding",
    consoleBrandingSectionDescription:
      "Upload the management console logo, Open Graph image, and favicon from this device. The logo appears in the sidebar and header. The Open Graph image is used in search and social previews.",
    publicWebsiteHint:
      "Public website branding, SEO, and contact details belong to each sub-tenant. They are not edited from this console.",
    manageWebsites: "Manage websites",
    selectScope: "Select settings",
    consoleOption: "Management Console",
    consoleCategory: "Console",
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
    viewOnlyBanner: "Your role can view these settings but cannot change them.",
    failedToLoadSettings: "Failed to Load Settings",
    tryAgain: "Try Again",
    managementConsole: "Management Console",
    tenantWebsite: "Sub-tenant Website",
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
    pageDescriptionSuper:
      "កំណត់ផ្ទាំងគ្រប់គ្រង។ អត្តសញ្ញាណ SEO និងគោលការណ៍មាតិកាគេហទំព័រសាធារណៈត្រូវកែនៅផ្ទាំងគ្រប់គ្រងរបស់គេហទំព័ររង។",
    pageDescriptionTenant: (name?: string | null) =>
      `កំណត់អត្តសញ្ញាណ SEO មាតិកា អ្នកប្រើ និងការតភ្ជាប់សម្រាប់ ${name || "គេហទំព័រនេះ"}។ ដែនផលិតកម្មត្រូវបានកំណត់ដោយ Super Admin នៅ Tenants។`,
    publicWebsiteUrl: "URL គេហទំព័រសាធារណៈ",
    publicWebsiteUrlDescription: "កំណត់ URL សាធារណៈសម្រាប់តំណ SEO និងការចែករំលែកអត្ថបទ។",
    adminDashboardUrl: "URL ផ្ទាំងគ្រប់គ្រង",
    adminDashboardUrlDescription: "បន្ថែម URL ផ្នែកគ្រប់គ្រងគេហទំព័រ ដើម្បីឱ្យអ៊ីមែលនាំអ្នកប្រើទៅផ្ទាំងត្រឹមត្រូវ។",
    branding: "អត្តសញ្ញាណម៉ាក",
    brandingSection: "អត្តសញ្ញាណគេហទំព័រ",
    publicWebsiteHint:
      "អត្តសញ្ញាណ SEO និងព័ត៌មានទំនាក់ទំនងគេហទំព័រសាធារណៈស្ថិតនៅគេហទំព័ររង។ មិនកែពីផ្ទាំងគ្រប់គ្រងនេះទេ។",
    manageWebsites: "គ្រប់គ្រងគេហទំព័រ",
    selectScope: "ជ្រើសការកំណត់",
    consoleOption: "ផ្ទាំងគ្រប់គ្រង",
    consoleCategory: "ផ្ទាំងគ្រប់គ្រង",
    brandingSectionDescription:
      "ផ្ទុក logo ផ្ទាំងគ្រប់គ្រង logo គេហទំព័រសាធារណៈ រូបភាព Open Graph និង favicon មួយ។ រូបភាព Open Graph និង favicon ប្រើទាំងផ្ទាំងគេហទំព័ររងនេះ និងគេហទំព័រសាធារណៈ។",
    consoleBrandingSection: "អត្តសញ្ញាណផ្ទាំងគ្រប់គ្រង",
    consoleBrandingSectionDescription:
      "ផ្ទុក logo រូបភាព Open Graph និង favicon របស់ផ្ទាំងគ្រប់គ្រងពីឧបករណ៍នេះ។ Logo បង្ហាញនៅរបារចំហៀង និងក្បាលទំព័រ។ រូបភាព Open Graph ប្រើសម្រាប់ការមើលជាមុននៅស្វែងរក និងបណ្តាញសង្គម។",
    brandingDescription: "បន្ថែម logo ការ៉េ រូបភាព Open Graph ឬ favicon សាធ�េ រូបភាព Open Graph ឬ favicon សាធារណៈ។",
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
    viewOnlyBanner: "តួនាទីរបស់អ្នកអាចមើលការកំណត់ទាំងនេះ ប៉ុន្តែមិនអាចកែបានទេ។",
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

  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;

  return false;
}

function getSettingsGqlClient(includeSelectedTenant: boolean) {
  return getAuthenticatedGqlClient(undefined, {
    includeSelectedTenant,
  });
}

const CONSOLE_SETTINGS_SCOPE = "__console__";

export default function SettingsPage() {
  const { locale } = useAdminLocale();
  const copy = settingsCopy[locale];
  const { user } = useAuth();
  const { activeTenant, tenantOptions, switchTenant, refreshTenants } = useTenant();
  const userRole = user?.role?.toString().toUpperCase();
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const viewingSubTenant = isSubTenantDisplay(activeTenant);
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canAccessSettings = hasPermission(Permission.VIEW_SETTINGS);
  const canUpdateSettings = hasPermission(Permission.UPDATE_SETTINGS);
  const canRetryEmail = canUpdateSettings;
  const [settings, setSettings] = React.useState<Setting[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<SettingType>(
    SettingType.SITE,
  );
  const settingsPanelRef = React.useRef<HTMLElement | null>(null);
  const loadedTenantIdRef = React.useRef<string | null | undefined>(undefined);
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
      if (loadedTenantIdRef.current !== activeTenant?.id) {
        setLoading(true);
      }
      setError(null);

      const response = await getSettingsGqlClient(viewingSubTenant).request(Q_SETTINGS);

      if (response && typeof response === "object" && "settings" in response) {
        const roleHiddenSettings = viewingSubTenant
          ? TENANT_HIDDEN_SETTING_KEYS
          : SUPER_ADMIN_HIDDEN_SETTING_KEYS;
        const visibleSettings = ((response.settings as Setting[]) || [])
          .filter(
            (setting) =>
              !HIDDEN_SETTING_KEYS.has(setting.key) &&
              !roleHiddenSettings.has(setting.key),
          )
          .map(presentSetting);
        const existingKeys = new Set(visibleSettings.map((setting) => setting.key));
        const brandingKeys = viewingSubTenant
          ? BRANDING_SETTING_KEYS
          : MAIN_TENANT_BRANDING_SETTING_KEYS;
        const missingBranding = brandingKeys
          .filter((key) => !existingKeys.has(key))
          .map((key) =>
          presentSetting({
            id: `local:${key}`,
            key,
            value: "",
            type: SettingType.SITE,
            label: key,
            description: "",
            isPublic: true,
            isRequired: false,
            createdAt: "",
            updatedAt: "",
          }),
        );
        setSettings([...visibleSettings, ...missingBranding]);
        loadedTenantIdRef.current = activeTenant?.id;
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
  }, [
    activeTenant?.id,
    canAccessSettings,
    copy.loadSettingsFailed,
    locale,
    viewingSubTenant,
  ]);

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
    if (!canUpdateSettings) {
      throw new Error(copy.viewOnlyBanner);
    }
    const hiddenKeys = viewingSubTenant
      ? TENANT_HIDDEN_SETTING_KEYS
      : SUPER_ADMIN_HIDDEN_SETTING_KEYS;
    if (hiddenKeys.has(input.key)) {
      throw new Error(
        viewingSubTenant ? copy.tenantUpdateBlocked : copy.saveSettingFailed,
      );
    }

    const response = await getSettingsGqlClient(viewingSubTenant).request(M_UPDATE_SETTING, {
      input,
    });
    const updatedSetting = getMutationSetting(response, "updateSetting");

    setSettings((prev) =>
      prev.map((setting) =>
        setting.key === input.key
          ? presentSetting({ ...setting, ...updatedSetting })
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
        "site.dashboard_logo_url",
        "site.og_image_url",
        "site.dashboard_favicon_url",
        "site.management_logo_url",
        "site.management_og_image_url",
        "site.management_favicon_url",
        "site.favicon_url",
        "site.public_base_url",
      ].includes(input.key)
    ) {
      await refreshTenants();
    }
  };

  const handleResetSetting = async (key: string) => {
    if (!canUpdateSettings) {
      throw new Error(copy.viewOnlyBanner);
    }
    const hiddenKeys = viewingSubTenant
      ? TENANT_HIDDEN_SETTING_KEYS
      : SUPER_ADMIN_HIDDEN_SETTING_KEYS;
    if (hiddenKeys.has(key)) {
      throw new Error(
        viewingSubTenant ? copy.tenantResetBlocked : copy.saveSettingFailed,
      );
    }

    const response = await getSettingsGqlClient(viewingSubTenant).request(M_RESET_SETTING, {
      key,
    });
    const resetSetting = getMutationSetting(response, "resetSetting");

    setSettings((prev) =>
      prev.map((setting) =>
        setting.key === key
          ? presentSetting({ ...setting, ...resetSetting })
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
        "site.dashboard_logo_url",
        "site.og_image_url",
        "site.dashboard_favicon_url",
        "site.management_logo_url",
        "site.management_og_image_url",
        "site.management_favicon_url",
        "site.favicon_url",
        "site.public_base_url",
      ].includes(key)
    ) {
      await refreshTenants();
    }
  };

  const handleTestEmailSettings = async () => {
    if (!canUpdateSettings) return;
    try {
      setTestingEmail(true);
      setEmailTestResult(null);

      const response = await getSettingsGqlClient(viewingSubTenant).request<{
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

  const pageTitle = viewingSubTenant ? copy.pageTitleTenant : copy.pageTitleSuper;
  const pageDescription = viewingSubTenant
    ? copy.pageDescriptionTenant(getTenantDisplayName(activeTenant, copy.tenantWebsite))
    : copy.pageDescriptionSuper;
  const visibleCategories = React.useMemo(
    () =>
      Object.entries(SETTING_CATEGORIES).filter(([key]) => {
        if (viewingSubTenant) return true;

        return [
          SettingType.SITE,
          SettingType.EMAIL,
          SettingType.API,
          SettingType.THEME,
          SettingType.MAINTENANCE,
        ].includes(key as SettingType);
      }),
    [viewingSubTenant],
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
  const categoryLabel = (category: SettingType) =>
    !viewingSubTenant && category === SettingType.SITE
      ? copy.consoleCategory
      : copy.categoryLabels[category] || SETTING_CATEGORIES[category].label;
  const categoryDescription =
    !viewingSubTenant && selectedCategory === SettingType.SITE
      ? copy.consoleBrandingSectionDescription
      : selectedCategoryInfo.description;
  const settingSummary = viewingSubTenant
    ? [
        [copy.settings, settings.length],
        [copy.public, publicCount],
        [copy.required, requiredCount],
      ]
    : [
        [copy.settings, settings.length],
        [copy.required, requiredCount],
      ];
  const visibleCategoryKeys = React.useMemo(
    () => new Set(visibleCategories.map(([key]) => key as SettingType)),
    [visibleCategories],
  );

  React.useEffect(() => {
    if (!visibleCategoryKeys.has(selectedCategory)) {
      setSelectedCategory(SettingType.SITE);
    }
  }, [selectedCategory, viewingSubTenant, visibleCategoryKeys]);
  const setupChecklist = React.useMemo(() => {
    const hasEmail =
      hasSettingValue(settings, "email.smtp_host") &&
      hasSettingValue(settings, "email.from_address");

    if (!viewingSubTenant) {
      const hasConsoleBranding =
        hasSettingValue(settings, "site.management_logo_url") ||
        hasSettingValue(settings, "site.management_og_image_url") ||
        hasSettingValue(settings, "site.management_favicon_url");

      return [
        {
          label: copy.consoleBrandingSection,
          description: copy.consoleBrandingSectionDescription,
          complete: hasConsoleBranding,
          category: SettingType.SITE,
        },
        {
          label: copy.emailDelivery,
          description: copy.emailDeliveryDescription,
          complete: hasEmail,
          category: SettingType.EMAIL,
        },
      ];
    }

    const hasBranding =
      hasSettingValue(settings, "site.dashboard_logo_url") ||
      hasSettingValue(settings, "site.logo_url") ||
      hasSettingValue(settings, "site.og_image_url") ||
      hasSettingValue(settings, "site.favicon_url");
    const hasContact =
      hasSettingValue(settings, "site.contact_email") &&
      (hasSettingValue(settings, "site.contact_phone") ||
        hasSettingValue(settings, "site.contact_address"));
    const hasSeo =
      hasSettingValue(settings, "seo.meta_title") &&
      hasSettingValue(settings, "seo.meta_description");
    const hasUserPolicy =
      hasSettingValue(settings, "users.default_role") &&
      hasSettingValue(settings, "users.password_min_length");
    const hasLegal =
      hasSettingValue(settings, "content.privacy_policy") &&
      hasSettingValue(settings, "content.terms_of_service") &&
      hasSettingValue(settings, "content.cookies_policy");

    return [
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
  }, [copy, settings, viewingSubTenant]);
  const visibleSetupChecklist = React.useMemo(
    () => setupChecklist.filter((item) => visibleCategoryKeys.has(item.category)),
    [setupChecklist, visibleCategoryKeys],
  );
  const completedSetupItems = visibleSetupChecklist.filter((item) => item.complete).length;
  const setupProgress =
    visibleSetupChecklist.length > 0
      ? Math.round((completedSetupItems / visibleSetupChecklist.length) * 100)
      : 100;
  const incompleteSetupItems = visibleSetupChecklist.filter((item) => !item.complete);

  const openSettingsCategory = React.useCallback((category: SettingType) => {
    setSelectedCategory(category);
    window.requestAnimationFrame(() => {
      settingsPanelRef.current?.focus({ preventScroll: true });
    });
  }, []);

  if (permissionsLoading || loading) {
    return <PageSkeleton />;
  }

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
    <div className="space-y-5">
        <header>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">
                {viewingSubTenant
                  ? getTenantDisplayName(activeTenant, copy.tenantWebsite)
                  : copy.managementConsole}
                {viewingSubTenant && activeTenant?.slug ? (
                  <span className="ml-2 font-mono text-xs text-slate-400">{activeTenant.slug}</span>
                ) : null}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {pageTitle}
              </h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                {pageDescription}
              </p>
              {canAccessSettings && !canUpdateSettings ? (
                <div className="mt-4 max-w-xl rounded-md border border-amber-200 bg-amber-50 px-3 py-3">
                  <p className="text-sm leading-6 text-amber-900">
                    {copy.viewOnlyBanner}
                  </p>
                </div>
              ) : null}
              {isSuperAdmin && !viewingSubTenant ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {copy.publicWebsiteHint}{" "}
                  <Link
                    href="/tenants"
                    className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-950"
                  >
                    {copy.manageWebsites}
                  </Link>
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              {isSuperAdmin ? (
                <Select
                  value={activeTenant?.id || CONSOLE_SETTINGS_SCOPE}
                  onValueChange={(value) => {
                    void switchTenant(value === CONSOLE_SETTINGS_SCOPE ? "" : value);
                  }}
                >
                  <SelectTrigger className="h-10 w-full bg-white">
                    <SelectValue placeholder={copy.selectScope} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CONSOLE_SETTINGS_SCOPE}>{copy.consoleOption}</SelectItem>
                    {tenantOptions
                      .filter((tenant) => tenant.status === "ACTIVE" && tenant.isMainTenant !== true)
                      .map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {getTenantDisplayName(tenant, tenant.name)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : null}
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
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
                  variant="ghost"
                  onClick={() => void loadSettings()}
                  className="h-10 shrink-0 px-3"
                  aria-label={copy.refresh}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 items-center gap-2 text-sm text-slate-950"
                  >
                    <span className="font-medium">{copy.readiness}</span>
                    <span className="text-slate-500">{setupProgress}%</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72">
                  <p className="px-2 py-2 text-sm text-slate-500">
                    {incompleteSetupItems.length === 0
                      ? copy.coreComplete
                      : copy.essentialsComplete(completedSetupItems, visibleSetupChecklist.length)}
                  </p>
                  {visibleSetupChecklist.map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      onClick={() => openSettingsCategory(item.category)}
                    >
                      <span
                        className={`mr-2 h-2 w-2 shrink-0 rounded-full ${
                          item.complete ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div
              className={`grid gap-6 ${
                settingSummary.length > 2 ? "grid-cols-3" : "grid-cols-2"
              }`}
            >
              {settingSummary.map(([label, value]) => (
                <div key={label} className="min-w-16">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="space-y-5">
          <nav className="flex gap-6 overflow-x-auto">
            {visibleCategories.map(([key]) => {
              const categoryKey = key as SettingType;
              const count = getCategoryCount(categoryKey);
              const selected = selectedCategory === categoryKey;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={count === 0}
                  onClick={() => openSettingsCategory(categoryKey)}
                  className={`shrink-0 border-b-2 pb-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    selected
                      ? "border-slate-950 font-medium text-slate-950"
                      : "border-transparent text-slate-500 hover:text-slate-950"
                  }`}
                >
                  {categoryLabel(categoryKey)}
                </button>
              );
            })}
          </nav>

          <main className="min-w-0 space-y-4">
            <section
              ref={settingsPanelRef}
              tabIndex={-1}
              className="scroll-mt-4 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <SelectedCategoryIcon className="h-5 w-5 text-slate-600" />
                      <h2 className="text-lg font-semibold text-slate-950">
                        {categoryLabel(selectedCategory)}
                      </h2>
                    </div>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                      {categoryDescription}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                {selectedCategory === SettingType.EMAIL ? (
                  <div className="mb-8">
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

                      {canUpdateSettings ? (
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
                      ) : null}
                    </div>
                    <EmailDeliveryLogs canRetry={canRetryEmail} />
                  </div>
                ) : null}

                {selectedCategory === SettingType.SITE && viewingSubTenant ? (
                  <div className="mb-8">
                    <h3 className="font-semibold text-slate-950">
                      {viewingSubTenant
                        ? copy.brandingSection
                        : copy.consoleBrandingSection}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {viewingSubTenant
                        ? copy.brandingSectionDescription
                        : copy.consoleBrandingSectionDescription}
                    </p>
                  </div>
                ) : null}

                <SettingsCategory
                  category={selectedCategory}
                  settings={filteredSettings}
                  onUpdateSetting={handleUpdateSetting}
                  onResetSetting={handleResetSetting}
                  loading={loading}
                  showPublicBadge={viewingSubTenant}
                  readOnly={!canUpdateSettings}
                />
              </div>
            </section>
          </main>
        </div>
    </div>
  );
}
