"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/components/permissions/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { LayoutWrapper } from './layout-wrapper';
import { ApolloClientProvider } from '@/components/providers/ApolloClientProvider';
import { useAdminLocale } from '@/hooks/useAdminLocale';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const { locale } = useAdminLocale();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const copy = locale === 'km'
    ? {
        loading: 'កំពុងផ្ទុក...',
        loginRedirect: 'កំពុងបញ្ជូនទៅទំព័រចូល...',
        dashboardRedirect: 'កំពុងបញ្ជូនទៅផ្ទាំងគ្រប់គ្រងវេទិកា...',
      }
    : {
        loading: 'Loading...',
        loginRedirect: 'Redirecting to login...',
        dashboardRedirect: 'Redirecting to platform dashboard...',
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
    '/carousel',
    '/audit',
    '/settings',
    '/profile',
  ];
  const isSuperAdminRouteAllowed = superAdminAllowedRoutes.some((route) =>
    route === '/' ? pathname === route : pathname === route || pathname.startsWith(`${route}/`)
  ) || (
    (pathname === '/ads' || pathname.startsWith('/ads/')) &&
    hasPermission(Permission.VIEW_ADS)
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
