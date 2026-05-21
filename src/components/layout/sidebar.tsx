"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  BarChart3,
  Tags,
  Image,
  Shield,
  ChevronLeft,
  ChevronRight,
  Hash,
  Archive,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCounts } from "@/hooks/useCounts";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Permission } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";

type SidebarNavigationItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge: string | null;
  description: string;
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

const getNavigation = (
  counts: { articles: number; users: number; categories: number; media: number },
  userRole?: string,
  permissions: {
    canViewSettings: boolean;
    canViewUsers: boolean;
    canViewMedia: boolean;
    canViewAnalytics: boolean;
    canViewCarousel: boolean;
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
    canViewAuditLogs: false,
    canSystemAdmin: false,
    canManageRoles: false,
    canManageStructure: false,
    canUpdateSettings: false,
  },
) => {
  if (userRole === "SUPER_ADMIN") {
    const platformItems: SidebarNavigationItem[] = [
      {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        badge: null,
        description: "Platform overview"
      },
    ];

    if (permissions.canViewAnalytics) {
      platformItems.push({
        name: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        badge: null,
        description: "Platform analytics"
      });
    }

    if (permissions.canViewUsers) {
      platformItems.push({
        name: "User Management",
        href: "/users",
        icon: Users,
        badge: counts.users > 0 ? counts.users.toString() : null,
        description: "Manage platform users"
      });
    }

    if (permissions.canSystemAdmin) {
      platformItems.push({
        name: "Tenant Management",
        href: "/tenants",
        icon: Building2,
        badge: null,
        description: "Manage tenant websites"
      });
    }

    if (permissions.canManageRoles) {
      platformItems.push({
        name: "Role Management",
        href: "/users/roles",
        icon: Shield,
        badge: null,
        description: "Manage role permissions"
      });
    }

    if (permissions.canViewMedia) {
      platformItems.push({
        name: "Media",
        href: "/media",
        icon: Image,
        badge: counts.media > 0 ? counts.media.toString() : null,
        description: "Files & images"
      });
    }

    if (permissions.canViewCarousel) {
      platformItems.push({
        name: "Carousel",
        href: "/carousel",
        icon: Image,
        badge: null,
        description: "Public hero slides"
      });
    }

    if (permissions.canViewAuditLogs) {
      platformItems.push({
        name: "Logs",
        href: "/audit",
        icon: Archive,
        badge: null,
        description: "System activity logs"
      });
    }

    if (permissions.canViewSettings) {
      platformItems.push({
        name: "Settings",
        href: "/settings",
        icon: Settings,
        badge: null,
        description: "Platform config"
      });
    }

    return platformItems;
  }

  // Base navigation items available to all users
  const baseItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      badge: null,
      description: "Overview & stats"
    },
    {
      name: "Articles",
      href: "/articles",
      icon: FileText,
      badge: counts.articles > 0 ? counts.articles.toString() : null,
      description: "Manage content"
    },
  ];

  if (permissions.canUpdateSettings || permissions.canSystemAdmin) {
    baseItems.push({
      name: "Website Settings",
      href: "/tenants",
      icon: Building2,
      badge: null,
      description: "Tenant website setup"
    });
  }

  if (permissions.canManageStructure) {
    baseItems.push(
      {
        name: "Categories",
        href: "/categories",
        icon: Tags,
        badge: counts.categories > 0 ? counts.categories.toString() : null,
        description: "Organize content"
      },
      {
        name: "Topics",
        href: "/topics",
        icon: Hash,
        badge: null,
        description: "Manage topics"
      },
    );
  }

  if (permissions.canViewMedia) {
    baseItems.push({
      name: "Media",
      href: "/media",
      icon: Image,
      badge: counts.media > 0 ? counts.media.toString() : null,
      description: "Files & images"
    });
  }

  if (permissions.canViewCarousel) {
    baseItems.push({
      name: "Carousel",
      href: "/carousel",
      icon: Image,
      badge: null,
      description: "Homepage hero slides"
    });
  }

  if (permissions.canViewAnalytics) {
    baseItems.push({
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      badge: null,
      description: "Performance data"
    });
  }

  if (permissions.canViewUsers) {
    baseItems.push({
      name: "Users",
      href: "/users",
      icon: Users,
      badge: counts.users > 0 ? counts.users.toString() : null,
      description: "User management"
    });
  }

  if (permissions.canViewSettings) {
    baseItems.push({
      name: "Settings",
      href: "/settings",
      icon: Settings,
      badge: null,
      description: "Website configuration"
    });
  }

  return baseItems;
};

export function Sidebar({ collapsed, onToggle, className }: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { activeTenant } = useTenant();
  const { hasPermission } = usePermissions();
  
  // Ensure we have a stable user role value with proper normalization
  const userRole = user?.role?.toString().toUpperCase();
  const brandName =
    userRole === "SUPER_ADMIN" ? "Management Console" : activeTenant?.name || "Pulse News";
  const brandInitials = brandName
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  
  const { counts, loading } = useCounts(userRole);
  const navigation = getNavigation(counts, userRole, {
    canViewSettings: hasPermission(Permission.VIEW_SETTINGS),
    canViewUsers: hasPermission(Permission.VIEW_ALL_USERS),
    canViewMedia:
      hasPermission(Permission.VIEW_MEDIA) || hasPermission(Permission.MANAGE_MEDIA),
    canViewAnalytics: hasPermission(Permission.VIEW_ANALYTICS),
    canViewCarousel:
      hasPermission(Permission.CREATE_CAROUSEL) ||
      hasPermission(Permission.UPDATE_CAROUSEL) ||
      hasPermission(Permission.DELETE_CAROUSEL),
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

  // Don't render navigation until user data is loaded to prevent flashing
  if (isLoading) {
    return (
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 flex flex-col",
          className
        )}
      >
        <div className="flex items-center justify-center h-16">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </motion.aside>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{
        width: collapsed ? 80 : 280,
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-3"
          >
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">
                {brandInitials || "PN"}
              </span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg truncate max-w-[170px]">
                {brandName}
              </h1>
              <p className="text-xs text-slate-500 font-medium">Admin Dashboard</p>
            </div>
          </motion.div>
        )}
        
        {collapsed && (
          <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
            <span className="text-white font-bold text-lg">
              {brandInitials || "PN"}
            </span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0 hover:bg-slate-100 transition-colors duration-200"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href}>
              <motion.div
                whileHover={{ scale: collapsed ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "group relative flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors duration-200",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                )} />
                
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between flex-1 ml-3"
                  >
                    <div>
                      <span className="block">{item.name}</span>
                      <span className={cn(
                        "text-xs transition-colors duration-200",
                        isActive ? "text-blue-100" : "text-slate-400"
                      )}>
                        {item.description}
                      </span>
                    </div>
                    {item.badge && (
                      <Badge 
                        variant={isActive ? "secondary" : "outline"} 
                        className={cn(
                          "text-xs h-5 px-2",
                          isActive 
                            ? "bg-white/20 text-white border-white/30" 
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </motion.div>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-slate-300">{item.description}</div>
                    {item.badge && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">Online</span>
              </div>
            </div>
            <div className="text-xs text-slate-500 text-center">
              © 2024 {brandName}
            </div>
          </motion.div>
        )}
        
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
