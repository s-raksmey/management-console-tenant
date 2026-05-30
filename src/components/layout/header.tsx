"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  ChevronDown,
  CheckCircle,
  XCircle,
  Send,
  FileText,
  Archive,
  UserPlus,
  Building2,
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
import { useTenant } from "@/contexts/TenantContext";
import { useSearch } from "@/hooks/useGraphQL";
import {
  useNotifications,
  type NotificationRecord,
  type NotificationTypeValue,
} from "@/hooks/useNotifications";
import { useVisibilityPolling } from "@/hooks/usePolling";
import { formatDistanceToNow } from "date-fns";
import { COLOR_SCHEME_CHANGED_EVENT } from "@/lib/tweakcn-theme";

interface HeaderProps {
  onMobileNavOpen: (open: boolean) => void;
  showBrand?: boolean;
}

export function Header({ onMobileNavOpen, showBrand = false }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activeTenant } = useTenant();
  const { searchArticles } = useSearch();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; title: string; slug: string }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const brandName =
    user?.role === "SUPER_ADMIN" ? "Management Console" : activeTenant?.name || "Pulse News";
  const brandInitials = brandName
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useNotifications();

  const toggleDarkMode = () => {
    const nextIsDark = !isDarkMode;
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem("pulse-news-color-scheme", nextIsDark ? "dark" : "light");
    setIsDarkMode(nextIsDark);
    window.dispatchEvent(new Event(COLOR_SCHEME_CHANGED_EVENT));
  };

  const handleLogout = () => {
    logout();
  };

  const formatNotificationTime = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getNotificationMeta = (type: NotificationTypeValue) => {
    switch (type) {
      case "SUBMISSION":
        return {
          label: "Submission",
          accent: "bg-blue-100 text-blue-700",
          icon: Send,
        };
      case "ACCOUNT_REQUEST":
        return {
          label: "New Account Request",
          accent: "bg-indigo-100 text-indigo-700",
          icon: UserPlus,
        };
      case "APPROVAL":
      case "PUBLICATION":
        return {
          label: "Approved",
          accent: "bg-green-100 text-green-700",
          icon: CheckCircle,
        };
      case "REJECTION":
        return {
          label: "Rejected",
          accent: "bg-red-100 text-red-700",
          icon: XCircle,
        };
      case "REVISION_REQUESTED":
        return {
          label: "Revision",
          accent: "bg-purple-100 text-purple-700",
          icon: FileText,
        };
      case "REVISION_APPROVED":
        return {
          label: "Revision",
          accent: "bg-green-100 text-green-700",
          icon: CheckCircle,
        };
      case "REVISION_REJECTED":
        return {
          label: "Revision",
          accent: "bg-red-100 text-red-700",
          icon: XCircle,
        };
      case "REVISION_CONSUMED":
        return {
          label: "Revision",
          accent: "bg-slate-100 text-slate-700",
          icon: Archive,
        };
      case "UNPUBLICATION":
      case "ARCHIVE":
        return {
          label: "Archived",
          accent: "bg-slate-100 text-slate-700",
          icon: Archive,
        };
      case "DRAFT_SAVED":
        return {
          label: "Draft",
          accent: "bg-amber-100 text-amber-700",
          icon: FileText,
        };
      default:
        return {
          label: "Update",
          accent: "bg-slate-100 text-slate-700",
          icon: FileText,
        };
    }
  };

  const getNotificationTarget = (notification: NotificationRecord) => {
    if (notification.type === "SUBMISSION") {
      return "/review";
    }
    if (
      notification.type === "ACCOUNT_REQUEST"
    ) {
      return "/users/requests";
    }
    if (
      notification.type === "REVISION_REQUESTED" ||
      notification.type === "REVISION_APPROVED" ||
      notification.type === "REVISION_REJECTED" ||
      notification.type === "REVISION_CONSUMED"
    ) {
      if (notification.articleId) {
        return `/articles/${notification.articleId}/edit`;
      }
    }
    if (notification.articleId) {
      return `/articles/${notification.articleId}`;
    }
    return undefined;
  };

  const getNotificationFromLabel = (notification: NotificationRecord) => {
    const fromUser = notification.fromUser;
    if (fromUser?.name && fromUser.name.trim()) {
      return `From: ${fromUser.name.trim()}`;
    }
    if (fromUser?.email && fromUser.email.trim()) {
      return `From: ${fromUser.email.trim()}`;
    }

    if (!notification.metadata || typeof notification.metadata !== "object") {
      return null;
    }

    const metadata = notification.metadata as Record<string, unknown>;
    const fromUserName = metadata.fromUserName;
    const fromUserEmail = metadata.fromUserEmail;

    if (typeof fromUserName === "string" && fromUserName.trim()) {
      return `From: ${fromUserName.trim()}`;
    }

    if (typeof fromUserEmail === "string" && fromUserEmail.trim()) {
      return `From: ${fromUserEmail.trim()}`;
    }

    return null;
  };

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setIsNotificationsLoading(true);

    try {
      const [listResult, countResult] = await Promise.all([
        getNotifications({ limit: 6, offset: 0, unreadOnly: false }),
        getUnreadCount(),
      ]);
      const list = listResult?.myNotifications?.notifications ?? [];
      setNotifications(list);
      setUnreadCount(countResult?.unreadNotificationCount ?? 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsNotificationsLoading(false);
    }
  }, [user?.id, getNotifications, getUnreadCount]);

  const handleNotificationClick = async (
    notification: NotificationRecord,
    targetPath?: string,
  ) => {
    if (!notification.isRead) {
      const result = await markNotificationRead(notification.id);
      if (result?.markNotificationRead?.isRead) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                  readAt: result.markNotificationRead.readAt ?? item.readAt,
                }
              : item,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }

    if (targetPath) {
      router.push(targetPath);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    const result = await markAllNotificationsRead();
    if (result?.markAllNotificationsRead) {
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "EDITOR":
        return "bg-blue-100 text-blue-800";
      case "AUTHOR":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Highlight matching text in search results
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(
      new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
    );
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={index}
              className="bg-yellow-200 text-slate-900 font-medium"
            >
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  useEffect(() => {
    const savedScheme = localStorage.getItem("pulse-news-color-scheme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)");

    const applyScheme = () => {
      const scheme = localStorage.getItem("pulse-news-color-scheme") || savedScheme || "system";
      const nextIsDark =
        scheme === "dark" || (scheme === "system" && systemPrefersDark.matches);

      document.documentElement.classList.toggle("dark", nextIsDark);
      setIsDarkMode(nextIsDark);
      window.dispatchEvent(new Event(COLOR_SCHEME_CHANGED_EVENT));
    };

    applyScheme();
    systemPrefersDark.addEventListener("change", applyScheme);
    return () => systemPrefersDark.removeEventListener("change", applyScheme);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      if (isCmdOrCtrl && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
          })),
        );
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [searchQuery, searchArticles]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useVisibilityPolling(loadNotifications, {
    interval: 10000,
    enabled: !!user?.id,
    immediate: false,
  });

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-30 flex h-12 min-w-0 items-center gap-2 overflow-hidden border-b border-slate-100 bg-white px-3 dark:border-slate-800 dark:bg-slate-900 md:gap-3 md:px-4">
        {/* Mobile nav trigger */}
        <MobileNavTrigger onOpenChange={onMobileNavOpen} />

        {showBrand && (
          <div className="hidden min-w-0 shrink-0 items-center gap-2 lg:flex">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900">
              <span className="text-white font-semibold text-sm">
                {brandInitials || "PN"}
              </span>
            </div>
            <span className="max-w-[160px] truncate font-semibold tracking-tight text-slate-900">
              {brandName}
            </span>
          </div>
        )}

        {/* Enhanced Search */}
        <div className="hidden min-w-0 flex-1 sm:block md:max-w-sm xl:max-w-md 2xl:max-w-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const query = searchQuery.trim();
              if (!query) return;
              setShowSuggestions(true);
            }}
          >
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${
                  searchFocused ? "text-blue-500" : "text-slate-500"
                }`}
              />
              <input
                ref={searchInputRef}
                name="search"
                type="search"
                placeholder="Search articles, categories, users... (Ctrl+K)"
                className={`h-9 w-full rounded-full border py-1.5 pl-9 pr-10 text-sm placeholder:text-slate-500 transition-colors duration-200 ${
                  searchFocused
                    ? "border-slate-300 bg-white"
                    : "border-slate-200 bg-slate-50/80 hover:bg-white"
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
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 font-mono text-xs text-slate-500">
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
                              setSearchQuery("");
                              router.push(`/articles/${result.id}`);
                            }}
                          >
                            <Search className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
                            <span className="truncate">
                              {highlightMatch(result.title, searchQuery)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        No results found
                      </p>
                      <p className="text-xs text-slate-500">
                        Try searching with different keywords
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right side actions */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {activeTenant && user?.role !== "SUPER_ADMIN" && (
            <div className="hidden h-8 max-w-[180px] items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 lg:flex xl:max-w-[220px]">
              <Building2 className="h-4 w-4 text-slate-500" />
              <span className="truncate text-xs font-semibold text-slate-700">
                {activeTenant.name}
              </span>
            </div>
          )}

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                className="h-8 w-8 p-0"
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
              <p>{isDarkMode ? "Light mode" : "Dark mode"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <DropdownMenu onOpenChange={(open) => open && loadNotifications()}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-8 w-8 p-0"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute items-center justify-center -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs animate-pulse"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-w-[calc(100vw-1rem)] w-[calc(100vw-1rem)] overflow-hidden border-slate-200 bg-white p-0 text-slate-950 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 sm:w-96"
            >
              <DropdownMenuLabel className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Notifications
                {unreadCount > 0 && (
                  <Badge className="border border-blue-200 bg-blue-50 text-xs text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200">
                    {unreadCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
              <div className="max-h-72 overflow-y-auto">
                {isNotificationsLoading && notifications.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500 dark:border-slate-700 dark:border-t-blue-300"></div>
                      <span>Loading notifications...</span>
                    </div>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`group flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors focus:bg-transparent ${
                        notification.isRead
                          ? "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80"
                          : "bg-blue-50/70 hover:bg-blue-50 dark:bg-blue-500/10 dark:hover:bg-blue-500/15"
                      }`}
                      onClick={() =>
                        handleNotificationClick(
                          notification,
                          getNotificationTarget(notification),
                        )
                      }
                    >
                      {(() => {
                        const meta = getNotificationMeta(notification.type);
                        const Icon = meta.icon;
                        const target = getNotificationTarget(notification);
                        const actionLabel =
                          target === "/review"
                            ? "Review queue"
                            : target === "/users/requests"
                              ? "Review request"
                              : target
                                ? "Open article"
                                : "View details";
                        const fromLabel =
                          getNotificationFromLabel(notification);

                        return (
                          <>
                            <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                              <Icon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                              {!notification.isRead && (
                                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:bg-blue-300 dark:ring-slate-900"></span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {notification.title}
                                </div>
                                <span className="ml-auto whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                                  {formatNotificationTime(
                                    notification.createdAt,
                                  )}
                                </span>
                              </div>
                              {notification.message && (
                                <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                                  {notification.message}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="text-blue-600 group-hover:text-blue-700 dark:text-sky-300 dark:group-hover:text-sky-200">
                                  {actionLabel}
                                </span>
                                {fromLabel && (
                                  <span className="truncate">
                                    • {fromLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <Bell className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                      No notifications
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      You are all caught up
                    </p>
                  </div>
                )}
              </div>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
              <DropdownMenuItem
                className="cursor-pointer justify-center py-2.5 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 disabled:text-slate-400 dark:text-sky-300 dark:hover:bg-sky-500/10 dark:hover:text-sky-200 dark:focus:bg-sky-500/10 dark:focus:text-sky-200 dark:disabled:text-slate-600"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
              >
                Mark all as read
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-9 items-center gap-2 px-1.5 md:px-2"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src="/avatar.png" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                    {user ? getUserInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left lg:block">
                  <div className="flex items-center gap-2">
                    <p className="max-w-[180px] truncate text-sm font-semibold leading-4 text-slate-900 xl:max-w-[220px]">
                      {user?.name || "User"}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`text-xs px-1.5 py-0.5 ${getRoleBadgeColor(user?.role || "")}`}
                    >
                      {user?.role || "USER"}
                    </Badge>
                  </div>
                  <p className="max-w-[220px] truncate text-xs leading-4 text-slate-500">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
                <ChevronDown className="hidden h-3 w-3 text-slate-500 lg:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="max-w-[calc(100vw-1rem)] w-[calc(100vw-1rem)] overflow-hidden p-1 sm:w-64"
            >
              <DropdownMenuLabel className="px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-start gap-2">
                    <p className="min-w-0 flex-1 text-sm font-semibold leading-5 text-slate-900">
                      {user?.name || "User"}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 px-1.5 py-0.5 text-[10px] leading-4 ${getRoleBadgeColor(user?.role || "")}`}
                    >
                      {user?.role || "USER"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 break-all text-xs leading-4 text-slate-500">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="h-9 cursor-pointer rounded-md px-3">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="h-9 cursor-pointer rounded-md px-3">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="h-9 cursor-pointer rounded-md px-3 text-red-600 focus:text-red-600"
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
