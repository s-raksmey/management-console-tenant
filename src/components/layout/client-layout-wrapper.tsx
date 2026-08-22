"use client";

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/components/permissions/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { LayoutWrapper } from './layout-wrapper';
import { ApolloClientProvider } from '@/components/providers/ApolloClientProvider';
import { useAdminLocale } from '@/hooks/useAdminLocale';
import { AuditService } from '@/services/audit.gql';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const { locale } = useAdminLocale();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const lastTrackedPage = useRef<string | null>(null);
  const copy = locale === 'km'
    ? {
        loading: 'កំពុងផ្ទុក...',
        loginRedirect: 'កំពុងបញ្ជូនទៅទំព័រចូល...',
        dashboardRedirect: 'កំពុងបញ្ជូនទៅផ្ទាំងគ្រប់គ្រងអ្នកជួលមេ...',
      }
    : {
        loading: 'Loading...',
        loginRedirect: 'Redirecting to login...',
        dashboardRedirect: 'Redirecting to the Main Tenant dashboard...',
      };

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const superAdminAllowedRoutes = [
    '/',
    '/tenants',
    '/users',
    '/analytics',
    '/media',
    '/audit',
    '/settings',
    '/profile',
  ];
  const isSuperAdminRouteAllowed = superAdminAllowedRoutes.some((route) =>
    route === '/' ? pathname === route : pathname === route || pathname.startsWith(`${route}/`)
  );

  useEffect(() => {
    // Don't redirect while loading
    if (isInitializing || permissionsLoading) return;

    // If not authenticated and trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
      return;
    }

    // If authenticated and on login page, redirect to dashboard
    if (isAuthenticated && pathname === '/login') {
      router.push('/');
      return;
    }

    if (
      isAuthenticated &&
      user?.role === 'SUPER_ADMIN' &&
      !isPublicRoute &&
      !isSuperAdminRouteAllowed
    ) {
      router.push('/');
      return;
    }
  }, [
    isAuthenticated,
    isInitializing,
    isPublicRoute,
    isSuperAdminRouteAllowed,
    pathname,
    permissionsLoading,
    router,
    user?.role,
  ]);

  useEffect(() => {
    if (!isAuthenticated || isInitializing || isPublicRoute || !user?.id) return;

    const trackingKey = `${user.id}:${pathname}`;
    if (lastTrackedPage.current === trackingKey) return;
    lastTrackedPage.current = trackingKey;

    void AuditService.trackPageView(pathname, document.title).catch(() => {
      lastTrackedPage.current = null;
    });
  }, [isAuthenticated, isInitializing, isPublicRoute, pathname, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || isInitializing || isPublicRoute || !user?.id) return;

    const interactiveSelector = [
      'a',
      'button',
      '[role="button"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[role="tab"]',
      '[role="switch"]',
      '[role="checkbox"]',
      'input[type="checkbox"]',
      'input[type="radio"]',
      'select',
      'summary',
    ].join(',');

    const handleInteraction = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(interactiveSelector)
        : null;
      if (!target || target.closest('[data-audit-ignore="true"]')) return;

      const tag = target.tagName.toLowerCase();
      const role = target.getAttribute('role');
      const type = target.getAttribute('type');
      const name = target.getAttribute('name');
      const id = target.id;
      const element = [tag, role && `role:${role}`, type && `type:${type}`, name && `name:${name}`, id && `id:${id}`]
        .filter(Boolean)
        .join(' ')
        .slice(0, 80);
      const label = (
        target.getAttribute('aria-label') ||
        target.getAttribute('title') ||
        target.textContent ||
        ''
      ).replace(/\s+/g, ' ').trim().slice(0, 160) || undefined;

      // Never record form values, typed text, or password content.
      void AuditService.trackUserInteraction(pathname, element, label).catch(() => undefined);
    };

    document.addEventListener('click', handleInteraction, true);
    return () => document.removeEventListener('click', handleInteraction, true);
  }, [isAuthenticated, isInitializing, isPublicRoute, pathname, user?.id]);

  // Show loading spinner while checking authentication
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{copy.loading}</p>
        </div>
      </div>
    );
  }

  // For public routes (like login), render without layout wrapper but with ApolloProvider
  if (isPublicRoute) {
    return <ApolloClientProvider>{children}</ApolloClientProvider>;
  }

  // For protected routes, ensure user is authenticated
  if (!isAuthenticated) {
    // This will be handled by the useEffect redirect, but just in case
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">{copy.loginRedirect}</p>
        </div>
      </div>
    );
  }

  if (
    user?.role === 'SUPER_ADMIN' &&
    !permissionsLoading &&
    !isPublicRoute &&
    !isSuperAdminRouteAllowed
  ) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">{copy.dashboardRedirect}</p>
        </div>
      </div>
    );
  }

  // Render with full layout for authenticated users, wrapped in ApolloProvider
  return (
    <ApolloClientProvider>
      <LayoutWrapper>
        {children}
      </LayoutWrapper>
    </ApolloClientProvider>
  );
}
