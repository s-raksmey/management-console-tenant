"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Shield, SlidersHorizontal } from "lucide-react";
import { Permission } from "@/components/permissions/PermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { RolePermissionService } from "@/services/role-permissions.gql";

type ManagedRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR";
type PermissionGroup = {
  title: string;
  description: string;
  excludedRoles?: ManagedRole[];
  permissions: Array<{
    key: Permission;
    label: string;
    description: string;
  }>;
};

const roles: ManagedRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"];

const roleDescriptions: Record<ManagedRole, string> = {
  SUPER_ADMIN: "Platform role for tenant governance, system operations, and global access.",
  ADMIN: "Tenant owner role with team, content, settings, and publishing control.",
  EDITOR: "Editorial role for reviewing, publishing, and improving content.",
  AUTHOR: "Writing role for drafting and maintaining owned content.",
};

const permissionGroups: PermissionGroup[] = [
  {
    title: "Users",
    description: "Team access and role governance.",
    permissions: [
      { key: Permission.CREATE_USER, label: "Create users", description: "Invite or create tenant users." },
      { key: Permission.UPDATE_USER, label: "Update users", description: "Edit user profile and account details." },
      { key: Permission.DELETE_USER, label: "Delete users", description: "Remove or deactivate users." },
      { key: Permission.VIEW_ALL_USERS, label: "View users", description: "See users in management views." },
      { key: Permission.MANAGE_USER_ROLES, label: "Manage roles", description: "Change role assignments and permissions." },
      { key: Permission.MANAGE_USERS, label: "Review requests", description: "Approve or reject account requests." },
    ],
  },
  {
    title: "Articles",
    description: "Content creation, editing, and publishing.",
    excludedRoles: ["SUPER_ADMIN"],
    permissions: [
      { key: Permission.CREATE_ARTICLE, label: "Create articles", description: "Create drafts and submissions." },
      { key: Permission.VIEW_ALL_ARTICLES, label: "All articles", description: "See articles from every author." },
      { key: Permission.UPDATE_OWN_ARTICLE, label: "Edit own articles", description: "Update articles created by the user." },
      { key: Permission.UPDATE_ANY_ARTICLE, label: "Edit any article", description: "Update articles from any author." },
      { key: Permission.DELETE_OWN_ARTICLE, label: "Delete own articles", description: "Delete own draft content." },
      { key: Permission.DELETE_ANY_ARTICLE, label: "Delete any article", description: "Delete any article in the tenant." },
      { key: Permission.PUBLISH_ARTICLE, label: "Publish articles", description: "Move approved content to published." },
      { key: Permission.UNPUBLISH_ARTICLE, label: "Unpublish articles", description: "Return published content to draft." },
      { key: Permission.PREVIEW_ARTICLE, label: "Preview articles", description: "Preview content before publication." },
    ],
  },
  {
    title: "Editorial",
    description: "Review queue and article promotion controls.",
    excludedRoles: ["SUPER_ADMIN"],
    permissions: [
      { key: Permission.REVIEW_ARTICLES, label: "Review articles", description: "Access the review queue." },
      { key: Permission.APPROVE_ARTICLES, label: "Approve articles", description: "Approve submitted content." },
      { key: Permission.REJECT_ARTICLES, label: "Reject articles", description: "Reject submitted content." },
      { key: Permission.SET_FEATURED, label: "Set featured", description: "Feature articles publicly." },
      { key: Permission.SET_BREAKING_NEWS, label: "Set breaking news", description: "Mark content as breaking news." },
      { key: Permission.SET_EDITORS_PICK, label: "Set editor picks", description: "Mark articles as editor picks." },
    ],
  },
  {
    title: "Structure",
    description: "Category, topic, and site organization.",
    excludedRoles: ["SUPER_ADMIN"],
    permissions: [
      { key: Permission.LIST_CATEGORIES, label: "List categories", description: "View all categories and topics." },
      { key: Permission.CREATE_CATEGORY, label: "Create categories", description: "Add new categories." },
      { key: Permission.UPDATE_CATEGORY, label: "Update categories", description: "Edit category details." },
      { key: Permission.DELETE_CATEGORY, label: "Delete categories", description: "Remove categories." },
      { key: Permission.CREATE_TOPIC, label: "Create topics", description: "Add sub-categories/topics." },
      { key: Permission.UPDATE_TOPIC, label: "Update topics", description: "Edit topic details." },
      { key: Permission.DELETE_TOPIC, label: "Delete topics", description: "Remove topics." },
    ],
  },
  {
    title: "System",
    description: "Settings, logs, and platform operations.",
    permissions: [
      { key: Permission.VIEW_SETTINGS, label: "View settings", description: "Read configuration values." },
      { key: Permission.UPDATE_SETTINGS, label: "Update settings", description: "Change configuration values." },
      { key: Permission.VIEW_ANALYTICS, label: "View analytics", description: "Open dashboard and performance charts." },
      { key: Permission.VIEW_AUDIT_LOGS, label: "View audit logs", description: "Inspect system activity." },
      { key: Permission.SYSTEM_ADMINISTRATION, label: "System administration", description: "Access platform administration tools." },
    ],
  },
  {
    title: "Carousel",
    description: "Public hero slide management.",
    permissions: [
      { key: Permission.CREATE_CAROUSEL, label: "Create slides", description: "Create public carousel slides." },
      { key: Permission.UPDATE_CAROUSEL, label: "Update slides", description: "Edit carousel slides and placements." },
      { key: Permission.DELETE_CAROUSEL, label: "Delete slides", description: "Remove carousel slides." },
    ],
  },
  {
    title: "Ads",
    description: "Sponsored placements and public ad operations.",
    permissions: [
      { key: Permission.VIEW_ADS, label: "View ads", description: "Open ads management and review ad performance." },
      { key: Permission.CREATE_ADS, label: "Create ads", description: "Create sponsored placements for public pages." },
      { key: Permission.UPDATE_ADS, label: "Update ads", description: "Edit ad creative, targeting, status, and schedule." },
      { key: Permission.DELETE_ADS, label: "Archive ads", description: "Archive ads that should no longer be shown." },
    ],
  },
  {
    title: "Media",
    description: "Uploaded files and image library.",
    permissions: [
      { key: Permission.VIEW_MEDIA, label: "View media", description: "Open and browse uploaded media." },
      { key: Permission.MANAGE_MEDIA, label: "Manage media", description: "Upload, update, and remove media files." },
    ],
  },
];

