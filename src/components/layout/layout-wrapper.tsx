"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { PermissionSidebar } from "../navigation/PermissionSidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { PageSkeleton, TenantsPageSkeleton } from "./page-skeleton";
import { ToastContainer } from "@/components/ui/toast";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const isWidePage = pathname === "/settings" || pathname === "/tenants";

  useEffect(() => {
    setContentReady(true);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.pathname === pathname && url.search === window.location.search) return;

      setContentReady(false);
    };

    const onPopState = () => setContentReady(false);

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [pathname]);

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
            {contentReady ? children : pathname === "/tenants" ? <TenantsPageSkeleton /> : <PageSkeleton />}
          </div>
        </main>
      </div>
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
