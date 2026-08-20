"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  BarChart3,
  Tags,
  Image,
  Menu,
  Building2,
  Archive,
  Shield,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Permission } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useAdminLocale, type AdminLocale } from "@/hooks/useAdminLocale";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getNavigation = (
  userRole?: string,
  locale: AdminLocale = "en",
  permissions: {
    canViewSettings: boolean;
    canViewUsers: boolean;
    canViewMedia: boolean;
    canViewAnalytics: boolean;
    canViewCarousel: boolean;
    canViewAds: boolean;
    canViewAuditLogs: boolean;
    canSystemAdmin: boolean;
    canManageRoles: boolean;
    canManageStructure: boolean;
    canUpdateSettings: boolean;
  } = {
    canViewSettings: false,
    canViewUsers: false,
    canViewMedia: false,
    canViewAnalytics: false,
    canViewCarousel: false,
    canViewAds: false,
    canViewAuditLogs: false,
    canSystemAdmin: false,
    canManageRoles: false,
    canManageStructure: false,
    canUpdateSettings: false,
  },
) => {
  const copy = {
    en: {
      dashboard: "Dashboard",
      tenantManagement: "Tenant Management",
      userManagement: "User Management",
      roleManagement: "Role Management",
      analytics: "Analytics",
      media: "Media",
      carousel: "Carousel",
      ads: "Ads",
      logs: "Logs",
      settings: "Settings",
      articles: "Articles",
      websiteSettings: "Website Settings",
      categories: "Categories",
      users: "Users",
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
      websiteSettings: "ការកំណត់គេហទំព័រ",
      categories: "ប្រភេទ",
      users: "អ្នកប្រើ",
    },
  }[locale];

  if (userRole === "SUPER_ADMIN") {
    const platformItems = [
      {
        name: copy.dashboard,
        href: "/",
        icon: LayoutDashboard,
      },
    ];

    if (permissions.canSystemAdmin) {
      platformItems.push({
        name: copy.tenantManagement,
        href: "/tenants",
        icon: Building2,
      });
    }

    if (permissions.canViewUsers) {
      platformItems.push({
        name: copy.userManagement,
        href: "/users",
        icon: Users,
      });
    }

    if (permissions.canManageRoles) {
      platformItems.push({
        name: copy.roleManagement,
        href: "/users/roles",
        icon: Shield,
      });
    }

    if (permissions.canViewAnalytics) {
      platformItems.push({
        name: copy.analytics,
        href: "/analytics",
        icon: BarChart3,
      });
    }

    if (permissions.canViewMedia) {
      platformItems.push({
        name: copy.media,
        href: "/media",
        icon: Image,
      });
    }

    if (permissions.canViewCarousel) {
      platformItems.push({
        name: copy.carousel,
        href: "/carousel",
        icon: Image,
      });
    }

    if (permissions.canViewAds) {
      platformItems.push({
        name: copy.ads,
        href: "/ads",
        icon: Megaphone,
      });
    }

    if (permissions.canViewAuditLogs) {
      platformItems.push({
        name: copy.logs,
        href: "/audit",
        icon: Archive,
      });
    }

    if (permissions.canViewSettings) {
      platformItems.push({
        name: copy.settings,
        href: "/settings",
        icon: Settings,
      });
    }

    return platformItems;
  }

  const baseItems = [
    {
      name: copy.dashboard,
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: copy.articles,
      href: "/articles",
      icon: FileText,
    },
  ];

  if (permissions.canUpdateSettings || permissions.canSystemAdmin) {
    baseItems.push({
      name: copy.websiteSettings,
      href: "/tenants",
      icon: Building2,
    });
  }

  if (permissions.canManageStructure) {
    baseItems.push({
      name: copy.categories,
      href: "/categories",
      icon: Tags,
    });
  }

  if (permissions.canViewMedia) {
    baseItems.push({
      name: copy.media,
      href: "/media",
      icon: Image,
    });
  }

  if (permissions.canViewCarousel) {
    baseItems.push({
      name: copy.carousel,
      href: "/carousel",
      icon: Image,
    });
  }

  if (permissions.canViewAds) {
    baseItems.push({
      name: copy.ads,
      href: "/ads",
      icon: Megaphone,
    });
  }

  if (permissions.canViewAnalytics) {
    baseItems.push({
      name: copy.analytics,
      href: "/analytics",
      icon: BarChart3,
    });
  }

  if (permissions.canViewUsers) {
    baseItems.push({
      name: copy.users,
      href: "/users",
      icon: Users,
    });
  }

  if (permissions.canViewSettings) {
    baseItems.push({
      name: copy.settings,
      href: "/settings",
      icon: Settings,
    });
  }

  return baseItems;
};

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { activeTenant } = useTenant();
  const { hasPermission } = usePermissions();
  const { locale } = useAdminLocale();
  const userRole = user?.role?.toString().toUpperCase();
  const navigation = getNavigation(userRole, locale, {
    canViewSettings: hasPermission(Permission.VIEW_SETTINGS),
    canViewUsers: hasPermission(Permission.VIEW_ALL_USERS),
    canViewMedia:
      hasPermission(Permission.VIEW_MEDIA) || hasPermission(Permission.MANAGE_MEDIA),
    canViewAnalytics: hasPermission(Permission.VIEW_ANALYTICS),
    canViewCarousel:
      hasPermission(Permission.CREATE_CAROUSEL) ||
      hasPermission(Permission.UPDATE_CAROUSEL) ||
      hasPermission(Permission.DELETE_CAROUSEL),
    canViewAds: hasPermission(Permission.VIEW_ADS),
    canViewAuditLogs: hasPermission(Permission.VIEW_AUDIT_LOGS),
    canSystemAdmin: hasPermission(Permission.SYSTEM_ADMINISTRATION),
    canManageRoles: hasPermission(Permission.MANAGE_USER_ROLES),
    canUpdateSettings: hasPermission(Permission.UPDATE_SETTINGS),
    canManageStructure:
      hasPermission(Permission.CREATE_CATEGORY) ||
      hasPermission(Permission.UPDATE_CATEGORY) ||
      hasPermission(Permission.DELETE_CATEGORY) ||
      hasPermission(Permission.CREATE_TOPIC) ||
      hasPermission(Permission.UPDATE_TOPIC) ||
      hasPermission(Permission.DELETE_TOPIC),
  });
  const brandName =
    userRole === "SUPER_ADMIN" ? "Management Console" : activeTenant?.name || "Pulse News";
  const brandInitials = brandName
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      className="w-[min(86vw,320px)] max-w-none bg-white p-0 dark:bg-slate-900"
    >
      <SheetContent className="flex w-full flex-col overflow-hidden p-0">
        <SheetClose />
        <SheetHeader className="border-b px-4 py-4 text-left">
          <SheetTitle className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-white font-bold text-sm">
                {brandInitials || "PN"}
              </span>
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-slate-900">{brandName}</div>
              <div className="text-xs text-slate-500">
                {locale === "km" ? "ផ្ទាំងគ្រប់គ្រង" : "Admin Dashboard"}
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t px-4 py-3">
          <div className="text-xs text-slate-500 text-center">
            © 2024 {brandName}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileNavTrigger({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const { locale } = useAdminLocale();

  return (
    <Button
      variant="outline"
      size="sm"
      className="md:hidden h-9 w-9 p-0"
      onClick={() => onOpenChange(true)}
    >
      <Menu className="h-4 w-4" />
      <span className="sr-only">{locale === "km" ? "បើកម៉ឺនុយរុករក" : "Open navigation menu"}</span>
    </Button>
  );
}
