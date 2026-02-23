'use client';

import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useGraphQL";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Save, X } from "lucide-react";
import { useToastHelpers } from "@/components/ui/toast";
import { Category, M_CREATE_CATEGORY, M_UPDATE_CATEGORY, M_DELETE_CATEGORY } from "@/services/category.gql";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";

interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { getCategories, loading: categoriesLoading } = useCategories();
  const { showSuccess, showError } = useToastHelpers();
  const client = getAuthenticatedGqlClient();

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      if (response?.categories) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      showError('Error', 'Failed to load categories');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
    });
    setEditingCategory(null);
  };

  const startEditing = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    });
    setEditingCategory(category);
  };

  const saveCategory = async () => {
    if (!formData.name.trim()) {
      showError("Validation Error", "Name is required");
      return;
    }

    if (!formData.slug.trim()) {
      showError("Validation Error", "Slug is required");
      return;
    }

    setIsLoading(true);

    try {
      const input = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
      };

      if (editingCategory) {
        // Update existing category
        await client.request(M_UPDATE_CATEGORY, {
          id: editingCategory.id,
          input
        });
        showSuccess("Success", "Category updated successfully");
      } else {
        // Create new category
        await client.request(M_CREATE_CATEGORY, {
          input
        });
        showSuccess("Success", "Category created successfully");
      }

      // Reload categories and reset form
      await loadCategories();
      resetForm();
    } catch (err: any) {
      console.error('Error saving category:', err);
      showError("Error", err.message || 'Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      return;
    }

    setIsLoading(true);

    try {
      await client.request(M_DELETE_CATEGORY, {
        id: categoryId
      });

      showSuccess("Success", "Category deleted successfully");
      await loadCategories();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      showError("Error", err.message || 'Failed to delete category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground">
            Create and manage categories for organizing your content
          </p>
        </div>
      </div>

      {/* Category Form - Always visible for create, switches to edit mode */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingCategory ? "Edit Category" : "Create New Category"}
          </CardTitle>
          <CardDescription>
            {editingCategory 
              ? `Editing category: ${editingCategory.name}`
              : "Add a new category to organize your articles and content"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter category name..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Slug <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="category-slug"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description for this category..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button 
              onClick={saveCategory} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {editingCategory ? "Update Category" : "Create Category"}
            </Button>
            {editingCategory && (
              <Button variant="outline" onClick={resetForm} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            {categories.length === 0 
              ? "No categories found. Create your first category above."
              : `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} found`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No categories yet.</p>
              <p>Create your first category to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{category.name}</h3>
                      <Badge variant="secondary">{category.slug}</Badge>
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {category.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {new Date(category.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(category)}
                      disabled={isLoading}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCategory(category.id, category.name)}
                      disabled={isLoading}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {categoriesLoading && (
        <div className="text-center py-4">
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
}

