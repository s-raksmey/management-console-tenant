// src/hooks/usePermissions.ts
"use client";

import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessResource,
} from "../components/permissions/PermissionGuard";

/**
 * Custom hook for permission checking
 */
export const usePermissions = () => {
  const { user, isLoading } = useAuth();

  const permissions = useMemo(() => {
    if (!user || isLoading) {
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
        isLoading,
      };
    }

    const userRole = user.role?.toString().toUpperCase() || "";
    const userId = user.id;

    return {
      hasPermission: (permission: Permission) =>
        hasPermission(userRole, permission),
      hasAnyPermission: (permissions: Permission[]) =>
        hasAnyPermission(userRole, permissions),
      hasAllPermissions: (permissions: Permission[]) =>
        hasAllPermissions(userRole, permissions),
      canAccessResource: (
        resourceUserId: string,
        requiredPermissions: Permission[],
      ) =>
        canAccessResource(
          userRole,
          userId,
          resourceUserId,
          requiredPermissions,
        ),
      isSuperAdmin: userRole === "SUPER_ADMIN",
      isAdmin: userRole === "ADMIN" || userRole === "SUPER_ADMIN",
      isEditor: userRole === "EDITOR",
      isAuthor: userRole === "AUTHOR",
      userRole,
      userId,
      isLoading: false,
    };
  }, [user, isLoading]);

  return permissions;
};

/**
 * Hook for checking specific role
 */
export const useRole = () => {
  const { user, isLoading } = useAuth();

  return useMemo(() => {
    if (!user || isLoading) {
      return {
        role: "",
        isSuperAdmin: false,
        isAdmin: false,
        isEditor: false,
        isAuthor: false,
        isLoading,
      };
    }

    const role = user.role?.toString().toUpperCase() || "";

    return {
      role,
      isSuperAdmin: role === "SUPER_ADMIN",
      isAdmin: role === "ADMIN" || role === "SUPER_ADMIN",
      isEditor: role === "EDITOR",
      isAuthor: role === "AUTHOR",
      isLoading: false,
    };
  }, [user, isLoading]);
};

/**
 * Hook for article-specific permissions
 */
export const useArticlePermissions = (articleAuthorId?: string) => {
  const { hasPermission, canAccessResource, userRole, userId, isLoading } =
    usePermissions();

  return useMemo(() => {
    if (isLoading) {
      return {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canPublish: false,
        canSetFeatures: false,
        canReview: false,
        isOwner: false,
        isLoading: true,
      };
    }

    const isOwner = articleAuthorId ? userId === articleAuthorId : false;

    return {
      canCreate: hasPermission(Permission.CREATE_ARTICLE),
      canEdit: isOwner || hasPermission(Permission.UPDATE_ANY_ARTICLE),
      canDelete:
        (isOwner && hasPermission(Permission.DELETE_OWN_ARTICLE)) ||
        hasPermission(Permission.DELETE_ANY_ARTICLE),
      canPublish: hasPermission(Permission.PUBLISH_ARTICLE),
      canSetFeatures:
        hasPermission(Permission.SET_FEATURED) ||
        hasPermission(Permission.SET_BREAKING_NEWS) ||
        hasPermission(Permission.SET_EDITORS_PICK),
      canReview: hasPermission(Permission.REVIEW_ARTICLES),
      isOwner,
      isLoading: false,
    };
  }, [hasPermission, userId, articleAuthorId, isLoading]);
};

/**
 * Hook for user management permissions
 */
export const useUserManagementPermissions = () => {
  const { hasPermission, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading) {
      return {
        canCreateUser: false,
        canUpdateUser: false,
        canDeleteUser: false,
        canViewAllUsers: false,
        canManageRoles: false,
        isLoading: true,
      };
    }

    return {
      canCreateUser: hasPermission(Permission.CREATE_USER),
      canUpdateUser: hasPermission(Permission.UPDATE_USER),
      canDeleteUser: hasPermission(Permission.DELETE_USER),
      canViewAllUsers: hasPermission(Permission.VIEW_ALL_USERS),
      canManageRoles: hasPermission(Permission.MANAGE_USER_ROLES),
      isLoading: false,
    };
  }, [hasPermission, isLoading]);
};

/**
 * Hook for workflow permissions
 */
export const useWorkflowPermissions = () => {
  const { hasPermission, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading) {
      return {
        canReview: false,
        canApprove: false,
        canReject: false,
        canViewReviewQueue: false,
        canViewWorkflowStats: false,
        isLoading: true,
      };
    }

    return {
      canReview: hasPermission(Permission.REVIEW_ARTICLES),
      canApprove: hasPermission(Permission.APPROVE_ARTICLES),
      canReject: hasPermission(Permission.REJECT_ARTICLES),
      canViewReviewQueue: hasPermission(Permission.REVIEW_ARTICLES),
      canViewWorkflowStats: hasPermission(Permission.REVIEW_ARTICLES),
      isLoading: false,
    };
  }, [hasPermission, isLoading]);
};

/**
 * Hook for system administration permissions
 */
export const useSystemPermissions = () => {
  const { hasPermission, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading) {
      return {
        canViewSettings: false,
        canUpdateSettings: false,
        canViewAuditLogs: false,
        canSystemAdmin: false,
        isLoading: true,
      };
    }

    return {
      canViewSettings: hasPermission(Permission.VIEW_SETTINGS),
      canUpdateSettings: hasPermission(Permission.UPDATE_SETTINGS),
      canViewAuditLogs: hasPermission(Permission.VIEW_AUDIT_LOGS),
      canSystemAdmin: hasPermission(Permission.SYSTEM_ADMINISTRATION),
      isLoading: false,
    };
  }, [hasPermission, isLoading]);
};

export default usePermissions;
