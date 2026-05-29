import { useCallback } from "react";
import { useGraphQL } from "@/hooks/useGraphQL";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";

export type NotificationTypeValue =
  | "SUBMISSION"
  | "APPROVAL"
  | "REJECTION"
  | "PUBLICATION"
  | "UNPUBLICATION"
  | "ARCHIVE"
  | "DRAFT_SAVED"
  | "REVISION_REQUESTED"
  | "REVISION_APPROVED"
  | "REVISION_REJECTED"
  | "REVISION_CONSUMED"
  | "ACCOUNT_REQUEST";

export type NotificationRecord = {
  id: string;
  type: NotificationTypeValue;
  title: string;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
  articleId?: string | null;
  fromUserId?: string | null;
  fromUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  toUserId: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationListResult = {
  totalCount: number;
  hasMore: boolean;
  notifications: NotificationRecord[];
};

let supportsFromUserField: boolean | null = null;
let hasRetriedFromUserField = false;

export function useNotifications() {
  const { query, mutate, loading, error } = useGraphQL();

  const getNotifications = useCallback(
    async (input?: { limit?: number; offset?: number; unreadOnly?: boolean }) => {
      const MY_NOTIFICATIONS_QUERY = `
        query MyNotifications($limit: Int, $offset: Int, $unreadOnly: Boolean) {
          myNotifications(limit: $limit, offset: $offset, unreadOnly: $unreadOnly) {
            totalCount
            hasMore
            notifications {
              id
              type
              title
              message
              metadata
              articleId
              fromUserId
              fromUser {
                id
                name
                email
              }
              toUserId
              isRead
              readAt
              createdAt
            }
          }
        }
      `;

      const LEGACY_NOTIFICATIONS_QUERY = `
        query MyNotifications($limit: Int, $offset: Int, $unreadOnly: Boolean) {
          myNotifications(limit: $limit, offset: $offset, unreadOnly: $unreadOnly) {
            totalCount
            hasMore
            notifications {
              id
              type
              title
              message
              metadata
              articleId
              fromUserId
              toUserId
              isRead
              readAt
              createdAt
            }
          }
        }
      `;

      const client = getAuthenticatedGqlClient();

      if (supportsFromUserField !== false) {
        try {
          const response = await client.request<{ myNotifications: NotificationListResult }>(
            MY_NOTIFICATIONS_QUERY,
            input
          );
          supportsFromUserField = true;
          return response;
        } catch (error: any) {
          const message = error?.response?.errors?.[0]?.message || error?.message || '';
          if (message.includes('fromUser')) {
            supportsFromUserField = false;
          } else {
            return null;
          }
        }
      }

      if (!hasRetriedFromUserField) {
        hasRetriedFromUserField = true;
        try {
          const response = await client.request<{ myNotifications: NotificationListResult }>(
            MY_NOTIFICATIONS_QUERY,
            input
          );
          supportsFromUserField = true;
          return response;
        } catch (error: any) {
          const message = error?.response?.errors?.[0]?.message || error?.message || '';
          if (message.includes('fromUser')) {
            supportsFromUserField = false;
          } else {
            return null;
          }
        }
      }

      try {
        return await client.request<{ myNotifications: NotificationListResult }>(
          LEGACY_NOTIFICATIONS_QUERY,
          input
        );
      } catch {
        return null;
      }
    },
    []
  );

  const getUnreadCount = useCallback(async () => {
    const UNREAD_COUNT_QUERY = `
      query UnreadCount {
        unreadNotificationCount
      }
    `;

    return query<{ unreadNotificationCount: number }>(UNREAD_COUNT_QUERY);
  }, [query]);

  const markNotificationRead = useCallback(
    async (id: string) => {
      const MARK_READ_MUTATION = `
        mutation MarkRead($id: ID!) {
          markNotificationRead(id: $id) {
            id
            isRead
            readAt
          }
        }
      `;

      return mutate<{ markNotificationRead: { id: string; isRead: boolean; readAt?: string | null } }>(
        MARK_READ_MUTATION,
        { id }
      );
    },
    [mutate]
  );

  const markAllNotificationsRead = useCallback(async () => {
    const MARK_ALL_MUTATION = `
      mutation MarkAllRead {
        markAllNotificationsRead
      }
    `;

    return mutate<{ markAllNotificationsRead: number }>(MARK_ALL_MUTATION);
  }, [mutate]);

  return {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    loading,
    error,
  };
}
