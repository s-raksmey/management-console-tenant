// src/graphql/mutations/articleWorkflow.ts
import { gql } from 'graphql-request';

export const SET_ARTICLE_STATUS_MUTATION = gql`
  mutation SetArticleStatus($id: ID!, $status: ArticleStatus!) {
    setArticleStatus(id: $id, status: $status) {
      id
      title
      status
      updatedAt
    }
  }
`;

export interface SetArticleStatusVariables {
  id: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
}

export interface SetArticleStatusResponse {
  setArticleStatus: {
    id: string;
    title: string;
    status: string;
    updatedAt: string;
  };
}
