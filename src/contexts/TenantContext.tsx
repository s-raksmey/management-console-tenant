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
  getAuthenticatedGqlClient,
  getSelectedTenantId,
  setSelectedTenantId,
} from "@/services/graphql-client";
import { Q_PUBLIC_SETTINGS } from "@/services/settings.gql";
import { getTenantDisplayName, withTenantLogoUrl } from "@/lib/tenant-display";

async function readSettingLogoUrl() {
  try {
    const response = await getAuthenticatedGqlClient().request<{
      publicSettings?: Array<{ key: string; value: unknown }>;
    }>(Q_PUBLIC_SETTINGS);
    const value = response.publicSettings?.find(
      (setting) => setting.key === "site.logo_url",
    )?.value;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

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
    isMainTenant: membership.tenant.isMainTenant,
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
      const hostTenant = await TenantService.getActiveTenantFromHost().catch(() => null);

      if (user.role === "SUPER_ADMIN") {
        const options = await TenantService.listTenants();
        const selectedTenantId = getSelectedTenantId();
        const subTenants = options.filter(
          (tenant) => tenant.status === "ACTIVE" && tenant.isMainTenant !== true,
        );
        const nextTenant =
          subTenants.find((tenant) => tenant.id === hostTenant?.id) ||
          subTenants.find((tenant) => tenant.id === selectedTenantId) ||
          (hostTenant && hostTenant.isMainTenant !== true ? hostTenant : null) ||
          null;

        const settingLogoUrl = await readSettingLogoUrl();
        setTenantOptions(options);
        setMemberships([]);
        if (nextTenant) {
          setSelectedTenantId(nextTenant.id);
          setActiveTenant(withTenantLogoUrl(nextTenant, settingLogoUrl));
        } else if (hostTenant) {
          setSelectedTenantId(hostTenant.id);
          setActiveTenant(withTenantLogoUrl(hostTenant, settingLogoUrl));
        } else {
          setSelectedTenantId(null);
          setActiveTenant(null);
        }
        return;
      }

      const selectedTenantId = getSelectedTenantId();
      const myMemberships = await TenantService.listMyTenants();
      const options = myMemberships
        .map(tenantFromMembership)
        .filter((tenant) => tenant.status === "ACTIVE" && !tenant.isMainTenant);

      const nextTenant =
        options.find((tenant) => tenant.id === hostTenant?.id) ||
        options.find((tenant) => tenant.id === selectedTenantId) ||
        options.find((tenant) => tenant.id === user.primaryTenantId) ||
        options[0] ||
        null;

      if (nextTenant) {
        setSelectedTenantId(nextTenant.id);
      } else {
        setSelectedTenantId(null);
      }

      const settingLogoUrl = await readSettingLogoUrl();
      setTenantOptions(options.map((tenant) => withTenantLogoUrl(tenant, settingLogoUrl)));
      setMemberships(myMemberships);
      setActiveTenant(nextTenant ? withTenantLogoUrl(nextTenant, settingLogoUrl) : null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isAuthenticated || !user) {
      document.title = "Management Console";
      return;
    }
    if (user.role === "SUPER_ADMIN") {
      document.title = "Management Console";
      return;
    }
    document.title = `${getTenantDisplayName(activeTenant, "Sub-tenant")} Admin`;
  }, [activeTenant, isAuthenticated, user]);

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
