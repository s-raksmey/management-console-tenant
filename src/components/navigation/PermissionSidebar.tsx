// src/components/navigation/PermissionSidebar.tsx
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Permission, PermissionGuard } from "../permissions/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { getNavigationItems, NavigationItem } from "./NavigationItems";
import { useState, useEffect } from "react";
import { useCounts } from "@/hooks/useCounts";
import { useArticles } from "@/hooks/useGraphQL";


interface PermissionSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

interface NavigationItemComponentProps {
  item: NavigationItem;
  collapsed: boolean;
  isActive: boolean;
  level?: number;
}

const NavigationItemComponent: React.FC<NavigationItemComponentProps> = ({
  item,
  collapsed,
  isActive,
  level = 0,
}) => {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  
  // Auto-expand if current path matches any child
  const shouldAutoExpand = hasChildren && item.children?.some(child => 
    pathname === child.href || pathname.startsWith(child.href + '/')
  );
  
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand || false);

  // Update expanded state when pathname changes
  useEffect(() => {
    if (shouldAutoExpand && !isExpanded) {
      setIsExpanded(true);
    }
  }, [shouldAutoExpand, isExpanded]);

  const itemContent = (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200",
        level > 0 && "ml-4 border-l border-slate-200 pl-6 dark:border-slate-700",
        isActive
          ? "bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-500/15 dark:text-blue-200"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      )}
    >
      <item.icon
        className={cn(
          "h-5 w-5 transition-colors",
          isActive
            ? "text-blue-600 dark:text-blue-300"
            : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-100"
        )}
      />
      
      {!collapsed && (
        <>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium truncate">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {item.badge}
                </Badge>
              )}
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setIsExpanded(!isExpanded);
                  }}
                  className="ml-2 rounded p-1 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
            {!collapsed && level === 0 && (
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {item.description}
              </p>
            )}
          </div>
        </>
      )}

      {collapsed && item.badge && (
        <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs min-w-[20px] h-5">
          {item.badge}
        </Badge>
      )}
    </div>
  );

  return (
    <PermissionGuard
      permissions={item.permissions}
      roles={item.roles}
      fallback={null}
    >
      <div>
        {hasChildren && !collapsed ? (
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="cursor-pointer"
          >
            {itemContent}
          </div>
        ) : (
          <Link 
            href={item.href} 
            className="block"
            target={item.openInNewTab ? "_blank" : undefined}
            rel={item.openInNewTab ? "noopener noreferrer" : undefined}
          >
            {itemContent}
          </Link>
        )}

        {/* Render children if expanded */}
        {hasChildren && isExpanded && !collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 space-y-1"
          >
            {item.children?.map((child) => {
              const childIsActive = pathname === child.href || pathname.startsWith(child.href + '/');
              return (
                <NavigationItemComponent
                  key={child.href}
                  item={child}
                  collapsed={collapsed}
                  isActive={childIsActive}
                  level={level + 1}
                />
              );
            })}
          </motion.div>
        )}
      </div>
    </PermissionGuard>
  );
};

export function PermissionSidebar({ collapsed, onToggle, className }: PermissionSidebarProps) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { activeTenant } = useTenant();
  const { hasPermission, userRole } = usePermissions();
  const { counts } = useCounts(userRole);
  const { getArticles } = useArticles();
  const [reviewQueueCount, setReviewQueueCount] = useState(0);
  const brandName =
    userRole === "SUPER_ADMIN" ? "Management Console" : activeTenant?.name || "Pulse News";
  const brandInitials = brandName
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();


  useEffect(() => {
    const loadReviewCount = async () => {
      if (!hasPermission(Permission.REVIEW_ARTICLES)) {
        setReviewQueueCount(0);
        return;
      }

      const response = await getArticles({ status: 'REVIEW', take: 1000, skip: 0 });
      const count = response?.articles?.length || 0;
      setReviewQueueCount(count);
    };

    loadReviewCount();
  }, [getArticles, hasPermission]);



  const navigationItems = getNavigationItems(
    {
      ...counts,
      reviewQueue: reviewQueueCount,
    },
    userRole
  );

  // Keep the current sidebar mounted during background auth/permission refreshes.
  // Swapping to the loading shell after a user is already present causes a white flash on navigation.
  if (isLoading && !user) {
    return (
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
          className
        )}
      >
        <div className="flex h-12 items-center justify-center border-b border-slate-100 dark:border-slate-800">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-300"></div>
        </div>
      </motion.aside>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-slate-100 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
        {!collapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex min-w-0 items-center gap-3 rounded-md"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 ring-1 ring-slate-800 dark:bg-slate-800 dark:ring-slate-700">
              <span className="text-white font-semibold text-sm">
                {brandInitials || "PN"}
              </span>
            </div>
            <div className="min-w-0 leading-tight">
              <p className="max-w-[170px] truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {brandName}
              </p>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{userRole?.toLowerCase()} Panel</p>
            </div>
          </motion.div>
        ) : null}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-label={collapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
          title={collapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
          className="h-8 w-8 p-0 hover:bg-slate-100 focus-visible:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-scrollbar flex-1 overflow-y-auto overflow-x-hidden p-4 [scrollbar-color:#334155_transparent] [scrollbar-width:thin]">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <NavigationItemComponent
                key={item.href}
                item={item}
                collapsed={collapsed}
                isActive={isActive}
              />
            );
          })}
        </div>
      </nav>

      {/* User Info */}
      {!collapsed && user && (
        <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-500">
              <span className="text-white font-medium text-sm">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {user.name || user.email}
              </p>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
                {userRole?.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

export default PermissionSidebar;
