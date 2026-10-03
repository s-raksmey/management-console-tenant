const friendlyArticleErrors: Record<string, string> = {
  ARTICLE_NOT_FOUND: "This article could not be found.",
  ARTICLE_PERMISSION_DENIED: "You do not have permission to perform this action.",
  ARTICLE_STATUS_INVALID: "This action is not available for the article's current status.",
  CATEGORY_REQUIRED: "Please select a valid category.",
  SUBCATEGORY_REQUIRED: "Please select a subcategory.",
  SUBCATEGORY_CATEGORY_MISMATCH: "Choose a subcategory from the selected category.",
  ARTICLE_ALREADY_PUBLISHED: "This article is already published.",
  ARTICLE_ALREADY_ARCHIVED: "This article is already archived.",
  REVISION_NOT_FOUND: "This revision could not be found.",
  REVISION_PERMISSION_DENIED: "You do not have permission to restore this revision.",
  REVISION_ALREADY_PROCESSED: "This revision request has already been reviewed.",
  REVISION_NO_CHANGES: "No changes to submit.",
  REVISION_NOTE_REQUIRED: "Add a note before submitting the revision request.",
  SLUG_ALREADY_EXISTS: "An article with this URL slug already exists.",
  SCHEDULE_DATE_INVALID: "Choose a valid future schedule date for a draft article.",
  ARTICLE_MODIFIED: "This article was updated by someone else. Reload the latest version before saving.",
  PUBLISH_FAILED: "The article is missing information required for review or publication.",
};

export function safeArticleErrorMessage(error: unknown, fallback: string): string {
  const value = error as any;
  const graphqlError = value?.response?.errors?.[0];
  const code = graphqlError?.extensions?.code ?? value?.extensions?.code;
  if (typeof code === "string" && friendlyArticleErrors[code]) return friendlyArticleErrors[code];

  const message = typeof graphqlError?.message === "string"
    ? graphqlError.message
    : error instanceof Error ? error.message : "";
  const codePrefix = message.match(/^([A-Z_]+):\s*/)?.[1];
  if (codePrefix && friendlyArticleErrors[codePrefix]) return friendlyArticleErrors[codePrefix];
  if (/prisma|sql|database|unique constraint|stack trace|internal server/i.test(message)) return fallback;
  return message.trim() || fallback;
}
