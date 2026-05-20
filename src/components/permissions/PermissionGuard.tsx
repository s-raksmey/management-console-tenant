// src/components/permissions/PermissionGuard.tsx
"use client";

import React from "react";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Permission definitions matching the backend
 */
export enum Permission {
  // User Management
  CREATE_USER = "CREATE_USER",
  UPDATE_USER = "UPDATE_USER",
  DELETE_USER = "DELETE_USER",
  VIEW_ALL_USERS = "VIEW_ALL_USERS",
  MANAGE_USER_ROLES = "MANAGE_USER_ROLES",
  MANAGE_USERS = "MANAGE_USERS",

  // Article Management
  CREATE_ARTICLE = "CREATE_ARTICLE",
  UPDATE_OWN_ARTICLE = "UPDATE_OWN_ARTICLE",
  UPDATE_ANY_ARTICLE = "UPDATE_ANY_ARTICLE",
  DELETE_OWN_ARTICLE = "DELETE_OWN_ARTICLE",
  DELETE_ANY_ARTICLE = "DELETE_ANY_ARTICLE",
  PUBLISH_ARTICLE = "PUBLISH_ARTICLE",
  UNPUBLISH_ARTICLE = "UNPUBLISH_ARTICLE",
  PREVIEW_ARTICLE = "PREVIEW_ARTICLE",

  // Article Features
  SET_FEATURED = "SET_FEATURED",
  SET_BREAKING_NEWS = "SET_BREAKING_NEWS",
  SET_EDITORS_PICK = "SET_EDITORS_PICK",

  // Content Review
  REVIEW_ARTICLES = "REVIEW_ARTICLES",
  APPROVE_ARTICLES = "APPROVE_ARTICLES",
  REJECT_ARTICLES = "REJECT_ARTICLES",

  // Category Management
  CREATE_CATEGORY = "CREATE_CATEGORY",
  UPDATE_CATEGORY = "UPDATE_CATEGORY",
  DELETE_CATEGORY = "DELETE_CATEGORY",

  // Topic Management
  CREATE_TOPIC = "CREATE_TOPIC",
  UPDATE_TOPIC = "UPDATE_TOPIC",
  DELETE_TOPIC = "DELETE_TOPIC",

  // Settings Management
  VIEW_SETTINGS = "VIEW_SETTINGS",
  UPDATE_SETTINGS = "UPDATE_SETTINGS",
  VIEW_ANALYTICS = "VIEW_ANALYTICS",

  // System Management
  VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS",
  SYSTEM_ADMINISTRATION = "SYSTEM_ADMINISTRATION",

  // Carousel Management
  CREATE_CAROUSEL = "CREATE_CAROUSEL",
  UPDATE_CAROUSEL = "UPDATE_CAROUSEL",
  DELETE_CAROUSEL = "DELETE_CAROUSEL",

  // Media Management
  VIEW_MEDIA = "VIEW_MEDIA",
  MANAGE_MEDIA = "MANAGE_MEDIA",
}

/**
 * Role-based permission matrix (matching backend)
 */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.VIEW_ALL_USERS,
    Permission.MANAGE_USER_ROLES,
    Permission.MANAGE_USERS,
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_OWN_ARTICLE,
    Permission.UPDATE_ANY_ARTICLE,
    Permission.DELETE_OWN_ARTICLE,
    Permission.DELETE_ANY_ARTICLE,
    Permission.PUBLISH_ARTICLE,
    Permission.UNPUBLISH_ARTICLE,
    Permission.PREVIEW_ARTICLE,
    Permission.SET_FEATURED,
    Permission.SET_BREAKING_NEWS,
    Permission.SET_EDITORS_PICK,
    Permission.REVIEW_ARTICLES,
    Permission.APPROVE_ARTICLES,
    Permission.REJECT_ARTICLES,
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
    Permission.VIEW_MEDIA,
    Permission.MANAGE_MEDIA,
  ],
  ADMIN: [
    // Full access to everything
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.VIEW_ALL_USERS,
    Permission.MANAGE_USER_ROLES,
    Permission.MANAGE_USERS,
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_OWN_ARTICLE,
    Permission.UPDATE_ANY_ARTICLE,
    Permission.DELETE_OWN_ARTICLE,
    Permission.DELETE_ANY_ARTICLE,
    Permission.PUBLISH_ARTICLE,
    Permission.UNPUBLISH_ARTICLE,
    Permission.PREVIEW_ARTICLE,
    Permission.SET_FEATURED,
    Permission.SET_BREAKING_NEWS,
    Permission.SET_EDITORS_PICK,
    Permission.REVIEW_ARTICLES,
    Permission.APPROVE_ARTICLES,
    Permission.REJECT_ARTICLES,
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
    Permission.VIEW_MEDIA,
    Permission.MANAGE_MEDIA,
  ],
  EDITOR: [
    // Content management and editorial control
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_OWN_ARTICLE,
    Permission.UPDATE_ANY_ARTICLE,
    Permission.DELETE_OWN_ARTICLE,
    Permission.PUBLISH_ARTICLE,
    Permission.UNPUBLISH_ARTICLE,
    Permission.PREVIEW_ARTICLE,
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
    Permission.VIEW_MEDIA,
    Permission.MANAGE_MEDIA,
  ],
  AUTHOR: [
    // Basic content creation
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_OWN_ARTICLE,
    Permission.DELETE_OWN_ARTICLE,
    Permission.PREVIEW_ARTICLE,
    Permission.VIEW_MEDIA,
  ],
};

