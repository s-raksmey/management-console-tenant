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

export const Q_TOPICS_BY_CATEGORY = gql`
  query GetTopicsByCategory($categorySlug: String!) {
    topicsByCategory(categorySlug: $categorySlug) {
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

export const Q_TOPIC_BY_SLUG = gql`
  query GetTopicBySlug($categorySlug: String!, $topicSlug: String!) {
    topicBySlug(categorySlug: $categorySlug, topicSlug: $topicSlug) {
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
// TOPIC MUTATIONS
// ============================================================================

export const M_UPSERT_TOPIC = gql`
  mutation UpsertTopic($id: ID, $input: UpsertTopicInput!) {
    upsertTopic(id: $id, input: $input) {
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

export const M_DELETE_TOPIC = gql`
  mutation DeleteTopic($id: ID!) {
    deleteTopic(id: $id)
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

