"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Moon, 
  Sun, 
  Globe,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MobileNavTrigger } from "./mobile-nav";
import { useAuth } from "@/contexts/AuthContext";
import { useSearch } from "@/hooks/useGraphQL";

interface HeaderProps {
  onMobileNavOpen: (open: boolean) => void;
}

export function Header({ onMobileNavOpen }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { searchArticles } = useSearch();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Here you would implement actual dark mode toggle logic
  };

  const handleLogout = () => {
    logout();
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'EDITOR':
        return 'bg-blue-100 text-blue-800';
      case 'AUTHOR':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Highlight matching text in search results
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 text-slate-900 font-medium">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      if (isCmdOrCtrl && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        setIsSearching(true);
        const result = await searchArticles({ query, take: 6, skip: 0 });
        const articles = result?.searchArticles?.articles || [];
        setSearchResults(
          articles.map((article: any) => ({
            id: article.id,
            title: article.title,
            slug: article.slug,
          }))
        );
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [searchQuery, searchArticles]);

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 md:px-6 shadow-sm">
        {/* Mobile nav trigger */}
        <MobileNavTrigger onOpenChange={onMobileNavOpen} />

        {/* Logo/Brand - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-2 mr-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">PN</span>
          </div>
          <span className="font-semibold text-slate-800">Pulse News</span>
        </div>

        {/* Enhanced Search */}
        <div className="flex-1 max-w-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const query = searchQuery.trim();
              if (!query) return;
              setShowSuggestions(true);
            }}
          >
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${
                searchFocused ? 'text-blue-500' : 'text-slate-500'
              }`} />
              <input
                ref={searchInputRef}
                name="search"
                type="search"
                placeholder="Search articles, categories, users... (Ctrl+K)"
                className={`w-full rounded-lg border bg-white pl-10 pr-12 py-2.5 text-sm placeholder:text-slate-500 transition-all duration-200 ${
                  searchFocused 
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onFocus={() => {
                  setSearchFocused(true);
                  setShowSuggestions(true);
                }}
                onBlur={() => {
                  setSearchFocused(false);
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {!searchFocused && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-xs text-slate-600">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              )}

              {showSuggestions && searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  {isSearching ? (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500"></div>
                        <span>Searching...</span>
                      </div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <ul className="max-h-64 overflow-auto py-1">
                      {searchResults.map((result) => (
                        <li key={result.id}>
                          <button
                            type="button"
                            className="flex w-full items-center px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setShowSuggestions(false);
                              setSearchQuery('');
                              router.push(`/articles/${result.id}`);
                            }}
                          >
                            <Search className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{highlightMatch(result.title, searchQuery)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                        <Search className="h-5 w-5 text-slate-400" />      
                      </div>
                      <p className="text-sm font-medium text-slate-700 mb-1">No results found</p>
                      <p className="text-xs text-slate-500">Try searching with different keywords</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span className="mr-2">🇺🇸</span>
                English
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="mr-2">🇰🇭</span>
                ខ្មែរ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0"
                onClick={toggleDarkMode}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isDarkMode ? 'Light mode' : 'Dark mode'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
                <Bell className="h-4 w-4" />
                <Badge
                  variant="destructive"
                  className="absolute items-center justify-center -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs animate-pulse"
                >
                  3
                </Badge>
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                <Badge variant="secondary" className="text-xs">3 new</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem className="flex-col items-start p-4 cursor-pointer">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-sm">New article published</span>
                    <span className="text-xs text-slate-500 ml-auto">2m ago</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    "Breaking News: Tech Innovation" has been published successfully.
                  </p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex-col items-start p-4 cursor-pointer">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-sm">Comment approved</span>
                    <span className="text-xs text-slate-500 ml-auto">5m ago</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    A comment on "Latest Updates" has been approved.
                  </p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex-col items-start p-4 cursor-pointer">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium text-sm">System update</span>
                    <span className="text-xs text-slate-500 ml-auto">1h ago</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    System maintenance completed successfully.
                  </p>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm text-blue-600 cursor-pointer">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="/avatar.png" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                    {user ? getUserInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{user?.name || 'User'}</p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs px-1.5 py-0.5 ${getRoleBadgeColor(user?.role || '')}`}
                    >
                      {user?.role || 'USER'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{user?.email || 'user@example.com'}</p>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-500 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs px-1.5 py-0.5 ${getRoleBadgeColor(user?.role || '')}`}
                    >
                      {user?.role || 'USER'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{user?.email || 'user@example.com'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}
