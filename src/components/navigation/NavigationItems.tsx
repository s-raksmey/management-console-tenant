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
  Building2,
  Megaphone,
  MessageSquare,
} from "lucide-react";
import { Permission } from "../permissions/PermissionGuard";
import type { AdminLocale } from "@/hooks/useAdminLocale";

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

const navCopy = {
  en: {
    dashboard: "Dashboard",
    tenantManagement: "Sub-tenant Management",
    userManagement: "User Management",
    roleManagement: "Role Management",
    analytics: "Analytics",
    media: "Media",
    carousel: "Carousel",
    ads: "Ads",
    logs: "Logs",
    settings: "Settings",
    articles: "Articles",
    allArticles: "All Articles",
    myArticles: "My Articles",
    websiteSettings: "Website Settings",
    reviewQueue: "Review Queue",
    comments: "Comments",
    categories: "Categories",
    users: "Users",
    allUsers: "All Users",
    auditLogs: "Audit Logs",
    publicReaders: "Public Readers",
    newArticle: "New Article",
    newTenant: "New Sub-tenant",
    newUser: "New User",
    newCategory: "New Category",
    newSlide: "New Slide",
    mainTenantOverview: "Main Tenant overview",
    manageTenantWebsites: "Manage sub-tenant websites",
    manageMainTenantUsers: "Manage main-tenant users",
    manageRolePermissions: "Manage role permissions",
    mainTenantAnalytics: "Main tenant analytics",
    filesImages: "Files & images",
    publicHeroSlides: "Public hero slides",
    sponsoredPlacements: "Sponsored placements",
    systemActivityLogs: "System activity logs",
    mainTenantConfiguration: "Main Tenant configuration",
    overviewStats: "Overview & stats",
    manageContent: "Manage content",
    viewAllArticles: "View all articles",
    yourArticles: "Your articles",
    tenantWebsiteSetup: "Sub-tenant website setup",
    articlesPendingReview: "Articles pending review",
    readerCommentActivity: "Reader comment activity",
    organizeContent: "Organize content",
    performanceData: "Performance data",
    userManagementDescription: "User management",
    viewAllUsers: "View all users",
    manageUserRoles: "Manage user roles",
    websiteConfiguration: "Website configuration",
    passwordlessWebsiteReaders: "Passwordless website readers",
    createNewArticle: "Create new article",
    createTenantWebsite: "Create sub-tenant website",
    createNewUser: "Create new user",
    createNewCategory: "Create new category",
    reviewArticles: "Review articles",
    createCarouselSlide: "Create carousel slide",
  },
  km: {
    dashboard: "ផ្ទាំងសង្ខេប",
    tenantManagement: "គ្រប់គ្រងគេហទំព័រ",
    userManagement: "គ្រប់គ្រងអ្នកប្រើ",
    roleManagement: "គ្រប់គ្រងតួនាទី",
    analytics: "វិភាគទិន្នន័យ",
    media: "មេឌៀ",
    carousel: "ការ៉ូសែល",
    ads: "ពាណិជ្ជកម្ម",
    logs: "កំណត់ហេតុ",
    settings: "ការកំណត់",
    articles: "អត្ថបទ",
    allArticles: "អត្ថបទទាំងអស់",
    myArticles: "អត្ថបទរបស់ខ្ញុំ",
    websiteSettings: "ការកំណត់គេហទំព័រ",
    reviewQueue: "ជួរពិនិត្យ",
    comments: "មតិយោបល់",
    categories: "ប្រភេទ",
    users: "អ្នកប្រើ",
    allUsers: "អ្នកប្រើទាំងអស់",
    auditLogs: "កំណត់ហេតុសវនកម្ម",
    publicReaders: "អ្នកអានសាធារណៈ",
    newArticle: "អត្ថបទថ្មី",
    newTenant: "គេហទំព័រថ្មី",
    newUser: "អ្នកប្រើថ្មី",
    newCategory: "ប្រភេទថ្មី",
    newSlide: "ស្លាយថ្មី",
    mainTenantOverview: "ទិដ្ឋភាពអ្នកជួលមេ",
    manageTenantWebsites: "គ្រប់គ្រងគេហទំព័រ",
    manageMainTenantUsers: "គ្រប់គ្រងអ្នកប្រើវេទិកា",
    manageRolePermissions: "គ្រប់គ្រងសិទ្ធិតួនាទី",
    mainTenantAnalytics: "វិភាគទិន្នន័យវេទិកា",
    filesImages: "ឯកសារ និងរូបភាព",
    publicHeroSlides: "ស្លាយមុខសាធារណៈ",
    sponsoredPlacements: "ទីតាំងផ្សាយពាណិជ្ជកម្ម",
    systemActivityLogs: "កំណត់ហេតុសកម្មភាពប្រព័ន្ធ",
    mainTenantConfiguration: "ការកំណត់អ្នកជួលមេ",
    overviewStats: "ទិដ្ឋភាព និងស្ថិតិ",
    manageContent: "គ្រប់គ្រងមាតិកា",
    viewAllArticles: "មើលអត្ថបទទាំងអស់",
    yourArticles: "អត្ថបទរបស់អ្នក",
    tenantWebsiteSetup: "រៀបចំគេហទំព័រ",
    articlesPendingReview: "អត្ថបទរង់ចាំពិនិត្យ",
    readerCommentActivity: "សកម្មភាពមតិយោបល់អ្នកអាន",
    organizeContent: "រៀបចំមាតិកា",
    performanceData: "ទិន្នន័យប្រតិបត្តិការ",
    userManagementDescription: "គ្រប់គ្រងអ្នកប្រើ",
    viewAllUsers: "មើលអ្នកប្រើទាំងអស់",
    manageUserRoles: "គ្រប់គ្រងតួនាទីអ្នកប្រើ",
    websiteConfiguration: "ការកំណត់គេហទំព័រ",
    passwordlessWebsiteReaders: "អ្នកអានគេហទំព័រដោយគ្មានពាក្យសម្ងាត់",
    createNewArticle: "បង្កើតអត្ថបទថ្មី",
    createTenantWebsite: "បង្កើតគេហទំព័រ",
    createNewUser: "បង្កើតអ្នកប្រើថ្មី",
    createNewCategory: "បង្កើតប្រភេទថ្មី",
    reviewArticles: "ពិនិត្យអត្ថបទ",
    createCarouselSlide: "បង្កើតស្លាយការ៉ូសែល",
  },
};

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
  _userRole?: string,
  locale: AdminLocale = "en",
): NavigationItem[] => {
  const copy = navCopy[locale];

  const navigationItems: NavigationItem[] = [
    // Dashboard - Available to all users
    {
      name: copy.dashboard,
      href: "/",
      icon: LayoutDashboard,
      badge: null,
      description: copy.overviewStats,
    },

    // Articles - Available to all users with different permissions
    {
      name: copy.articles,
      href: "/articles",
      icon: FileText,
      badge: counts.articles > 0 ? counts.articles.toString() : null,
      description: copy.manageContent,
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
    },

    {
      name: copy.websiteSettings,
      href: "/tenants",
      icon: Building2,
      badge: null,
      description: copy.tenantWebsiteSetup,
      permissions: [Permission.UPDATE_SETTINGS, Permission.SYSTEM_ADMINISTRATION],
    },

    // Review Queue - Editors and Admins only
    {
      name: copy.reviewQueue,
      href: "/review",
      icon: ClipboardList,
      badge: counts.reviewQueue ? counts.reviewQueue.toString() : null,
      description: copy.articlesPendingReview,
      permissions: [Permission.REVIEW_ARTICLES],
    },

    {
      name: copy.comments,
      href: "/comments",
      icon: MessageSquare,
      badge: null,
      description: copy.readerCommentActivity,
      permissions: [Permission.REVIEW_ARTICLES],
    },

    // Categories and topics - visible to roles with structure management access
    {
      name: copy.categories,
      href: "/categories",
      icon: Tags,
      badge: counts.categories > 0 ? counts.categories.toString() : null,
      description: copy.organizeContent,
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
      name: copy.media,
      href: "/media",
      icon: Image,
      badge: counts.media > 0 ? counts.media.toString() : null,
      description: copy.filesImages,
      permissions: [Permission.VIEW_MEDIA, Permission.MANAGE_MEDIA],
    },

    {
      name: copy.carousel,
      href: "/carousel",
      icon: Image,
      badge: null,
      description: copy.publicHeroSlides,
      permissions: [
        Permission.CREATE_CAROUSEL,
        Permission.UPDATE_CAROUSEL,
        Permission.DELETE_CAROUSEL,
      ],
    },

    {
      name: copy.ads,
      href: "/ads",
      icon: Megaphone,
      badge: null,
      description: copy.sponsoredPlacements,
      permissions: [Permission.VIEW_ADS],
    },

    // Analytics - Available to all users
    {
      name: copy.analytics,
      href: "/analytics",
      icon: BarChart3,
      badge: null,
      description: copy.performanceData,
      permissions: [Permission.VIEW_ANALYTICS],
    },

    // User Management - Admins only
    {
      name: copy.users,
      href: "/users",
      icon: Users,
      badge: counts.users > 0 ? counts.users.toString() : null,
      description: copy.userManagementDescription,
      permissions: [Permission.VIEW_ALL_USERS],
      children: [
        {
          name: copy.allUsers,
          href: "/users",
          icon: Users,
          description: copy.viewAllUsers,
          permissions: [Permission.VIEW_ALL_USERS],
        },
        {
          name: copy.roleManagement,
          href: "/users/roles",
          icon: Shield,
          description: copy.manageUserRoles,
          permissions: [Permission.MANAGE_USER_ROLES],
        },
      ],
    },

    // Audit Logs - Admins only
    {
      name: copy.auditLogs,
      href: "/audit",
      icon: Archive,
      badge: null,
      description: copy.systemActivityLogs,
      permissions: [Permission.VIEW_AUDIT_LOGS],
    },

  ];

  navigationItems.push({
    name: copy.settings,
    href: "/settings",
    icon: Settings,
    badge: null,
    description: copy.websiteConfiguration,
    permissions: [Permission.VIEW_SETTINGS],
  });

  navigationItems.push({
    name: copy.publicReaders,
    href: "/readers",
    icon: Users,
    badge: null,
    description: copy.passwordlessWebsiteReaders,
    permissions: [Permission.VIEW_SETTINGS],
  });

  return navigationItems;
};
