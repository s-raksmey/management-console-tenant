"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getGqlClient,
  getAuthenticatedGqlClient,
  getSelectedTenantId,
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

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "EDITOR" | "AUTHOR";
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
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// GraphQL Queries and Mutations
const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      message
      token
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
      token
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

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      success
      message
      token
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

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token storage utilities
const TOKEN_KEY = "pulse_news_admin_token";

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

const setStoredToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
};

const removeStoredToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
};

// Create authenticated GraphQL client
const getAuthenticatedClient = (token?: string) => {
  const client = getGqlClient();
  const authToken = token || getStoredToken();

  if (authToken) {
    client.setHeader("Authorization", `Bearer ${authToken}`);
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

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getStoredToken();

      if (storedToken) {
        setToken(storedToken);
        try {
          await refreshUser(storedToken);
        } catch (error) {
          console.error("Failed to refresh user:", error);
          // Token might be invalid, clear it
          removeStoredToken();
          setDynamicRolePermissions(null);
          setRolePermissions({});
          setToken(null);
          setPermissionsReady(true);
        }
      } else {
        setPermissionsReady(true);
      }

      setIsLoading(false);
      setIsInitializing(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const handleTenantChanged = () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        void refreshUser(storedToken);
      }
    };

    window.addEventListener("pulse-news:tenant-changed", handleTenantChanged);

    return () => {
      window.removeEventListener("pulse-news:tenant-changed", handleTenantChanged);
    };
  }, []);

  // Refresh user data from server
  const refreshUser = async (authToken?: string): Promise<void> => {
    try {
      const client = getAuthenticatedClient(authToken);
      const response = await client.request<{ me: AuthResponse }>(ME_QUERY);

      if (response.me.success && response.me.user) {
        if (response.me.user.role === "SUPER_ADMIN") {
          setSelectedTenantId(null);
        }
        setUser(response.me.user);
        await refreshRolePermissions();
      } else {
        throw new Error(response.me.message || "Failed to get user data");
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      throw error;
    }
  };

  const refreshRolePermissions = useCallback(async (): Promise<void> => {
    try {
      setPermissionsReady(false);
      const matrix = await RolePermissionService.getMatrix();
      const next = Object.fromEntries(
        matrix.map((item) => [item.role, item.permissions]),
      ) as Record<string, Permission[]>;

      setRolePermissions(next);
      setDynamicRolePermissions(next);
    } catch (error) {
      console.warn("Could not refresh role permissions:", error);
      setRolePermissions({});
      setDynamicRolePermissions(null);
    } finally {
      setPermissionsReady(true);
    }
  }, []);

  const completeLogin = async (authResponse: AuthResponse) => {
    if (authResponse.success && authResponse.token && authResponse.user) {
      setStoredToken(authResponse.token);
      setToken(authResponse.token);
      await refreshUser(authResponse.token);
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

  // Register function
  const register = async (data: RegisterData): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const client = getGqlClient();
      const response = await client.request<{ register: AuthResponse }>(
        REGISTER_MUTATION,
        {
          input: data,
        },
      );

      const authResponse = response.register;

      if (authResponse.success && authResponse.token) {
        // Store token first
        setStoredToken(authResponse.token);
        setToken(authResponse.token);

        // If user data is available, use it
        if (authResponse.user) {
          if (authResponse.user.role === "SUPER_ADMIN") {
            setSelectedTenantId(null);
          }
          setUser(authResponse.user);
          await refreshRolePermissions();
        } else {
          // If user is null (due to server error), try to fetch user data using the token
          try {
            const authenticatedClient = getAuthenticatedGqlClient(
              authResponse.token,
            );
            const meResponse = await authenticatedClient.request<{
              me: { success: boolean; user?: User };
            }>(ME_QUERY);

            if (meResponse.me.success && meResponse.me.user) {
              if (meResponse.me.user.role === "SUPER_ADMIN") {
                setSelectedTenantId(null);
              }
              setUser(meResponse.me.user);
              await refreshRolePermissions();
            }
          } catch (meError) {
            console.warn(
              "Could not fetch user data after registration:",
              meError,
            );
            // Registration was successful, but we couldn't get user data
            // This is not a critical error - user can still proceed
          }
        }
      }

      return authResponse;
    } catch (error: any) {
      console.error("Register error:", error);

      // Check if this is a GraphQL error with partial success
      if (
        error.response?.data?.register?.success &&
        error.response?.data?.register?.token
      ) {
        // Registration was successful despite GraphQL errors
        const partialResponse = error.response.data.register;
        setStoredToken(partialResponse.token);
        setToken(partialResponse.token);

        // Try to fetch user data with the token
        try {
          const authenticatedClient = getAuthenticatedGqlClient(
            partialResponse.token,
          );
          const meResponse = await authenticatedClient.request<{
            me: { success: boolean; user?: User };
          }>(ME_QUERY);

          if (meResponse.me.success && meResponse.me.user) {
            if (meResponse.me.user.role === "SUPER_ADMIN") {
              setSelectedTenantId(null);
            }
            setUser(meResponse.me.user);
            await refreshRolePermissions();
          }
        } catch (meError) {
          console.warn(
            "Could not fetch user data after registration:",
            meError,
          );
        }

        return {
          success: true,
          message: partialResponse.message || "Registration successful",
          token: partialResponse.token,
        };
      }

      return {
        success: false,
        message:
          error.response?.errors?.[0]?.message ||
          "Registration failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = (): void => {
    removeStoredToken();
    setSelectedTenantId(null);
    setDynamicRolePermissions(null);
    setRolePermissions({});
    setPermissionsReady(true);
    setToken(null);
    setUser(null);
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
    register,
    logout,
    refreshUser: () => refreshUser(),
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
