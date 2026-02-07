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
  X,
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

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getNavigation = (userRole?: string) => {
  const baseItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Articles",
      href: "/articles",
      icon: FileText,
    },
    {
      name: "Categories",
      href: "/categories",
      icon: Tags,
    },
    {
      name: "Media",
      href: "/media",
      icon: Image,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
  ];

  if (userRole === "ADMIN") {
    baseItems.push({
      name: "Users",
      href: "/users",
      icon: Users,
    });
  }

  baseItems.push({
    name: "Settings",
    href: "/settings",
    icon: Settings,
  });

  return baseItems;
};

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const userRole = user?.role?.toString().toUpperCase();
  const navigation = getNavigation(userRole);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[280px] sm:w-[300px]">
        <SheetClose />
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Pulse News</div>
              <div className="text-xs text-slate-500">Admin Dashboard</div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-8 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-slate-500 text-center">
            © 2024 Pulse News
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileNavTrigger({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="md:hidden h-9 w-9 p-0"
      onClick={() => onOpenChange(true)}
    >
      <Menu className="h-4 w-4" />
      <span className="sr-only">Open navigation menu</span>
    </Button>
  );
}
