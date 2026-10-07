"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PermissionSidebar } from "../navigation/PermissionSidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { ToastContainer } from "@/components/ui/toast";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isWidePage = pathname === "/settings" || pathname === "/tenants";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <PermissionSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
      </div>

      {/* Mobile Navigation */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      {/* Main Content */}
      <div
        className={`box-border min-h-screen min-w-0 ${sidebarCollapsed ? "md:ml-20 md:w-[calc(100%-5rem)]" : "md:ml-[280px] md:w-[calc(100%-280px)]"}`}
      >
        {/* Header */}
        <Header onMobileNavOpen={setMobileNavOpen} showBrand={sidebarCollapsed} />

        {/* Page Content */}
        <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className={isWidePage ? "min-w-0 w-full space-y-5 sm:space-y-6" : "mx-auto min-w-0 max-w-7xl space-y-5 sm:space-y-6"}>
            {children}
          </div>
        </main>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