const defaultRolePermissions: Record<ManagedRole, Permission[]> = {
  SUPER_ADMIN: [
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.VIEW_ALL_USERS,
    Permission.MANAGE_USER_ROLES,
    Permission.MANAGE_USERS,
    Permission.VIEW_SETTINGS,
    Permission.UPDATE_SETTINGS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.SYSTEM_ADMINISTRATION,
    Permission.CREATE_CAROUSEL,
    Permission.UPDATE_CAROUSEL,
    Permission.DELETE_CAROUSEL,
    Permission.VIEW_ADS,
    Permission.CREATE_ADS,
    Permission.UPDATE_ADS,
    Permission.DELETE_ADS,
    Permission.VIEW_MEDIA,
    Permission.MANAGE_MEDIA,
  ],
  ADMIN: [
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.VIEW_ALL_USERS,
    Permission.MANAGE_USER_ROLES,
    Permission.MANAGE_USERS,
    Permission.CREATE_ARTICLE,
    Permission.VIEW_ALL_ARTICLES,
    Permission.UPDATE_OWN_ARTICLE,
    Permission.UPDATE_ANY_ARTICLE,
    Permission.DELETE_OWN_ARTICLE,
    Permission.DELETE_ANY_ARTICLE,
    Permission.PUBLISH_ARTICLE,
    Permission.UNPUBLISH_ARTICLE,
    Permission.SET_FEATURED,
    Permission.SET_BREAKING_NEWS,
    Permission.SET_EDITORS_PICK,
    Permission.REVIEW_ARTICLES,
    Permission.APPROVE_ARTICLES,
    Permission.REJECT_ARTICLES,
    Permission.LIST_CATEGORIES,
    Permission.CREATE_CATEGORY,
    Permission.UPDATE_CATEGORY,
    Permission.DELETE_CATEGORY,
    Permission.CREATE_TOPIC,
    Permission.UPDATE_TOPIC,
    Permission.DELETE_TOPIC,
    Permission.VIEW_SETTINGS,
    Permission.UPDATE_SETTINGS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.SYSTEM_ADMINISTRATION,
    Permission.CREATE_CAROUSEL,
    Permission.UPDATE_CAROUSEL,
    Permission.DELETE_CAROUSEL,
    Permission.VIEW_ADS,
    Permission.CREATE_ADS,
    Permission.UPDATE_ADS,
    Permission.DELETE_ADS,
    Permission.VIEW_MEDIA,
    Permission.MANAGE_MEDIA,
  ],
  EDITOR: [
    Permission.CREATE_ARTICLE,
    Permission.VIEW_ALL_ARTICLES,
    Permission.UPDATE_OWN_ARTICLE,
    Permission.UPDATE_ANY_ARTICLE,
    Permission.DELETE_OWN_ARTICLE,
    Permission.PUBLISH_ARTICLE,
    Permission.UNPUBLISH_ARTICLE,
    Permission.SET_FEATURED,
    Permission.SET_BREAKING_NEWS,
    Permission.SET_EDITORS_PICK,
    Permission.REVIEW_ARTICLES,
    Permission.APPROVE_ARTICLES,
    Permission.REJECT_ARTICLES,
    Permission.VIEW_ANALYTICS,
    Permission.CREATE_CAROUSEL,
    Permission.UPDATE_CAROUSEL,
    Permission.DELETE_CAROUSEL,
    Permission.VIEW_ADS,
    Permission.VIEW_MEDIA,
    Permission.MANAGE_MEDIA,
  ],
  AUTHOR: [
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_OWN_ARTICLE,
    Permission.DELETE_OWN_ARTICLE,
    Permission.PREVIEW_ARTICLE,
    Permission.VIEW_MEDIA,
  ],
};

