/* =========================
   Categories
========================= */

export const Q_CATEGORIES = /* GraphQL */ `
  query Categories {
    categories {
      id
      name
      slug
    }
  }
`;

/* =========================
   Articles list
========================= */

export const Q_ARTICLES = /* GraphQL */ `
  query Articles(
    $status: ArticleStatus
    $categorySlug: String
    $topic: String
    $take: Int
    $skip: Int
  ) {
    articles(
      status: $status
      categorySlug: $categorySlug
      topic: $topic
      take: $take
      skip: $skip
    ) {
      id
      title
      slug
      excerpt
      status
      topic
      coverImageUrl
      authorName
      isFeatured
      isEditorsPick
      isBreaking
      revisionStatus
      revisionRequestedAt
      breakingNewsRequestStatus
      breakingNewsRequestedAt
      breakingNewsRequestedBy {
        id
        name
        email
      }

      publishedAt
      createdAt
      updatedAt
      category {
        id
        name
        slug
      }
      author {
        id
      }
    }
  }
`;

/* =========================
   Article by slug (public)
========================= */

export const Q_ARTICLES_BY_TOPIC = /* GraphQL */ `
  query ArticlesByTopic($categorySlug: String!, $topicSlug: String!) {
    articlesByTopic(categorySlug: $categorySlug, topicSlug: $topicSlug) {
      id
      title
      slug
      excerpt
      topic
      status
      isBreaking
      authorName
      publishedAt
      createdAt
      updatedAt
      contentJson
      category {
        name
        slug
      }
      author {
        id
      }
    }
  }
`;

/* =========================
   Article by ID (CMS)
========================= */

export const Q_ARTICLE_BY_ID = /* GraphQL */ `
  query ArticleById($id: ID!) {
    articleById(id: $id) {
      id
      title
      slug
      excerpt
      topic
      status
      isBreaking
      authorName
      publishedAt
      createdAt
      updatedAt
      revisionStatus
      revisionRequestedAt
      breakingNewsRequestStatus
      breakingNewsRequestedAt
      breakingNewsRequestedBy {
        id
        name
        email
      }
      category {
        name
        slug
      }
      author {
        id
      }
      contentJson
    }
  }
`;

export const Q_ARTICLE_BY_SLUG = /* GraphQL */ `
  query ArticleBySlug($slug: String!) {
    articleBySlug(slug: $slug) {
      id
      title
      slug
      excerpt
      topic
      status
      authorName
      publishedAt
      createdAt
      updatedAt
      category {
        name
        slug
      }
      author {
        id
      }
      contentJson
    }
  }
`;

/* =========================
   Article Preview
========================= */

export const Q_PREVIEW_ARTICLE = /* GraphQL */ `
  query PreviewArticle($id: ID!) {
    articleById(id: $id) {
      id
      title
      slug
      status
      excerpt
      contentJson
      authorName
      coverImageUrl
      category {
        name
        slug
      }
      createdAt
      updatedAt
      publishedAt
    }
  }
`;

export const Q_PREVIEW_ARTICLE_BY_SLUG = /* GraphQL */ `
  query PreviewArticleBySlug($slug: String!) {
    articleBySlug(slug: $slug) {
      id
      title
      slug
      status
      excerpt
      contentJson
      authorName
      coverImageUrl
      category {
        name
        slug
      }
      createdAt
      updatedAt
      publishedAt
    }
  }
`;

/* =========================
   Revision Requests & History
========================= */

export const Q_REVISION_REQUESTS = /* GraphQL */ `
  query RevisionRequests($articleId: ID!, $status: RevisionRequestStatus) {
    revisionRequests(articleId: $articleId, status: $status) {
      id
      status
      note
      proposedChanges
      createdAt
      requester {
        id
        name
        email
      }
      reviewedAt
      reviewedBy {
        id
        name
      }
      reviewComment
    }
  }
`;

export const Q_ARTICLE_REVISION_HISTORY = /* GraphQL */ `
  query ArticleRevisionHistory($articleId: ID!, $limit: Int) {
    articleRevisionHistory(articleId: $articleId, limit: $limit) {
      id
      summary
      changes
      appliedAt
      appliedBy {
        id
        name
      }
      revisionRequest {
        id
        status
      }
    }
  }
`;

/* =========================
   Mutations
========================= */

export const M_UPSERT_ARTICLE = /* GraphQL */ `
  mutation UpsertArticle($id: ID, $input: UpsertArticleInput!) {
    upsertArticle(id: $id, input: $input) {
      id
      title
      slug
      excerpt
      topic
      status
      publishedAt
      isBreaking
      category {
        id
        name
        slug
      }
      contentJson
    }
  }
`;

