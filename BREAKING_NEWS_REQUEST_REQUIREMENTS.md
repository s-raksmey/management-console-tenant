# Breaking News Request Workflow - Backend Implementation Requirements

## Overview

This document specifies the backend changes needed to support a complete breaking news request workflow where:
- **Authors** can request articles be marked as breaking news at any article status (DRAFT, REVIEW, PUBLISHED)
- **Editors/Admins** can review and approve/reject these requests
- **Admins** can directly set articles as breaking news without requiring a request

## Assumed Rules (From Product Requirements)

- Authors can request breaking news on DRAFT, REVIEW, or PUBLISHED articles
- Authors can only see breaking news requests for their own articles
- Editors/Admins can see all pending requests
- Editors/Admins can approve/reject requests

## Current Limitations

The current backend implementation restricts breaking news requests to PUBLISHED articles only:
```
Error: "Only published articles can be marked as breaking news"
Location: pulse-news-server/src/graphql/schema.ts:2990
```

## Required Changes

### 1. Update `requestBreakingNews` Mutation

**Current Behavior:**
- Only accepts PUBLISHED articles
- Rejects DRAFT and REVIEW articles

**Required Behavior:**
- Accept articles in ANY status: DRAFT, REVIEW, or PUBLISHED
- Create a breaking news request record regardless of article status
- Return request ID if successful

**Implementation:**

```typescript
// In schema.ts, update requestBreakingNews resolver
requestBreakingNews: async (_, { articleId, reason }, context) => {
  // Remove or modify this check:
  // if (article.status !== 'PUBLISHED') {
  //   throw new Error('Only published articles can be marked as breaking news');
  // }
  
  // Instead, allow any article status
  // Create breaking news request with status PENDING
  // Return: { id, status: 'PENDING', reason, createdAt, articleId }
}
```

### 2. Update `pendingBreakingNewsRequests` Query

**Current Issue:**
- Requires ADMIN or EDITOR role
- AUTHORS cannot access this query

**Required Behavior:**
- Keep ADMIN/EDITOR access for viewing ALL pending requests
- Add optional filtering for AUTHOR role (they can only see their own article requests)

**Implementation Options:**

**Option A: Single Query with Role-Based Filtering**
```typescript
pendingBreakingNewsRequests: async (_, args, context) => {
  if (context.user.role === 'AUTHOR') {
    // Return only pending breaking news requests for articles authored by this user
    return breakingNewsRequests.filter(
      req => req.article.authorId === context.user.id && 
              req.status === 'PENDING'
    );
  }
  
  // ADMIN/EDITOR see all pending requests
  return breakingNewsRequests.filter(req => req.status === 'PENDING');
}
```

**Option B: Create Separate Query for Authors**
```typescript
myPendingBreakingNewsRequests: async (_, args, context) => {
  // Authors only see their own pending requests
  if (context.user.role !== 'AUTHOR') {
    throw new Error('Only authors can access this query');
  }
  
  return breakingNewsRequests.filter(
    req => req.article.authorId === context.user.id && 
            req.status === 'PENDING'
  );
}
```

### 3. Update `breakingNewsRequests` Query

**Current Behavior:**
- Requires ADMIN or EDITOR role for access
- Takes `articleId` parameter

**Required Behavior:**
- Keep ADMIN/EDITOR access
- Add AUTHOR access for their own articles
- Return full request history (PENDING, APPROVED, REJECTED)

**Implementation:**
```typescript
breakingNewsRequests: async (_, { articleId }, context) => {
  const article = await Article.findById(articleId);
  
  if (context.user.role === 'AUTHOR') {
    // Authors can only see requests for their own articles
    if (article.authorId !== context.user.id) {
      throw new Error('You cannot view breaking news requests for articles you did not write');
    }
  } else if (context.user.role !== 'ADMIN' && context.user.role !== 'EDITOR') {
    throw new Error('Unauthorized');
  }
  
  return breakingNewsRequests.filter(req => req.articleId === articleId);
}
```

### 4. Permission Structure

**Breaking News Request Permissions:**

| Role | Action | Allowed |
|------|--------|---------|
| AUTHOR | Request breaking news on own article (any status) | ✅ YES |
| AUTHOR | Request breaking news on others' articles | ❌ NO |
| AUTHOR | Approve/Reject requests | ❌ NO |
| AUTHOR | View own pending requests | ✅ YES (restricted to own articles) |
| EDITOR | Request breaking news | ✅ YES (any article) |
| EDITOR | Approve/Reject requests | ✅ YES |
| EDITOR | View all pending requests | ✅ YES |
| ADMIN | Request breaking news | ✅ YES |
| ADMIN | Approve/Reject requests | ✅ YES |
| ADMIN | Set breaking news directly (bypass request) | ✅ YES |
| ADMIN | View all pending requests | ✅ YES |

### 5. Breaking News Request Status Flow

```
PENDING
  ├─→ APPROVED (Editor/Admin approves)
  ├─→ REJECTED (Editor/Admin rejects with comment)
  └─→ Can be re-requested after rejection
```

### 6. Article Breaking News Fields

These fields should be exposed in the `Article` type for all queries:

