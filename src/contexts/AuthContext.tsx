"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  COOKIE_SESSION_TOKEN,
  getGqlClient,
  getAuthenticatedGqlClient,
  getSelectedTenantId,
  isBearerToken,
  setSelectedTenantId,
} from "@/services/graphql-client";
import { gql } from "graphql-request";
import { setDynamicRolePermissions, type Permission } from "@/components/permissions/PermissionGuard";
import { RolePermissionService } from "@/services/role-permissions.gql";

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR";
  isActive: boolean;
  primaryTenantId?: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  requiresTwoFactor?: boolean;
  twoFactorSetupRequired?: boolean;
  twoFactorToken?: string;
  twoFactorSetup?: {
    secret: string;
    otpAuthUrl: string;
    qrCodeUrl: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  permissionsReady: boolean;
  isAuthenticated: boolean;
  rolePermissions: Record<string, Permission[]>;
  refreshRolePermissions: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  verifyTwoFactorLogin: (input: {
    twoFactorToken: string;
    code: string;
  }) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// GraphQL Queries and Mutations
const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      message
      requiresTwoFactor
      twoFactorSetupRequired
      twoFactorToken
      twoFactorSetup {
        secret
        otpAuthUrl
        qrCodeUrl
      }
      user {
        id
        email
        name
        role
        isActive
        primaryTenantId
      }
    }
  }
`;

const VERIFY_TWO_FACTOR_LOGIN_MUTATION = gql`
  mutation VerifyTwoFactorLogin($input: VerifyTwoFactorLoginInput!) {
    verifyTwoFactorLogin(input: $input) {
      success
      message
      user {
        id
        email
        name
        role
        isActive
        primaryTenantId
      }
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
      message
    }
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      success
      message
      user {
        id
        email
        name
        role
        isActive
        primaryTenantId
      }
    }
  }
`;

const AUTH_REQUIRED_MESSAGE = "Authentication required";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

function isAuthenticationRequired(error: unknown): boolean {
  return getErrorMessage(error).includes(AUTH_REQUIRED_MESSAGE);
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create authenticated GraphQL client
const getAuthenticatedClient = (token?: string) => {
  const client = getGqlClient();
  if (isBearerToken(token)) {
    client.setHeader("Authorization", `Bearer ${token}`);
  }

  const selectedTenantId = getSelectedTenantId();
  if (selectedTenantId) {
    client.setHeader("x-tenant-id", selectedTenantId);
  }

  return client;
};

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [permissionsReady, setPermissionsReady] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<Record<string, Permission[]>>({});
  const hasLoadedRolePermissions = useRef(false);

  const clearAuthState = useCallback(() => {
    hasLoadedRolePermissions.current = false;
    setDynamicRolePermissions(null);
    setRolePermissions({});
    setPermissionsReady(true);
    setToken(null);
    setUser(null);
  }, []);

  // Initialize auth state from the secure auth cookie.
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const refreshed = await refreshUser({
          suppressAuthRequired: true,
          resetSuperAdminTenant: true,
        });
        if (!refreshed) {
          clearAuthState();
          return;
        }
        setToken(COOKIE_SESSION_TOKEN);
      } catch (error) {
        console.error("Failed to refresh user:", error);
        clearAuthState();
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [clearAuthState]);

  useEffect(() => {
    const handleTenantChanged = () => {
      void refreshUser({ suppressAuthRequired: true }).then((refreshed) => {
        if (!refreshed) {
          clearAuthState();
        }
      });
    };

    window.addEventListener("pulse-news:tenant-changed", handleTenantChanged);

    return () => {
      window.removeEventListener("pulse-news:tenant-changed", handleTenantChanged);
    };
  }, [clearAuthState]);

  // Refresh user data from server
  const refreshUser = async (
    options: {
      authToken?: string;
      suppressAuthRequired?: boolean;
      resetSuperAdminTenant?: boolean;
    } = {},
  ): Promise<boolean> => {
    try {
      const client = getAuthenticatedClient(options.authToken);
      const response = await client.request<{ me: AuthResponse }>(ME_QUERY);

      if (response.me.success && response.me.user) {
        if (response.me.user.role === "SUPER_ADMIN" && options.resetSuperAdminTenant) {
          setSelectedTenantId(null);
        }
        setUser(response.me.user);
        await refreshRolePermissions();
        return true;
      }

      if (
        options.suppressAuthRequired &&
        response.me.message === AUTH_REQUIRED_MESSAGE
      ) {
        return false;
      } else {
        throw new Error(response.me.message || "Failed to get user data");
      }
    } catch (error) {
      if (options.suppressAuthRequired && isAuthenticationRequired(error)) {
        return false;
      }
      console.error("Error refreshing user:", error);
      throw error;
    }
  };

  const refreshRolePermissions = useCallback(async (): Promise<void> => {
    const shouldShowInitialLoading = !hasLoadedRolePermissions.current;

    try {
      if (shouldShowInitialLoading) {
        setPermissionsReady(false);
      }

      const matrix = await RolePermissionService.getMatrix();
      const next = Object.fromEntries(
        matrix.map((item) => [item.role, item.permissions]),
      ) as Record<string, Permission[]>;

      setRolePermissions(next);
      setDynamicRolePermissions(next);
      hasLoadedRolePermissions.current = true;
    } catch (error) {
      console.warn("Could not refresh role permissions:", error);
      if (shouldShowInitialLoading) {
        setRolePermissions({});
        setDynamicRolePermissions(null);
      }
    } finally {
      setPermissionsReady(true);
    }
  }, []);

  const completeLogin = async (authResponse: AuthResponse) => {
    if (authResponse.success && authResponse.user) {
      setToken(COOKIE_SESSION_TOKEN);
      await refreshUser({ resetSuperAdminTenant: true });
    }
  };

  // Login function
  const login = async (
    credentials: LoginCredentials,
  ): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const client = getGqlClient();
      const response = await client.request<{ login: AuthResponse }>(
        LOGIN_MUTATION,
        {
          input: credentials,
        },
      );

      const authResponse = response.login;

      await completeLogin(authResponse);

      return authResponse;
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Network error occurred. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactorLogin = async (input: {
    twoFactorToken: string;
    code: string;
  }): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const client = getGqlClient();
      const response = await client.request<{
        verifyTwoFactorLogin: AuthResponse;
      }>(VERIFY_TWO_FACTOR_LOGIN_MUTATION, {
        input,
      });

      const authResponse = response.verifyTwoFactorLogin;
      await completeLogin(authResponse);
      return authResponse;
    } catch (error) {
      console.error("Two-factor login error:", error);
      return {
        success: false,
        message: "Verification failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = (): void => {
    void getGqlClient().request(LOGOUT_MUTATION).catch((error) => {
      console.warn("Logout cookie cleanup failed:", error);
    });
    setSelectedTenantId(null);
    clearAuthState();
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    rolePermissions,
    permissionsReady,
    isInitializing,
    isAuthenticated: !!user && !!token,
    login,
    verifyTwoFactorLogin,
    logout,
    refreshUser: async () => {
      await refreshUser();
    },
    refreshRolePermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