const tenantContentPermissions = new Set<Permission>(
  permissionGroups
    .filter((group) => group.excludedRoles?.includes("SUPER_ADMIN"))
    .flatMap((group) => group.permissions.map((permission) => permission.key)),
);

function normalizeRolePermissionsForUi(
  permissions: Record<ManagedRole, Permission[]>,
): Record<ManagedRole, Permission[]> {
  return {
    ...permissions,
    SUPER_ADMIN: permissions.SUPER_ADMIN.filter(
      (permission) => !tenantContentPermissions.has(permission),
    ),
  };
}

export default function RoleManagementPage() {
  const { user, rolePermissions: authRolePermissions, refreshRolePermissions } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canViewRoleManagement =
    isSuperAdmin || hasPermission(Permission.MANAGE_USER_ROLES);
  const [savingPermission, setSavingPermission] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [rolePermissions, setRolePermissions] =
    useState<Record<ManagedRole, Permission[]>>(defaultRolePermissions);

  useEffect(() => {
    setRolePermissions(normalizeRolePermissionsForUi({
      SUPER_ADMIN: authRolePermissions.SUPER_ADMIN || defaultRolePermissions.SUPER_ADMIN,
      ADMIN: authRolePermissions.ADMIN || defaultRolePermissions.ADMIN,
      EDITOR: authRolePermissions.EDITOR || defaultRolePermissions.EDITOR,
      AUTHOR: authRolePermissions.AUTHOR || defaultRolePermissions.AUTHOR,
    }));
  }, [authRolePermissions]);

  useEffect(() => {
    void refreshRolePermissions();
  }, [refreshRolePermissions]);

  const permissionCount = useMemo(
    () => Object.values(rolePermissions).reduce((total, items) => total + items.length, 0),
    [rolePermissions],
  );

  const togglePermission = async (role: ManagedRole, permission: Permission) => {
    if (!isSuperAdmin) return;

    const enabled = !rolePermissions[role].includes(permission);
    const savingKey = `${role}:${permission}`;
    setSavingPermission(savingKey);
    setError("");

    try {
      const result = await RolePermissionService.updatePermission({
        role,
        permission,
        enabled,
      });

      setRolePermissions((current) => ({
        ...current,
        [role]: result.permissions,
      }));
      await refreshRolePermissions();
    } catch (error: any) {
      setError(error?.response?.errors?.[0]?.message || "Failed to update role permission.");
    } finally {
      setSavingPermission(null);
    }
  };

  return (
    <>
      {!permissionsLoading && !canViewRoleManagement ? (
        <div className="text-sm text-red-600">
          Access denied: Insufficient permissions
        </div>
      ) : (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase text-blue-600">
                <Shield className="h-4 w-4" />
                Role Management
              </div>
              <CardTitle className="mt-2 text-3xl">Role Permissions</CardTitle>
              <CardDescription className="mt-2">
                {isSuperAdmin
                  ? "Review each tenant role and adjust permission switches."
                  : "Review what each tenant role can do. Permission switches are read-only for tenant admins."}
              </CardDescription>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Badge variant="outline" className="justify-center px-3 py-2">
                {roles.length} roles
              </Badge>
              <Badge variant="outline" className="justify-center px-3 py-2">
                {permissionGroups.length} groups
              </Badge>
              <Badge variant="outline" className="justify-center px-3 py-2">
                {permissionCount} enabled
              </Badge>
              <Badge variant={isSuperAdmin ? "default" : "secondary"} className="justify-center px-3 py-2">
                {isSuperAdmin ? "Editable" : "View only"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          {roles.map((role) => (
            <Card key={role}>
              <CardHeader>
                <CardTitle>
                  {role === "SUPER_ADMIN"
                    ? "Super Admin"
                    : role === "ADMIN"
                      ? "Admin"
                      : role === "EDITOR"
                        ? "Editor"
                        : "Author"}
                </CardTitle>
                <CardDescription>{roleDescriptions[role]}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2">
                  <span className="text-sm text-slate-600">Enabled permissions</span>
                  <span className="text-xl font-bold text-slate-950">{rolePermissions[role].length}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {permissionGroups.map((group) => {
            const visibleRoles = roles.filter(
              (role) => !group.excludedRoles?.includes(role),
            );

            return (
            <Card key={group.title}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{group.title}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs font-semibold uppercase text-slate-500">
                        <th className="py-3 pr-4">Permission</th>
                        {visibleRoles.map((role) => (
                          <th key={role} className="w-36 px-4 py-3 text-center">
                            {role}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.permissions.map((permission) => (
                        <tr key={permission.key} className="border-b last:border-0">
                          <td className="py-4 pr-4">
                            <p className="font-medium text-slate-950">{permission.label}</p>
                            <p className="mt-1 text-xs text-slate-500">{permission.description}</p>
                          </td>
                          {visibleRoles.map((role) => {
                            const enabled = rolePermissions[role].includes(permission.key);
                            const savingKey = `${role}:${permission.key}`;
                            const isSaving = savingPermission === savingKey;
                            return (
                              <td key={`${role}-${permission.key}`} className="px-4 py-4 text-center">
                                <button
                                  type="button"
                                  disabled={!isSuperAdmin || Boolean(savingPermission)}
                                  onClick={() => void togglePermission(role, permission.key)}
                                  className={[
                                    "mx-auto flex h-7 w-12 items-center rounded-full border p-0.5 transition",
                                    enabled ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-slate-200",
                                    isSuperAdmin ? "cursor-pointer" : "cursor-not-allowed opacity-80",
                                  ].join(" ")}
                                  aria-label={`${enabled ? "Disable" : "Enable"} ${permission.label} for ${role}`}
                                >
                                  <span
                                    className={[
                                      "flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm transition",
                                      enabled ? "translate-x-5" : "translate-x-0",
                                    ].join(" ")}
                                  >
                                    {isSaving ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      enabled && <Check className="h-3 w-3" />
                                    )}
                                  </span>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      </div>
      )}
    </>
  );
}
