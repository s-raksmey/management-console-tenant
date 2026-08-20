'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSearch } from '@/hooks/useGraphQL';
import { Article } from '@/types/article';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X, Eye, Edit, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useAdminLocale } from '@/hooks/useAdminLocale';

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  REVIEW: "bg-yellow-100 text-yellow-800", 
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-red-100 text-red-800"
};

const searchPageCopy = {
  en: {
    title: 'Search Articles',
    description: 'Find articles, categories, and content across your site',
    searchPlaceholder: 'Search articles, titles, content...',
    suggestions: 'Suggestions',
    filters: 'Filters',
    clearAll: 'Clear all',
    status: 'Status',
    allStatuses: 'All statuses',
    statuses: {
      DRAFT: 'Draft',
      REVIEW: 'Review',
      PUBLISHED: 'Published',
      ARCHIVED: 'Archived',
    },
    category: 'Category',
    allCategories: 'All categories',
    categories: {
      tech: 'Technology',
      world: 'World',
      business: 'Business',
      sports: 'Sports',
      entertainment: 'Entertainment',
      politics: 'Politics',
      health: 'Health',
    },
    authorTopic: 'Author/Topic',
    authorTopicPlaceholder: 'Author name or topic',
    sortBy: 'Sort By',
    sortByPlaceholder: 'Sort by',
    sortOptions: {
      relevance: 'Relevance',
      date: 'Date',
      views: 'Views',
      title: 'Title',
    },
    order: 'Order',
    orderOptions: {
      desc: 'Newest First',
      asc: 'Oldest First',
    },
    searching: 'Searching...',
    resultsFor: (count: number, query: string) => `${count} results for "${query}"`,
    searchError: 'Search Error',
    searchErrorDescription: 'Something went wrong while searching. Please try again.',
    searchingArticles: 'Searching articles...',
    featured: 'Featured',
    editorsPick: "Editor's Pick",
    breaking: 'Breaking',
    byAuthor: (name: string) => `by ${name}`,
    viewsCount: (count: number) => `${count} views`,
    loading: 'Loading...',
    loadMore: 'Load More',
    viewArticle: 'View article',
    editArticle: 'Edit article',
    noResults: 'No results found',
    noResultsDescription: 'Try adjusting your search terms or filters',
    startSearching: 'Start searching',
    startSearchingDescription: 'Enter a search term to find articles, content, and more',
  },
  km: {
    title: 'ស្វែងរកអត្ថបទ',
    description: 'ស្វែងរកអត្ថបទ ប្រភេទ និងមាតិកានៅលើគេហទំព័ររបស់អ្នក',
    searchPlaceholder: 'ស្វែងរកអត្ថបទ ចំណងជើង មាតិកា...',
    suggestions: 'ការណែនាំ',
    filters: 'ចម្រោះ',
    clearAll: 'សម្អាតទាំងអស់',
    status: 'ស្ថានភាព',
    allStatuses: 'ស្ថានភាពទាំងអស់',
    statuses: {
      DRAFT: 'ព្រាង',
      REVIEW: 'រង់ចាំពិនិត្យ',
      PUBLISHED: 'បានផ្សព្វផ្សាយ',
      ARCHIVED: 'បានដាក់ប័ណ្ណសារ',
    },
    category: 'ប្រភេទ',
    allCategories: 'ប្រភេទទាំងអស់',
    categories: {
      tech: 'បច្ចេកវិទ្យា',
      world: 'ពិភពលោក',
      business: 'ពាណិជ្ជកម្ម',
      sports: 'កីឡា',
      entertainment: 'កម្សាន្ត',
      politics: 'នយោបាយ',
      health: 'សុខភាព',
    },
    authorTopic: 'អ្នកនិពន្ធ/ប្រធានបទ',
    authorTopicPlaceholder: 'ឈ្មោះអ្នកនិពន្ធ ឬប្រធានបទ',
    sortBy: 'តម្រៀបតាម',
    sortByPlaceholder: 'តម្រៀបតាម',
    sortOptions: {
      relevance: 'ភាពពាក់ព័ន្ធ',
      date: 'កាលបរិច្ឆេទ',
      views: 'ចំនួនមើល',
      title: 'ចំណងជើង',
    },
    order: 'លំដាប់',
    orderOptions: {
      desc: 'ថ្មីជាងមុន',
      asc: 'ចាស់ជាងមុន',
    },
    searching: 'កំពុងស្វែងរក...',
    resultsFor: (count: number, query: string) => `${count} លទ្ធផលសម្រាប់ "${query}"`,
    searchError: 'បញ្ហាស្វែងរក',
    searchErrorDescription: 'មានបញ្ហាពេលស្វែងរក។ សូមព្យាយាមម្ដងទៀត។',
    searchingArticles: 'កំពុងស្វែងរកអត្ថបទ...',
    featured: 'អត្ថបទពិសេស',
    editorsPick: 'ជម្រើសអ្នកនិពន្ធ',
    breaking: 'ព័ត៌មានទាន់ហេតុការណ៍',
    byAuthor: (name: string) => `ដោយ ${name}`,
    viewsCount: (count: number) => `${count} មើល`,
    loading: 'កំពុងផ្ទុក...',
    loadMore: 'ផ្ទុកបន្ថែម',
    viewArticle: 'មើលអត្ថបទ',
    editArticle: 'កែអត្ថបទ',
    noResults: 'រកមិនឃើញលទ្ធផល',
    noResultsDescription: 'សូមកែពាក្យស្វែងរក ឬចម្រោះរបស់អ្នក',
    startSearching: 'ចាប់ផ្តើមស្វែងរក',
    startSearchingDescription: 'បញ្ចូលពាក្យស្វែងរកដើម្បីរកអត្ថបទ មាតិកា និងផ្សេងៗ',
  },
} as const;

