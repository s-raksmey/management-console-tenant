// src/hooks/useUserManagement.ts
import { useState, useCallback } from 'react';
import { getAuthenticatedGqlClient } from '@/services/graphql-client';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR';
  isActive: boolean;
  createdAt: string;
  tenantMemberships?: Array<{
    id: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR';
    isActive: boolean;
    tenant: {
      id: string;
      name: string;
      slug: string;
      status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
    };
  }>;
}

export interface UserListResult {
  users: User[];
  totalCount: number;
  hasMore: boolean;
  filters: {
    search?: string;
    role?: string;
    status?: string;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: {
    admin: number;
    editor: number;
    author: number;
  };
  recentRegistrations: number;
}

export interface BasicStats {
  totalUsers: number;
  totalArticles: number;
}

export interface UserManagementResult {
  success: boolean;
  message: string;
  user?: User;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  activityType: string;
  details?: any;
  performedBy: string;
  timestamp: string;
  user?: User;
}

export interface ListUsersInput {
  take?: number;
  skip?: number;
  search?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR';
  status?: 'ACTIVE' | 'INACTIVE';
  sortBy?: 'name' | 'email' | 'role' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR';
  isActive?: boolean;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserProfileInput {
  userId: string;
  name: string;
  email: string;
}

export interface UpdateUserRoleInput {
  userId: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR';
}

export interface UpdateUserStatusInput {
  userId: string;
  isActive: boolean;
  reason?: string;
}

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface RequestPasswordResetInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

const AUTH_REQUIRED_MESSAGE = 'Authentication required';

function isAuthenticationRequiredError(error: any): boolean {
  if (
    typeof error?.message === 'string' &&
    error.message.includes(AUTH_REQUIRED_MESSAGE)
  ) {
    return true;
  }

  return (
    error?.response?.errors?.some(
      (item: { message?: string }) => item.message === AUTH_REQUIRED_MESSAGE,
    ) ?? false
  );
}

// ============================================================================
// GRAPHQL QUERIES
// ============================================================================

const LIST_USERS_QUERY = `
  query ListUsers($input: ListUsersInput!) {
    listUsers(input: $input) {
      users {
        id
        email
        name
        role
        isActive
        createdAt
        tenantMemberships {
          id
          role
          isActive
          tenant {
            id
            name
            slug
            status
          }
        }
      }
      totalCount
      hasMore
      filters {
        search
        role
        status
      }
    }
  }
`;

const GET_USER_BY_ID_QUERY = `
  query GetUserById($id: ID!) {
    getUserById(id: $id) {
      id
      email
      name
      role
      isActive
      createdAt
    }
  }
`;

const GET_USER_STATS_QUERY = `
  query GetUserStats {
    getUserStats {
      totalUsers
      activeUsers
      inactiveUsers
      usersByRole {
        admin
        editor
        author
      }
      recentRegistrations
    }
  }
`;

const GET_BASIC_STATS_QUERY = `
  query GetBasicStats {
    getBasicStats {
      totalUsers
      totalArticles
    }
  }
`;

const GET_USER_ACTIVITY_QUERY = `
  query GetUserActivity($userId: ID, $limit: Int) {
    getUserActivity(userId: $userId, limit: $limit) {
      id
      userId
      activityType
      details
      performedBy
      timestamp
      user {
        id
        name
        email
      }
    }
  }
`;

// ============================================================================
// GRAPHQL MUTATIONS
// ============================================================================

const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      success
      message
      user {
        id
        email
        name
        role
        isActive
        createdAt
      }
    }
  }
`;

const UPDATE_USER_PROFILE_MUTATION = `
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(input: $input) {
      success
      message
      user {
        id
        email
        name
        role
        isActive
        createdAt
      }
    }
  }
`;

const UPDATE_USER_ROLE_MUTATION = `
  mutation UpdateUserRole($input: UpdateUserRoleInput!) {
    updateUserRole(input: $input) {
      success
      message
      user {
        id
        email
        name
        role
        isActive
        createdAt
      }
    }
  }
`;

const UPDATE_USER_STATUS_MUTATION = `
  mutation UpdateUserStatus($input: UpdateUserStatusInput!) {
    updateUserStatus(input: $input) {
      success
      message
      user {
        id
        email
        name
        role
        isActive
        createdAt
      }
    }
  }
`;

const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
      message
    }
  }
`;

const BULK_UPDATE_USER_ROLES_MUTATION = `
  mutation BulkUpdateUserRoles($userIds: [ID!]!, $role: UserRole!) {
    bulkUpdateUserRoles(userIds: $userIds, role: $role) {
      success
      message
    }
  }
`;

const BULK_UPDATE_USER_STATUS_MUTATION = `
  mutation BulkUpdateUserStatus($userIds: [ID!]!, $isActive: Boolean!) {
    bulkUpdateUserStatus(userIds: $userIds, isActive: $isActive) {
      success
      message
    }
  }
`;

const CHANGE_PASSWORD_MUTATION = `
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      success
      message
    }
  }
`;

const REQUEST_PASSWORD_RESET_MUTATION = `
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input) {
      success
      message
    }
  }
`;

