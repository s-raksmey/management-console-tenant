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

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  REVIEW: "bg-yellow-100 text-yellow-800", 
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-red-100 text-red-800"
};

export default function SearchPage() {
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
        <h1 className="text-2xl font-bold text-slate-900">Search Articles</h1>
        <p className="text-slate-600">Find articles, categories, and content across your site</p>
      </div>

      {/* Search Input */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search articles, titles, content..."
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
                <div className="text-xs font-medium text-slate-500 mb-2 px-2">Suggestions</div>
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
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              !
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-slate-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-900">Filters</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
              <Select value={filters.categorySlug} onValueChange={(value) => handleFilterChange('categorySlug', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="world">World</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="politics">Politics</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Author/Topic</label>
              <Input
                placeholder="Author name or topic"
                value={filters.topic}
                onChange={(e) => handleFilterChange('topic', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Sort By</label>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Order</label>
              <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
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
              {loading ? 'Searching...' : `${totalCount} results for "${searchQuery}"`}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="font-medium text-red-800">Search Error</h3>
                <p className="text-red-600 text-sm">
                  {typeof error === 'string' ? error : 'Something went wrong while searching. Please try again.'}
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
              <p className="text-slate-600">Searching articles...</p>
            </div>
          </div>
        )}

        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((article) => (
              <div key={article.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600">
                        <Link href={`/articles/${article.id}/edit`}>
                          {article.title}
                        </Link>
                      </h3>
                      <Badge className={`text-xs ${statusColors[article.status]}`}>
                        {article.status}
                      </Badge>
                      {article.isFeatured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                      {article.isEditorsPick && <Badge variant="secondary" className="text-xs">Editor's Pick</Badge>}
                      {article.isBreaking && <Badge variant="destructive" className="text-xs">Breaking</Badge>}
                    </div>
                    
                    {article.excerpt && (
                      <p className="text-slate-600 mb-3 line-clamp-2">{article.excerpt}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>/{article.slug}</span>
                      {article.category && <span>{article.category.name}</span>}
                      {article.authorName && <span>by {article.authorName}</span>}
                      <span>{format(new Date(article.updatedAt), 'MMM d, yyyy')}</span>
                      <span>{article.viewCount || 0} views</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${article.category?.slug || 'news'}/${article.topic || 'latest'}/${article.slug}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
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
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : searchQuery && !loading ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No results found</h3>
            <p className="text-slate-600">
              Try adjusting your search terms or filters
            </p>
          </div>
        ) : !searchQuery ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Start searching</h3>
            <p className="text-slate-600">
              Enter a search term to find articles, content, and more
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
