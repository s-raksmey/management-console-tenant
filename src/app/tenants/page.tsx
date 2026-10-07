"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Archive,
  Building2,
  Check,
  Copy,
  Edit2,
  ExternalLink,
  Filter,
  KeyRound,
  Loader2,
  Mail,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Shield,
  UserPlus,
  Users,
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
import { useInitialPageReady } from "@/lib/use-initial-page-ready";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToastHelpers } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { getTenantDisplayName } from "@/lib/tenant-display";
import { displaySiteUrl, isLoopbackSiteUrl } from "@/lib/site-url";
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
    loadFailed: "Failed to load sub-tenants.",
    tenantNameRequired: "Sub-tenant name is required.",
    createTenantTitle: "Create Sub-tenant Website?",
    createTenantDescription: (name: string) => `Create sub-tenant website "${name}"?`,
    createTenant: "Create Sub-tenant",
    tenantCreated: "Sub-tenant Created",
    tenantCreatedDescription: (name: string) => `${name} is ready.`,
    createTenantFailed: "Failed to create sub-tenant.",
    tenantUserRequired: "Sub-tenant, name, and email are required.",
    createTenantUserTitle: "Create Sub-tenant User?",
    createTenantUserDescription: (name: string, role?: string | null) =>
      `Create ${name} as a sub-tenant ${role?.toLowerCase()}?`,
    createUser: "Create User",
    tenantUserCreated: "Sub-tenant User Created",
    tenantUserCreatedDescription: "The user can now access this sub-tenant.",
    createTenantUserFailed: "Failed to create sub-tenant user.",
    resetTwoFactorTitle: "Reset Two-Factor Setup?",
    resetTwoFactorDescription: (name: string) =>
      `Reset two-factor setup for "${name}"? They will need to scan a new QR code on next login.`,
    resetTwoFactor: "Reset Two-Factor",
    resetTwoFactorFailed: "Failed to reset two-factor setup.",
    resetTwoFactorSuccess: "Two-Factor Reset",
    saveTenantTitle: "Save Sub-tenant Changes?",
    saveTenantDescription: (name: string) => `Save changes to sub-tenant "${name}"?`,
    saveTenant: "Save Sub-tenant",
    tenantUpdated: "Sub-tenant Updated",
    tenantUpdatedDescription: (name: string) => `${name} has been updated.`,
    updateTenantFailed: "Failed to update sub-tenant.",
    archiveTenantTitle: "Archive Sub-tenant?",
    restoreTenantTitle: "Restore Sub-tenant?",
    archiveTenantDescription: (name: string) => `Archive "${name}"?`,
    restoreTenantDescription: (name: string) => `Restore "${name}"?`,
    archiveTenant: "Archive Sub-tenant",
    restoreTenant: "Restore Sub-tenant",
    tenantArchived: "Sub-tenant Archived",
    tenantRestored: "Sub-tenant Restored",
    tenantArchivedDescription: (name: string) => `${name} is hidden from public/admin access.`,
    tenantRestoredDescription: (name: string) => `${name} is active again.`,
    tenantLifecycleFailed: (action: string) => `Failed to ${action} sub-tenant.`,
    archiveAction: "archive",
    restoreAction: "restore",
    eyebrowSuper: "Main Tenant Control",
    eyebrowTenant: "Website Control",
    titleSuper: "Sub-tenant Websites",
    titleTenant: "Current Website",
    descriptionSuper: "Create websites, set production domains, and manage users from the main tenant.",
    descriptionTenant: "Manage this sub-tenant admin website and public website identity.",
    createTenantWebsite: "Create Sub-tenant",
    newSite: "New admin and public site",
    searchPlaceholder: "Search name, slug, or domain",
    filter: "Filter",
    allStatuses: "All statuses",
    columnName: "Sub-tenant",
    columnDomain: "Public domain",
    columnAdminDomain: "Admin domain",
    columnUsers: "Users",
    columnStatus: "Status",
    columnActions: "Actions",
    localSetup: "Local setup",
    openUsers: "Users",
    noSearchResults: "No sub-tenants match this search.",
    summaryLine: (active: number, users: number, archived: number) =>
      `${active} active · ${users} users · ${archived} archived`,
    activeTenants: "Active Sub-tenants",
    tenantUsers: "Sub-tenant Users",
    activeSites: "Active Sites",
    archived: "Archived",
    tenants: "Sub-tenants",
    website: "Website",
    tenantsConfigured: (count: number) => `${count} sub-tenant website${count !== 1 ? "s" : ""} configured`,
    websiteDescription: "Update the name, locale, and active state for this sub-tenant",
    websiteDescriptionSuper: "Set production domains, locale, and whether this site is active.",
    websiteDescriptionTenant: "Update the name, locale, and active state. Super Admin sets production domains.",
    loadingTenants: "Loading sub-tenants...",
    noTenants: "No sub-tenants yet.",
    createTenantDialogDescription:
      "Create a clean sub-tenant admin and public website. Set the production public domain here, or leave it empty for local development.",
    tenantName: "Sub-tenant Name",
    slug: "Slug",
    formDescription: "Description",
    publicUrl: "Public website domain",
    adminUrl: "Admin console URL",
    publicUrlPlaceholder: "https://news.example.com",
    adminUrlPlaceholder: "https://admin.news.example.com",
    publicUrlHint:
      "Required in production. Point DNS for this host at the public website deploy. Leave empty locally — local uses the sub-tenant ID under Local setup.",
    adminUrlHint:
      "Optional. Use only if this sub-tenant has its own admin host. A shared management console is fine.",
    localUrlIgnored: "A local address was stored and is ignored. Enter the production domain or leave empty.",
    domainsSetBySuperAdmin: "Production domains are set by Super Admin on this Tenants page.",
    createTenantUser: "Create Sub-tenant User",
    createTenantUserDialogDescription: "Create a user directly inside this sub-tenant and choose their role.",
    tenant: "Sub-tenant",
    selectFromTenantUsers: "Select from a sub-tenant's Users panel",
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
    cancelEdit: "Cancel Edit",
    editTenant: "Edit Sub-tenant",
    archive: "Archive",
    restore: "Restore",
    publicWebsiteEnvironment: "Public Website Environment",
    envHint: "Local public website uses this sub-tenant ID. Production uses the public website domain Super Admin sets above — point DNS at the public web deploy.",
    tenantId: "Sub-tenant ID",
    tenantSlug: "Sub-tenant slug",
    publicWebsiteEnvironmentLabel: "Public website environment",
    currentSlug: "Current slug",
    copyEnv: "Copy Env",
    tenantUsersTitle: "Sub-tenant Users",
    usersInTenant: (count: number, tenantName: string) => `${count} user${count !== 1 ? "s" : ""} in ${tenantName}`,
    addUser: "Add User",
    noUsersAssigned: "No users are assigned to this sub-tenant yet.",
    passwordRequired: "Password is required for new users (min 8 characters).",
    tableUser: "User",
    tableEmail: "Email",
    tenantRole: "Sub-tenant Role",
    mainTenantRole: "Main Tenant Role",
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
    enableTenantSite: "Enable this sub-tenant public/admin site",
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
    descriptionSuper: "បង្កើតគេហទំព័រ កំណត់ដែនផលិតកម្ម និងគ្រប់គ្រងអ្នកប្រើពីអ្នកជួលមេ។",
    descriptionTenant: "គ្រប់គ្រងអត្តសញ្ញាណគេហទំព័រផ្នែកគ្រប់គ្រង និងគេហទំព័រសាធារណៈនេះ។",
    createTenantWebsite: "បង្កើតគេហទំព័ររង",
    newSite: "គេហទំព័រផ្នែកគ្រប់គ្រង និងសាធារណៈថ្មី",
    searchPlaceholder: "ស្វែងរកឈ្មោះ ស្លាក URL ឬដែន",
    filter: "តម្រង",
    allStatuses: "ស្ថានភាពទាំងអស់",
    columnName: "គេហទំព័ររង",
    columnDomain: "ដែនសាធារណៈ",
    columnAdminDomain: "ដែនផ្ទាំងគ្រប់គ្រង",
    columnUsers: "អ្នកប្រើ",
    columnStatus: "ស្ថានភាព",
    columnActions: "សកម្មភាព",
    localSetup: "ការដំឡើងមូលដ្ឋាន",
    openUsers: "អ្នកប្រើ",
    noSearchResults: "មិនមានគេហទំព័ររងដែលត្រូវនឹងការស្វែងរកនេះទេ។",
    summaryLine: (active: number, users: number, archived: number) =>
      `${active} សកម្ម · ${users} អ្នកប្រើ · ${archived} ប័ណ្ណសារ`,
    activeTenants: "គេហទំព័រសកម្ម",
    tenantUsers: "អ្នកប្រើគេហទំព័រ",
    activeSites: "តំបន់បណ្តាញសកម្ម",
    archived: "បានដាក់ប័ណ្ណសារ",
    tenants: "គេហទំព័រ",
    website: "គេហទំព័រ",
    tenantsConfigured: (count: number) => `បានកំណត់គេហទំព័រ ${count}`,
    websiteDescription: "កែឈ្មោះ ភាសាចម្បង និងស្ថានភាពសកម្មរបស់គេហទំព័រនេះ",
    websiteDescriptionSuper: "កំណត់ដែនផលិតកម្ម ភាសា និងថាតើគេហទំព័រនេះសកម្មដែរឬទេ។",
    websiteDescriptionTenant: "កែឈ្មោះ ភាសា និងស្ថានភាពសកម្ម។ Super Admin ជាអ្នកកំណត់ដែនផលិតកម្ម។",
    loadingTenants: "កំពុងផ្ទុកគេហទំព័រ...",
    noTenants: "មិនទាន់មានគេហទំព័រ។",
    createTenantDialogDescription:
      "បង្កើតគេហទំព័រផ្នែកគ្រប់គ្រង និងសាធារណៈថ្មី។ កំណត់ដែនសាធារណៈផលិតកម្មនៅទីនេះ ឬទុកទទេសម្រាប់ម៉ាស៊ីនមូលដ្ឋាន។",
    tenantName: "ឈ្មោះគេហទំព័រ",
    slug: "ស្លាក URL",
    formDescription: "ពណ៌នា",
    publicUrl: "ដែនគេហទំព័រសាធារណៈ",
    adminUrl: "URL ផ្ទាំងគ្រប់គ្រង",
    publicUrlPlaceholder: "https://news.example.com",
    adminUrlPlaceholder: "https://admin.news.example.com",
    publicUrlHint:
      "ត្រូវការនៅផលិតកម្ម។ តម្រង់ DNS របស់ host នេះទៅការដាក់ឱ្យប្រើគេហទំព័រសាធារណៈ។ ទុកទទេនៅក្នុងម៉ាស៊ីនមូលដ្ឋាន — ម៉ាស៊ីនមូលដ្ឋានប្រើលេខសម្គាល់គេហទំព័រក្នុង Local setup។",
    adminUrlHint:
      "ជាជម្រើស។ ប្រើតែពេលគេហទំព័ររងនេះមាន host ផ្នែកគ្រប់គ្រងផ្ទាល់ខ្លួន។ ផ្ទាំងគ្រប់គ្រងរួមគ្នាក៏បាន។",
    localUrlIgnored: "អាសយដ្ឋានមូលដ្ឋានត្រូវបានរក្សាទុក ហើយមិនប្រើ។ បញ្ចូលដែនផលិតកម្ម ឬទុកទទេ។",
    domainsSetBySuperAdmin: "ដែនផលិតកម្មត្រូវបានកំណត់ដោយ Super Admin នៅទំព័រ Tenants នេះ។",
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
    cancelEdit: "បោះបង់ការកែ",
    editTenant: "កែគេហទំព័រ",
    archive: "ដាក់ប័ណ្ណសារ",
    restore: "ស្ដារ",
    publicWebsiteEnvironment: "បរិស្ថានគេហទំព័រសាធារណៈ",
    envHint: "គេហទំព័រសាធារណៈក្នុងម៉ាស៊ីនមូលដ្ឋានប្រើលេខសម្គាល់គេហទំព័រនេះ។ ផលិតកម្មប្រើដែនគេហទំព័រសាធារណៈដែល Super Admin កំណត់ខាងលើ — តម្រង់ DNS ទៅការដាក់ឱ្យប្រើគេហទំព័រសាធារណៈ។",
    tenantId: "លេខសម្គាល់គេហទំព័រ",
    tenantSlug: "ស្លាក URL គេហទំព័រ",
    publicWebsiteEnvironmentLabel: "បរិស្ថានគេហទំព័រសាធារណៈ",
    currentSlug: "ស្លាក URL បច្ចុប្បន្ន",
    copyEnv: "ចម្លងការកំណត់បរិស្ថាន",
    tenantUsersTitle: "អ្នកប្រើគេហទំព័រ",
    usersInTenant: (count: number, tenantName: string) => `${count} អ្នកប្រើ ក្នុង ${tenantName}`,
    addUser: "បន្ថែមអ្នកប្រើ",
    noUsersAssigned: "មិនទាន់មានអ្នកប្រើត្រូវបានផ្តល់ទៅគេហទំព័រនេះទេ។",
    passwordRequired: "ត្រូវការពាក្យសម្ងាត់សម្រាប់អ្នកប្រើថ្មី (យ៉ាងតិច 8 តួ)។",
    tableUser: "អ្នកប្រើ",
    tableEmail: "អ៊ីមែល",
    tenantRole: "តួនាទីគេហទំព័រ",
    mainTenantRole: "តួនាទីអ្នកជួលមេ",
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

