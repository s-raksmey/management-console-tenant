import { gql } from "graphql-request";
import { getAuthenticatedGqlClient } from "./graphql-client";

export type DashboardChartPoint = {
  label: string;
  value: number;
  secondaryValue?: number | null;
};

export type DashboardTenantMetric = {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  articles: number;
  users: number;
  publicSites: number;
};

export type DashboardAnalytics = {
  scope: "PLATFORM" | "TENANT";
  tenantId?: string | null;
  tenantName?: string | null;
  summary: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeUsers: number;
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    reviewArticles: number;
    archivedArticles: number;
    totalViews: number;
    publicSites: number;
    auditEvents: number;
  };
  articleStatus: DashboardChartPoint[];
  userRoles: DashboardChartPoint[];
  monthlyContent: DashboardChartPoint[];
  tenantActivity: DashboardTenantMetric[];
  categoryViews: DashboardChartPoint[];
};

const Q_DASHBOARD_ANALYTICS = gql`
  query DashboardAnalytics {
    dashboardAnalytics {
      scope
      tenantId
      tenantName
      summary {
        totalTenants
        activeTenants
        totalUsers
        activeUsers
        totalArticles
        publishedArticles
        draftArticles
        reviewArticles
        archivedArticles
        totalViews
        publicSites
        auditEvents
      }
      articleStatus {
        label
        value
        secondaryValue
      }
      userRoles {
        label
        value
        secondaryValue
      }
      monthlyContent {
        label
        value
        secondaryValue
      }
      tenantActivity {
        id
        name
        slug
        status
        articles
        users
        publicSites
      }
      categoryViews {
        label
        value
        secondaryValue
      }
    }
  }
`;

export class DashboardAnalyticsService {
  static async getDashboardAnalytics(tenantId?: string | null): Promise<DashboardAnalytics> {
    const client = getAuthenticatedGqlClient(undefined, {
      includeSelectedTenant: false,
    });
    if (tenantId) {
      client.setHeader("x-tenant-id", tenantId);
    }

    const response = await client.request<{
      dashboardAnalytics: DashboardAnalytics;
    }>(Q_DASHBOARD_ANALYTICS);

    return response.dashboardAnalytics;
  }
}
