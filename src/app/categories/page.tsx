'use client';

import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useGraphQL";
import { CategoryList } from "@/components/categories/CategoryList";
import { CategoryForm, CategoryFormData } from "@/components/categories/CategoryForm";
import { Category, M_CREATE_CATEGORY, M_UPDATE_CATEGORY, M_DELETE_CATEGORY } from "@/services/category.gql";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getCategories, loading: categoriesLoading } = useCategories();
  const client = getAuthenticatedGqlClient();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setError(null);
      const response = await getCategories();
      if (response?.categories) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: CategoryFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (editingCategory) {
        // Update existing category
        await client.request(M_UPDATE_CATEGORY, {
          id: editingCategory.id,
          input: data
        });
      } else {
        // Create new category
        await client.request(M_CREATE_CATEGORY, {
          input: data
        });
      }

      // Reload categories and close form
      await loadCategories();
      setShowForm(false);
      setEditingCategory(null);
    } catch (err: any) {
      console.error('Error saving category:', err);
      setError(err.message || 'Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (category: Category) => {
    setIsLoading(true);
    setError(null);

    try {
      await client.request(M_DELETE_CATEGORY, {
        id: category.id
      });

      // Reload categories
      await loadCategories();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Failed to delete category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setError(null);
  };

  if (categoriesLoading && categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Categories</h1>
          <p className="text-slate-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Categories</h1>
        <p className="text-slate-600">Organize your content with categories.</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-red-600 text-sm">⚠️</div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-900">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Category Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h2>
          <CategoryForm
            category={editingCategory}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Categories List */}
      <CategoryList
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        isLoading={isLoading}
      />
    </div>
  );
}
