import { gql } from "graphql-request";

// ============================================================================
// TOPIC QUERIES
// ============================================================================

export const Q_TOPICS = gql`
  query GetTopics {
    topics {
      id
      slug
      title
      description
      coverImageUrl
      coverVideoUrl
      categoryId
      createdAt
      updatedAt
      category {
        id
        name
        slug
      }
    }
  }
`;

// ============================================================================
// TYPES
// ============================================================================

export interface Topic {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  coverVideoUrl?: string | null;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface UpsertTopicInput {
  categorySlug: string;
  slug: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  coverVideoUrl?: string | null;
}