function formatSiteHost(url?: string | null) {
  const displayed = displaySiteUrl(url);
  if (!displayed) return "";
  try {
    return new URL(displayed).host;
  } catch {
    return displayed.replace(/^https?:\/\//i, "");
  }
}

function DomainLink({
  url,
  emptyLabel,
}: {
  url?: string | null;
  emptyLabel: string;
}) {
  const host = formatSiteHost(url);
  const href = displaySiteUrl(url);

  if (!host || !href) {
    return <span className="text-sm text-slate-400">{emptyLabel}</span>;
  }

  return (
    <button
      type="button"
      className="inline-flex max-w-[220px] items-center gap-1 truncate text-left text-sm text-blue-600 hover:underline dark:text-blue-400"
      onClick={() => window.open(href, "_blank", "noreferrer")}
    >
      <span className="truncate">{host}</span>
      <ExternalLink className="h-3 w-3 shrink-0" />
    </button>
  );
}

function getPrimarySite(tenant: Tenant) {
  return tenant.sites.find((item) => item.isPrimary) ?? tenant.sites[0];
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
  const { activeTenant, refreshTenants } = useTenant();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const showErrorRef = useRef(showError);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const pageReady = useInitialPageReady(loading);
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
  const [usersTenantId, setUsersTenantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TenantStatus>("ALL");
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
  const selectedUserTenant = tenants.find((tenant) => tenant.id === adminForm.tenantId);
  const editingTenant = tenants.find((tenant) => tenant.id === editingTenantId) ?? null;
  const editingSite = editingTenant ? getPrimarySite(editingTenant) : undefined;
  const usersTenant = tenants.find((tenant) => tenant.id === usersTenantId) ?? null;
  const usersMemberships = usersTenant ? getTenantScopedMemberships(usersTenant) : [];
  const filteredTenants = tenants.filter((tenant) => {
    if (statusFilter !== "ALL" && tenant.status !== statusFilter) return false;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const site = getPrimarySite(tenant);
    return [tenant.name, tenant.slug, tenant.description, site?.publicBaseUrl, site?.adminBaseUrl, tenant.id]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

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

    if (!adminForm.password?.trim() || adminForm.password.trim().length < 8) {
      showError(copy.validationError, copy.passwordRequired);
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
      if (adminForm.tenantId) {
        setUsersTenantId(adminForm.tenantId);
      }
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
    if (!hasPermission(Permission.UPDATE_USER)) return;
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
      publicBaseUrl: displaySiteUrl(site?.publicBaseUrl),
      adminBaseUrl: displaySiteUrl(site?.adminBaseUrl),
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
        name: tenantName,
        slug: editTenantForm.slug?.trim()
          ? toSlug(editTenantForm.slug)
          : toSlug(tenantName),
        description: editTenantForm.description?.trim() || null,
        primaryLocale: editTenantForm.primaryLocale?.trim() || "en",
        status: editTenantForm.status,
        isActive: editTenantForm.isActive,
        ...(isSuperAdmin
          ? {
              publicBaseUrl: editTenantForm.publicBaseUrl?.trim() || null,
              adminBaseUrl: editTenantForm.adminBaseUrl?.trim() || null,
            }
          : {}),
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

  if (!pageReady) {
    return null;
  }

  return (
    <PermissionGuard permissions={[Permission.SYSTEM_ADMINISTRATION, Permission.UPDATE_SETTINGS]} showError>
      <main className="space-y-6">
        <div
          className="grid w-full grid-cols-[minmax(0,1fr)_max-content] items-start gap-4"
          style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) max-content", alignItems: "start", width: "100%" }}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              {isSuperAdmin ? copy.eyebrowSuper : copy.eyebrowTenant}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
              {isSuperAdmin
                ? copy.titleSuper
                : getTenantDisplayName(activeTenant || tenants[0], copy.titleTenant)}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {isSuperAdmin ? copy.descriptionSuper : copy.descriptionTenant}
            </p>
            {isSuperAdmin && tenants.length > 0 && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {copy.summaryLine(activeTenantCount, tenantUserCount, archivedTenantCount)}
              </p>
            )}
          </div>
          {isSuperAdmin && (
            <Button type="button" className="w-max shrink-0 justify-self-end" onClick={() => setTenantDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {copy.createTenantWebsite}
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="space-y-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <CardTitle>{isSuperAdmin ? copy.tenants : copy.website}</CardTitle>
              <CardDescription>
                {isSuperAdmin
                  ? copy.tenantsConfigured(tenants.length)
                  : copy.websiteDescriptionTenant}
              </CardDescription>
            </div>
            {isSuperAdmin && (
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <Filter className="h-4 w-4" />
                  <span>{copy.filter}</span>
                </div>
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={copy.searchPlaceholder}
                    className="h-9 pl-9"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as "ALL" | TenantStatus)}
                >
                  <SelectTrigger className="h-9 w-full sm:w-[180px]">
                    <SelectValue placeholder={copy.allStatuses} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{copy.allStatuses}</SelectItem>
                    {tenantStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {copy.statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
            ) : filteredTenants.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">{copy.noSearchResults}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.columnName}</TableHead>
                    <TableHead>{copy.columnDomain}</TableHead>
                    <TableHead>{copy.columnAdminDomain}</TableHead>
                    <TableHead className="hidden sm:table-cell">{copy.columnUsers}</TableHead>
                    <TableHead>{copy.columnStatus}</TableHead>
                    <TableHead className="w-14 text-right">
                      <span className="sr-only">{copy.columnActions}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => {
                    const site = getPrimarySite(tenant);
                    const membershipCount = getTenantScopedMemberships(tenant).length;

                    return (
                      <TableRow key={tenant.id}>
                        <TableCell className="max-w-[260px]">
                          <p className="truncate font-medium text-slate-900 dark:text-slate-50">
                            {tenant.name}
                          </p>
                          <p className="truncate text-xs text-slate-500">/{tenant.slug}</p>
                        </TableCell>
                        <TableCell>
                          <DomainLink url={site?.publicBaseUrl} emptyLabel={copy.notSet} />
                        </TableCell>
                        <TableCell>
                          <DomainLink url={site?.adminBaseUrl} emptyLabel={copy.notSet} />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <button
                            type="button"
                            className="text-sm text-slate-700 hover:underline dark:text-slate-300"
                            onClick={() => setUsersTenantId(tenant.id)}
                          >
                            {membershipCount}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant={statusBadgeVariant(tenant.status) as "outline" | "secondary" | "destructive"}>
                              {copy.statusLabels[tenant.status]}
                            </Badge>
                            {site?.isActive === false && (
                              <Badge variant="secondary">{copy.siteDisabled}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">{copy.columnActions}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startTenantEdit(tenant)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                {copy.editTenant}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setUsersTenantId(tenant.id)}>
                                <Users className="mr-2 h-4 w-4" />
                                {copy.openUsers}
                              </DropdownMenuItem>
                              {hasPermission(Permission.CREATE_USER) && (
                                <DropdownMenuItem onClick={() => openCreateTenantUser(tenant)}>
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  {copy.addUser}
                                </DropdownMenuItem>
                              )}
                              {isSuperAdmin && tenant.status !== "ARCHIVED" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => void updateTenantLifecycle(tenant, "ARCHIVED")}
                                  >
                                    <Archive className="mr-2 h-4 w-4" />
                                    {copy.archive}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {isSuperAdmin && tenant.status === "ARCHIVED" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => void updateTenantLifecycle(tenant, "ACTIVE")}
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    {copy.restore}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={Boolean(editingTenantId)}
          onOpenChange={(open) => {
            if (!open) cancelTenantEdit();
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{copy.editTenant}</DialogTitle>
              <DialogDescription>
                {isSuperAdmin ? copy.websiteDescriptionSuper : copy.websiteDescriptionTenant}
              </DialogDescription>
            </DialogHeader>
            {editingTenant && (
              <form className="space-y-5" onSubmit={updateTenant}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">{copy.tenantName}</Label>
                    <Input
                      id="edit-name"
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
                    <Label htmlFor="edit-slug">{copy.slug}</Label>
                    <Input
                      id="edit-slug"
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
                    <Label htmlFor="edit-status">{copy.status}</Label>
                    <select
                      id="edit-status"
                      value={editTenantForm.status ?? "ACTIVE"}
                      onChange={(event) =>
                        setEditTenantForm((current) => ({
                          ...current,
                          status: event.target.value as TenantStatus,
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    >
                      {tenantStatuses.map((status) => (
                        <option key={status} value={status}>
                          {copy.statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-locale">{copy.primaryLocale}</Label>
                    <Input
                      id="edit-locale"
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

                <div className="space-y-2">
                  <Label htmlFor="edit-description">{copy.formDescription}</Label>
                  <Textarea
                    id="edit-description"
                    value={editTenantForm.description ?? ""}
                    onChange={(event) =>
                      setEditTenantForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>

                {isSuperAdmin ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-public">{copy.publicUrl}</Label>
                      <Input
                        id="edit-public"
                        value={editTenantForm.publicBaseUrl ?? ""}
                        onChange={(event) =>
                          setEditTenantForm((current) => ({
                            ...current,
                            publicBaseUrl: event.target.value,
                          }))
                        }
                        placeholder={copy.publicUrlPlaceholder}
                      />
                      {(isLoopbackSiteUrl(editingSite?.publicBaseUrl) ||
                        isLoopbackSiteUrl(editTenantForm.publicBaseUrl)) && (
                        <p className="text-xs text-amber-700 dark:text-amber-400">{copy.localUrlIgnored}</p>
                      )}
                      <p className="text-xs text-slate-500">{copy.publicUrlHint}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-admin">{copy.adminUrl}</Label>
                      <Input
                        id="edit-admin"
                        value={editTenantForm.adminBaseUrl ?? ""}
                        onChange={(event) =>
                          setEditTenantForm((current) => ({
                            ...current,
                            adminBaseUrl: event.target.value,
                          }))
                        }
                        placeholder={copy.adminUrlPlaceholder}
                      />
                      <p className="text-xs text-slate-500">{copy.adminUrlHint}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{copy.domainsSetBySuperAdmin}</p>
                )}

                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editTenantForm.isActive ?? true}
                    onChange={(event) =>
                      setEditTenantForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  {copy.enableTenantSite}
                </label>

                {isSuperAdmin && (
                  <div className="space-y-2 rounded-md border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-sm font-medium">{copy.localSetup}</p>
                    <pre className="overflow-x-auto rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                      {buildPublicEnv(editingTenant)}
                    </pre>
                    <p className="text-xs text-slate-500">{copy.envHint}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyTenantValue(copy.tenantId, editingTenant.id)}
                      >
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        {copy.tenantId}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyTenantValue(copy.publicWebsiteEnvironmentLabel, buildPublicEnv(editingTenant))
                        }
                      >
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        {copy.copyEnv}
                      </Button>
                    </div>
                  </div>
                )}

                <DialogFooter>
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
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(usersTenant)}
          onOpenChange={(open) => {
            if (!open) setUsersTenantId(null);
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{copy.tenantUsersTitle}</DialogTitle>
              <DialogDescription>
                {usersTenant
                  ? copy.usersInTenant(usersMemberships.length, usersTenant.name)
                  : copy.users}
              </DialogDescription>
            </DialogHeader>
            {usersTenant && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  {hasPermission(Permission.CREATE_USER) && (
                    <Button type="button" size="sm" onClick={() => openCreateTenantUser(usersTenant)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {copy.addUser}
                    </Button>
                  )}
                </div>
                {usersMemberships.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">{copy.noUsersAssigned}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{copy.tableUser}</TableHead>
                        <TableHead>{copy.tableEmail}</TableHead>
                        <TableHead>{copy.tenantRole}</TableHead>
                        <TableHead>{copy.status}</TableHead>
                        <TableHead>{copy.twoFactor}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersMemberships.map((membership) => (
                        <TableRow key={membership.id}>
                          <TableCell>
                            <p className="font-medium">{membership.user.name}</p>
                            <p className="text-xs text-slate-500">
                              {copy.roleLabels[membership.user.role as keyof typeof copy.roleLabels] ??
                                membership.user.role}
                            </p>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-2 text-sm">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {membership.user.email}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="gap-1">
                              <Shield className="h-3 w-3" />
                              {copy.roleLabels[membership.role as keyof typeof copy.roleLabels] ??
                                membership.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={membership.user.isActive ? "default" : "secondary"}>
                              {membership.user.isActive ? copy.accountActive : copy.accountInactive}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-start gap-2">
                              <Badge
                                variant={membership.user.twoFactorEnabled ? "outline" : "secondary"}
                              >
                                {membership.user.twoFactorEnabled ? copy.enabled : copy.needsSetup}
                              </Badge>
                              {hasPermission(Permission.UPDATE_USER) ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
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
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={tenantDialogOpen} onOpenChange={setTenantDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{copy.createTenantWebsite}</DialogTitle>
              <DialogDescription>{copy.createTenantDialogDescription}</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={createTenant}>
              <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="grid gap-4 sm:grid-cols-2">
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
                    placeholder={copy.publicUrlPlaceholder}
                  />
                  <p className="text-xs text-slate-500">{copy.publicUrlHint}</p>
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
                    placeholder={copy.adminUrlPlaceholder}
                  />
                  <p className="text-xs text-slate-500">{copy.adminUrlHint}</p>
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
              <DialogDescription>{copy.createTenantUserDialogDescription}</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={createTenantAdmin}>
              <div className="space-y-2">
                <Label>{copy.tenant}</Label>
                <div className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                  <p className="font-medium">{selectedUserTenant?.name || copy.selectFromTenantUsers}</p>
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
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
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
                  required
                  minLength={8}
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
          onOpenChange={(open) => setConfirmation((current) => ({ ...current, open }))}
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
