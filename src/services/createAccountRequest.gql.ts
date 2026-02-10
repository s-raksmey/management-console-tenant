import { gql } from '@apollo/client';

export const SUBMIT_ACCOUNT_REQUEST_MUTATION = gql`
  mutation SubmitAccountRequest($input: AccountRequestInput!) {
    submitAccountRequest(input: $input) {
      success
      message
      request {
        id
        email
        requesterName
        requestedRole
        status
        createdAt
      }
    }
  }
`;
