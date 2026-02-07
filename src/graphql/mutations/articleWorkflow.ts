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

export const PERFORM_WORKFLOW_ACTION_MUTATION = gql`
  mutation PerformWorkflowAction($input: WorkflowActionInput!) {
    performWorkflowAction(input: $input) {
      success
      message
      article {
        id
        title
        status
        updatedAt
      }
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

export interface PerformWorkflowActionVariables {
  input: {
    articleId: string;
    action: 'SUBMIT_FOR_REVIEW' | 'APPROVE' | 'REJECT';
    reason?: string;
    notifyAuthor?: boolean;
  };
}

export interface PerformWorkflowActionResponse {
  performWorkflowAction: {
    success: boolean;
    message?: string | null;
    article?: {
      id: string;
      title: string;
      status: string;
      updatedAt: string;
    } | null;
  };
}
