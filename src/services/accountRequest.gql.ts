import { gql } from '@apollo/client';

export const ACCOUNT_REQUESTS_QUERY = gql`
  query AccountRequests($status: String) {
    accountRequests(status: $status) {
      id
      email
      requesterName
      requestedRole
      status
      createdAt
      customMessage
    }
  }
`;

export const APPROVE_ACCOUNT_REQUEST_MUTATION = gql`
  mutation ApproveAccountRequest($id: ID!, $customMessage: String) {
    approveAccountRequest(id: $id, customMessage: $customMessage) {
      success
      message
      request {
        id
        status
      }
    }
  }
`;

export const REJECT_ACCOUNT_REQUEST_MUTATION = gql`
  mutation RejectAccountRequest($id: ID!, $customMessage: String) {
    rejectAccountRequest(id: $id, customMessage: $customMessage) {
      success
      message
      request {
        id
        status
      }
    }
  }
`;
