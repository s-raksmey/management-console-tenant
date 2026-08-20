"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Archive,
  Building2,
  Check,
  ChevronDown,
  Copy,
  Edit2,
  ExternalLink,
  Globe2,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  RotateCcw,
  Server,
  Shield,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  CreateTenantAdminInput,
  CreateTenantInput,
  Tenant,
  TenantService,
  TenantStatus,
  UpdateTenantInput,
} from "@/services/tenant.gql";
import { UserService } from "@/services/user.gql";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToastHelpers } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Permission, PermissionGuard } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useAdminLocale } from "@/hooks/useAdminLocale";

const emptyTenant: CreateTenantInput = {
  name: "",
  slug: "",
  description: "",
  publicBaseUrl: "",
  adminBaseUrl: "",
  primaryLocale: "en",
};

const emptyAdmin: CreateTenantAdminInput = {
  tenantId: "",
  email: "",
  password: "",
  name: "",
  role: "ADMIN",
};

const tenantStatuses: TenantStatus[] = ["ACTIVE", "SUSPENDED", "ARCHIVED"];

const tenantsCopy = {
  en: {
    confirm: "Confirm",
    cancel: "Cancel",
    copied: "Copied",
    copiedDescription: (label: string) => `${label} copied to clipboard.`,
    copyFailed: "Copy Failed",
    copyFailedDescription: (label: string) => `Could not copy ${label}.`,
    error: "Error",
    validationError: "Validation Error",
    loadFailed: "Failed to load tenants.",
    tenantNameRequired: "Tenant name is required.",
    createTenantTitle: "Create Tenant Website?",
    createTenantDescription: (name: string) => `Create tenant website "${name}"?`,
    createTenant: "Create Tenant",
    tenantCreated: "Tenant Created",
    tenantCreatedDescription: (name: string) => `${name} is ready.`,
    createTenantFailed: "Failed to create tenant.",
    tenantUserRequired: "Tenant, name, and email are required.",
    createTenantUserTitle: "Create Tenant User?",
    createTenantUserDescription: (name: string, role?: string | null) =>
      `Create ${name} as a tenant ${role?.toLowerCase()}?`,
    createUser: "Create User",
    tenantUserCreated: "Tenant User Created",
    tenantUserCreatedDescription: "The user can now access this tenant.",
    createTenantUserFailed: "Failed to create tenant user.",
    resetTwoFactorTitle: "Reset Two-Factor Setup?",
    resetTwoFactorDescription: (name: string) =>
      `Reset two-factor setup for "${name}"? They will need to scan a new QR code on next login.`,
    resetTwoFactor: "Reset Two-Factor",
    resetTwoFactorFailed: "Failed to reset two-factor setup.",
    resetTwoFactorSuccess: "Two-Factor Reset",
    saveTenantTitle: "Save Tenant Changes?",
    saveTenantDescription: (name: string) => `Save changes to tenant "${name}"?`,
    saveTenant: "Save Tenant",
    tenantUpdated: "Tenant Updated",
    tenantUpdatedDescription: (name: string) => `${name} has been updated.`,
    updateTenantFailed: "Failed to update tenant.",
    archiveTenantTitle: "Archive Tenant?",
    restoreTenantTitle: "Restore Tenant?",
    archiveTenantDescription: (name: string) => `Archive "${name}"?`,
    restoreTenantDescription: (name: string) => `Restore "${name}"?`,
    archiveTenant: "Archive Tenant",
    restoreTenant: "Restore Tenant",
    tenantArchived: "Tenant Archived",
    tenantRestored: "Tenant Restored",
    tenantArchivedDescription: (name: string) => `${name} is hidden from public/admin access.`,
    tenantRestoredDescription: (name: string) => `${name} is active again.`,
    tenantLifecycleFailed: (action: string) => `Failed to ${action} tenant.`,
    archiveAction: "archive",
    restoreAction: "restore",
    eyebrowSuper: "Tenant Control",
    eyebrowTenant: "Website Control",
    titleSuper: "Tenant Websites",
    titleTenant: "Current Website",
    descriptionSuper: "Create tenant websites, inspect users, and manage each tenant from one place.",
    descriptionTenant: "Manage this tenant admin website and public website identity.",
    createTenantWebsite: "Create Tenant Website",
    newSite: "New admin and public site",
    activeTenants: "Active Tenants",
    tenantUsers: "Tenant Users",
    activeSites: "Active Sites",
    archived: "Archived",
    tenants: "Tenants",
    website: "Website",
    tenantsConfigured: (count: number) => `${count} tenant website${count !== 1 ? "s" : ""} configured`,
    websiteDescription: "Update the name, URLs, locale, and active state for this tenant",
    refresh: "Refresh",
    loadingTenants: "Loading tenants...",
    noTenants: "No tenants yet.",
    createTenantDialogDescription: "Create a clean tenant admin and public website. Content starts empty.",
    tenantName: "Tenant Name",
    slug: "Slug",
    formDescription: "Description",
    publicUrl: "Public URL",
    adminUrl: "Admin URL",
    createTenantUser: "Create Tenant User",
    createTenantUserDialogDescription: "Create a user directly inside this tenant and choose their role.",
    tenant: "Tenant",
    selectFromTenantUsers: "Select from a tenant's Users panel",
    name: "Name",
    email: "Email",
    role: "Role",
    admin: "Admin",
    editor: "Editor",
    author: "Author",
    password: "Password",
    passwordPlaceholder: "Required for new users",
    siteDisabled: "Site Disabled",
    users: "Users",
    connection: "Connection",
    publicSite: "Public Site",
    adminSite: "Admin Site",
    notSet: "Not set",
    openPublic: "Open public",
    openAdmin: "Open admin",
    tenantAdminCount: (count: number) => `${count} tenant admin${count !== 1 ? "s" : ""}`,
    cancelEdit: "Cancel Edit",
    editTenant: "Edit Tenant",
    archive: "Archive",
    restore: "Restore",
    publicWebsiteEnvironment: "Public Website Environment",
    envHint: "Tenant ID is stable. The slug can change when the tenant name changes, so it is not required in the public website env.",
    tenantId: "Tenant ID",
    tenantSlug: "Tenant slug",
    publicWebsiteEnvironmentLabel: "Public website environment",
    currentSlug: "Current slug",
    copyEnv: "Copy Env",
    tenantUsersTitle: "Tenant Users",
    usersInTenant: (count: number, tenantName: string) => `${count} user${count !== 1 ? "s" : ""} in ${tenantName}`,
    addUser: "Add User",
    noUsersAssigned: "No users are assigned to this tenant yet.",
    tableUser: "User",
    tableEmail: "Email",
    tenantRole: "Tenant Role",
    platformRole: "Platform Role",
    status: "Status",
    twoFactor: "Two-Factor",
    created: "Created",
    accountActive: "Account Active",
    accountInactive: "Account Inactive",
    membershipInactive: "Membership Inactive",
    enabled: "Enabled",
    needsSetup: "Needs Setup",
    showQrAgain: "Show QR Again",
    primaryLocale: "Primary Locale",
    enableTenantSite: "Enable this tenant public/admin site",
    statusLabels: {
      ACTIVE: "Active",
      SUSPENDED: "Suspended",
      ARCHIVED: "Archived",
    },
    roleLabels: {
      SUPER_ADMIN: "Super Admin",
      ADMIN: "Admin",
      EDITOR: "Editor",
      AUTHOR: "Author",
    },
  },
  km: {
    confirm: "បញ្ជាក់",
    cancel: "បោះបង់",
    copied: "បានចម្លង",
    copiedDescription: (label: string) => `បានចម្លង ${label} ទៅក្តារតម្បៀតខ្ទាស់។`,
    copyFailed: "ចម្លងមិនបាន",
    copyFailedDescription: (label: string) => `មិនអាចចម្លង ${label} បានទេ។`,
    error: "បញ្ហា",
    validationError: "ទិន្នន័យមិនត្រឹមត្រូវ",
    loadFailed: "មិនអាចផ្ទុកគេហទំព័របានទេ។",
    tenantNameRequired: "ត្រូវការឈ្មោះគេហទំព័រ។",
    createTenantTitle: "បង្កើតគេហទំព័រថ្មី?",
    createTenantDescription: (name: string) => `បង្កើតគេហទំព័រ "${name}"?`,
    createTenant: "បង្កើតគេហទំព័រ",
    tenantCreated: "បានបង្កើតគេហទំព័រ",
    tenantCreatedDescription: (name: string) => `${name} រួចរាល់ហើយ។`,
    createTenantFailed: "មិនអាចបង្កើតគេហទំព័របានទេ។",
    tenantUserRequired: "ត្រូវការគេហទំព័រ ឈ្មោះ និងអ៊ីមែល។",
    createTenantUserTitle: "បង្កើតអ្នកប្រើគេហទំព័រ?",
    createTenantUserDescription: (name: string, role?: string | null) =>
      `បង្កើត ${name} ជាអ្នកប្រើគេហទំព័រតួនាទី ${role?.toLowerCase()}?`,
    createUser: "បង្កើតអ្នកប្រើ",
    tenantUserCreated: "បានបង្កើតអ្នកប្រើគេហទំព័រ",
    tenantUserCreatedDescription: "អ្នកប្រើអាចចូលប្រើគេហទំព័រនេះបានហើយ។",
    createTenantUserFailed: "មិនអាចបង្កើតអ្នកប្រើគេហទំព័របានទេ។",
    resetTwoFactorTitle: "កំណត់ការផ្ទៀងផ្ទាត់ពីរជំហានឡើងវិញ?",
    resetTwoFactorDescription: (name: string) =>
      `កំណត់ការផ្ទៀងផ្ទាត់ពីរជំហានសម្រាប់ "${name}" ឡើងវិញ? ពួកគេត្រូវស្កេន QR ថ្មីនៅពេលចូលលើកក្រោយ។`,
    resetTwoFactor: "កំណត់ពីរជំហានឡើងវិញ",
    resetTwoFactorFailed: "មិនអាចកំណត់ការផ្ទៀងផ្ទាត់ពីរជំហានឡើងវិញបានទេ។",
    resetTwoFactorSuccess: "បានកំណត់ពីរជំហានឡើងវិញ",
    saveTenantTitle: "រក្សាទុកការកែគេហទំព័រ?",
    saveTenantDescription: (name: string) => `រក្សាទុកការកែប្រែគេហទំព័រ "${name}"?`,
    saveTenant: "រក្សាទុកគេហទំព័រ",
    tenantUpdated: "បានកែគេហទំព័រ",
    tenantUpdatedDescription: (name: string) => `${name} ត្រូវបានកែប្រែហើយ។`,
    updateTenantFailed: "មិនអាចកែគេហទំព័របានទេ។",
    archiveTenantTitle: "ដាក់គេហទំព័រក្នុងប័ណ្ណសារ?",
    restoreTenantTitle: "ស្ដារគេហទំព័រ?",
    archiveTenantDescription: (name: string) => `ដាក់ "${name}" ក្នុងប័ណ្ណសារ?`,
    restoreTenantDescription: (name: string) => `ស្ដារ "${name}"?`,
    archiveTenant: "ដាក់ក្នុងប័ណ្ណសារ",
    restoreTenant: "ស្ដារគេហទំព័រ",
    tenantArchived: "បានដាក់គេហទំព័រក្នុងប័ណ្ណសារ",
    tenantRestored: "បានស្ដារគេហទំព័រ",
    tenantArchivedDescription: (name: string) => `${name} ត្រូវបានលាក់ពីការចូលប្រើសាធារណៈ និងផ្នែកគ្រប់គ្រង។`,
    tenantRestoredDescription: (name: string) => `${name} សកម្មឡើងវិញ។`,
    tenantLifecycleFailed: (action: string) => `មិនអាច${action}គេហទំព័របានទេ។`,
    archiveAction: "ដាក់ក្នុងប័ណ្ណសារ",
    restoreAction: "ស្ដារ",
    eyebrowSuper: "គ្រប់គ្រងគេហទំព័រ",
    eyebrowTenant: "គ្រប់គ្រងគេហទំព័រ",
    titleSuper: "គេហទំព័រទាំងអស់",
    titleTenant: "គេហទំព័របច្ចុប្បន្ន",
    descriptionSuper: "បង្កើតគេហទំព័រ ពិនិត្យអ្នកប្រើ និងគ្រប់គ្រងគេហទំព័រទាំងអស់ពីកន្លែងតែមួយ។",
    descriptionTenant: "គ្រប់គ្រងអត្តសញ្ញាណគេហទំព័រផ្នែកគ្រប់គ្រង និងគេហទំព័រសាធារណៈនេះ។",
    createTenantWebsite: "បង្កើតគេហទំព័រ",
    newSite: "គេហទំព័រផ្នែកគ្រប់គ្រង និងសាធារណៈថ្មី",
    activeTenants: "គេហទំព័រសកម្ម",
    tenantUsers: "អ្នកប្រើគេហទំព័រ",
    activeSites: "តំបន់បណ្តាញសកម្ម",
    archived: "បានដាក់ប័ណ្ណសារ",
    tenants: "គេហទំព័រ",
    website: "គេហទំព័រ",
    tenantsConfigured: (count: number) => `បានកំណត់គេហទំព័រ ${count}`,
    websiteDescription: "កែឈ្មោះ URL ភាសាចម្បង និងស្ថានភាពសកម្មរបស់គេហទំព័រនេះ",
    refresh: "ផ្ទុកឡើងវិញ",
    loadingTenants: "កំពុងផ្ទុកគេហទំព័រ...",
    noTenants: "មិនទាន់មានគេហទំព័រ។",
    createTenantDialogDescription: "បង្កើតគេហទំព័រផ្នែកគ្រប់គ្រង និងសាធារណៈថ្មី។ មាតិកាចាប់ផ្តើមទទេ។",
    tenantName: "ឈ្មោះគេហទំព័រ",
    slug: "ស្លាក URL",
    formDescription: "ពណ៌នា",
    publicUrl: "URL សាធារណៈ",
    adminUrl: "URL ផ្នែកគ្រប់គ្រង",
    createTenantUser: "បង្កើតអ្នកប្រើគេហទំព័រ",
    createTenantUserDialogDescription: "បង្កើតអ្នកប្រើដោយផ្ទាល់ក្នុងគេហទំព័រនេះ និងជ្រើសតួនាទី។",
    tenant: "គេហទំព័រ",
    selectFromTenantUsers: "ជ្រើសពីផ្ទាំងអ្នកប្រើរបស់គេហទំព័រ",
    name: "ឈ្មោះ",
    email: "អ៊ីមែល",
    role: "តួនាទី",
    admin: "អ្នកគ្រប់គ្រង",
    editor: "អ្នកកែសម្រួល",
    author: "អ្នកនិពន្ធ",
    password: "ពាក្យសម្ងាត់",
    passwordPlaceholder: "ត្រូវការសម្រាប់អ្នកប្រើថ្មី",
    siteDisabled: "គេហទំព័របានបិទ",
    users: "អ្នកប្រើ",
    connection: "ការតភ្ជាប់",
    publicSite: "គេហទំព័រសាធារណៈ",
    adminSite: "គេហទំព័រផ្នែកគ្រប់គ្រង",
    notSet: "មិនទាន់កំណត់",
    openPublic: "បើកផ្នែកសាធារណៈ",
    openAdmin: "បើកផ្នែកគ្រប់គ្រង",
    tenantAdminCount: (count: number) => `${count} អ្នកគ្រប់គ្រងគេហទំព័រ`,
    cancelEdit: "បោះបង់ការកែ",
    editTenant: "កែគេហទំព័រ",
    archive: "ដាក់ប័ណ្ណសារ",
    restore: "ស្ដារ",
    publicWebsiteEnvironment: "បរិស្ថានគេហទំព័រសាធារណៈ",
    envHint: "លេខសម្គាល់គេហទំព័រមានស្ថិរភាព។ ស្លាក URL អាចផ្លាស់ប្តូរពេលឈ្មោះគេហទំព័រផ្លាស់ប្តូរ ដូច្នេះវាមិនចាំបាច់នៅក្នុងការកំណត់បរិស្ថានរបស់គេហទំព័រសាធារណៈទេ។",
    tenantId: "លេខសម្គាល់គេហទំព័រ",
    tenantSlug: "ស្លាក URL គេហទំព័រ",
    publicWebsiteEnvironmentLabel: "បរិស្ថានគេហទំព័រសាធារណៈ",
    currentSlug: "ស្លាក URL បច្ចុប្បន្ន",
    copyEnv: "ចម្លងការកំណត់បរិស្ថាន",
    tenantUsersTitle: "អ្នកប្រើគេហទំព័រ",
    usersInTenant: (count: number, tenantName: string) => `${count} អ្នកប្រើ ក្នុង ${tenantName}`,
    addUser: "បន្ថែមអ្នកប្រើ",
    noUsersAssigned: "មិនទាន់មានអ្នកប្រើត្រូវបានផ្តល់ទៅគេហទំព័រនេះទេ។",
    tableUser: "អ្នកប្រើ",
    tableEmail: "អ៊ីមែល",
    tenantRole: "តួនាទីគេហទំព័រ",
    platformRole: "តួនាទីវេទិកា",
    status: "ស្ថានភាព",
    twoFactor: "ពីរជំហាន",
    created: "បានបង្កើត",
    accountActive: "គណនីសកម្ម",
    accountInactive: "គណនីអសកម្ម",
    membershipInactive: "សមាជិកភាពអសកម្ម",
    enabled: "បានបើក",
    needsSetup: "ត្រូវការកំណត់",
    showQrAgain: "បង្ហាញ QR ម្តងទៀត",
    primaryLocale: "ភាសាចម្បង",
    enableTenantSite: "បើកគេហទំព័រសាធារណៈ និងផ្នែកគ្រប់គ្រងនេះ",
    statusLabels: {
      ACTIVE: "សកម្ម",
      SUSPENDED: "បានផ្អាក",
      ARCHIVED: "បានដាក់ប័ណ្ណសារ",
    },
    roleLabels: {
      SUPER_ADMIN: "អ្នកគ្រប់គ្រងកំពូល",
      ADMIN: "អ្នកគ្រប់គ្រង",
      EDITOR: "អ្នកកែសម្រួល",
      AUTHOR: "អ្នកនិពន្ធ",
    },
  },
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function shouldSyncSlugFromName(currentSlug: string | null | undefined, previousName: string | null | undefined) {
  return !currentSlug || currentSlug === toSlug(previousName || "");
}

function statusBadgeVariant(status: TenantStatus) {
  if (status === "ACTIVE") return "outline";
  if (status === "SUSPENDED") return "secondary";
  return "destructive";
}

function getTenantScopedMemberships(tenant: Tenant) {
  return tenant.memberships.filter(
    (membership) =>
      membership.role !== "SUPER_ADMIN" &&
      membership.user.role !== "SUPER_ADMIN",
  );
}

export default function TenantsPage() {
  const { locale } = useAdminLocale();
  const copy = tenantsCopy[locale];
  const { showSuccess, showError } = useToastHelpers();
  const { refreshTenants } = useTenant();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const showErrorRef = useRef(showError);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTenant, setSavingTenant] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingLifecycleId, setSavingLifecycleId] = useState<string | null>(null);
  const [savingTwoFactorUserId, setSavingTwoFactorUserId] = useState<string | null>(null);
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [tenantForm, setTenantForm] = useState<CreateTenantInput>(emptyTenant);
  const [adminForm, setAdminForm] = useState<CreateTenantAdminInput>(emptyAdmin);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [expandedUsersTenantId, setExpandedUsersTenantId] = useState<string | null>(null);
  const [expandedConnectionTenantId, setExpandedConnectionTenantId] = useState<string | null>(null);
  const [editTenantForm, setEditTenantForm] = useState<UpdateTenantInput>({});
  const [confirmation, setConfirmation] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant?: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    confirmText: copy.confirm,
    onConfirm: () => {},
  });

  const publicApiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql";

  const activeTenantCount = tenants.filter((tenant) => tenant.status === "ACTIVE").length;
  const archivedTenantCount = tenants.filter((tenant) => tenant.status === "ARCHIVED").length;
  const tenantUserCount = tenants.reduce(
    (total, tenant) => total + getTenantScopedMemberships(tenant).length,
    0,
  );
  const activeSiteCount = tenants.reduce(
    (total, tenant) => total + tenant.sites.filter((site) => site.isActive).length,
    0,
  );
  const selectedUserTenant = tenants.find((tenant) => tenant.id === adminForm.tenantId);

  const copyTenantValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showSuccess(copy.copied, copy.copiedDescription(label));
    } catch {
      showError(copy.copyFailed, copy.copyFailedDescription(label));
    }
  };

  const buildPublicEnv = (tenant: Tenant) =>
    [
      `NEXT_PUBLIC_API_URL=${publicApiUrl}`,
      `NEXT_PUBLIC_TENANT_ID=${tenant.id}`,
    ].join("\n");

  const requestConfirmation = (input: {
    title: string;
    description: string;
    confirmText: string;
    variant?: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmation({
      open: true,
      title: input.title,
      description: input.description,
      confirmText: input.confirmText,
      variant: input.variant,
      onConfirm: input.onConfirm,
    });
  };

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const items = isSuperAdmin
        ? await TenantService.listTenants()
        : await TenantService.getActiveTenant().then((tenant) => (tenant ? [tenant] : []));

      setTenants(items);
      setAdminForm((current) => ({
        ...current,
        tenantId: current.tenantId || items[0]?.id || "",
      }));
    } catch (error: any) {
      showErrorRef.current(
        copy.error,
        locale === "en"
          ? error?.response?.errors?.[0]?.message || copy.loadFailed
          : copy.loadFailed,
      );
    } finally {
      setLoading(false);
    }
  }, [copy.error, copy.loadFailed, isSuperAdmin, locale]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  const createTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!tenantForm.name.trim()) {
      showError(copy.validationError, copy.tenantNameRequired);
      return;
    }

    requestConfirmation({
      title: copy.createTenantTitle,
      description: copy.createTenantDescription(tenantForm.name.trim()),
      confirmText: copy.createTenant,
      onConfirm: async () => {
    setSavingTenant(true);
    try {
      const tenant = await TenantService.createTenant({
        ...tenantForm,
        name: tenantForm.name.trim(),
        slug: tenantForm.slug?.trim() || toSlug(tenantForm.name),
        description: tenantForm.description?.trim() || null,
        publicBaseUrl: tenantForm.publicBaseUrl?.trim() || null,
        adminBaseUrl: tenantForm.adminBaseUrl?.trim() || null,
        primaryLocale: tenantForm.primaryLocale || "en",
      });

      setTenants((current) => [tenant, ...current]);
      setAdminForm((current) => ({ ...current, tenantId: tenant.id }));
      setTenantForm(emptyTenant);
      setTenantDialogOpen(false);
      showSuccess(copy.tenantCreated, copy.tenantCreatedDescription(tenant.name));
      await refreshTenants();
    } catch (error: any) {
      showError(
        copy.error,
        locale === "en"
          ? error?.response?.errors?.[0]?.message || copy.createTenantFailed
          : copy.createTenantFailed,
      );
    } finally {
      setSavingTenant(false);
    }
      },
    });
  };

  const createTenantAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adminForm.tenantId || !adminForm.email.trim() || !adminForm.name.trim()) {
      showError(copy.validationError, copy.tenantUserRequired);
      return;
    }

    requestConfirmation({
      title: copy.createTenantUserTitle,
      description: copy.createTenantUserDescription(adminForm.name.trim(), adminForm.role),
      confirmText: copy.createUser,
      onConfirm: async () => {
    setSavingAdmin(true);
    try {
      await TenantService.createTenantAdmin({
        ...adminForm,
        email: adminForm.email.trim(),
        name: adminForm.name.trim(),
        password: adminForm.password?.trim() || null,
      });
      setAdminForm((current) => ({ ...emptyAdmin, tenantId: current.tenantId }));
      setAdminDialogOpen(false);
      showSuccess(copy.tenantUserCreated, copy.tenantUserCreatedDescription);
      await loadTenants();
    } catch (error: any) {
      showError(
        copy.error,
        locale === "en"
          ? error?.response?.errors?.[0]?.message || copy.createTenantUserFailed
          : copy.createTenantUserFailed,
      );
    } finally {
      setSavingAdmin(false);
    }
      },
    });
  };

  const resetUserTwoFactor = async (targetUser: { id: string; name: string }) => {
    requestConfirmation({
      title: copy.resetTwoFactorTitle,
      description: copy.resetTwoFactorDescription(targetUser.name),
      confirmText: copy.resetTwoFactor,
      variant: "destructive",
      onConfirm: async () => {
    setSavingTwoFactorUserId(targetUser.id);
    try {
      const result = await UserService.resetUserTwoFactor(targetUser.id);
      if (!result.success) {
        showError(
          copy.error,
          locale === "en" && result.message ? result.message : copy.resetTwoFactorFailed,
        );
        return;
      }

      showSuccess(
        copy.resetTwoFactorSuccess,
        locale === "en" ? result.message : copy.resetTwoFactorSuccess,
      );
      await loadTenants();
    } catch (error: any) {
      showError(
        copy.error,
        locale === "en"
          ? error?.response?.errors?.[0]?.message || copy.resetTwoFactorFailed
          : copy.resetTwoFactorFailed,
      );
    } finally {
      setSavingTwoFactorUserId(null);
    }
      },
    });
  };

  const openCreateTenantUser = (tenant: Tenant) => {
    setAdminForm({
      ...emptyAdmin,
      tenantId: tenant.id,
      role: "AUTHOR",
    });
    setAdminDialogOpen(true);
  };

  const startTenantEdit = (tenant: Tenant) => {
    const site = tenant.sites.find((item) => item.isPrimary) ?? tenant.sites[0];

    setEditingTenantId(tenant.id);
    setEditTenantForm({
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description ?? "",
      publicBaseUrl: site?.publicBaseUrl ?? "",
      adminBaseUrl: site?.adminBaseUrl ?? "",
      primaryLocale: site?.primaryLocale ?? "en",
      status: tenant.status,
      isActive: site?.isActive ?? true,
    });
  };

  const cancelTenantEdit = () => {
    setEditingTenantId(null);
    setEditTenantForm({});
  };

  const updateTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingTenantId) return;
    if (!editTenantForm.name?.trim()) {
      showError(copy.validationError, copy.tenantNameRequired);
      return;
    }
    const tenantName = editTenantForm.name.trim();

    requestConfirmation({
      title: copy.saveTenantTitle,
      description: copy.saveTenantDescription(tenantName),
      confirmText: copy.saveTenant,
      onConfirm: async () => {
    setSavingEdit(true);
    try {
      const tenant = await TenantService.updateTenant(editingTenantId, {
        ...editTenantForm,
        name: tenantName,
        slug: editTenantForm.slug?.trim()
          ? toSlug(editTenantForm.slug)
          : toSlug(tenantName),
        description: editTenantForm.description?.trim() || null,
        publicBaseUrl: editTenantForm.publicBaseUrl?.trim() || null,
        adminBaseUrl: editTenantForm.adminBaseUrl?.trim() || null,
        primaryLocale: editTenantForm.primaryLocale?.trim() || "en",
      });

      setTenants((current) =>
        current.map((item) => (item.id === tenant.id ? tenant : item)),
      );
      cancelTenantEdit();
      showSuccess(copy.tenantUpdated, copy.tenantUpdatedDescription(tenant.name));
      await refreshTenants();
    } catch (error: any) {
      showError(
        copy.error,
        locale === "en"
          ? error?.response?.errors?.[0]?.message || copy.updateTenantFailed
          : copy.updateTenantFailed,
      );
    } finally {
      setSavingEdit(false);
    }
      },
    });
  };

  const updateTenantLifecycle = async (tenant: Tenant, nextStatus: TenantStatus) => {
    const isArchiving = nextStatus === "ARCHIVED";
    const actionLabel = isArchiving ? copy.archiveAction : copy.restoreAction;

    requestConfirmation({
      title: isArchiving ? copy.archiveTenantTitle : copy.restoreTenantTitle,
      description: isArchiving
        ? copy.archiveTenantDescription(tenant.name)
        : copy.restoreTenantDescription(tenant.name),
      confirmText: isArchiving ? copy.archiveTenant : copy.restoreTenant,
      variant: isArchiving ? "destructive" : "default",
      onConfirm: async () => {
    setSavingLifecycleId(tenant.id);
    try {
      const updatedTenant = await TenantService.updateTenant(tenant.id, {
        status: nextStatus,
        isActive: !isArchiving,
      });

      setTenants((current) =>
        current.map((item) => (item.id === updatedTenant.id ? updatedTenant : item)),
      );
      showSuccess(
        isArchiving ? copy.tenantArchived : copy.tenantRestored,
        isArchiving
          ? copy.tenantArchivedDescription(tenant.name)
          : copy.tenantRestoredDescription(tenant.name),
      );
      await refreshTenants();
    } catch (error: any) {
      showError(
        copy.error,
        locale === "en"
          ? error?.response?.errors?.[0]?.message || copy.tenantLifecycleFailed(actionLabel)
          : copy.tenantLifecycleFailed(actionLabel),
      );
    } finally {
      setSavingLifecycleId(null);
    }
      },
    });
  };

  return (
    <PermissionGuard permissions={[Permission.SYSTEM_ADMINISTRATION, Permission.UPDATE_SETTINGS]} showError>
      <main className="space-y-6">
      <section className="rounded-lg border bg-white p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {isSuperAdmin ? copy.eyebrowSuper : copy.eyebrowTenant}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              {isSuperAdmin ? copy.titleSuper : copy.titleTenant}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isSuperAdmin ? copy.descriptionSuper : copy.descriptionTenant}
            </p>
          </div>

          {isSuperAdmin && (
            <div className="w-full xl:w-auto">
              <button
                type="button"
                onClick={() => setTenantDialogOpen(true)}
                className="group w-full rounded-lg border border-blue-200 bg-blue-600 p-4 text-left text-white shadow-sm transition hover:bg-blue-700 xl:w-[320px]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15">
                    <Globe2 className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{copy.createTenantWebsite}</span>
                    <span className="mt-0.5 block text-xs text-blue-100">
                      {copy.newSite}
                    </span>
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>

        {isSuperAdmin && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [copy.activeTenants, activeTenantCount, Building2],
              [copy.tenantUsers, tenantUserCount, Users],
              [copy.activeSites, activeSiteCount, Globe2],
              [copy.archived, archivedTenantCount, Archive],
            ].map(([label, value, Icon]) => {
              const StatIcon = Icon as typeof Building2;
              return (
                <div key={label as string} className="rounded-md border bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      {label as string}
                    </p>
                    <StatIcon className="h-4 w-4 text-slate-500" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {value as number}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{isSuperAdmin ? copy.tenants : copy.website}</CardTitle>
              <CardDescription>
                {isSuperAdmin
                  ? copy.tenantsConfigured(tenants.length)
                  : copy.websiteDescription}
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadTenants()}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {copy.refresh}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {copy.loadingTenants}
            </div>
          ) : tenants.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm text-slate-500">{copy.noTenants}</p>
            </div>
          ) : (
            <div className="divide-y">
              {tenants.map((tenant) => {
                const site = tenant.sites.find((item) => item.isPrimary) ?? tenant.sites[0];
                const isEditing = editingTenantId === tenant.id;
                const tenantMemberships = getTenantScopedMemberships(tenant);
                const adminCount = tenantMemberships.filter((member) => member.role === "ADMIN").length;
                const isUsersExpanded = expandedUsersTenantId === tenant.id;
                const isConnectionExpanded = expandedConnectionTenantId === tenant.id;

                return (
                  <div key={tenant.id} className="space-y-4 p-5">
                    <div className="grid gap-5 xl:grid-cols-[minmax(260px,1fr)_minmax(320px,1.3fr)_260px]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-lg font-semibold text-slate-950">
                            {tenant.name}
                          </h2>
                          <Badge variant={statusBadgeVariant(tenant.status) as any}>
                            {copy.statusLabels[tenant.status]}
                          </Badge>
                          {site?.isActive === false && (
                            <Badge variant="secondary">{copy.siteDisabled}</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">/{tenant.slug}</p>
                        {tenant.description && (
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                            {tenant.description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setExpandedUsersTenantId((current) =>
                                current === tenant.id ? null : tenant.id,
                              )
                            }
                          >
                            <Users className="mr-2 h-4 w-4" />
                            {copy.users}
                            <Badge variant="secondary" className="ml-2">
                              {tenantMemberships.length}
                            </Badge>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setExpandedConnectionTenantId((current) =>
                                current === tenant.id ? null : tenant.id,
                              )
                            }
                          >
                            <Server className="mr-2 h-4 w-4" />
                            {copy.connection}
                            <ChevronDown
                              className={`ml-1 h-4 w-4 transition-transform ${
                                isConnectionExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            {copy.publicSite}
                          </p>
                          <p className="mt-2 truncate text-sm font-medium text-slate-900">
                            {site?.publicBaseUrl || copy.notSet}
                          </p>
                          {site?.publicBaseUrl && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="mt-1 h-auto p-0"
                              onClick={() =>
                                window.open(site.publicBaseUrl ?? undefined, "_blank", "noreferrer")
                              }
                            >
                              {copy.openPublic}
                              <ExternalLink className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <div className="rounded-md border bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            {copy.adminSite}
                          </p>
                          <p className="mt-2 truncate text-sm font-medium text-slate-900">
                            {site?.adminBaseUrl || copy.notSet}
                          </p>
                          {site?.adminBaseUrl && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="mt-1 h-auto p-0"
                              onClick={() =>
                                window.open(site.adminBaseUrl ?? undefined, "_blank", "noreferrer")
                              }
                            >
                              {copy.openAdmin}
                              <ExternalLink className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 xl:items-end">
                        <div className="mb-1 text-sm text-slate-600">
                          <span className="font-medium text-slate-950">{adminCount}</span>{" "}
                          {copy.tenantAdminCount(adminCount).replace(String(adminCount), "")}
                        </div>
                        <Button
                          type="button"
                          variant={isEditing ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => (isEditing ? cancelTenantEdit() : startTenantEdit(tenant))}
                        >
                          {isEditing ? <X className="mr-2 h-4 w-4" /> : <Edit2 className="mr-2 h-4 w-4" />}
                          {isEditing ? copy.cancelEdit : copy.editTenant}
                        </Button>
                        {isSuperAdmin && tenant.status !== "ARCHIVED" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={savingLifecycleId === tenant.id}
                            onClick={() => updateTenantLifecycle(tenant, "ARCHIVED")}
                            className="text-red-600 hover:text-red-700"
                          >
                            {savingLifecycleId === tenant.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Archive className="mr-2 h-4 w-4" />
                            )}
                            {copy.archive}
                          </Button>
                        )}
                        {isSuperAdmin && tenant.status === "ARCHIVED" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={savingLifecycleId === tenant.id}
                            onClick={() => updateTenantLifecycle(tenant, "ACTIVE")}
                          >
                            {savingLifecycleId === tenant.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="mr-2 h-4 w-4" />
                            )}
                            {copy.restore}
                          </Button>
                        )}
                      </div>
                    </div>

                    {isConnectionExpanded && (
                      <div className="grid gap-3 rounded-md border bg-slate-50 p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            {copy.publicWebsiteEnvironment}
                          </p>
                          <pre className="mt-2 overflow-x-auto rounded-md border bg-white p-3 text-xs leading-5 text-slate-700">
                            {buildPublicEnv(tenant)}
                          </pre>
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {copy.envHint}
                          </p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => copyTenantValue(copy.tenantId, tenant.id)}
                              className="flex items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                            >
                              <span className="truncate">ID: {tenant.id}</span>
                              <Copy className="h-3.5 w-3.5 flex-shrink-0" />
                            </button>
                            <button
                              type="button"
                              onClick={() => copyTenantValue(copy.tenantSlug, tenant.slug)}
                              className="flex items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                            >
                              <span className="truncate">{copy.currentSlug}: {tenant.slug}</span>
                              <Copy className="h-3.5 w-3.5 flex-shrink-0" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyTenantValue(copy.publicWebsiteEnvironmentLabel, buildPublicEnv(tenant))
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            {copy.copyEnv}
                          </Button>
                        </div>
                      </div>
                    )}

                    {isUsersExpanded && (
                      <div className="rounded-md border bg-white">
                        <div className="flex flex-col gap-2 border-b bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="flex items-center gap-2 font-semibold text-slate-950">
                              <Users className="h-4 w-4 text-blue-600" />
                              {copy.tenantUsersTitle}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {copy.usersInTenant(tenantMemberships.length, tenant.name)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="w-fit bg-white">
                              {tenant.slug}
                            </Badge>
                            {hasPermission(Permission.CREATE_USER) && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => openCreateTenantUser(tenant)}
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                {copy.addUser}
                              </Button>
                            )}
                          </div>
                        </div>

                        {tenantMemberships.length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-500">
                            {copy.noUsersAssigned}
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-sm">
                              <thead>
                                <tr className="border-b text-left text-xs font-semibold uppercase text-slate-500">
                                  <th className="px-4 py-3">{copy.tableUser}</th>
                                  <th className="px-4 py-3">{copy.tableEmail}</th>
                                  <th className="px-4 py-3">{copy.tenantRole}</th>
                                  <th className="px-4 py-3">{copy.platformRole}</th>
                                  <th className="px-4 py-3">{copy.status}</th>
                                  <th className="px-4 py-3">{copy.twoFactor}</th>
                                  <th className="px-4 py-3">{copy.created}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tenantMemberships.map((membership) => (
                                  <tr key={membership.id} className="border-b last:border-0">
                                    <td className="px-4 py-3">
                                      <p className="font-medium text-slate-950">
                                        {membership.user.name}
                                      </p>
                                      <p className="text-xs text-slate-500">ID: {membership.user.id}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2 text-slate-700">
                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                        {membership.user.email}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Badge variant="secondary" className="gap-1">
                                        <Shield className="h-3 w-3" />
                                        {copy.roleLabels[membership.role as keyof typeof copy.roleLabels] ?? membership.role}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Badge variant="outline">{copy.roleLabels[membership.user.role as keyof typeof copy.roleLabels] ?? membership.user.role}</Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap gap-1">
                                        <Badge variant={membership.user.isActive ? "default" : "secondary"}>
                                          {membership.user.isActive ? copy.accountActive : copy.accountInactive}
                                        </Badge>
                                        {!membership.isActive && (
                                          <Badge variant="secondary">{copy.membershipInactive}</Badge>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-col gap-2">
                                        <Badge
                                          variant={membership.user.twoFactorEnabled ? "outline" : "secondary"}
                                          className="w-fit"
                                        >
                                          {membership.user.twoFactorEnabled ? copy.enabled : copy.needsSetup}
                                        </Badge>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="w-fit"
                                          disabled={savingTwoFactorUserId === membership.user.id}
                                          onClick={() => void resetUserTwoFactor(membership.user)}
                                        >
                                          {savingTwoFactorUserId === membership.user.id ? (
                                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <KeyRound className="mr-2 h-3.5 w-3.5" />
                                          )}
                                          {copy.showQrAgain}
                                        </Button>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                      {new Date(membership.user.createdAt).toLocaleDateString(locale === "km" ? "km-KH" : undefined)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {isEditing && (
                      <form className="rounded-md border bg-slate-50 p-4" onSubmit={updateTenant}>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-name-${tenant.id}`}>{copy.tenantName}</Label>
                            <Input
                              id={`edit-name-${tenant.id}`}
                              value={editTenantForm.name ?? ""}
                              onChange={(event) =>
                                setEditTenantForm((current) => ({
                                  ...current,
                                  name: event.target.value,
                                  slug: shouldSyncSlugFromName(current.slug, current.name)
                                    ? toSlug(event.target.value)
                                    : current.slug,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-slug-${tenant.id}`}>{copy.slug}</Label>
                            <Input
                              id={`edit-slug-${tenant.id}`}
                              value={editTenantForm.slug ?? ""}
                              onChange={(event) =>
                                setEditTenantForm((current) => ({
                                  ...current,
                                  slug: toSlug(event.target.value),
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-status-${tenant.id}`}>{copy.status}</Label>
                            <select
                              id={`edit-status-${tenant.id}`}
                              value={editTenantForm.status ?? "ACTIVE"}
                              onChange={(event) =>
                                setEditTenantForm((current) => ({
                                  ...current,
                                  status: event.target.value as TenantStatus,
                                }))
                              }
                              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                              {tenantStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {copy.statusLabels[status]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-public-${tenant.id}`}>{copy.publicUrl}</Label>
                            <Input
                              id={`edit-public-${tenant.id}`}
                              value={editTenantForm.publicBaseUrl ?? ""}
                              onChange={(event) =>
                                setEditTenantForm((current) => ({
                                  ...current,
                                  publicBaseUrl: event.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-admin-${tenant.id}`}>{copy.adminUrl}</Label>
                            <Input
                              id={`edit-admin-${tenant.id}`}
                              value={editTenantForm.adminBaseUrl ?? ""}
                              onChange={(event) =>
                                setEditTenantForm((current) => ({
                                  ...current,
                                  adminBaseUrl: event.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-locale-${tenant.id}`}>{copy.primaryLocale}</Label>
                            <Input
                              id={`edit-locale-${tenant.id}`}
                              value={editTenantForm.primaryLocale ?? "en"}
                              onChange={(event) =>
                                setEditTenantForm((current) => ({
                                  ...current,
                                  primaryLocale: event.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label htmlFor={`edit-description-${tenant.id}`}>{copy.formDescription}</Label>
                          <Textarea
                            id={`edit-description-${tenant.id}`}
                            value={editTenantForm.description ?? ""}
                            onChange={(event) =>
                              setEditTenantForm((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={editTenantForm.isActive ?? true}
                            onChange={(event) =>
                              setEditTenantForm((current) => ({
                                ...current,
                                isActive: event.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          {copy.enableTenantSite}
                        </label>

                        <div className="mt-4 flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={cancelTenantEdit}>
                            {copy.cancel}
                          </Button>
                          <Button type="submit" disabled={savingEdit}>
                            {savingEdit ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-2 h-4 w-4" />
                            )}
                            {copy.saveTenant}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={tenantDialogOpen} onOpenChange={setTenantDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{copy.createTenantWebsite}</DialogTitle>
            <DialogDescription>
              {copy.createTenantDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={createTenant}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenant-name">{copy.tenantName}</Label>
                <Input
                  id="tenant-name"
                  value={tenantForm.name}
                  onChange={(event) =>
                    setTenantForm((current) => ({
                      ...current,
                      name: event.target.value,
                      slug: shouldSyncSlugFromName(current.slug, current.name)
                        ? toSlug(event.target.value)
                        : current.slug,
                    }))
                  }
                  placeholder="Pulse Business"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-slug">{copy.slug}</Label>
                <Input
                  id="tenant-slug"
                  value={tenantForm.slug ?? ""}
                  onChange={(event) =>
                    setTenantForm((current) => ({
                      ...current,
                      slug: toSlug(event.target.value),
                    }))
                  }
                  placeholder="pulse-business"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant-description">{copy.formDescription}</Label>
              <Textarea
                id="tenant-description"
                value={tenantForm.description ?? ""}
                onChange={(event) =>
                  setTenantForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="public-url">{copy.publicUrl}</Label>
                <Input
                  id="public-url"
                  value={tenantForm.publicBaseUrl ?? ""}
                  onChange={(event) =>
                    setTenantForm((current) => ({
                      ...current,
                      publicBaseUrl: event.target.value,
                    }))
                  }
                  placeholder="http://localhost:3000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-url">{copy.adminUrl}</Label>
                <Input
                  id="admin-url"
                  value={tenantForm.adminBaseUrl ?? ""}
                  onChange={(event) =>
                    setTenantForm((current) => ({
                      ...current,
                      adminBaseUrl: event.target.value,
                    }))
                  }
                  placeholder="http://localhost:3001"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTenantDialogOpen(false)}>
                {copy.cancel}
              </Button>
              <Button type="submit" disabled={savingTenant}>
                {savingTenant ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {copy.createTenant}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.createTenantUser}</DialogTitle>
            <DialogDescription>
              {copy.createTenantUserDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={createTenantAdmin}>
            <div className="space-y-2">
              <Label>{copy.tenant}</Label>
              <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm">
                <p className="font-medium text-slate-950">
                  {selectedUserTenant?.name || copy.selectFromTenantUsers}
                </p>
                {selectedUserTenant && (
                  <p className="text-xs text-slate-500">/{selectedUserTenant.slug}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-name">{copy.name}</Label>
              <Input
                id="admin-name"
                value={adminForm.name}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">{copy.email}</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminForm.email}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-role">{copy.role}</Label>
              <select
                id="admin-role"
                value={adminForm.role ?? "AUTHOR"}
                onChange={(event) =>
                  setAdminForm((current) => ({
                    ...current,
                    role: event.target.value as "ADMIN" | "EDITOR" | "AUTHOR",
                  }))
                }
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="ADMIN">{copy.admin}</option>
                <option value="EDITOR">{copy.editor}</option>
                <option value="AUTHOR">{copy.author}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">{copy.password}</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminForm.password ?? ""}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder={copy.passwordPlaceholder}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdminDialogOpen(false)}>
                {copy.cancel}
              </Button>
              <Button type="submit" disabled={savingAdmin}>
                {savingAdmin ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                {copy.createUser}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        open={confirmation.open}
        onOpenChange={(open) =>
          setConfirmation((current) => ({ ...current, open }))
        }
        title={confirmation.title}
        description={confirmation.description}
        confirmText={confirmation.confirmText}
        cancelText={copy.cancel}
        variant={confirmation.variant}
        onConfirm={() => {
          void confirmation.onConfirm();
        }}
      />
      </main>
    </PermissionGuard>
  );
}
