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

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function statusBadgeVariant(status: TenantStatus) {
  if (status === "ACTIVE") return "outline";
  if (status === "SUSPENDED") return "secondary";
  return "destructive";
}

export default function TenantsPage() {
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

  const publicApiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql";

  const activeTenantCount = tenants.filter((tenant) => tenant.status === "ACTIVE").length;
  const archivedTenantCount = tenants.filter((tenant) => tenant.status === "ARCHIVED").length;
  const tenantUserCount = tenants.reduce(
    (total, tenant) => total + tenant.memberships.length,
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
      showSuccess("Copied", `${label} copied to clipboard.`);
    } catch {
      showError("Copy Failed", `Could not copy ${label}.`);
    }
  };

  const buildPublicEnv = (tenant: Tenant) =>
    [
      `NEXT_PUBLIC_API_URL=${publicApiUrl}`,
      `NEXT_PUBLIC_TENANT_ID=${tenant.id}`,
      `NEXT_PUBLIC_TENANT_SLUG=${tenant.slug}`,
    ].join("\n");

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
        "Error",
        error?.response?.errors?.[0]?.message || "Failed to load tenants.",
      );
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  const createTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!tenantForm.name.trim()) {
      showError("Validation Error", "Tenant name is required.");
      return;
    }

    if (!window.confirm(`Create tenant website "${tenantForm.name.trim()}"?`)) {
      return;
    }

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
      showSuccess("Tenant Created", `${tenant.name} is ready.`);
      await refreshTenants();
    } catch (error: any) {
      showError(
        "Error",
        error?.response?.errors?.[0]?.message || "Failed to create tenant.",
      );
    } finally {
      setSavingTenant(false);
    }
  };

  const createTenantAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adminForm.tenantId || !adminForm.email.trim() || !adminForm.name.trim()) {
      showError("Validation Error", "Tenant, name, and email are required.");
      return;
    }

    if (!window.confirm(`Create ${adminForm.name.trim()} as a tenant ${adminForm.role?.toLowerCase()}?`)) {
      return;
    }

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
      showSuccess("Tenant User Created", "The user can now access this tenant.");
      await loadTenants();
    } catch (error: any) {
      showError(
        "Error",
        error?.response?.errors?.[0]?.message || "Failed to create tenant user.",
      );
    } finally {
      setSavingAdmin(false);
    }
  };

  const resetUserTwoFactor = async (targetUser: { id: string; name: string }) => {
    if (
      !window.confirm(
        `Reset two-factor setup for "${targetUser.name}"? They will need to scan a new QR code on next login.`,
      )
    ) {
      return;
    }

    setSavingTwoFactorUserId(targetUser.id);
    try {
      const result = await UserService.resetUserTwoFactor(targetUser.id);
      if (!result.success) {
        showError("Error", result.message || "Failed to reset two-factor setup.");
        return;
      }

      showSuccess("Two-Factor Reset", result.message);
      await loadTenants();
    } catch (error: any) {
      showError(
        "Error",
        error?.response?.errors?.[0]?.message || "Failed to reset two-factor setup.",
      );
    } finally {
      setSavingTwoFactorUserId(null);
    }
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
      showError("Validation Error", "Tenant name is required.");
      return;
    }

    if (!window.confirm(`Save changes to tenant "${editTenantForm.name.trim()}"?`)) {
      return;
    }

    setSavingEdit(true);
    try {
      const tenant = await TenantService.updateTenant(editingTenantId, {
        ...editTenantForm,
        name: editTenantForm.name.trim(),
        slug: editTenantForm.slug?.trim()
          ? toSlug(editTenantForm.slug)
          : toSlug(editTenantForm.name),
        description: editTenantForm.description?.trim() || null,
        publicBaseUrl: editTenantForm.publicBaseUrl?.trim() || null,
        adminBaseUrl: editTenantForm.adminBaseUrl?.trim() || null,
        primaryLocale: editTenantForm.primaryLocale?.trim() || "en",
      });

      setTenants((current) =>
        current.map((item) => (item.id === tenant.id ? tenant : item)),
      );
      cancelTenantEdit();
      showSuccess("Tenant Updated", `${tenant.name} has been updated.`);
      await refreshTenants();
    } catch (error: any) {
      showError(
        "Error",
        error?.response?.errors?.[0]?.message || "Failed to update tenant.",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const updateTenantLifecycle = async (tenant: Tenant, nextStatus: TenantStatus) => {
    const isArchiving = nextStatus === "ARCHIVED";
    const actionLabel = isArchiving ? "archive" : "restore";

    if (!window.confirm(`Are you sure you want to ${actionLabel} "${tenant.name}"?`)) {
      return;
    }

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
        isArchiving ? "Tenant Archived" : "Tenant Restored",
        isArchiving
          ? `${tenant.name} is hidden from public/admin access.`
          : `${tenant.name} is active again.`,
      );
      await refreshTenants();
    } catch (error: any) {
      showError(
        "Error",
        error?.response?.errors?.[0]?.message || `Failed to ${actionLabel} tenant.`,
      );
    } finally {
      setSavingLifecycleId(null);
    }
  };

  return (
    <PermissionGuard permissions={[Permission.SYSTEM_ADMINISTRATION, Permission.UPDATE_SETTINGS]} showError>
      <main className="space-y-6">
      <section className="rounded-lg border bg-white p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {isSuperAdmin ? "Tenant Control" : "Website Control"}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              {isSuperAdmin ? "Tenant Websites" : "Current Website"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isSuperAdmin
                ? "Create tenant websites, inspect users, and manage each tenant from one place."
                : "Manage this tenant admin website and public website identity."}
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
                    <span className="block font-semibold">Create Tenant Website</span>
                    <span className="mt-0.5 block text-xs text-blue-100">
                      New admin and public site
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
              ["Active Tenants", activeTenantCount, Building2],
              ["Tenant Users", tenantUserCount, Users],
              ["Active Sites", activeSiteCount, Globe2],
              ["Archived", archivedTenantCount, Archive],
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
              <CardTitle>{isSuperAdmin ? "Tenants" : "Website"}</CardTitle>
              <CardDescription>
                {isSuperAdmin
                  ? `${tenants.length} tenant website${tenants.length !== 1 ? "s" : ""} configured`
                  : "Update the name, URLs, locale, and active state for this tenant"}
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadTenants()}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading tenants...
            </div>
          ) : tenants.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm text-slate-500">No tenants yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {tenants.map((tenant) => {
                const site = tenant.sites.find((item) => item.isPrimary) ?? tenant.sites[0];
                const isEditing = editingTenantId === tenant.id;
                const adminCount = tenant.memberships.filter((member) => member.role === "ADMIN").length;
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
                            {tenant.status}
                          </Badge>
                          {site?.isActive === false && (
                            <Badge variant="secondary">Site Disabled</Badge>
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
                            Users
                            <Badge variant="secondary" className="ml-2">
                              {tenant.memberships.length}
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
                            Connection
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
                            Public Site
                          </p>
                          <p className="mt-2 truncate text-sm font-medium text-slate-900">
                            {site?.publicBaseUrl || "Not set"}
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
                              Open public
                              <ExternalLink className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <div className="rounded-md border bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Admin Site
                          </p>
                          <p className="mt-2 truncate text-sm font-medium text-slate-900">
                            {site?.adminBaseUrl || "Not set"}
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
                              Open admin
                              <ExternalLink className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 xl:items-end">
                        <div className="mb-1 text-sm text-slate-600">
                          <span className="font-medium text-slate-950">{adminCount}</span>{" "}
                          tenant admin{adminCount !== 1 ? "s" : ""}
                        </div>
                        <Button
                          type="button"
                          variant={isEditing ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => (isEditing ? cancelTenantEdit() : startTenantEdit(tenant))}
                        >
                          {isEditing ? <X className="mr-2 h-4 w-4" /> : <Edit2 className="mr-2 h-4 w-4" />}
                          {isEditing ? "Cancel Edit" : "Edit Tenant"}
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
                            Archive
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
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>

                    {isConnectionExpanded && (
                      <div className="grid gap-3 rounded-md border bg-slate-50 p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Public Website Environment
                          </p>
                          <pre className="mt-2 overflow-x-auto rounded-md border bg-white p-3 text-xs leading-5 text-slate-700">
                            {buildPublicEnv(tenant)}
                          </pre>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => copyTenantValue("Tenant ID", tenant.id)}
                              className="flex items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                            >
                              <span className="truncate">ID: {tenant.id}</span>
                              <Copy className="h-3.5 w-3.5 flex-shrink-0" />
                            </button>
                            <button
                              type="button"
                              onClick={() => copyTenantValue("Tenant slug", tenant.slug)}
                              className="flex items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                            >
                              <span className="truncate">Slug: {tenant.slug}</span>
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
                              copyTenantValue("Public website environment", buildPublicEnv(tenant))
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Env
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
                              Tenant Users
                            </h3>
                            <p className="text-sm text-slate-500">
                              {tenant.memberships.length} user{tenant.memberships.length !== 1 ? "s" : ""} in {tenant.name}
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
                                Add User
                              </Button>
                            )}
                          </div>
                        </div>

                        {tenant.memberships.length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-500">
                            No users are assigned to this tenant yet.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-sm">
                              <thead>
                                <tr className="border-b text-left text-xs font-semibold uppercase text-slate-500">
                                  <th className="px-4 py-3">User</th>
                                  <th className="px-4 py-3">Email</th>
                                  <th className="px-4 py-3">Tenant Role</th>
                                  <th className="px-4 py-3">Platform Role</th>
                                  <th className="px-4 py-3">Status</th>
                                  <th className="px-4 py-3">Two-Factor</th>
                                  <th className="px-4 py-3">Created</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tenant.memberships.map((membership) => (
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
                                        {membership.role}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Badge variant="outline">{membership.user.role}</Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap gap-1">
                                        <Badge variant={membership.user.isActive ? "default" : "secondary"}>
                                          {membership.user.isActive ? "Account Active" : "Account Inactive"}
                                        </Badge>
                                        {!membership.isActive && (
                                          <Badge variant="secondary">Membership Inactive</Badge>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-col gap-2">
                                        <Badge
                                          variant={membership.user.twoFactorEnabled ? "outline" : "secondary"}
                                          className="w-fit"
                                        >
                                          {membership.user.twoFactorEnabled ? "Enabled" : "Needs Setup"}
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
                                          Show QR Again
                                        </Button>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                      {new Date(membership.user.createdAt).toLocaleDateString()}
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
                            <Label htmlFor={`edit-name-${tenant.id}`}>Tenant Name</Label>
                            <Input
                              id={`edit-name-${tenant.id}`}
                              value={editTenantForm.name ?? ""}
                              onChange={(event) =>
                                setEditTenantForm((current) => ({ ...current, name: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-slug-${tenant.id}`}>Slug</Label>
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
                            <Label htmlFor={`edit-status-${tenant.id}`}>Status</Label>
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
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-public-${tenant.id}`}>Public URL</Label>
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
                            <Label htmlFor={`edit-admin-${tenant.id}`}>Admin URL</Label>
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
                            <Label htmlFor={`edit-locale-${tenant.id}`}>Primary Locale</Label>
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
                          <Label htmlFor={`edit-description-${tenant.id}`}>Description</Label>
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
                          Enable this tenant public/admin site
                        </label>

                        <div className="mt-4 flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={cancelTenantEdit}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={savingEdit}>
                            {savingEdit ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-2 h-4 w-4" />
                            )}
                            Save Tenant
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
            <DialogTitle>Create Tenant Website</DialogTitle>
            <DialogDescription>
              Create a clean tenant admin and public website. Content starts empty.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={createTenant}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenant-name">Tenant Name</Label>
                <Input
                  id="tenant-name"
                  value={tenantForm.name}
                  onChange={(event) =>
                    setTenantForm((current) => ({
                      ...current,
                      name: event.target.value,
                      slug: current.slug || toSlug(event.target.value),
                    }))
                  }
                  placeholder="Pulse Business"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-slug">Slug</Label>
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
              <Label htmlFor="tenant-description">Description</Label>
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
                <Label htmlFor="public-url">Public URL</Label>
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
                <Label htmlFor="admin-url">Admin URL</Label>
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
                Cancel
              </Button>
              <Button type="submit" disabled={savingTenant}>
                {savingTenant ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Tenant
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Tenant User</DialogTitle>
            <DialogDescription>
              Create a user directly inside this tenant and choose their role.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={createTenantAdmin}>
            <div className="space-y-2">
              <Label>Tenant</Label>
              <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm">
                <p className="font-medium text-slate-950">
                  {selectedUserTenant?.name || "Select from a tenant's Users panel"}
                </p>
                {selectedUserTenant && (
                  <p className="text-xs text-slate-500">/{selectedUserTenant.slug}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-name">Name</Label>
              <Input
                id="admin-name"
                value={adminForm.name}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
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
              <Label htmlFor="admin-role">Role</Label>
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
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="AUTHOR">Author</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminForm.password ?? ""}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Required for new users"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdminDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingAdmin}>
                {savingAdmin ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </main>
    </PermissionGuard>
  );
}
