// src/components/user-management/UserList.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { UserService } from '../../services/user.gql';
import UserTableRow from './UserTableRow';
import BulkActionBar from './BulkActionBar';
import type { User, UserFilters, ListUsersInput } from '../../types/user';

interface UserListProps {
  filters: UserFilters;
}

export default function UserList({ filters }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  const pageSize = 10;

  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const input: ListUsersInput = {
        take: pageSize,
        skip: (page - 1) * pageSize,
        search: filters.search || undefined,
        role: filters.role !== 'ALL' ? filters.role : undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      const result = await UserService.listUsers(input);
      
      setUsers(result.users);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      setCurrentPage(page);
      setSelectedUserIds([]); // Clear selection when data changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers(1);
  }, [filters]);

  const handlePageChange = (page: number) => {
    fetchUsers(page);
  };

  const handleUserSelect = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUserIds(users.map(user => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
  };

  const handleUserDelete = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    setSelectedUserIds(prev => prev.filter(id => id !== userId));
    setTotalCount(prev => prev - 1);
  };

  const handleBulkActionComplete = () => {
    // Refresh the current page after bulk action
    fetchUsers(currentPage);
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const isAllSelected = users.length > 0 && selectedUserIds.length === users.length;
  const isPartiallySelected = selectedUserIds.length > 0 && selectedUserIds.length < users.length;

  if (loading && users.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-slate-600">Loading users...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading users: {error}</p>
          <button
            onClick={() => fetchUsers(currentPage)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedUserIds={selectedUserIds}
        onClearSelection={() => setSelectedUserIds([])}
        onBulkActionComplete={handleBulkActionComplete}
      />

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isPartiallySelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {users.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  isSelected={selectedUserIds.includes(user.id)}
                  onSelect={handleUserSelect}
                  onUserUpdate={handleUserUpdate}
                  onUserDelete={handleUserDelete}
                />
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No users found</p>
            <p className="text-slate-400 text-sm mt-1">
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Showing{' '}
                    <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, totalCount)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{totalCount}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && users.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
          <span className="text-slate-600">Updating...</span>
        </div>
      )}

    </div>
  );
}
