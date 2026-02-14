// src/services/registrationRequest.gql.ts
import { gql } from 'graphql-request';
import { getAuthenticatedGqlClient } from './graphql-client';
import type {
  RegistrationRequest,
  RegistrationRequestListResponse,
  RegistrationStatsResponse,
  AdminReviewResponse,
  ListRegistrationRequestsInput,
  ReviewRegistrationInput,
  BulkReviewRegistrationInput,
} from '../types/registrationRequest';

// ============================================================================
// GRAPHQL QUERIES
// ============================================================================

const LIST_REGISTRATION_REQUESTS_QUERY = gql`
  query ListRegistrationRequests($input: ListRegistrationRequestsInput) {
    listRegistrationRequests(input: $input) {
      success
      message
      requests {
        id
        email
        name
        requestedRole
        status
        emailVerifiedAt
        reviewedBy
        reviewedAt
        reviewNotes
        ipAddress
        userAgent
        createdAt
        updatedAt
        reviewer {
          id
          name
          email
        }
      }
      totalCount
      hasMore
    }
  }
`;

const GET_REGISTRATION_STATS_QUERY = gql`
  query GetRegistrationStats {
    getRegistrationStats {
      totalRequests
      pendingVerification
      pendingApproval
      approved
      rejected
      expired
    }
  }
`;

// ============================================================================
// GRAPHQL MUTATIONS
// ============================================================================

const APPROVE_REGISTRATION_REQUEST_MUTATION = gql`
  mutation ApproveRegistrationRequest($input: ReviewRegistrationInput!) {
    approveRegistrationRequest(input: $input) {
      success
      message
      user {
        id
        email
        name
        role
        isActive
      }
    }
  }
`;

const REJECT_REGISTRATION_REQUEST_MUTATION = gql`
  mutation RejectRegistrationRequest($input: ReviewRegistrationInput!) {
    rejectRegistrationRequest(input: $input) {
      success
      message
    }
  }
`;

const BULK_APPROVE_REGISTRATION_REQUESTS_MUTATION = gql`
  mutation BulkApproveRegistrationRequests($input: BulkReviewRegistrationInput!) {
    bulkApproveRegistrationRequests(input: $input) {
      success
      message
    }
  }
`;

const BULK_REJECT_REGISTRATION_REQUESTS_MUTATION = gql`
  mutation BulkRejectRegistrationRequests($input: BulkReviewRegistrationInput!) {
    bulkRejectRegistrationRequests(input: $input) {
      success
      message
    }
  }
`;

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

export class RegistrationRequestService {
  private static getClient() {
    return getAuthenticatedGqlClient();
  }

  // Query Functions
  static async listRegistrationRequests(input?: ListRegistrationRequestsInput): Promise<RegistrationRequestListResponse> {
    try {
      const response = await this.getClient().request<{ listRegistrationRequests: RegistrationRequestListResponse }>(
        LIST_REGISTRATION_REQUESTS_QUERY,
        { input }
      );
      return response.listRegistrationRequests;
    } catch (error) {
      console.error('🔍 Frontend Debug - Error listing registration requests:', error);
      
      // Check for GraphQL authorization errors
      if (error && typeof error === 'object' && 'response' in error) {
        const graphqlError = error as any;
        if (graphqlError.response?.errors?.some((e: any) => e.message?.includes('Admin access required'))) {
          throw new Error('You do not have permission to access registration requests. Admin role required.');
        }
      }
      
      throw new Error('Failed to fetch registration requests');
    }
  }

  static async getRegistrationStats(): Promise<RegistrationStatsResponse> {
    try {
      const response = await this.getClient().request<{ getRegistrationStats: RegistrationStatsResponse }>(
        GET_REGISTRATION_STATS_QUERY
      );
      return response.getRegistrationStats;
    } catch (error) {
      console.error('🔍 Frontend Debug - Error fetching registration stats:', error);
      
      // Check for GraphQL authorization errors
      if (error && typeof error === 'object' && 'response' in error) {
        const graphqlError = error as any;
        if (graphqlError.response?.errors?.some((e: any) => e.message?.includes('Admin access required'))) {
          throw new Error('You do not have permission to access registration statistics. Admin role required.');
        }
      }
      
      throw new Error('Failed to fetch registration statistics');
    }
  }

