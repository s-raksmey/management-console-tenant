// src/services/registrationSubmission.gql.ts
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

export const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input) {
      success
      message
      registrationRequest {
        id
        email
        name
        status
      }
    }
  }
`;
