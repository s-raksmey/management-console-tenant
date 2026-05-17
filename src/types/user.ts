// src/types/user.ts

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR';
export type AssignableUserRole = UserRole;
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type UserSortBy = 'name' | 'email' | 'role' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface UserListFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserListResult {
  users: User[];
  totalCount: number;
  hasMore: boolean;
  filters: UserListFilters;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: {
    superAdmin?: number;
    admin: number;
    editor: number;
    author: number;
  };
  recentRegistrations: number;
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

// Input Types
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: AssignableUserRole;
  isActive?: boolean;
  sendWelcomeEmail?: boolean;
}

export interface ListUsersInput {
  take?: number;
  skip?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  sortBy?: UserSortBy;
  sortOrder?: SortOrder;
}

export interface UpdateUserProfileInput {
  userId: string;
  name: string;
  email: string;
}

export interface UpdateUserRoleInput {
  userId: string;
  role: AssignableUserRole;
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

// UI State Types
export interface UserFilters {
  search: string;
  role: UserRole | 'ALL';
  status: UserStatus | 'ALL';
  sortBy: UserSortBy;
  sortOrder: SortOrder;
}

export interface UserTableState {
  loading: boolean;
  error: string | null;
  users: User[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
  pageSize: number;
  filters: UserFilters;
}

export interface BulkActionState {
  selectedUsers: string[];
  isProcessing: boolean;
  action: 'role' | 'status' | null;
}
