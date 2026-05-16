export type CarouselSlide = {
  id: string;
  placement: "HOME" | "CATEGORY" | "TOPIC";
  categorySlug?: string | null;
  topicSlug?: string | null;
  title: string;
  titleKhmer?: string | null;
  subtitle?: string | null;
  subtitleKhmer?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  ctaLabel?: string | null;
  ctaLabelKhmer?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name: string;
    email: string;
    role: string;
  } | null;
};

export type CarouselSlideInput = {
  placement?: "HOME" | "CATEGORY" | "TOPIC";
  categorySlug?: string | null;
  topicSlug?: string | null;
  title: string;
  titleKhmer?: string | null;
  subtitle?: string | null;
  subtitleKhmer?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  ctaLabel?: string | null;
  ctaLabelKhmer?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export const CAROUSEL_SLIDE_FIELDS = /* GraphQL */ `
  id
  placement
  categorySlug
  topicSlug
  title
  titleKhmer
  subtitle
  subtitleKhmer
  imageUrl
  linkUrl
  ctaLabel
  ctaLabelKhmer
  sortOrder
  isActive
  createdAt
  updatedAt
  createdBy {
    name
    email
    role
  }
`;

export const Q_HOME_CAROUSEL_SLIDES = /* GraphQL */ `
  query HomeCarouselSlides {
    homeCarouselSlides(includeInactive: true) {
      ${CAROUSEL_SLIDE_FIELDS}
    }
  }
`;

export const M_CREATE_HOME_CAROUSEL_SLIDE = /* GraphQL */ `
  mutation CreateHomeCarouselSlide($input: HomeCarouselSlideInput!) {
    createHomeCarouselSlide(input: $input) {
      ${CAROUSEL_SLIDE_FIELDS}
    }
  }
`;

export const M_UPDATE_HOME_CAROUSEL_SLIDE = /* GraphQL */ `
  mutation UpdateHomeCarouselSlide($id: ID!, $input: HomeCarouselSlideInput!) {
    updateHomeCarouselSlide(id: $id, input: $input) {
      ${CAROUSEL_SLIDE_FIELDS}
    }
  }
`;

export const M_DELETE_HOME_CAROUSEL_SLIDE = /* GraphQL */ `
  mutation DeleteHomeCarouselSlide($id: ID!) {
    deleteHomeCarouselSlide(id: $id)
  }
`;
