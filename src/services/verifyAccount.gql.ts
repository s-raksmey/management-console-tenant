import { gql } from '@apollo/client';

export const VERIFY_ACCOUNT_REQUEST_MUTATION = gql`
  mutation VerifyAccountRequest($id: ID!, $code: String!) {
    verifyAccountRequest(id: $id, code: $code) {
      success
      message
      request {
        id
        email
        requesterName
        requestedRole
        status
        userId
      }
    }
  }
`;