let dynamicRolePermissions: Record<string, Permission[]> | null = null;

export const setDynamicRolePermissions = (matrix: Record<string, Permission[]> | null) => {
  dynamicRolePermissions = matrix;
};

/**
 * Permission utility functions
 */
export const hasPermission = (
  userRole: string,
  permission: Permission,
): boolean => {
  const normalizedRole = userRole?.toUpperCase();
  const rolePermissions =
    dynamicRolePermissions !== null
      ? dynamicRolePermissions[normalizedRole] || []
      : ROLE_PERMISSIONS[normalizedRole] || [];
  return rolePermissions.includes(permission);
};

export const hasAnyPermission = (
  userRole: string,
  permissions: Permission[],
): boolean => {
  return permissions.some((permission) => hasPermission(userRole, permission));
};

export const hasAllPermissions = (
  userRole: string,
  permissions: Permission[],
): boolean => {
  return permissions.every((permission) => hasPermission(userRole, permission));
};

export const canAccessResource = (
  userRole: string,
  userId: string,
  resourceUserId: string,
  requiredPermissions: Permission[],
): boolean => {
  // Check if user owns the resource
  if (userId === resourceUserId) {
    return true;
  }

  // Check if user has elevated permissions
  return hasAnyPermission(userRole, requiredPermissions);
};

/**
 * Permission Guard Component Props
 */
interface PermissionGuardProps {
  children: React.ReactNode;
  permissions?: Permission[];
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  resourceUserId?: string;
  showError?: boolean;
}

/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback = null,
  resourceUserId,
  showError = false,
}) => {
  const { user, isLoading, permissionsReady } = useAuth();

  // Show loading state
  if (isLoading || (user && !permissionsReady)) {
    return <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>;
  }

  // No user authenticated
  if (!user) {
    if (showError) {
      return (
        <div className="text-red-600 text-sm">Authentication required</div>
      );
    }
    return <>{fallback}</>;
  }

  const userRole = user.role?.toString().toUpperCase() || "";

  // Check role-based access
  if (roles.length > 0) {
    const hasRole = roles.some((role) => userRole === role.toUpperCase());
    if (!hasRole) {
      if (showError) {
        return (
          <div className="text-red-600 text-sm">
            Access denied: Required role {roles.join(" or ")}
          </div>
        );
      }
      return <>{fallback}</>;
    }
  }

  // Check permission-based access
  if (permissions.length > 0) {
    let hasAccess = false;

    if (resourceUserId) {
      // Resource-based permission check
      hasAccess = canAccessResource(
        userRole,
        user.id,
        resourceUserId,
        permissions,
      );
    } else {
      // General permission check
      hasAccess = requireAll
        ? hasAllPermissions(userRole, permissions)
        : hasAnyPermission(userRole, permissions);
    }

    if (!hasAccess) {
      if (showError) {
        return (
          <div className="text-red-600 text-sm">
            Access denied: Insufficient permissions
          </div>
        );
      }
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

/**
 * Higher-order component for permission-based rendering
 */
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  permissions: Permission[],
  options: {
    requireAll?: boolean;
    fallback?: React.ReactNode;
    showError?: boolean;
  } = {},
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <PermissionGuard
      permissions={permissions}
      requireAll={options.requireAll}
      fallback={options.fallback}
      showError={options.showError}
    >
      <Component {...props} />
    </PermissionGuard>
  );

  WrappedComponent.displayName = `withPermissions(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Role-based component wrapper
 */
interface RoleBasedProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
  showError?: boolean;
}

export const RoleBased: React.FC<RoleBasedProps> = ({
  children,
  allowedRoles,
  fallback = null,
  showError = false,
}) => (
  <PermissionGuard
    roles={allowedRoles}
    fallback={fallback}
    showError={showError}
  >
    {children}
  </PermissionGuard>
);

export default PermissionGuard;
