/* =========================
   Categories
========================= */

export const Q_CATEGORIES = /* GraphQL */ `
  query Categories {
    categories {
      id
      name
      nameKhmer
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
      scheduledAt
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
      tags {
        id
        name
        slug
      }
    }
  }
`;

/* =========================
   Article by slug (public)
========================= */

export const Q_ARTICLE_BY_ID = /* GraphQL */ `
  query ArticleById($id: ID!) {
    articleById(id: $id) {
      id
      title
      slug
      excerpt
      topic
      coverImageUrl
      status
      isBreaking
      authorName
      publishedAt
      scheduledAt
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
      tags {
        id
        name
        slug
      }
      contentJson
    }
  }
`;

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
      scheduledAt
      isBreaking
      tags {
        id
        name
        slug
      }
      category {
        id
        name
        slug
      }
      contentJson
      updatedAt
    }
  }
`;

export const M_RESTORE_ARTICLE_REVISION = /* GraphQL */ `
  mutation RestoreArticleRevision($articleId: ID!, $revisionId: ID!) {
    restoreArticleRevision(articleId: $articleId, revisionId: $revisionId) {
      id
      title
      slug
      updatedAt
    }
  }
`;

export const M_DELETE_ARTICLE = /* GraphQL */ `
  mutation DeleteArticle($id: ID!) {
    deleteArticle(id: $id)
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