```graphql
type Article {
  id: ID!
  title: String!
  status: ArticleStatus!
  
  # Breaking news fields (add to existing Article type)
  isBreaking: Boolean!                  # Directly set by admin
  breakingNewsRequestStatus: BreakingNewsRequestStatus  # Request status
  breakingNewsRequestedAt: DateTime     # When request was made
  breakingNewsRequestedBy: User         # Who made the request
}

enum BreakingNewsRequestStatus {
  NONE
  PENDING
  APPROVED
  REJECTED
}
```

### 7. Breaking News Request Type

Define a new GraphQL type for request records:

```graphql
type BreakingNewsRequest {
  id: ID!
  articleId: ID!
  article: Article!
  requester: User!              # Who requested it
  reason: String!               # Why they think it's breaking news
  status: BreakingNewsRequestStatus!
  createdAt: DateTime!
  reviewedAt: DateTime
  reviewedBy: User             # Who approved/rejected
  reviewComment: String        # Optional comment from reviewer
}
```

### 8. GraphQL Mutations to Update

**`requestBreakingNews` Mutation**
```typescript
// Current:
requestBreakingNews(articleId: ID!, reason: String!): BreakingNewsRequest

// Should work for ALL article statuses, not just PUBLISHED
// Returns: { id, status: 'PENDING', reason, articleId, createdAt, requester }
```

**`approveBreakingNews` Mutation**
```typescript
// Should remain unchanged, but ensure it:
// - Only ADMIN/EDITOR can call
// - Takes requestId (not articleId)
// - Returns request with updated status: APPROVED

approveBreakingNews(
  requestId: ID!
  reviewComment: String
): BreakingNewsRequest
```

**`rejectBreakingNews` Mutation**
```typescript
// Should remain unchanged, but ensure it:
// - Only ADMIN/EDITOR can call
// - Takes requestId (not articleId)
// - Returns request with updated status: REJECTED

rejectBreakingNews(
  requestId: ID!
  reviewComment: String
): BreakingNewsRequest
```

### 9. GraphQL Operations (Examples)

Use these queries/mutations as the contract the frontend is already aligned to.

**Mutations**
```graphql
mutation RequestBreakingNews($articleId: ID!, $reason: String) {
  requestBreakingNews(articleId: $articleId, reason: $reason) {
    id
    status
    reason
    createdAt
    requester { id name email }
  }
}

mutation ApproveBreakingNews($requestId: ID!, $reviewComment: String) {
  approveBreakingNews(requestId: $requestId, reviewComment: $reviewComment) {
    id
    status
    reviewComment
    reviewedAt
    reviewedBy { id name email }
  }
}

mutation RejectBreakingNews($requestId: ID!, $reviewComment: String) {
  rejectBreakingNews(requestId: $requestId, reviewComment: $reviewComment) {
    id
    status
    reviewComment
    reviewedAt
    reviewedBy { id name email }
  }
}
```

**Queries**
```graphql
query PendingBreakingNewsRequests {
  pendingBreakingNewsRequests {
    id
    status
    reason
    createdAt
    article { id title slug status }
    requester { id name email }
  }
}

query BreakingNewsRequestsByArticle($articleId: ID!) {
  breakingNewsRequests(articleId: $articleId) {
    id
    status
    reason
    reviewComment
    reviewedAt
    requester { id name }
    reviewedBy { id name }
  }
}

query ArticleBreakingNewsFields($id: ID!) {
  articleById(id: $id) {
    id
    title
    isBreaking
    breakingNewsRequestStatus
    breakingNewsRequestedAt
    breakingNewsRequestedBy { id name email }
  }
}
```

## Frontend Impact

Once backend is updated, the frontend will:
1. Show "Request as breaking news" checkbox on article create and edit forms for all statuses
2. Allow authors to submit breaking news requests immediately (not just after publishing)
3. Enable real-time request tracking in the UI

## Testing Checklist

- [ ] Author can request breaking news on DRAFT article
- [ ] Author can request breaking news on REVIEW article  
- [ ] Author can request breaking news on PUBLISHED article
- [ ] Author can view their own pending breaking news requests
- [ ] Author cannot view other authors' breaking news requests
- [ ] Editor can view ALL pending breaking news requests
- [ ] Editor can approve/reject breaking news requests
- [ ] Editor can request breaking news on any article
- [ ] Admin can request breaking news on any article
- [ ] Admin can approve/reject breaking news requests
- [ ] Admin can directly set article as breaking news
- [ ] Multiple requests can exist for same article (after rejection + re-request)
- [ ] Request history is preserved (APPROVED, REJECTED statuses visible)

## Summary of Changes

| Component | Change | Reason |
|-----------|--------|--------|
| `requestBreakingNews` mutation | Remove article status restriction | Enable authors to request breaking news at any point |
| `pendingBreakingNewsRequests` query | Allow AUTHOR role with filtering | Authors should see their own pending requests |
| `breakingNewsRequests` query | Allow AUTHOR role for own articles | Authors should see full request history for their articles |
| Article type | Expose breaking news fields | Frontend needs data to display status |
| Permissions | Add AUTHOR breaking news request role | Authors should have limited breaking news permissions |

---

**Document Version:** 1.0  
**Last Updated:** February 6, 2026  
**For:** Pulse News Admin Backend Team
