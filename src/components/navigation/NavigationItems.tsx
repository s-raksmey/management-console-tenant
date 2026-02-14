// src/components/navigation/NavigationItems.tsx
'use client';

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
  Calendar,
  Bell,
  Archive,
  UserPlus,
} from "lucide-react";
import { Permission } from '../permissions/PermissionGuard';

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
  userRole?: string
): NavigationItem[] => {
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
      permissions: [Permission.CREATE_ARTICLE],
      children: [
        {
          name: "All Articles",
          href: "/articles",
          icon: FileText,
          description: "View all articles",
          permissions: [Permission.CREATE_ARTICLE],
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

    // Review Queue - Editors and Admins only
    {
      name: "Review Queue",
      href: "/review",
      icon: ClipboardList,
      badge: counts.reviewQueue ? counts.reviewQueue.toString() : null,
      description: "Articles pending review",
      permissions: [Permission.REVIEW_ARTICLES],
    },

    // Categories - Authors can view, Editors+ can manage
    {
      name: "Categories",
      href: "/categories",
      icon: Tags,
      badge: counts.categories > 0 ? counts.categories.toString() : null,
      description: "Organize content",
      permissions: [Permission.CREATE_ARTICLE], // Authors can view categories
    },

    // Media - Available to all content creators
    {
      name: "Media",
      href: "/media",
      icon: Image,
      badge: counts.media > 0 ? counts.media.toString() : null,
      description: "Files & images",
      permissions: [Permission.CREATE_ARTICLE],
    },

    // Analytics - Available to all users
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      badge: null,
      description: "Performance data",
      permissions: [Permission.CREATE_ARTICLE],
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

    // Settings - View for all, Update for Admins
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      badge: null,
      description: "System configuration",
      permissions: [Permission.VIEW_SETTINGS],
      children: [
        {
          name: "General",
          href: "/settings/general",
          icon: Settings,
          description: "General settings",
          permissions: [Permission.VIEW_SETTINGS],
        },
        {
          name: "Security",
          href: "/settings/security",
          icon: Shield,
          description: "Security settings",
          permissions: [Permission.UPDATE_SETTINGS],
        },
        {
          name: "Email",
          href: "/settings/email",
          icon: Bell,
          description: "Email configuration",
          permissions: [Permission.UPDATE_SETTINGS],
        },
      ],
    },
  ];

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
  ];

  // Add role-specific quick actions
  if (userRole === 'ADMIN') {
    baseActions.push(
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
      }
    );
  } else if (userRole === 'EDITOR') {
    baseActions.push(
      {
        name: "Review Queue",
        href: "/review",
        icon: ClipboardList,
        description: "Review articles",
        permissions: [Permission.REVIEW_ARTICLES],
      },
      {
        name: "New Category",
        href: "/categories/new",
        icon: Tags,
        description: "Create new category",
        permissions: [Permission.CREATE_CATEGORY],
      }
    );
  }

  return baseActions;
};

/**
 * Get breadcrumb items for current path
 */
export const getBreadcrumbs = (pathname: string): { name: string; href: string }[] => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: { name: string; href: string }[] = [
    { name: 'Dashboard', href: '/' }
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Convert segment to readable name
    const name = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      name,
      href: currentPath
    });
  });

  return breadcrumbs;
};

export default getNavigationItems;
