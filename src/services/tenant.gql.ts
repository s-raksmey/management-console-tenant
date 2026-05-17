import { gql } from "graphql-request";
import { getAuthenticatedGqlClient } from "./graphql-client";

export type TenantStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type TenantRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR";

export type TenantSite = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  domain?: string | null;
  publicBaseUrl?: string | null;
  adminBaseUrl?: string | null;
  primaryLocale: string;
  isPrimary: boolean;
  isActive: boolean;
};

export type TenantMembership = {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  isActive: boolean;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: TenantStatus;
    sites: TenantSite[];
  };
  user: {
    id: string;
    email: string;
    name: string;
    role: TenantRole;
  };
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  description?: string | null;
  sites: TenantSite[];
  memberships: TenantMembership[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTenantInput = {
  name: string;
  slug?: string | null;
  description?: string | null;
  publicBaseUrl?: string | null;
  adminBaseUrl?: string | null;
  primaryLocale?: string | null;
};

export type UpdateTenantInput = Partial<CreateTenantInput> & {
  status?: TenantStatus;
  isActive?: boolean;
};

export type CreateTenantAdminInput = {
  tenantId: string;
  email: string;
  password?: string | null;
  name: string;
  role?: "ADMIN" | "EDITOR" | "AUTHOR";
};

const TENANT_FIELDS = gql`
  fragment TenantFields on Tenant {
    id
    name
    slug
    status
    description
    createdAt
    updatedAt
    sites {
      id
      tenantId
      name
      slug
      domain
      publicBaseUrl
      adminBaseUrl
      primaryLocale
      isPrimary
      isActive
    }
    memberships {
      id
      tenantId
      userId
      role
      isActive
      user {
        id
        email
        name
        role
      }
    }
  }
`;

export const Q_TENANTS = gql`
  ${TENANT_FIELDS}
  query Tenants {
    tenants {
      ...TenantFields
    }
  }
`;

export const Q_ACTIVE_TENANT = gql`
  ${TENANT_FIELDS}
  query ActiveTenant {
    activeTenant {
      ...TenantFields
    }
  }
`;

export const Q_MY_TENANTS = gql`
  query MyTenants {
    myTenants {
      id
      tenantId
      userId
      role
      isActive
      tenant {
        id
        name
        slug
        status
        sites {
          id
          tenantId
          name
          slug
          domain
          publicBaseUrl
          adminBaseUrl
          primaryLocale
          isPrimary
          isActive
        }
      }
    }
  }
`;

export const M_CREATE_TENANT = gql`
  ${TENANT_FIELDS}
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) {
      ...TenantFields
    }
  }
`;

export const M_UPDATE_TENANT = gql`
  ${TENANT_FIELDS}
  mutation UpdateTenant($id: ID!, $input: UpdateTenantInput!) {
    updateTenant(id: $id, input: $input) {
      ...TenantFields
    }
  }
`;

export const M_CREATE_TENANT_ADMIN = gql`
  mutation CreateTenantAdmin($input: CreateTenantAdminInput!) {
    createTenantAdmin(input: $input) {
      id
      email
      name
      role
      isActive
      primaryTenantId
    }
  }
`;

export class TenantService {
  static async getActiveTenant(): Promise<Tenant | null> {
    const client = getAuthenticatedGqlClient();
    const response = await client.request<{ activeTenant: Tenant | null }>(
      Q_ACTIVE_TENANT,
    );
    return response.activeTenant ?? null;
  }

  static async listTenants(): Promise<Tenant[]> {
    const client = getAuthenticatedGqlClient();
    const response = await client.request<{ tenants: Tenant[] }>(Q_TENANTS);
    return response.tenants ?? [];
  }

  static async listMyTenants(): Promise<TenantMembership[]> {
    const client = getAuthenticatedGqlClient();
    const response = await client.request<{ myTenants: TenantMembership[] }>(
      Q_MY_TENANTS,
    );
    return response.myTenants ?? [];
  }

  static async createTenant(input: CreateTenantInput): Promise<Tenant> {
    const client = getAuthenticatedGqlClient();
    const response = await client.request<{ createTenant: Tenant }>(
      M_CREATE_TENANT,
      {
        input,
      },
    );
    return response.createTenant;
  }

  static async updateTenant(
    id: string,
    input: UpdateTenantInput,
  ): Promise<Tenant> {
    const client = getAuthenticatedGqlClient();
    const response = await client.request<{ updateTenant: Tenant }>(
      M_UPDATE_TENANT,
      {
        id,
        input,
      },
    );
    return response.updateTenant;
  }

  static async createTenantAdmin(input: CreateTenantAdminInput) {
    const client = getAuthenticatedGqlClient();
    const response = await client.request(M_CREATE_TENANT_ADMIN, { input });
    return response;
  }
}