export const M_SET_STATUS = /* GraphQL */ `
  mutation SetArticleStatus($id: ID!, $status: ArticleStatus!) {
    setArticleStatus(id: $id, status: $status) {
      id
      status
      publishedAt
    }
  }
`;

export const M_DELETE_ARTICLE = /* GraphQL */ `
  mutation DeleteArticle($id: ID!) {
    deleteArticle(id: $id)
  }
`;

/* =========================
   Home sections (UPDATED)
========================= */

export const Q_TOP_STORIES = /* GraphQL */ `
  query {
    topStories {
      id
      title
      slug
      excerpt
      topic
      contentJson
      publishedAt
      category { name slug }
    }
  }
`;

export const Q_EDITORS_PICKS = /* GraphQL */ `
  query {
    editorsPicks {
      id
      title
      slug
      excerpt
      topic
      contentJson
      category { name slug }
    }
  }
`;

export const Q_BREAKING_NEWS = /* GraphQL */ `
  query {
    breakingNews {
      id
      title
      slug
      excerpt
      topic
      contentJson
      publishedAt
      category { name slug }
    }
  }
`;

export const Q_TRENDING = /* GraphQL */ `
  query {
    trending {
      id
      title
      slug
      topic
      contentJson
      publishedAt
      category { name slug }
    }
  }
`;

export const M_INCREMENT_VIEW = /* GraphQL */ `
  mutation ($slug: String!) {
    incrementArticleView(slug: $slug)
  }
`;

export const M_REQUEST_BREAKING_NEWS = /* GraphQL */ `
  mutation RequestBreakingNews($articleId: ID!, $reason: String) {
    requestBreakingNews(articleId: $articleId, reason: $reason) {
      id
      status
      createdAt
    }
  }
`;

export const M_APPROVE_BREAKING_NEWS_REQUEST = /* GraphQL */ `
  mutation ApproveBreakingNews($requestId: ID!, $reviewComment: String) {
    approveBreakingNews(requestId: $requestId, reviewComment: $reviewComment) {
      id
      isBreaking
    }
  }
`;

export const M_REJECT_BREAKING_NEWS_REQUEST = /* GraphQL */ `
  mutation RejectBreakingNews($requestId: ID!, $reviewComment: String) {
    rejectBreakingNews(requestId: $requestId, reviewComment: $reviewComment) {
      id
      status
      reviewComment
    }
  }
`;

export const M_REQUEST_ARTICLE_REVISION = /* GraphQL */ `
  mutation RequestArticleRevision($input: RequestArticleRevisionInput!) {
    requestArticleRevision(input: $input) {
      id
      status
      note
      proposedChanges
      createdAt
      requester {
        id
        name
        email
      }
    }
  }
`;

export const M_APPROVE_ARTICLE_REVISION = /* GraphQL */ `
  mutation ApproveArticleRevision($requestId: ID!, $reviewComment: String) {
    approveArticleRevision(requestId: $requestId, reviewComment: $reviewComment) {
      id
      title
      status
      revisionStatus
      updatedAt
    }
  }
`;

export const Q_PENDING_BREAKING_NEWS_REQUESTS = /* GraphQL */ `
  query PendingBreakingNewsRequests {
    pendingBreakingNewsRequests {
      id
      status
      reason
      createdAt
      article {
        id
        title
        slug
      }
      requester {
        id
        name
        email
      }
    }
  }
`;

export const Q_BREAKING_NEWS_REQUESTS = /* GraphQL */ `
  query BreakingNewsRequests($articleId: ID!) {
    breakingNewsRequests(articleId: $articleId) {
      id
      status
      reason
      reviewComment
      reviewedAt
      createdAt
      requester {
        id
        name
        email
      }
    }
  }
`;

export const M_REJECT_ARTICLE_REVISION = /* GraphQL */ `
  mutation RejectArticleRevision($requestId: ID!, $reviewComment: String) {
    rejectArticleRevision(requestId: $requestId, reviewComment: $reviewComment) {
      id
      status
      reviewComment
      reviewedAt
      reviewedBy {
        id
        name
      }
    }
  }
`;

export const Q_TOPIC_BY_SLUG = /* GraphQL */ `
  query TopicBySlug($categorySlug: String!, $topicSlug: String!) {
    topicBySlug(categorySlug: $categorySlug, topicSlug: $topicSlug) {
      id
      slug
      title
      description
      coverImageUrl
      coverVideoUrl
      category {
        name
        slug
      }
    }
  }
`;