  // Mutation Functions
  static async approveRegistrationRequest(input: ReviewRegistrationInput): Promise<AdminReviewResponse> {
    try {
      const response = await this.getClient().request<{ approveRegistrationRequest: AdminReviewResponse }>(
        APPROVE_REGISTRATION_REQUEST_MUTATION,
        { input }
      );
      return response.approveRegistrationRequest;
    } catch (error) {
      console.error('Error approving registration request:', error);
      
      // Check for GraphQL authorization errors
      if (error && typeof error === 'object' && 'response' in error) {
        const graphqlError = error as any;
        if (graphqlError.response?.errors?.some((e: any) => e.message?.includes('Admin access required'))) {
          throw new Error('You do not have permission to approve registration requests. Admin role required.');
        }
      }
      
      throw new Error('Failed to approve registration request');
    }
  }

  static async rejectRegistrationRequest(input: ReviewRegistrationInput): Promise<AdminReviewResponse> {
    try {
      const response = await this.getClient().request<{ rejectRegistrationRequest: AdminReviewResponse }>(
        REJECT_REGISTRATION_REQUEST_MUTATION,
        { input }
      );
      return response.rejectRegistrationRequest;
    } catch (error) {
      console.error('Error rejecting registration request:', error);
      
      // Check for GraphQL authorization errors
      if (error && typeof error === 'object' && 'response' in error) {
        const graphqlError = error as any;
        if (graphqlError.response?.errors?.some((e: any) => e.message?.includes('Admin access required'))) {
          throw new Error('You do not have permission to reject registration requests. Admin role required.');
        }
      }
      
      throw new Error('Failed to reject registration request');
    }
  }

  static async bulkApproveRegistrationRequests(input: BulkReviewRegistrationInput): Promise<AdminReviewResponse> {
    try {
      const response = await this.getClient().request<{ bulkApproveRegistrationRequests: AdminReviewResponse }>(
        BULK_APPROVE_REGISTRATION_REQUESTS_MUTATION,
        { input }
      );
      return response.bulkApproveRegistrationRequests;
    } catch (error) {
      console.error('Error bulk approving registration requests:', error);
      
      // Check for GraphQL authorization errors
      if (error && typeof error === 'object' && 'response' in error) {
        const graphqlError = error as any;
        if (graphqlError.response?.errors?.some((e: any) => e.message?.includes('Admin access required'))) {
          throw new Error('You do not have permission to approve registration requests. Admin role required.');
        }
      }
      
      throw new Error('Failed to bulk approve registration requests');
    }
  }

  static async bulkRejectRegistrationRequests(input: BulkReviewRegistrationInput): Promise<AdminReviewResponse> {
    try {
      const response = await this.getClient().request<{ bulkRejectRegistrationRequests: AdminReviewResponse }>(
        BULK_REJECT_REGISTRATION_REQUESTS_MUTATION,
        { input }
      );
      return response.bulkRejectRegistrationRequests;
    } catch (error) {
      console.error('Error bulk rejecting registration requests:', error);
      
      // Check for GraphQL authorization errors
      if (error && typeof error === 'object' && 'response' in error) {
        const graphqlError = error as any;
        if (graphqlError.response?.errors?.some((e: any) => e.message?.includes('Admin access required'))) {
          throw new Error('You do not have permission to reject registration requests. Admin role required.');
        }
      }
      
      throw new Error('Failed to bulk reject registration requests');
    }
  }

  // Utility Functions
  static getStatusDisplayName(status: string): string {
    const statusNames = {
      PENDING_VERIFICATION: 'Pending Email Verification',
      PENDING_APPROVAL: 'Pending Admin Approval',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      EXPIRED: 'Expired',
    };
    return statusNames[status as keyof typeof statusNames] || status;
  }

  static getStatusBadgeColor(status: string): string {
    const colors = {
      PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
      PENDING_APPROVAL: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  static getRoleDisplayName(role: string): string {
    const roleNames = {
      ADMIN: 'Administrator',
      EDITOR: 'Editor',
      AUTHOR: 'Author',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  }

  static getRoleBadgeColor(role: string): string {
    const colors = {
      ADMIN: 'bg-red-100 text-red-800',
      EDITOR: 'bg-blue-100 text-blue-800',
      AUTHOR: 'bg-green-100 text-green-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  static formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  }

  static getTimeAgo(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    } catch {
      return 'Unknown';
    }
  }
}
