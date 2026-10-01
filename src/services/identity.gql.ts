import { ClientError, gql } from 'graphql-request';
import { getAuthenticatedGqlClient } from './graphql-client';

export type IdentityStatus = 'ACTIVE' | 'INACTIVE';

export interface MyDigitalIdentity {
  id: string;
  identityNumber: string;
  profilePhotoUrl?: string | null;
  status: IdentityStatus;
  account: {
    name: string;
    role: string;
  };
}

const MY_IDENTITY = gql`
  query MyDigitalIdentity {
    myDigitalIdentity {
      id
      identityNumber
      profilePhotoUrl
      status
      account {
        name
        role
      }
    }
  }
`;

export function identityErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ClientError) {
    return error.response.errors?.[0]?.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const UPDATE_MY_PHOTO = gql`
  mutation UpdateMyProfilePhoto($input: UpdateMyDigitalIdentityInput!) {
    updateMyDigitalIdentity(input: $input) {
      success
      message
      identity {
        profilePhotoUrl
      }
    }
  }
`;

export class IdentityService {
  static async getMine(): Promise<MyDigitalIdentity> {
    const client = getAuthenticatedGqlClient();
    const response = await client.request<{ myDigitalIdentity: MyDigitalIdentity }>(MY_IDENTITY);
    return response.myDigitalIdentity;
  }

  static async updatePhoto(input: {
    displayName: string;
    profilePhotoUrl: string;
  }): Promise<{ success: boolean; message: string; profilePhotoUrl?: string | null }> {
    const client = getAuthenticatedGqlClient();
    const response = await client.request<{
      updateMyDigitalIdentity: {
        success: boolean;
        message: string;
        identity?: { profilePhotoUrl?: string | null } | null;
      };
    }>(UPDATE_MY_PHOTO, { input });
    return {
      success: response.updateMyDigitalIdentity.success,
      message: response.updateMyDigitalIdentity.message,
      profilePhotoUrl: response.updateMyDigitalIdentity.identity?.profilePhotoUrl,
    };
  }
}
