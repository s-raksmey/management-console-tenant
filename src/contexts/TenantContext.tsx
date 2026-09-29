"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
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
import {
  getTenantDisplayName,
  getTenantLogoUrl,
  withTenantLogoUrl,
} from "@/lib/tenant-display";

function sameTenantBrand(left: Tenant | null, right: Tenant | null) {
  if (left === right) return true;
  if (!left || !right) return false;
  return left.id === right.id && getTenantLogoUrl(left) === getTenantLogoUrl(right);
}

async function readPublicSettingUrl(
  key: string,
  includeSelectedTenant: boolean,
) {
  try {
    const response = await getAuthenticatedGqlClient(undefined, {
      includeSelectedTenant,
    }).request<{
      publicSettings?: Array<{ key: string; value: unknown }>;
    }>(Q_PUBLIC_SETTINGS);
    const value = response.publicSettings?.find(
      (setting) => setting.key === key,
    )?.value;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

async function readSettingLogoUrl() {
  return readPublicSettingUrl("site.logo_url", true);
}

async function readDashboardBrandLogoUrl(tenantHasLogo: boolean) {
  const dashboardLogoUrl = await readPublicSettingUrl("site.dashboard_logo_url", true);
  if (dashboardLogoUrl) return dashboardLogoUrl;
  if (tenantHasLogo) return null;
  return readSettingLogoUrl();
}

async function readManagementLogoUrl() {
  return readPublicSettingUrl("site.management_logo_url", false);
}

type TenantContextType = {
  activeTenant: Tenant | null;
  tenantOptions: Tenant[];
  memberships: TenantMembership[];
  isLoading: boolean;
  managementLogoUrl: string | null;
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
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [tenantOptions, setTenantOptions] = useState<Tenant[]>([]);
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [managementLogoUrl, setManagementLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasResolvedTenantRef = useRef(false);

  const loadTenants = useCallback(async () => {
    if (!isAuthenticated || !user) {
      hasResolvedTenantRef.current = false;
      setActiveTenant(null);
      setTenantOptions([]);
      setMemberships([]);
      setManagementLogoUrl(null);
      return;
    }

    if (!hasResolvedTenantRef.current) {
      setIsLoading(true);
    }

    try {
      if (user.role === "SUPER_ADMIN") {
        const options = await TenantService.listTenants();
        const selectedTenantId = getSelectedTenantId();
        const subTenants = options.filter(
          (tenant) => tenant.status === "ACTIVE" && tenant.isMainTenant !== true,
        );
        const nextTenant =
          subTenants.find((tenant) => tenant.id === selectedTenantId) || null;

        const [settingLogoUrl, consoleLogoUrl] = await Promise.all([
          nextTenant
            ? readDashboardBrandLogoUrl(Boolean(getTenantLogoUrl(nextTenant)))
            : Promise.resolve(null),
          readManagementLogoUrl(),
        ]);
        setManagementLogoUrl(consoleLogoUrl);
        setTenantOptions(options);
        setMemberships([]);
        if (nextTenant) {
          setSelectedTenantId(nextTenant.id);
          setActiveTenant((current) => {
            const next = withTenantLogoUrl(nextTenant, settingLogoUrl);
            return sameTenantBrand(current, next) ? current : next;
          });
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
        options.find((tenant) => tenant.id === selectedTenantId) ||
        options.find((tenant) => tenant.id === user.primaryTenantId) ||
        options[0] ||
        null;

      if (nextTenant) {
        setSelectedTenantId(nextTenant.id);
      } else {
        setSelectedTenantId(null);
      }

      const settingLogoUrl = await readDashboardBrandLogoUrl(
        Boolean(getTenantLogoUrl(nextTenant)),
      );
      setManagementLogoUrl(null);
      setTenantOptions(options.map((tenant) => withTenantLogoUrl(tenant, settingLogoUrl)));
      setMemberships(myMemberships);
      setActiveTenant((current) => {
        if (!nextTenant) return null;
        const next = withTenantLogoUrl(nextTenant, settingLogoUrl);
        return sameTenantBrand(current, next) ? current : next;
      });
    } finally {
      hasResolvedTenantRef.current = true;
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const consoleTitle = "Tenant Console";
    if (!isAuthenticated || !user || !activeTenant || activeTenant.isMainTenant) {
      document.title = consoleTitle;
      return;
    }
    document.title = getTenantDisplayName(activeTenant, consoleTitle);
  }, [activeTenant, isAuthenticated, pathname, user]);

  const switchTenant = useCallback(
    async (tenantId: string) => {
      if (!tenantId) {
        setSelectedTenantId(null);
        setActiveTenant(null);
        window.dispatchEvent(new CustomEvent("tenant-console:tenant-changed"));
        return;
      }

      const tenant = tenantOptions.find((item) => item.id === tenantId);
      if (!tenant) return;

      setSelectedTenantId(tenant.id);
      setActiveTenant(tenant);
      window.dispatchEvent(new CustomEvent("tenant-console:tenant-changed"));
    },
    [tenantOptions],
  );

  const value = useMemo<TenantContextType>(
    () => ({
      activeTenant,
      tenantOptions,
      memberships,
      isLoading,
      managementLogoUrl,
      switchTenant,
      refreshTenants: loadTenants,
    }),
    [
      activeTenant,
      tenantOptions,
      memberships,
      isLoading,
      managementLogoUrl,
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
