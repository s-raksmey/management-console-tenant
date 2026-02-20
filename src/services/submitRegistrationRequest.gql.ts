import { gql } from '@apollo/client';

export const SUBMIT_REGISTRATION_REQUEST_MUTATION = gql`
  mutation SubmitRegistrationRequest($input: SubmitRegistrationRequestInput!) {
    submitRegistrationRequest(input: $input) {
      success
      message
      registrationId
    }
  }
`;

