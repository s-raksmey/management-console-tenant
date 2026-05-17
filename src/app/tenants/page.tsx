"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Building2,
  Check,
  Copy,
  Edit2,
  Loader2,
  Plus,
  UserPlus,
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToastHelpers } from "@/components/ui/toast";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";

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

export default function TenantsPage() {
  const { showSuccess, showError } = useToastHelpers();
  const { refreshTenants } = useTenant();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const showErrorRef = useRef(showError);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTenant, setSavingTenant] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [tenantForm, setTenantForm] = useState<CreateTenantInput>(emptyTenant);
  const [adminForm, setAdminForm] =
    useState<CreateTenantAdminInput>(emptyAdmin);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [editTenantForm, setEditTenantForm] = useState<UpdateTenantInput>({});

  const copyTenantValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showSuccess("Copied", `${label} copied to clipboard.`);
    } catch {
      showError("Copy Failed", `Could not copy ${label}.`);
    }
  };

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const items = isSuperAdmin
        ? await TenantService.listTenants()
        : await TenantService.getActiveTenant().then((tenant) =>
            tenant ? [tenant] : [],
          );
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

    if (
      !window.confirm(
        `Create tenant website "${tenantForm.name.trim()}" with starter content?`,
      )
    ) {
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

    if (
      !adminForm.tenantId ||
      !adminForm.email.trim() ||
      !adminForm.name.trim()
    ) {
      showError("Validation Error", "Tenant, name, and email are required.");
      return;
    }

    if (
      !window.confirm(
        `Create ${adminForm.name.trim()} as a tenant admin for this website?`,
      )
    ) {
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
      setAdminForm((current) => ({
        ...emptyAdmin,
        tenantId: current.tenantId,
      }));
      showSuccess(
        "Tenant Admin Created",
        "The user can now manage this tenant.",
      );
      await loadTenants();
    } catch (error: any) {
      showError(
        "Error",
        error?.response?.errors?.[0]?.message ||
          "Failed to create tenant admin.",
      );
    } finally {
      setSavingAdmin(false);
    }
  };

  const startTenantEdit = (tenant: Tenant) => {
    const site =
      tenant.sites.find((item) => item.isPrimary) ?? tenant.sites[0];

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

    if (
      !window.confirm(
        `Save changes to tenant "${editTenantForm.name.trim()}"?`,
      )
    ) {
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

  return (
    <main className="space-y-6 p-6">
      <div>
        <p className="text-sm font-semibold uppercase text-blue-600">
          Platform
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          {isSuperAdmin ? "Tenant Websites" : "Website Settings"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isSuperAdmin
            ? "Create clean tenant admin/public websites and assign tenant admins."
            : "Manage this tenant admin website and public website identity."}
        </p>
      </div>

      {isSuperAdmin && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Create Tenant Website</CardTitle>
            <CardDescription>
              This creates the tenant and its first public/admin site config.
            </CardDescription>
          </CardHeader>
          <CardContent>
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

              <Button type="submit" disabled={savingTenant}>
                {savingTenant ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Tenant
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Tenant Admin</CardTitle>
            <CardDescription>
              Assign a user to manage one tenant website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={createTenantAdmin}>
              <div className="space-y-2">
                <Label htmlFor="admin-tenant">Tenant</Label>
                <select
                  id="admin-tenant"
                  value={adminForm.tenantId}
                  onChange={(event) =>
                    setAdminForm((current) => ({
                      ...current,
                      tenantId: event.target.value,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-name">Name</Label>
                <Input
                  id="admin-name"
                  value={adminForm.name}
                  onChange={(event) =>
                    setAdminForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
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
                    setAdminForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminForm.password ?? ""}
                  onChange={(event) =>
                    setAdminForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Required for new users"
                />
              </div>
              <Button type="submit" disabled={savingAdmin}>
                {savingAdmin ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Create Tenant Admin
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isSuperAdmin ? "All Tenants" : "Current Website"}</CardTitle>
          <CardDescription>
            {isSuperAdmin
              ? `${tenants.length} tenant websites configured`
              : "Update the name, URLs, locale, and active state for this tenant"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading tenants...
            </div>
          ) : tenants.length === 0 ? (
            <div className="rounded-md border border-dashed py-12 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm text-slate-500">No tenants yet.</p>
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {tenants.map((tenant) => {
                const site =
                  tenant.sites.find((item) => item.isPrimary) ??
                  tenant.sites[0];
                const isEditing = editingTenantId === tenant.id;

                return (
                  <div
                    key={tenant.id}
                    className="space-y-4 p-4"
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_220px_180px_120px]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-slate-950">
                            {tenant.name}
                          </h2>
                          <Badge variant="outline">{tenant.status}</Badge>
                          {site?.isActive === false && (
                            <Badge variant="secondary">Site Disabled</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          /{tenant.slug}
                        </p>
                        {tenant.description && (
                          <p className="mt-2 text-sm text-slate-600">
                            {tenant.description}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          Tenant Keys
                        </p>
                        <button
                          type="button"
                          onClick={() => copyTenantValue("Tenant ID", tenant.id)}
                          className="flex w-full items-center justify-between gap-2 rounded-md border bg-slate-50 px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100"
                        >
                          <span className="min-w-0 truncate">
                            ID: {tenant.id}
                          </span>
                          <Copy className="h-3.5 w-3.5 flex-shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            copyTenantValue("Tenant slug", tenant.slug)
                          }
                          className="flex w-full items-center justify-between gap-2 rounded-md border bg-slate-50 px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100"
                        >
                          <span className="min-w-0 truncate">
                            Slug: {tenant.slug}
                          </span>
                          <Copy className="h-3.5 w-3.5 flex-shrink-0" />
                        </button>
                      </div>
                      <div className="text-sm">
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          Public
                        </p>
                        <p className="mt-1 truncate text-slate-700">
                          {site?.publicBaseUrl || "Not set"}
                        </p>
                        <p className="mt-1 truncate text-slate-500">
                          {site?.adminBaseUrl || "No admin URL"}
                        </p>
                      </div>
                      <div className="text-sm">
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          Admins
                        </p>
                        <p className="mt-1 text-slate-700">
                          {
                            tenant.memberships.filter(
                              (member) => member.role === "ADMIN",
                            ).length
                          }{" "}
                          tenant admin
                        </p>
                      </div>
                      <div className="flex items-start justify-end">
                        <Button
                          type="button"
                          variant={isEditing ? "secondary" : "outline"}
                          size="sm"
                          onClick={() =>
                            isEditing ? cancelTenantEdit() : startTenantEdit(tenant)
                          }
                        >
                          {isEditing ? (
                            <X className="mr-2 h-4 w-4" />
                          ) : (
                            <Edit2 className="mr-2 h-4 w-4" />
                          )}
                          {isEditing ? "Cancel" : "Edit"}
                        </Button>
                      </div>
                    </div>

                    {isEditing && (
                      <form
                        className="rounded-md border bg-slate-50 p-4"
                        onSubmit={updateTenant}
                      >
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-name-${tenant.id}`}>
                              Tenant Name
                            </Label>
                            <Input
                              id={`edit-name-${tenant.id}`}
                              value={editTenantForm.name ?? ""}
                              onChange={(event) =>
                                setEditTenantForm((current) => ({
                                  ...current,
                                  name: event.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-slug-${tenant.id}`}>
                              Slug
                            </Label>
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
                            <Label htmlFor={`edit-status-${tenant.id}`}>
                              Status
                            </Label>
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
                            <Label htmlFor={`edit-public-${tenant.id}`}>
                              Public URL
                            </Label>
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
                            <Label htmlFor={`edit-admin-${tenant.id}`}>
                              Admin URL
                            </Label>
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
                            <Label htmlFor={`edit-locale-${tenant.id}`}>
                              Primary Locale
                            </Label>
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
                          <Label htmlFor={`edit-description-${tenant.id}`}>
                            Description
                          </Label>
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
                          <Button
                            type="button"
                            variant="outline"
                            onClick={cancelTenantEdit}
                          >
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
    </main>
  );
}
