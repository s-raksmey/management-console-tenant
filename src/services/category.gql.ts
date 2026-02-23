import { gql } from "graphql-request";

// ============================================================================
// CATEGORY QUERIES
// ============================================================================

export const Q_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
      createdAt
      updatedAt
    }
  }
`;

// ============================================================================
// CATEGORY MUTATIONS
// ============================================================================

export const M_CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      slug
      createdAt
      updatedAt
    }
  }
`;

export const M_UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      slug
      createdAt
      updatedAt
    }
  }
`;

export const M_DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;

// ============================================================================
// TYPES
// ============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
}
