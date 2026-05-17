// src/services/user.gql.ts
import { gql } from 'graphql-request';
import { getAuthenticatedGqlClient } from './graphql-client';
import type {
  User,
  UserListResult,
  UserStats,
  UserManagementResult,
  PasswordResetResult,
  ActivityLog,
  CreateUserInput,
  ListUsersInput,
  UpdateUserProfileInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
  ChangePasswordInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
} from '../types/user';

// ============================================================================
// GRAPHQL QUERIES
// ============================================================================

const LIST_USERS_QUERY = gql`
  query ListUsers($input: ListUsersInput!) {
    listUsers(input: $input) {
      users {
        id
        email
        name
        role
        isActive
        createdAt
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

const GET_USER_BY_ID_QUERY = gql`
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

const GET_USER_STATS_QUERY = gql`
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

const GET_BASIC_STATS_QUERY = gql`
  query GetBasicStats {
    getBasicStats {
      totalUsers
      totalArticles
    }
  }
`;

const GET_USER_ACTIVITY_QUERY = gql`
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

const CREATE_USER_MUTATION = gql`
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

const UPDATE_USER_PROFILE_MUTATION = gql`
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

const UPDATE_USER_ROLE_MUTATION = gql`
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

const UPDATE_USER_STATUS_MUTATION = gql`
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

const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
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

const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      success
      message
    }
  }
`;

const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input) {
      success
      message
    }
  }
`;

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      success
      message
    }
  }
`;

const BULK_UPDATE_USER_ROLES_MUTATION = gql`
  mutation BulkUpdateUserRoles($userIds: [ID!]!, $role: UserRole!) {
    bulkUpdateUserRoles(userIds: $userIds, role: $role) {
      success
      message
    }
  }
`;

const BULK_UPDATE_USER_STATUS_MUTATION = gql`
  mutation BulkUpdateUserStatus($userIds: [ID!]!, $isActive: Boolean!) {
    bulkUpdateUserStatus(userIds: $userIds, isActive: $isActive) {
      success
      message
    }
  }
