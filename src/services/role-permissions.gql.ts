import { gql } from "graphql-request";
import { getAuthenticatedGqlClient } from "./graphql-client";
import { Permission } from "@/components/permissions/PermissionGuard";
import type { UserRole } from "@/types/user";

export type RolePermissionConfig = {
  role: UserRole;
  permissions: Permission[];
};

const ROLE_PERMISSION_MATRIX_QUERY = gql`
  query RolePermissionMatrix {
    rolePermissionMatrix {
      role
      permissions
    }
  }
`;

const UPDATE_ROLE_PERMISSION_MUTATION = gql`
  mutation UpdateRolePermission($role: UserRole!, $permission: String!, $enabled: Boolean!) {
    updateRolePermission(role: $role, permission: $permission, enabled: $enabled) {
      role
      permissions
    }
  }
`;

function normalizeMatrix(items: Array<{ role: UserRole; permissions: string[] }>) {
  return items.map((item) => ({
    role: item.role,
    permissions: item.permissions as Permission[],
  }));
}

export class RolePermissionService {
  static async getMatrix(): Promise<RolePermissionConfig[]> {
    const response = await getAuthenticatedGqlClient().request<{
      rolePermissionMatrix: Array<{ role: UserRole; permissions: string[] }>;
    }>(ROLE_PERMISSION_MATRIX_QUERY);

    return normalizeMatrix(response.rolePermissionMatrix);
  }

  static async updatePermission(input: {
    role: UserRole;
    permission: Permission;
    enabled: boolean;
  }): Promise<RolePermissionConfig> {
    const response = await getAuthenticatedGqlClient().request<{
      updateRolePermission: { role: UserRole; permissions: string[] };
    }>(UPDATE_ROLE_PERMISSION_MUTATION, input);

    return {
      role: response.updateRolePermission.role,
      permissions: response.updateRolePermission.permissions as Permission[],
    };
  }
}
