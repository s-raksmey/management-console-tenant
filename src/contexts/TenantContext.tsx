"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tenant,
  TenantMembership,
  TenantService,
} from "@/services/tenant.gql";
import {
  getSelectedTenantId,
  setSelectedTenantId,
} from "@/services/graphql-client";

type TenantContextType = {
  activeTenant: Tenant | null;
  tenantOptions: Tenant[];
  memberships: TenantMembership[];
  isLoading: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenants: () => Promise<void>;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

function tenantFromMembership(membership: TenantMembership): Tenant {
  return {
    id: membership.tenant.id,
    name: membership.tenant.name,
    slug: membership.tenant.slug,
    status: membership.tenant.status,
    sites: membership.tenant.sites ?? [],
    memberships: [],
    createdAt: "",
    updatedAt: "",
  };
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [tenantOptions, setTenantOptions] = useState<Tenant[]>([]);
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTenants = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setActiveTenant(null);
      setTenantOptions([]);
      setMemberships([]);
      return;
    }

    setIsLoading(true);

    try {
      const selectedTenantId = getSelectedTenantId();
      const myMemberships =
        user.role === "SUPER_ADMIN" ? [] : await TenantService.listMyTenants();
      const options =
        user.role === "SUPER_ADMIN"
          ? await TenantService.listTenants()
          : myMemberships.map(tenantFromMembership);

      const nextTenant =
        options.find((tenant) => tenant.id === selectedTenantId) ||
        options.find((tenant) => tenant.id === user.primaryTenantId) ||
        options[0] ||
        null;

      if (nextTenant) {
        setSelectedTenantId(nextTenant.id);
      } else {
        setSelectedTenantId(null);
      }

      setTenantOptions(options);
      setMemberships(myMemberships);
      setActiveTenant(nextTenant);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  const switchTenant = useCallback(
    async (tenantId: string) => {
      const tenant = tenantOptions.find((item) => item.id === tenantId);
      if (!tenant) return;

      setSelectedTenantId(tenant.id);
      setActiveTenant(tenant);
      window.dispatchEvent(new CustomEvent("pulse-news:tenant-changed"));
    },
    [tenantOptions],
  );

  const value = useMemo<TenantContextType>(
    () => ({
      activeTenant,
      tenantOptions,
      memberships,
      isLoading,
      switchTenant,
      refreshTenants: loadTenants,
    }),
    [
      activeTenant,
      tenantOptions,
      memberships,
      isLoading,
      switchTenant,
      loadTenants,
    ],
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }

  return context;
}
