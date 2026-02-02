// src/graphql/queries/reviewQueue.ts
import { gql } from 'graphql-request';

export const REVIEW_QUEUE_QUERY = gql`
  query ReviewQueue($filters: ReviewQueueFilters) {
    reviewQueue(filters: $filters) {
      articles {
        id
        title
        excerpt
        status
        createdAt
        updatedAt
        author {
          id
          name
          email
        }
        category {
          id
          name
          slug
        }
      }
      totalCount
      hasMore
    }
  }
`;

export interface ReviewQueueFilters {
  categoryId?: string;
  authorId?: string;
  limit?: number;
  offset?: number;
}

export interface ReviewQueueArticle {
  id: string;
  title: string;
  excerpt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ReviewQueueData {
  articles: ReviewQueueArticle[];
  totalCount: number;
  hasMore: boolean;
}

export interface ReviewQueueResponse {
  reviewQueue: ReviewQueueData;
}
