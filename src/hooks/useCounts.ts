'use client';

import { useState, useEffect } from 'react';
import { useArticles, useCategories } from './useGraphQL';
import { getAuthFetchHeaders } from '@/services/graphql-client';
import { UserService } from '@/services/user.gql';
import { Permission } from '@/components/permissions/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';

interface Counts {
  articles: number;
  users: number;
  categories: number;
  media: number;
}

interface CountsResult {
  counts: Counts;
  loading: boolean;
  errors: {
    users?: string;
  };
}

export function useCounts(userRole?: string): CountsResult {
  const [counts, setCounts] = useState<Counts>({
    articles: 0,
    users: 0,
    categories: 0,
    media: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{ users?: string }>({});
  
  const { getArticles } = useArticles();
  const { getCategories } = useCategories();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        
        // Fetch articles count using GraphQL
        const articlesData = await getArticles({ take: 1000, skip: 0 });
        const articlesCount = articlesData?.articles?.length || 0;

        // Fetch users count using GraphQL stats (more efficient and reliable)
        let usersCount = 0;
        let userError: string | undefined;
        
        if (hasPermission(Permission.VIEW_ALL_USERS)) {
          try {
            const userStats = await UserService.getUserStats();
            usersCount = userStats?.totalUsers || 0;
            setErrors(prev => ({ ...prev, users: undefined })); // Clear any previous errors
          } catch (error) {
            console.warn('Failed to fetch users count via getUserStats, attempting fallback:', error);
            
            // Check if it's a permission error (multiple ways to detect this)
            const isPermissionError = error instanceof Error && (
              error.message.includes('Admin role required') ||
              error.message.includes('permission') ||
              error.message.includes('AuthorizationError') ||
              error.message.includes('returned null') // This often indicates auth failure
            );
            
            if (isPermissionError) {
              // Try basic stats fallback (requires only authentication)
              try {
                const basicStats = await UserService.getBasicStats();
                usersCount = basicStats?.totalUsers || 0;
                userError = 'Admin access required for detailed user statistics';
                setErrors(prev => ({ ...prev, users: userError }));
              } catch (basicError) {
                console.warn('Basic stats fallback also failed:', basicError);
                
                // Final fallback: Try to get a rough count from listUsers query
                try {
                  const usersResult = await UserService.listUsers({ take: 1000, skip: 0 });
                  usersCount = usersResult?.totalCount || 0;
                  userError = 'Admin access required for user management';
                  setErrors(prev => ({ ...prev, users: userError }));
                } catch (fallbackError) {
                  console.warn('All user count methods failed:', fallbackError);
                  userError = 'Unable to fetch user statistics';
                  setErrors(prev => ({ ...prev, users: userError }));
                }
              }
            } else {
              // Non-permission error, try other fallbacks
              try {
                const usersResult = await UserService.listUsers({ take: 1000, skip: 0 });
                usersCount = usersResult?.totalCount || 0;
              } catch (fallbackError) {
                console.warn('Fallback users count also failed:', fallbackError);
                userError = 'Unable to fetch user statistics';
                setErrors(prev => ({ ...prev, users: userError }));
              }
            }
          }
        } else {
          // For non-admin users, set users count to 0 and clear any errors
          usersCount = 0;
          setErrors(prev => ({ ...prev, users: undefined }));
        }

        // Fetch categories count using GraphQL
        const categoriesData = await getCategories();
        const categoriesCount = categoriesData?.categories?.length || 0;

        // Fetch media count using REST API (this one exists)
        let mediaCount = 0;
        try {
          const mediaResponse = await fetch('/api/media/upload', {
            headers: getAuthFetchHeaders(),
          });
          const mediaData = await mediaResponse.json();
          mediaCount = mediaData.success ? (mediaData.files?.length || 0) : 0;
        } catch (mediaError) {
          console.warn('Failed to fetch media count:', mediaError);
          // Keep default value of 0
        }

        setCounts({
          articles: articlesCount,
          users: usersCount,
          categories: categoriesCount,
          media: mediaCount,
        });
      } catch (error) {
        console.error('Failed to fetch counts:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [getArticles, getCategories, hasPermission, userRole]);

  return { counts, loading, errors };
}
