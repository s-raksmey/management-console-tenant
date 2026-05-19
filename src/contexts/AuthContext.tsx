"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getGqlClient,
  getAuthenticatedGqlClient,
  getSelectedTenantId,
  setSelectedTenantId,
} from "@/services/graphql-client";
import { gql } from "graphql-request";

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
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
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
          setToken(null);
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
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
      } else {
        throw new Error(response.me.message || "Failed to get user data");
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      throw error;
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

      if (authResponse.success && authResponse.token && authResponse.user) {
        if (authResponse.user.role === "SUPER_ADMIN") {
          setSelectedTenantId(null);
        }
        // Store token and user data
        setStoredToken(authResponse.token);
        setToken(authResponse.token);
        setUser(authResponse.user);
      }

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
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    refreshUser: () => refreshUser(),
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
