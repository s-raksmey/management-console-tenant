// src/types/registrationRequest.ts

export type RegistrationRequestStatus = 
  | 'PENDING_VERIFICATION'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export type UserRole = 'ADMIN' | 'EDITOR' | 'AUTHOR';

export interface RegistrationRequest {
  id: string;
  email: string;
  name: string;
  requestedRole: UserRole;
  status: RegistrationRequestStatus;
  emailVerifiedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RegistrationRequestListResponse {
  success: boolean;
  message?: string;
  requests: RegistrationRequest[];
  totalCount: number;
  hasMore: boolean;
}

export interface RegistrationStatsResponse {
  totalRequests: number;
  pendingVerification: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  expired: number;
}

export interface AdminReviewResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
  };
}

export interface RegistrationRequestFilters {
  status: RegistrationRequestStatus | 'ALL';
  search?: string;
  sortBy: 'createdAt' | 'name' | 'email' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface ListRegistrationRequestsInput {
  status?: RegistrationRequestStatus;
  limit?: number;
  offset?: number;
}

export interface ReviewRegistrationInput {
  registrationId: string;
  reviewNotes?: string;
}

export interface BulkReviewRegistrationInput {
  registrationIds: string[];
  reviewNotes?: string;
}
