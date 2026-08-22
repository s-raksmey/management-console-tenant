// src/services/audit.gql.ts
import { gql } from 'graphql-request';
import { getAuthenticatedGqlClient } from './graphql-client';
import type {
  AuditLog,
  AuditLogFilters,
  AuditLogListResult,
} from '../types/audit';

// ============================================================================
// GRAPHQL QUERIES
// ============================================================================

const LIST_AUDIT_LOGS_QUERY = gql`
  query ListAuditLogs($filters: AuditLogFilters) {
    auditLogs(filters: $filters) {
      logs {
        id
        action
        userId
        userEmail
        targetUserId
        resourceId
        resourceType
        resourceName
        ipAddress
        userAgent
        details
        success
        errorMessage
        createdAt
      }
      totalCount
      hasMore
    }
  }
`;

const GET_AUDIT_LOG_QUERY = gql`
  query GetAuditLog($id: ID!) {
    auditLog(id: $id) {
      id
      action
      userId
      targetUserId
      resourceId
      resourceType
      ipAddress
      userAgent
      details
      success
      errorMessage
      createdAt
    }
  }
`;

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class AuditService {
  static async trackPageView(path: string, title?: string): Promise<void> {
    const client = getAuthenticatedGqlClient();
    await client.request(
      gql`
        mutation TrackPageView($path: String!, $title: String) {
          trackPageView(path: $path, title: $title)
        }
      `,
      { path, title }
    );
  }

  static async trackUserInteraction(
    path: string,
    element: string,
    label?: string
  ): Promise<void> {
    const client = getAuthenticatedGqlClient();
    await client.request(
      gql`
        mutation TrackUserInteraction($path: String!, $element: String!, $label: String) {
          trackUserInteraction(path: $path, element: $element, label: $label)
        }
      `,
      { path, element, label }
    );
  }

  /**
   * List audit logs with pagination and filters
   */
  static async listAuditLogs(
    skip: number = 0,
    take: number = 50,
    filters?: AuditLogFilters
  ): Promise<AuditLogListResult> {
    try {
      const client = getAuthenticatedGqlClient();
      const response = await client.request(LIST_AUDIT_LOGS_QUERY, {
        filters: {
          userId: filters?.userId,
          eventType: filters?.action,
          resourceType: filters?.resourceType,
          resourceId: filters?.resourceId,
          success: filters?.success,
          startDate: filters?.startDate,
          endDate: filters?.endDate,
          limit: take,
          offset: skip,
          search: filters?.search,
        },
      });

      // Response is nested under logs property
      const logsData = response.auditLogs?.logs || [];
      const totalCount = response.auditLogs?.totalCount || 0;
      const hasMore = response.auditLogs?.hasMore || false;

      // Enrich logs with fallback values from details if needed
      const enrichedLogs = logsData.map((log: any) => {
        let ipAddress = log.ipAddress;
        let resourceName = log.resourceName;
        let resourceType = log.resourceType;
        let userAgent = log.userAgent;

        // Try to extract from details object
        if (!ipAddress && log.details) {
          ipAddress = log.details.ipAddress || log.details.ip;
        }

        if (!resourceName && log.details) {
          resourceName = log.details.resourceName || log.details.name || log.details.title || log.details.label;
        }

        if (!resourceType && log.details) {
          resourceType = log.details.resourceType || log.details.type;
        }

        if (!userAgent && log.details) {
          userAgent = log.details.userAgent || log.details.agent;
        }

        // For specific action types, generate meaningful resource names and types
        if (!resourceType) {
          switch (log.action) {
            case 'USER_LOGIN':
            case 'USER_LOGOUT':
            case 'USER_REGISTRATION':
              resourceType = 'User';
              break;
            case 'ARTICLE_CREATED':
            case 'ARTICLE_UPDATED':
            case 'ARTICLE_DELETED':
            case 'ARTICLE_PUBLISHED':
            case 'ARTICLE_UNPUBLISHED':
              resourceType = 'Article';
              break;
            case 'USER_CREATED':
            case 'USER_UPDATED':
            case 'USER_DELETED':
            case 'USER_ROLE_CHANGED':
            case 'USER_STATUS_CHANGED':
              resourceType = 'User';
              break;
            default:
              resourceType = 'System';
          }
        }

        if (!resourceName) {
          switch (log.action) {
            case 'USER_LOGIN':
              resourceName = 'User Authentication';
              break;
            case 'USER_LOGOUT':
              resourceName = 'User Session';
              break;
            case 'USER_REGISTRATION':
              resourceName = 'User Registration';
              break;
            case 'PASSWORD_CHANGED':
              resourceName = 'Password Reset';
              break;
            case 'PERMISSION_DENIED':
            case 'UNAUTHORIZED_ACCESS':
              resourceName = 'Security';
              break;
            default:
              resourceName = log.resourceId ? `[ID: ${log.resourceId.substring(0, 8)}...]` : 'System Event';
          }
        }

        // For user agent, provide a default if missing
        if (!userAgent) {
          userAgent = 'Web Application';
        }

        // Only set "Internal" as fallback if ipAddress is truly not available
        // Backend should now be providing actual IP addresses
        if (!ipAddress) {
          ipAddress = '-';
        }

        return {
          ...log,
          ipAddress: ipAddress,
          resourceName: resourceName,
          resourceType: resourceType,
          userAgent: userAgent,
        };
      });

      return {
        logs: enrichedLogs,
        totalCount,
        hasMore,
      };
    } catch (error) {
      console.error('Error listing audit logs:', error);
      throw error;
    }
  }

  /**
   * Get a single audit log by ID
   */
  static async getAuditLog(id: string): Promise<AuditLog> {
    try {
      const client = getAuthenticatedGqlClient();
      const response = await client.request(GET_AUDIT_LOG_QUERY, { id });

      return response.auditLog;
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw error;
    }
  }

  /**
   * Export audit logs to CSV
   */
  static async exportAuditLogs(filters?: AuditLogFilters): Promise<Blob> {
    try {
      // Fetch all logs matching the filters
      const result = await this.listAuditLogs(0, 10000, filters);
      
      // Convert to CSV
      const headers = ['Date', 'User', 'Event Type', 'Status', 'Resource Type', 'Resource', 'IP Address'];
      const rows = result.logs.map(log => [
        new Date(log.createdAt).toLocaleString(),
        log.userEmail || 'System',
        log.action.replace(/_/g, ' '),
        log.success ? 'Success' : 'Failed',
        log.resourceType || '-',
        log.resourceName || log.resourceId || '-',
        log.ipAddress || '-',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return new Blob([csv], { type: 'text/csv' });
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }
}
