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
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "../permissions/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { getNavigationItems, NavigationItem } from "./NavigationItems";
import { useState, useEffect } from "react";
import { useCounts } from "@/hooks/useCounts";
import { useArticles } from "@/hooks/useGraphQL";
import { RegistrationRequestService } from "@/services/registrationRequest.gql";

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
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
        level > 0 && "ml-4 pl-6 border-l border-slate-200",
        isActive
          ? "bg-blue-50 text-blue-700 shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <item.icon
        className={cn(
          "h-5 w-5 transition-colors",
          isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
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
                  className="ml-2 p-1 rounded hover:bg-slate-200 transition-colors"
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
              <p className="text-xs text-slate-500 truncate mt-0.5">
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
  const { userRole } = usePermissions();
  const { counts } = useCounts(userRole);
  const { getArticles } = useArticles();
  const [reviewQueueCount, setReviewQueueCount] = useState(0);
  const [pendingRegistrationCount, setPendingRegistrationCount] = useState(0);

  useEffect(() => {
    const loadReviewCount = async () => {
      if (!userRole || userRole.toString().toUpperCase() === 'AUTHOR') {
        setReviewQueueCount(0);
        return;
      }

      const response = await getArticles({ status: 'REVIEW', take: 1000, skip: 0 });
      const count = response?.articles?.length || 0;
      setReviewQueueCount(count);
    };

    loadReviewCount();
  }, [getArticles, userRole]);

  useEffect(() => {
    const loadRegistrationCount = async () => {
      if (!userRole || userRole.toString().toUpperCase() !== 'ADMIN') {
        setPendingRegistrationCount(0);
        return;
      }

      try {
        const stats = await RegistrationRequestService.getRegistrationStats();
        setPendingRegistrationCount(stats.pendingApproval || 0);
      } catch (error) {
        console.error('Error loading registration stats:', error);
        setPendingRegistrationCount(0);
      }
    };

    loadRegistrationCount();
  }, [userRole]);

  const navigationItems = getNavigationItems(
    {
      ...counts,
      reviewQueue: reviewQueueCount,
      pendingRegistrations: pendingRegistrationCount,
    },
    userRole
  );

  // Don't render navigation until user data is loaded
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
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-slate-100 bg-white">
        {!collapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
              <span className="text-white font-semibold text-sm">PN</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Pulse News</p>
              <p className="text-xs text-slate-500 capitalize">{userRole?.toLowerCase()} Panel</p>
            </div>
          </motion.div>
        ) : null}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0 hover:bg-slate-100"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
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
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user.name || user.email}
              </p>
              <p className="text-xs text-slate-500 capitalize">
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
