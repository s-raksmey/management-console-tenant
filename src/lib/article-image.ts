type ArticleImageSource = {
  coverImageUrl?: string | null;
  ogImageUrl?: string | null;
};

export function getArticleImage(a?: ArticleImageSource | null): string | null {
  return a?.coverImageUrl || a?.ogImageUrl || null;
}
