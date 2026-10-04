// src/hooks/usePermissions.ts
"use client";

import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Permission,
  hasPermission as hasStaticPermission,
  hasAnyPermission as hasAnyStaticPermission,
  hasAllPermissions as hasAllStaticPermissions,
} from "../components/permissions/PermissionGuard";

/**
 * Custom hook for permission checking
 */
export const usePermissions = () => {
  const { user, isLoading, rolePermissions, permissionsReady } = useAuth();

  const permissions = useMemo(() => {
    if (!user || isLoading || !permissionsReady) {
      return {
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
        canAccessResource: () => false,
        isSuperAdmin: false,
        isAdmin: false,
        isEditor: false,
        isAuthor: false,
        userRole: "",
        userId: "",
        isLoading: isLoading || (Boolean(user) && !permissionsReady),
      };
    }

    const userRole = user.role?.toString().toUpperCase() || "";
    const userId = user.id;
    const permissionsForRole = rolePermissions[userRole];
    const hasRuntimePermission = (permission: Permission) =>
      permissionsForRole
        ? permissionsForRole.includes(permission)
        : hasStaticPermission(userRole, permission);
    const hasAnyRuntimePermission = (permissions: Permission[]) =>
      permissionsForRole
        ? permissions.some((permission) => permissionsForRole.includes(permission))
        : hasAnyStaticPermission(userRole, permissions);
    const hasAllRuntimePermissions = (permissions: Permission[]) =>
      permissionsForRole
        ? permissions.every((permission) => permissionsForRole.includes(permission))
        : hasAllStaticPermissions(userRole, permissions);

    return {
      hasPermission: hasRuntimePermission,
      hasAnyPermission: hasAnyRuntimePermission,
      hasAllPermissions: hasAllRuntimePermissions,
      canAccessResource: (
        resourceUserId: string,
        requiredPermissions: Permission[],
      ) => userId === resourceUserId || hasAnyRuntimePermission(requiredPermissions),
      isSuperAdmin: userRole === "SUPER_ADMIN",
      isAdmin: userRole === "ADMIN" || userRole === "SUPER_ADMIN",
      isEditor: userRole === "EDITOR",
      isAuthor: userRole === "AUTHOR",
      userRole,
      userId,
      isLoading: false,
    };
  }, [user, isLoading, rolePermissions, permissionsReady]);

  return permissions;
};

export default usePermissions;
