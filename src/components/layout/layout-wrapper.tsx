"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PermissionSidebar } from "../navigation/PermissionSidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { ToastContainer } from "@/components/ui/toast";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <PermissionSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
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
        className="min-h-screen"
      >
        {/* Header */}
        <Header onMobileNavOpen={setMobileNavOpen} />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </motion.div>
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