`;

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

export class UserService {
  private static getClient() {
    // Always get a fresh authenticated client to ensure we have the latest token
    return getAuthenticatedGqlClient();
  }

  // Query Functions
  static async listUsers(input: ListUsersInput): Promise<UserListResult> {
    try {
      const response = await this.getClient().request<{ listUsers: UserListResult }>(
        LIST_USERS_QUERY,
        { input }
      );
      return response.listUsers;
    } catch (error) {
      console.error('🔍 Frontend Debug - Error listing users:', error);
      
      // Check for GraphQL authorization errors
      if (error && typeof error === 'object' && 'response' in error) {
        const graphqlError = error as any;
        if (graphqlError.response?.errors?.some((e: any) => e.message?.includes('Required role'))) {
          throw new Error('You do not have permission to access user management features. Admin role required.');
        }
      }
      
      throw new Error('Failed to fetch users');
    }
  }

  static async getUserById(id: string): Promise<User> {
    try {
      const response = await this.getClient().request<{ getUserById: User }>(
        GET_USER_BY_ID_QUERY,
        { id }
      );
      return response.getUserById;
    } catch (error) {
      console.error('🔍 Frontend Debug - Error fetching user:', error);
      
      // Check for GraphQL authorization errors
      if (error && typeof error === 'object' && 'response' in error) {
        const graphqlError = error as any;
        if (graphqlError.response?.errors?.some((e: any) => e.message?.includes('Required role'))) {
          throw new Error('You do not have permission to access user details. Insufficient permissions.');
        }
      }
      
      throw new Error('Failed to fetch user details');
    }
  }

  static async getUserStats(): Promise<UserStats> {
    try {
      const response = await this.getClient().request<{ getUserStats: UserStats | null }>(
        GET_USER_STATS_QUERY
      );
      
      // Check if the response or getUserStats is null
      if (!response || response.getUserStats === null || response.getUserStats === undefined) {
        throw new Error('User statistics data is not available. The backend resolver returned null.');
      }
      
      return response.getUserStats;
    } catch (error) {
      console.error('🔍 Frontend Debug - Error fetching user stats:', error);
      
      // First check for GraphQL authorization errors (most common case for non-admin users)
      if (error && typeof error === 'object' && 'response' in error) {
        const graphqlError = error as any;
        if (graphqlError.response?.errors?.some((e: any) => 
          e.message?.includes('Required role') || 
          e.message?.includes('AuthorizationError') ||
          e.extensions?.code === 'FORBIDDEN'
        )) {
          throw new Error('You do not have permission to access user statistics. Admin role required.');
        }
      }
      
      // Check if the error message indicates authorization failure
      if (error instanceof Error && (
        error.message.includes('Required role') ||
        error.message.includes('AuthorizationError') ||
        error.message.includes('ADMIN')
      )) {
        throw new Error('You do not have permission to access user statistics. Admin role required.');
      }
      
      // Check if this is a GraphQL resolver not implemented error
      if (error && typeof error === 'object' && 'response' in error) {
        const gqlError = error as any;
        if (gqlError.response?.errors?.some((e: any) => 
          e.extensions?.code === 'INTERNAL_SERVER_ERROR' || 
          e.message?.includes('Unexpected error')
        )) {
          throw new Error('User statistics feature is temporarily unavailable. The backend service is being updated.');
        }
      }
      
      // Handle null response specifically - this might also be due to authorization
      if (error instanceof Error && error.message.includes('returned null')) {
        // If we get null response, it might be due to authorization failure
        // Let's throw an authorization error to trigger the fallback
        throw new Error('You do not have permission to access user statistics. Admin role required.');
      }
      
      throw new Error('Failed to fetch user statistics');
    }
  }

  static async getBasicStats(): Promise<{ totalUsers: number; totalArticles: number }> {
    try {
      const response = await this.getClient().request<{ getBasicStats: { totalUsers: number; totalArticles: number } }>(
        GET_BASIC_STATS_QUERY
      );
      
      return response.getBasicStats;
    } catch (error) {
      console.error('🔍 Frontend Debug - Error fetching basic stats:', error);
      
      // Check for GraphQL authorization errors
      if (error && typeof error === 'object' && 'response' in error) {
        const graphqlError = error as any;
        if (graphqlError.response?.errors?.some((e: any) => e.message?.includes('Required role'))) {
          throw new Error('You do not have permission to access basic statistics. Authentication required.');
        }
      }
      
      throw new Error('Failed to fetch basic statistics');
    }
  }

  static async getUserActivity(userId?: string, limit?: number): Promise<ActivityLog[]> {
    try {
      const response = await this.getClient().request<{ getUserActivity: ActivityLog[] }>(
        GET_USER_ACTIVITY_QUERY,
        { userId, limit }
      );
      return response.getUserActivity;
    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw new Error('Failed to fetch user activity');
    }
  }

  // Mutation Functions
  static async createUser(input: CreateUserInput): Promise<UserManagementResult> {
    try {
      const response = await this.getClient().request<{ createUser: UserManagementResult }>(
        CREATE_USER_MUTATION,
        { input }
      );
      return response.createUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  static async updateUserProfile(input: UpdateUserProfileInput): Promise<UserManagementResult> {
    try {
      const response = await this.getClient().request<{ updateUserProfile: UserManagementResult }>(
        UPDATE_USER_PROFILE_MUTATION,
        { input }
      );
      return response.updateUserProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  static async updateUserRole(input: UpdateUserRoleInput): Promise<UserManagementResult> {
    try {
      const response = await this.getClient().request<{ updateUserRole: UserManagementResult }>(
        UPDATE_USER_ROLE_MUTATION,
        { input }
      );
      return response.updateUserRole;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  static async updateUserStatus(input: UpdateUserStatusInput): Promise<UserManagementResult> {
    try {
      const response = await this.getClient().request<{ updateUserStatus: UserManagementResult }>(
        UPDATE_USER_STATUS_MUTATION,
        { input }
      );
      return response.updateUserStatus;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error('Failed to update user status');
    }
  }

  static async deleteUser(id: string): Promise<UserManagementResult> {
    try {
      const response = await this.getClient().request<{ deleteUser: UserManagementResult }>(
        DELETE_USER_MUTATION,
        { id }
      );
      return response.deleteUser;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  static async changePassword(input: ChangePasswordInput): Promise<PasswordResetResult> {
    try {
      const response = await this.getClient().request<{ changePassword: PasswordResetResult }>(
        CHANGE_PASSWORD_MUTATION,
        { input }
      );
      return response.changePassword;
    } catch (error) {
      console.error('Error changing password:', error);
      throw new Error('Failed to change password');
    }
  }

  static async requestPasswordReset(input: RequestPasswordResetInput): Promise<PasswordResetResult> {
    try {
      const response = await this.getClient().request<{ requestPasswordReset: PasswordResetResult }>(
        REQUEST_PASSWORD_RESET_MUTATION,
        { input }
      );
      return response.requestPasswordReset;
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw new Error('Failed to request password reset');
    }
  }

  static async resetPassword(input: ResetPasswordInput): Promise<PasswordResetResult> {
    try {
      const response = await this.getClient().request<{ resetPassword: PasswordResetResult }>(
        RESET_PASSWORD_MUTATION,
        { input }
      );
      return response.resetPassword;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw new Error('Failed to reset password');
    }
  }

  static async bulkUpdateUserRoles(userIds: string[], role: string): Promise<UserManagementResult> {
    try {
      const response = await this.getClient().request<{ bulkUpdateUserRoles: UserManagementResult }>(
        BULK_UPDATE_USER_ROLES_MUTATION,
        { userIds, role }
      );
      return response.bulkUpdateUserRoles;
    } catch (error) {
      console.error('Error bulk updating user roles:', error);
      throw new Error('Failed to update user roles');
    }
  }

  static async bulkUpdateUserStatus(userIds: string[], isActive: boolean): Promise<UserManagementResult> {
    try {
      const response = await this.getClient().request<{ bulkUpdateUserStatus: UserManagementResult }>(
        BULK_UPDATE_USER_STATUS_MUTATION,
        { userIds, isActive }
      );
      return response.bulkUpdateUserStatus;
    } catch (error) {
      console.error('Error bulk updating user status:', error);
      throw new Error('Failed to update user status');
    }
  }

  // Utility Functions

  static async checkGetUserStatsAvailability(): Promise<boolean> {
    try {
      await this.getUserStats();
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getFallbackUserStats(): Promise<UserStats | null> {
    try {
      
      // Fetch all users to calculate basic statistics
      const allUsersResult = await this.listUsers({ take: 1000, skip: 0 });
      
      if (!allUsersResult || !allUsersResult.users) {
        console.warn('listUsers returned invalid data:', allUsersResult);
        return {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          usersByRole: { admin: 0, editor: 0, author: 0 },
          recentRegistrations: 0
        };
      }

      const users = allUsersResult.users;
      if (users.length === 0) {
        return {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          usersByRole: { admin: 0, editor: 0, author: 0 },
          recentRegistrations: 0
        };
      }

      const totalUsers = users.length;
      const activeUsers = users.filter(user => user.isActive).length;
      const inactiveUsers = totalUsers - activeUsers;

      const usersByRole = {
        admin: users.filter(user => user.role === 'ADMIN').length,
        editor: users.filter(user => user.role === 'EDITOR').length,
        author: users.filter(user => user.role === 'AUTHOR').length,
      };

      // Calculate recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRegistrations = users.filter(user => {
        try {
          return new Date(user.createdAt) > thirtyDaysAgo;
        } catch (dateError) {
          console.warn('Invalid date format for user:', user.id, user.createdAt);
          return false;
        }
      }).length;

      const fallbackStats = {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
        recentRegistrations
      };

      return fallbackStats;
    } catch (error) {
      console.error('Failed to generate fallback user stats:', error);
      return null;
    }
  }

  static getRoleDisplayName(role: string): string {
    const roleNames = {
      SUPER_ADMIN: 'Super Administrator',
      ADMIN: 'Administrator',
      EDITOR: 'Editor',
      AUTHOR: 'Author',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  }

  static getStatusDisplayName(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  static getRoleBadgeColor(role: string): string {
    const colors = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-red-100 text-red-800',
      EDITOR: 'bg-blue-100 text-blue-800',
      AUTHOR: 'bg-green-100 text-green-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  static getStatusBadgeColor(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }
}
