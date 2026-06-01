// src/components/navigation/NavigationItems.tsx
"use client";

import {
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  BarChart3,
  Tags,
  Image,
  ClipboardList,
  Shield,
  Archive,
  UserPlus,
  Building2,
  Megaphone,
} from "lucide-react";
import { Permission } from "../permissions/PermissionGuard";

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  badge?: string | null;
  description: string;
  permissions?: Permission[];
  roles?: string[];
  children?: NavigationItem[];
  openInNewTab?: boolean;
}

/**
 * Get navigation items based on user permissions and role
 */
export const getNavigationItems = (
  counts: {
    articles: number;
    users: number;
    categories: number;
    media: number;
    reviewQueue?: number;
  },
  userRole?: string,
): NavigationItem[] => {
  if (userRole === "SUPER_ADMIN") {
    return [
      {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        badge: null,
        description: "Platform overview",
      },
      {
        name: "Tenant Management",
        href: "/tenants",
        icon: Building2,
        badge: null,
        description: "Manage tenant websites",
        permissions: [Permission.SYSTEM_ADMINISTRATION],
      },
      {
        name: "User Management",
        href: "/users",
        icon: Users,
        badge: counts.users > 0 ? counts.users.toString() : null,
        description: "Manage platform users",
        permissions: [Permission.VIEW_ALL_USERS],
      },
      {
        name: "Role Management",
        href: "/users/roles",
        icon: Shield,
        badge: null,
        description: "Manage role permissions",
        permissions: [Permission.MANAGE_USER_ROLES],
      },
      {
        name: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        badge: null,
        description: "Platform analytics",
        permissions: [Permission.VIEW_ANALYTICS],
      },
      {
        name: "Media",
        href: "/media",
        icon: Image,
        badge: counts.media > 0 ? counts.media.toString() : null,
        description: "Files & images",
        permissions: [Permission.VIEW_MEDIA, Permission.MANAGE_MEDIA],
      },
      {
        name: "Carousel",
        href: "/carousel",
        icon: Image,
        badge: null,
        description: "Public hero slides",
        permissions: [
          Permission.CREATE_CAROUSEL,
          Permission.UPDATE_CAROUSEL,
          Permission.DELETE_CAROUSEL,
        ],
      },
      {
        name: "Ads",
        href: "/ads",
        icon: Megaphone,
        badge: null,
        description: "Sponsored placements",
        permissions: [Permission.VIEW_ADS],
      },
      {
        name: "Logs",
        href: "/audit",
        icon: Archive,
        badge: null,
        description: "System activity logs",
        permissions: [Permission.VIEW_AUDIT_LOGS],
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        badge: null,
        description: "Platform configuration",
        permissions: [Permission.VIEW_SETTINGS],
      },
    ];
  }

  const navigationItems: NavigationItem[] = [
    // Dashboard - Available to all users
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      badge: null,
      description: "Overview & stats",
    },

    // Articles - Available to all users with different permissions
    {
      name: "Articles",
      href: "/articles",
      icon: FileText,
      badge: counts.articles > 0 ? counts.articles.toString() : null,
      description: "Manage content",
      permissions: [
        Permission.CREATE_ARTICLE,
        Permission.VIEW_ALL_ARTICLES,
        Permission.UPDATE_OWN_ARTICLE,
        Permission.UPDATE_ANY_ARTICLE,
        Permission.DELETE_OWN_ARTICLE,
        Permission.DELETE_ANY_ARTICLE,
        Permission.PUBLISH_ARTICLE,
        Permission.REVIEW_ARTICLES,
      ],
      children: [
        {
          name: "All Articles",
          href: "/articles",
          icon: FileText,
          description: "View all articles",
          permissions: [Permission.VIEW_ALL_ARTICLES],
        },
        {
          name: "My Articles",
          href: "/articles/my",
          icon: FileText,
          description: "Your articles",
          permissions: [Permission.UPDATE_OWN_ARTICLE],
        },
      ],
    },

    {
      name: "Website Settings",
      href: "/tenants",
      icon: Building2,
      badge: null,
      description: "Tenant website setup",
      permissions: [Permission.UPDATE_SETTINGS, Permission.SYSTEM_ADMINISTRATION],
    },

    // Review Queue - Editors and Admins only
    {
      name: "Review Queue",
      href: "/review",
      icon: ClipboardList,
      badge: counts.reviewQueue ? counts.reviewQueue.toString() : null,
      description: "Articles pending review",
      permissions: [Permission.REVIEW_ARTICLES],
    },

    // Categories and topics - visible to roles with structure management access
    {
      name: "Categories",
      href: "/categories",
      icon: Tags,
      badge: counts.categories > 0 ? counts.categories.toString() : null,
      description: "Organize content",
      permissions: [
        Permission.LIST_CATEGORIES,
        Permission.CREATE_CATEGORY,
        Permission.UPDATE_CATEGORY,
        Permission.DELETE_CATEGORY,
        Permission.CREATE_TOPIC,
        Permission.UPDATE_TOPIC,
        Permission.DELETE_TOPIC,
      ],
    },

    // Media - Available to all content creators
    {
      name: "Media",
      href: "/media",
      icon: Image,
      badge: counts.media > 0 ? counts.media.toString() : null,
      description: "Files & images",
      permissions: [Permission.VIEW_MEDIA, Permission.MANAGE_MEDIA],
    },

    {
      name: "Carousel",
      href: "/carousel",
      icon: Image,
      badge: null,
      description: "Homepage hero slides",
      permissions: [
        Permission.CREATE_CAROUSEL,
        Permission.UPDATE_CAROUSEL,
        Permission.DELETE_CAROUSEL,
      ],
    },

    {
      name: "Ads",
      href: "/ads",
      icon: Megaphone,
      badge: null,
      description: "Sponsored placements",
      permissions: [Permission.VIEW_ADS],
    },

    // Analytics - Available to all users
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      badge: null,
      description: "Performance data",
      permissions: [Permission.VIEW_ANALYTICS],
    },

    // User Management - Admins only
    {
      name: "Users",
      href: "/users",
      icon: Users,
      badge: counts.users > 0 ? counts.users.toString() : null,
      description: "User management",
      permissions: [Permission.VIEW_ALL_USERS],
      children: [
        {
          name: "All Users",
          href: "/users",
          icon: Users,
          description: "View all users",
          permissions: [Permission.VIEW_ALL_USERS],
        },
        {
          name: "Registration Requests",
          href: "/users/requests",
          icon: UserPlus,
          description: "Review new user requests",
          permissions: [Permission.MANAGE_USERS],
        },
        {
          name: "Role Management",
          href: "/users/roles",
          icon: Shield,
          description: "Manage user roles",
          permissions: [Permission.MANAGE_USER_ROLES],
        },
      ],
    },

    // Audit Logs - Admins only
    {
      name: "Audit Logs",
      href: "/audit",
      icon: Archive,
      badge: null,
      description: "System activity logs",
      permissions: [Permission.VIEW_AUDIT_LOGS],
    },

  ];

  navigationItems.push({
    name: "Settings",
    href: "/settings",
    icon: Settings,
    badge: null,
    description: "Website configuration",
    permissions: [Permission.VIEW_SETTINGS],
  });

  return navigationItems;
};

