export type AdvertisementStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
export type AdvertisementPlacement =
  | "HOME_TOP"
  | "HOME_SIDEBAR"
  | "CATEGORY_TOP"
  | "ARTICLE_INLINE"
  | "ARTICLE_SIDEBAR"
  | "FOOTER";
export type AdvertisementFormat = "IMAGE" | "TEXT" | "HTML";
export type AdvertisementTargetScope = "GLOBAL" | "CATEGORY" | "TOPIC" | "ARTICLE";

export type Advertisement = {
  id: string;
  tenantId?: string | null;
  name: string;
  placement: AdvertisementPlacement;
  format: AdvertisementFormat;
  status: AdvertisementStatus;
  imageUrl?: string | null;
  targetUrl?: string | null;
  headline?: string | null;
  body?: string | null;
  sponsorName?: string | null;
  html?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  priority: number;
  impressions: number;
  clicks: number;
  targetScope: AdvertisementTargetScope;
  categorySlug?: string | null;
  topicSlug?: string | null;
  articleId?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name: string;
    email: string;
    role: string;
  } | null;
};

export type AdvertisementInput = {
  name: string;
  placement: AdvertisementPlacement;
  format: AdvertisementFormat;
  status: AdvertisementStatus;
  imageUrl?: string | null;
  targetUrl?: string | null;
  headline?: string | null;
  body?: string | null;
  sponsorName?: string | null;
  html?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  priority?: number;
  targetScope?: AdvertisementTargetScope;
  categorySlug?: string | null;
  topicSlug?: string | null;
  articleId?: string | null;
};

export const ADVERTISEMENT_FIELDS = /* GraphQL */ `
  id
  tenantId
  name
  placement
  format
  status
  imageUrl
  targetUrl
  headline
  body
  sponsorName
  html
  startAt
  endAt
  priority
  impressions
  clicks
  targetScope
  categorySlug
  topicSlug
  articleId
  createdAt
  updatedAt
  createdBy {
    name
    email
    role
  }
`;

export const Q_ADVERTISEMENTS = /* GraphQL */ `
  query Advertisements($status: AdvertisementStatus, $placement: AdvertisementPlacement) {
    advertisements(status: $status, placement: $placement) {
      ${ADVERTISEMENT_FIELDS}
    }
  }
`;

export const M_CREATE_ADVERTISEMENT = /* GraphQL */ `
  mutation CreateAdvertisement($input: AdvertisementInput!) {
    createAdvertisement(input: $input) {
      ${ADVERTISEMENT_FIELDS}
    }
  }
`;

export const M_UPDATE_ADVERTISEMENT = /* GraphQL */ `
  mutation UpdateAdvertisement($id: ID!, $input: AdvertisementInput!) {
    updateAdvertisement(id: $id, input: $input) {
      ${ADVERTISEMENT_FIELDS}
    }
  }
`;

export const M_DELETE_ADVERTISEMENT = /* GraphQL */ `
  mutation DeleteAdvertisement($id: ID!) {
    deleteAdvertisement(id: $id)
  }
`;
