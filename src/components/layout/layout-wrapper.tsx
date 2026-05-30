"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  const [isMobile, setIsMobile] = useState(false);
  const isWidePage = pathname === "/settings" || pathname === "/tenants";

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
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
      <motion.div
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 80 : 280),
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="min-h-screen min-w-0"
      >
        {/* Header */}
        <Header onMobileNavOpen={setMobileNavOpen} showBrand={sidebarCollapsed} />

        {/* Page Content */}
        <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className={isWidePage ? "min-w-0 w-full space-y-5 sm:space-y-6" : "mx-auto min-w-0 max-w-7xl space-y-5 sm:space-y-6"}>
            {children}
          </div>
        </main>
      </motion.div>
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