/**
 * Get quick actions based on user role
 */
export const getQuickActions = (userRole?: string): NavigationItem[] => {
  const baseActions: NavigationItem[] = [
    {
      name: "New Article",
      href: "/articles/new",
      icon: FileText,
      description: "Create new article",
      permissions: [Permission.CREATE_ARTICLE],
    },
    {
      name: "New Tenant",
      href: "/tenants",
      icon: Building2,
      description: "Create tenant website",
      permissions: [Permission.SYSTEM_ADMINISTRATION],
    },
    {
      name: "New User",
      href: "/users/new",
      icon: Users,
      description: "Create new user",
      permissions: [Permission.CREATE_USER],
    },
    {
      name: "New Category",
      href: "/categories/new",
      icon: Tags,
      description: "Create new category",
      permissions: [Permission.CREATE_CATEGORY],
    },
    {
      name: "Review Queue",
      href: "/review",
      icon: ClipboardList,
      description: "Review articles",
      permissions: [Permission.REVIEW_ARTICLES],
    },
    {
      name: "New Slide",
      href: "/carousel/new",
      icon: Image,
      description: "Create carousel slide",
      permissions: [Permission.CREATE_CAROUSEL],
    },
  ];

  return baseActions;
};

/**
 * Get breadcrumb items for current path
 */
export const getBreadcrumbs = (
  pathname: string,
): { name: string; href: string }[] => {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { name: string; href: string }[] = [
    { name: "Dashboard", href: "/" },
  ];

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Convert segment to readable name
    const name = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    breadcrumbs.push({
      name,
      href: currentPath,
    });
  });

  return breadcrumbs;
};

export default getNavigationItems;
