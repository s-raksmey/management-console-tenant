"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutWrapper } from './layout-wrapper';
import { ApolloClientProvider } from '@/components/providers/ApolloClientProvider';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/verify-email'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const superAdminAllowedRoutes = [
    '/',
    '/tenants',
    '/users',
    '/analytics',
    '/audit',
    '/settings',
    '/profile',
  ];
  const isSuperAdminRouteAllowed = superAdminAllowedRoutes.some((route) =>
    route === '/' ? pathname === route : pathname === route || pathname.startsWith(`${route}/`)
  );

  useEffect(() => {
    // Don't redirect while loading
    if (isInitializing) return;

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
    router,
    user?.role,
  ]);

  // Show loading spinner while checking authentication
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
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
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (
    user?.role === 'SUPER_ADMIN' &&
    !isPublicRoute &&
    !isSuperAdminRouteAllowed
  ) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Redirecting to platform dashboard...</p>
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