const RESET_PASSWORD_MUTATION = `
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      success
      message
    }
  }
`;

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export function useUserManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const executeQuery = useCallback(async <T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const client = getAuthenticatedGqlClient(token ?? undefined);
      const response = await client.request<T>(query, variables);
      return response;
    } catch (err: any) {
      const isAuthRequired = isAuthenticationRequiredError(err);

      if (!isAuthRequired) {
        console.error('User Management GraphQL Error:', err);
      }

      if (isAuthRequired) {
        setError(null);
        return null;
      }
      
      // Handle GraphQL errors
      if (err.response?.errors) {
        const errorMessages = err.response.errors.map((e: any) => e.message).join(', ');
        setError(errorMessages);
      } else {
        setError(err.message || 'An unknown error occurred');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ============================================================================
  // QUERY FUNCTIONS
  // ============================================================================

  const listUsers = useCallback(async (input: ListUsersInput = {}): Promise<UserListResult | null> => {
    const response = await executeQuery<{ listUsers: UserListResult }>(LIST_USERS_QUERY, { input });
    return response?.listUsers || null;
  }, [executeQuery]);

  const getUserById = useCallback(async (id: string): Promise<User | null> => {
    const response = await executeQuery<{ getUserById: User }>(GET_USER_BY_ID_QUERY, { id });
    return response?.getUserById || null;
  }, [executeQuery]);

  const getUserStats = useCallback(async (): Promise<UserStats | null> => {
    const response = await executeQuery<{ getUserStats: UserStats }>(GET_USER_STATS_QUERY);
    return response?.getUserStats || null;
  }, [executeQuery]);

  const getBasicStats = useCallback(async (): Promise<BasicStats | null> => {
    const response = await executeQuery<{ getBasicStats: BasicStats }>(GET_BASIC_STATS_QUERY);
    return response?.getBasicStats || null;
  }, [executeQuery]);

  const getUserActivity = useCallback(async (userId?: string, limit = 50): Promise<ActivityLog[] | null> => {
    const response = await executeQuery<{ getUserActivity: ActivityLog[] }>(GET_USER_ACTIVITY_QUERY, { userId, limit });
    return response?.getUserActivity || null;
  }, [executeQuery]);

  // ============================================================================
  // MUTATION FUNCTIONS
  // ============================================================================

  const createUser = useCallback(async (input: CreateUserInput): Promise<UserManagementResult | null> => {
    const response = await executeQuery<{ createUser: UserManagementResult }>(CREATE_USER_MUTATION, { input });
    return response?.createUser || null;
  }, [executeQuery]);

  const updateUserProfile = useCallback(async (input: UpdateUserProfileInput): Promise<UserManagementResult | null> => {
    const response = await executeQuery<{ updateUserProfile: UserManagementResult }>(UPDATE_USER_PROFILE_MUTATION, { input });
    return response?.updateUserProfile || null;
  }, [executeQuery]);

  const updateUserRole = useCallback(async (input: UpdateUserRoleInput): Promise<UserManagementResult | null> => {
    const response = await executeQuery<{ updateUserRole: UserManagementResult }>(UPDATE_USER_ROLE_MUTATION, { input });
    return response?.updateUserRole || null;
  }, [executeQuery]);

  const updateUserStatus = useCallback(async (input: UpdateUserStatusInput): Promise<UserManagementResult | null> => {
    const response = await executeQuery<{ updateUserStatus: UserManagementResult }>(UPDATE_USER_STATUS_MUTATION, { input });
    return response?.updateUserStatus || null;
  }, [executeQuery]);

  const deleteUser = useCallback(async (id: string): Promise<UserManagementResult | null> => {
    const response = await executeQuery<{ deleteUser: UserManagementResult }>(DELETE_USER_MUTATION, { id });
    return response?.deleteUser || null;
  }, [executeQuery]);

  const bulkUpdateUserRoles = useCallback(async (userIds: string[], role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR'): Promise<UserManagementResult | null> => {
    const response = await executeQuery<{ bulkUpdateUserRoles: UserManagementResult }>(BULK_UPDATE_USER_ROLES_MUTATION, { userIds, role });
    return response?.bulkUpdateUserRoles || null;
  }, [executeQuery]);

  const bulkUpdateUserStatus = useCallback(async (userIds: string[], isActive: boolean): Promise<UserManagementResult | null> => {
    const response = await executeQuery<{ bulkUpdateUserStatus: UserManagementResult }>(BULK_UPDATE_USER_STATUS_MUTATION, { userIds, isActive });
    return response?.bulkUpdateUserStatus || null;
  }, [executeQuery]);

  const changePassword = useCallback(async (input: ChangePasswordInput): Promise<PasswordResetResult | null> => {
    const response = await executeQuery<{ changePassword: PasswordResetResult }>(CHANGE_PASSWORD_MUTATION, { input });
    return response?.changePassword || null;
  }, [executeQuery]);

  const requestPasswordReset = useCallback(async (input: RequestPasswordResetInput): Promise<PasswordResetResult | null> => {
    const response = await executeQuery<{ requestPasswordReset: PasswordResetResult }>(REQUEST_PASSWORD_RESET_MUTATION, { input });
    return response?.requestPasswordReset || null;
  }, [executeQuery]);

  const resetPassword = useCallback(async (input: ResetPasswordInput): Promise<PasswordResetResult | null> => {
    const response = await executeQuery<{ resetPassword: PasswordResetResult }>(RESET_PASSWORD_MUTATION, { input });
    return response?.resetPassword || null;
  }, [executeQuery]);

  return {
    // State
    loading,
    error,
    
    // Query functions
    listUsers,
    getUserById,
    getUserStats,
    getBasicStats,
    getUserActivity,
    
    // Mutation functions
    createUser,
    updateUserProfile,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    bulkUpdateUserRoles,
    bulkUpdateUserStatus,
    changePassword,
    requestPasswordReset,
    resetPassword,
  };
}
