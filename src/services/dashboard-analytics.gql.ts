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

export type AnalyticsDateRangePreset =
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "LAST_3_MONTHS"
  | "LAST_6_MONTHS"
  | "LAST_12_MONTHS"
  | "CUSTOM";

export type AnalyticsGroupBy = "DAY" | "WEEK" | "MONTH";

export type TenantTimeAnalyticsInput = {
  dateRange: {
    preset: AnalyticsDateRangePreset;
    from?: string;
    to?: string;
  };
  groupBy: AnalyticsGroupBy;
};

export type TenantPublishingPoint = {
  label: string;
  start: string;
  endExclusive: string;
  created: number;
  published: number;
  totalViews: number;
};

export type TenantCategoryView = {
  categoryId: string;
  name: string;
  views: number;
  percentage: number;
  topics: Array<{
    slug: string;
    name: string;
    views: number;
    percentage: number;
    parentPercentage: number;
  }>;
};

export type TenantTimeAnalytics = {
  rangeFrom: string;
  rangeTo: string;
  summary: {
    createdArticles: number;
    publishedArticles: number;
    totalViews: number;
  };
  publishing: TenantPublishingPoint[];
  categoryViews: TenantCategoryView[];
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

const Q_TENANT_TIME_ANALYTICS = gql`
  query TenantTimeAnalytics($input: TenantTimeAnalyticsInput!) {
    tenantTimeAnalytics(input: $input) {
      rangeFrom
      rangeTo
      summary {
        createdArticles
        publishedArticles
        totalViews
      }
      publishing {
        label
        start
        endExclusive
        created
        published
        totalViews
      }
      categoryViews {
        categoryId
        name
        views
        percentage
        topics {
          slug
          name
          views
          percentage
          parentPercentage
        }
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

  static async getTenantTimeAnalytics(
    input: TenantTimeAnalyticsInput,
  ): Promise<TenantTimeAnalytics> {
    const client = getAuthenticatedGqlClient();
    const response = await client.request<{
      tenantTimeAnalytics: TenantTimeAnalytics;
    }>(Q_TENANT_TIME_ANALYTICS, { input });
    return response.tenantTimeAnalytics;
  }
}