export default function SearchPage() {
  const { locale } = useAdminLocale();
  const copy = searchPageCopy[locale];
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<Article[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'ALL',
    categorySlug: searchParams.get('category') || '',
    topic: searchParams.get('topic') || '',
    sortBy: searchParams.get('sortBy') || 'relevance',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { searchArticles, getSearchSuggestions, loading, error } = useSearch();

  const updateURL = useCallback((query: string, newFilters: typeof filters) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (newFilters.status !== 'ALL') params.set('status', newFilters.status);
    if (newFilters.categorySlug) params.set('category', newFilters.categorySlug);
    if (newFilters.topic) params.set('topic', newFilters.topic);
    if (newFilters.sortBy !== 'relevance') params.set('sortBy', newFilters.sortBy);
    if (newFilters.sortOrder !== 'desc') params.set('sortOrder', newFilters.sortOrder);
    
    const newURL = params.toString() ? `/search?${params.toString()}` : '/search';
    router.replace(newURL, { scroll: false });
  }, [router]);

  const performSearch = useCallback(async (query: string, page = 0, resetResults = true) => {
    if (!query.trim()) {
      setResults([]);
      setTotalCount(0);
      setHasMore(false);
      return;
    }

    try {
      const searchInput = {
        query: query.trim(),
        categorySlug: filters.categorySlug || undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        authorName: filters.topic || undefined, // Map topic filter to authorName search
        take: 20,
        skip: page * 20,
        sortBy: filters.sortBy || 'relevance',
        sortOrder: filters.sortOrder || 'desc',
      };

      const response = await searchArticles(searchInput);
      
      if (response?.searchArticles) {
        const newResults = response.searchArticles.articles || [];
        setResults(resetResults ? newResults : [...results, ...newResults]);
        setTotalCount(response.searchArticles.totalCount || 0);
        setHasMore(response.searchArticles.hasMore || false);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  }, [searchArticles, filters, results]);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  // Handle search suggestions
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const response = await getSearchSuggestions(searchQuery, 5);
          if (response?.searchSuggestions) {
            setSuggestions(response.searchSuggestions);
            setShowSuggestions(true);
          }
        } catch (err) {
          console.error('Suggestions error:', err);
          setSuggestions([]);
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, getSearchSuggestions]);

  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        performSearch(searchQuery, 0, true);
        updateURL(searchQuery, filters);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, filters, performSearch, updateURL]);

  const handleLoadMore = () => {
    performSearch(searchQuery, currentPage + 1, false);
  };

  const clearFilters = () => {
    const newFilters = {
      status: 'ALL',
      categorySlug: '',
      topic: '',
      sortBy: 'relevance',
      sortOrder: 'desc',
    };
    setFilters(newFilters);
    updateURL(searchQuery, newFilters);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL(searchQuery, newFilters);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const hasActiveFilters = (filters.status !== 'ALL' && filters.status) || filters.categorySlug || filters.topic;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{copy.title}</h1>
        <p className="text-slate-600">{copy.description}</p>
      </div>

      {/* Search Input */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder={copy.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-10"
          />
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs font-medium text-slate-500 mb-2 px-2">{copy.suggestions}</div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-md transition-colors"
                  >
                    <Search className="inline h-3 w-3 mr-2 text-slate-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full items-center gap-2 sm:w-auto"
        >
          <Filter className="h-4 w-4" />
          {copy.filters}
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              !
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4 rounded-lg bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-medium text-slate-900">{copy.filters}</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                {copy.clearAll}
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{copy.status}</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={copy.allStatuses} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{copy.allStatuses}</SelectItem>
                  <SelectItem value="DRAFT">{copy.statuses.DRAFT}</SelectItem>
                  <SelectItem value="REVIEW">{copy.statuses.REVIEW}</SelectItem>
                  <SelectItem value="PUBLISHED">{copy.statuses.PUBLISHED}</SelectItem>
                  <SelectItem value="ARCHIVED">{copy.statuses.ARCHIVED}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{copy.category}</label>
              <Select value={filters.categorySlug} onValueChange={(value) => handleFilterChange('categorySlug', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={copy.allCategories} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{copy.allCategories}</SelectItem>
                  <SelectItem value="tech">{copy.categories.tech}</SelectItem>
                  <SelectItem value="world">{copy.categories.world}</SelectItem>
                  <SelectItem value="business">{copy.categories.business}</SelectItem>
                  <SelectItem value="sports">{copy.categories.sports}</SelectItem>
                  <SelectItem value="entertainment">{copy.categories.entertainment}</SelectItem>
                  <SelectItem value="politics">{copy.categories.politics}</SelectItem>
                  <SelectItem value="health">{copy.categories.health}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{copy.authorTopic}</label>
              <Input
                placeholder={copy.authorTopicPlaceholder}
                value={filters.topic}
                onChange={(e) => handleFilterChange('topic', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{copy.sortBy}</label>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={copy.sortByPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">{copy.sortOptions.relevance}</SelectItem>
                  <SelectItem value="date">{copy.sortOptions.date}</SelectItem>
                  <SelectItem value="views">{copy.sortOptions.views}</SelectItem>
                  <SelectItem value="title">{copy.sortOptions.title}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{copy.order}</label>
              <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={copy.order} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{copy.orderOptions.desc}</SelectItem>
                  <SelectItem value="asc">{copy.orderOptions.asc}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-slate-600">
              {loading ? copy.searching : copy.resultsFor(totalCount, searchQuery)}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="font-medium text-red-800">{copy.searchError}</h3>
                <p className="text-red-600 text-sm">
                  {locale === 'en' && typeof error === 'string' ? error : copy.searchErrorDescription}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && results.length === 0 && searchQuery && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-slate-600">{copy.searchingArticles}</p>
            </div>
          </div>
        )}

        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((article) => (
              <div key={article.id} className="rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="min-w-0 break-words text-base font-semibold text-slate-900 hover:text-blue-600 sm:text-lg">
                        <Link href={`/articles/${article.id}/edit`}>
                          {article.title}
                        </Link>
                      </h3>
                      <Badge className={`text-xs ${statusColors[article.status]}`}>
                        {copy.statuses[article.status]}
                      </Badge>
                      {article.isFeatured && <Badge variant="secondary" className="text-xs">{copy.featured}</Badge>}
                      {article.isEditorsPick && <Badge variant="secondary" className="text-xs">{copy.editorsPick}</Badge>}
                      {article.isBreaking && <Badge variant="destructive" className="text-xs">{copy.breaking}</Badge>}
                    </div>
                    
                    {article.excerpt && (
                      <p className="text-slate-600 mb-3 line-clamp-2">{article.excerpt}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>/{article.slug}</span>
                      {article.category && <span>{article.category.name}</span>}
                      {article.authorName && <span>{copy.byAuthor(article.authorName)}</span>}
                      <span>{format(new Date(article.updatedAt), 'MMM d, yyyy')}</span>
                      <span>{copy.viewsCount(article.viewCount || 0)}</span>
                    </div>
                  </div>
                  
                  <div className="flex shrink-0 items-center gap-2 sm:ml-4">
                    <Button variant="ghost" size="sm" aria-label={copy.viewArticle} asChild>
                      <Link href={`/${article.category?.slug || 'news'}/${article.topic || 'latest'}/${article.slug}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" aria-label={copy.editArticle} asChild>
                      <Link href={`/articles/${article.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {copy.loading}
                    </>
                  ) : (
                    copy.loadMore
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : searchQuery && !loading ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">{copy.noResults}</h3>
            <p className="text-slate-600">
              {copy.noResultsDescription}
            </p>
          </div>
        ) : !searchQuery ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">{copy.startSearching}</h3>
            <p className="text-slate-600">
              {copy.startSearchingDescription}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
