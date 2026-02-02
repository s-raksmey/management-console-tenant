// src/graphql/queries/workflowActions.ts
import { gql } from 'graphql-request';

export const GET_AVAILABLE_WORKFLOW_ACTIONS_QUERY = gql`
  query GetAvailableWorkflowActions($articleId: ID!) {
    getAvailableWorkflowActions(articleId: $articleId)
  }
`;

export interface GetAvailableWorkflowActionsVariables {
  articleId: string;
}

export interface GetAvailableWorkflowActionsResponse {
  getAvailableWorkflowActions: string[];
}
