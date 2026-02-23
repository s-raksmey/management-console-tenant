'use client';

import { useState, useEffect } from "react";
import { useCategories, useGraphQL } from "@/hooks/useGraphQL";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Save, X } from "lucide-react";
import { useToastHelpers } from "@/components/ui/toast";
import { Category, M_CREATE_CATEGORY, M_UPDATE_CATEGORY, M_DELETE_CATEGORY } from "@/services/category.gql";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";

interface Topic {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
}

interface TopicFormData {
  title: string;
  slug: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [pendingTopics, setPendingTopics] = useState<TopicFormData[]>([]);
  
  const { getCategories, loading: categoriesLoading } = useCategories();
  const { query } = useGraphQL();
  const { showSuccess, showError } = useToastHelpers();
  const client = getAuthenticatedGqlClient();

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
  });

  const [topicFormData, setTopicFormData] = useState<TopicFormData>({
    title: "",
    slug: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  // Load topics when editing a category
  useEffect(() => {
    if (editingCategory) {
      loadTopicsForCategory(editingCategory.slug);
    } else {
      setTopics([]);
    }
  }, [editingCategory]);

  const loadCategories = async () => {
    try {
      console.log('🔄 Loading categories...');
      const response = await getCategories();
      console.log('📦 Categories response:', response);
      if (response?.categories) {
        console.log(`✅ Setting ${response.categories.length} categories`);
        setCategories(response.categories);
      } else {
        console.warn('⚠️ No categories in response');
      }
    } catch (err) {
      console.error('❌ Error loading categories:', err);
      showError('Error', 'Failed to load categories');
    }
  };

  const loadTopicsForCategory = async (categorySlug: string) => {
    try {
      const TOPICS_BY_CATEGORY_QUERY = `
        query GetTopicsByCategory($categorySlug: String!) {
          topicsByCategory(categorySlug: $categorySlug) {
            id
            slug
            title
            description
            category {
              id
              name
              slug
            }
            createdAt
            updatedAt
          }
        }
      `;

      const result = await query(TOPICS_BY_CATEGORY_QUERY, { categorySlug });
      setTopics(result.topicsByCategory || []);
    } catch (err) {
      console.error("Failed to load topics:", err);
      showError("Error", "Failed to load topics");
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

  const handleTopicTitleChange = (title: string) => {
    setTopicFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
    });
    setEditingCategory(null);
    setTopics([]);
    setShowTopicForm(false);
    setEditingTopic(null);
    setPendingTopics([]);
    resetTopicForm();
  };

  const resetTopicForm = () => {
    setTopicFormData({
      title: "",
      slug: "",
    });
    setShowTopicForm(false);
    setEditingTopic(null);
  };

  const startEditing = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
    });
    setEditingCategory(category);
    setPendingTopics([]); // Clear pending topics when editing existing category
  };

  const startEditingTopic = (topic: Topic) => {
    setTopicFormData({
      title: topic.title,
      slug: topic.slug,
    });
    setEditingTopic(topic);
    setShowTopicForm(true);
  };

  const addPendingTopic = () => {
    if (!topicFormData.title.trim()) {
      showError("Validation Error", "Topic title is required");
      return;
    }

    if (!topicFormData.slug.trim()) {
      showError("Validation Error", "Topic slug is required");
      return;
    }

    // Check for duplicate slugs in pending topics
    if (pendingTopics.some(t => t.slug === topicFormData.slug)) {
      showError("Validation Error", "Topic slug must be unique");
      return;
    }

    setPendingTopics(prev => [...prev, { ...topicFormData }]);
    resetTopicForm();
    showSuccess("Success", "Topic added to list");
  };

  const removePendingTopic = (index: number) => {
    setPendingTopics(prev => prev.filter((_, i) => i !== index));
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
      };

      let savedCategory;

      if (editingCategory) {
        // Update existing category
        await client.request(M_UPDATE_CATEGORY, {
          id: editingCategory.id,
          input
        });
        savedCategory = { ...editingCategory, ...input };
        showSuccess("Success", "Category updated successfully");
      } else {
        // Create new category
        const result = await client.request(M_CREATE_CATEGORY, {
          input
        });
        savedCategory = result.createCategory;
        showSuccess("Success", "Category created successfully");

        // Create pending topics for new category
        if (pendingTopics.length > 0) {
          for (const pendingTopic of pendingTopics) {
            try {
              await createTopicForCategory(savedCategory.slug, pendingTopic);
            } catch (err) {
              console.error("Failed to create topic:", pendingTopic.title, err);
              showError("Warning", `Failed to create topic: ${pendingTopic.title}`);
            }
          }
          showSuccess("Success", `Created ${pendingTopics.length} topics for ${savedCategory.name}`);
        }
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

  const createTopicForCategory = async (categorySlug: string, topicData: TopicFormData) => {
    const UPSERT_TOPIC_MUTATION = `
      mutation UpsertTopic($id: ID, $input: UpsertTopicInput!) {
        upsertTopic(id: $id, input: $input) {
          id
          slug
          title
          description
          category {
            id
            name
            slug
          }
          createdAt
          updatedAt
        }
      }
    `;

    const input = {
      categorySlug: categorySlug,
      slug: topicData.slug,
      title: topicData.title,
      description: null,
      coverImageUrl: null,
      coverVideoUrl: null,
    };

    const variables = {
      id: null,
      input,
    };

    return await query(UPSERT_TOPIC_MUTATION, variables);
  };

  const saveTopic = async () => {
    if (!editingCategory) {
      showError("Error", "Please save the category first");
      return;
    }

    if (!topicFormData.title.trim()) {
      showError("Validation Error", "Topic title is required");
      return;
    }

    if (!topicFormData.slug.trim()) {
      showError("Validation Error", "Topic slug is required");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createTopicForCategory(editingCategory.slug, topicFormData);
      
      if (result.upsertTopic) {
        showSuccess("Success", editingTopic ? "Topic updated successfully" : "Topic created successfully");
        resetTopicForm();
        loadTopicsForCategory(editingCategory.slug);
      }
    } catch (err: any) {
      console.error("Failed to save topic:", err);
      showError("Error", err.message || "Failed to save topic");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTopic = async (topicId: string, topicTitle: string) => {
    if (!confirm(`Are you sure you want to delete the topic "${topicTitle}"?`)) {
      return;
    }

    setIsLoading(true);

    try {
      const DELETE_TOPIC_MUTATION = `
        mutation DeleteTopic($id: ID!) {
          deleteTopic(id: $id)
        }
      `;

      const result = await query(DELETE_TOPIC_MUTATION, { id: topicId });
      
      if (result.deleteTopic) {
        showSuccess("Success", "Topic deleted successfully");
        if (editingCategory) {
          loadTopicsForCategory(editingCategory.slug);
        }
      }
    } catch (err: any) {
      console.error("Failed to delete topic:", err);
      showError("Error", err.message || "Failed to delete topic");
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

      // Immediately update local state to remove the deleted category
      setCategories(prevCategories => 
        prevCategories.filter(category => category.id !== categoryId)
      );

      showSuccess("Success", "Category deleted successfully");
      
      // Also refresh from server to ensure consistency
      try {
        await loadCategories();
      } catch (refreshErr) {
        console.warn('Failed to refresh categories after deletion:', refreshErr);
        // Don't show error to user since deletion was successful
      }
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
            Create and manage categories with their topics (sub-categories)
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
              ? `Editing category: ${editingCategory.name} - Manage its topics below`
              : "Add a new category and its topics (sub-categories) to organize your articles"
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

          {/* Topic Management for New Categories */}
          {!editingCategory && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Add Topics (Sub-Categories)</h4>
                <Button 
                  onClick={() => setShowTopicForm(true)} 
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Topic
                </Button>
              </div>
              
              {/* Topic Form */}
              {showTopicForm && (
                <div className="border rounded-lg p-3 bg-background mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Topic Title <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={topicFormData.title}
                        onChange={(e) => handleTopicTitleChange(e.target.value)}
                        placeholder="e.g. Markets, Economy, Companies..."
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Topic Slug <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={topicFormData.slug}
                        onChange={(e) => setTopicFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="e.g. markets, economy, companies..."
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={addPendingTopic} 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-3 w-3" />
                      Add to List
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={resetTopicForm} 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Pending Topics List */}
              {pendingTopics.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Topics to be created:</p>
                  {pendingTopics.map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded bg-background"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{topic.title}</span>
                        <Badge variant="outline" className="text-xs">{topic.slug}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePendingTopic(index)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {pendingTopics.length === 0 && !showTopicForm && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click "Add Topic" to create sub-categories like "Markets", "Economy", etc.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-4">
            <Button 
              onClick={saveCategory} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {editingCategory ? "Update Category" : "Create Category"}
              {!editingCategory && pendingTopics.length > 0 && ` & ${pendingTopics.length} Topics`}
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

      {/* Topics Management - Only show when editing a category */}
      {editingCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Topics in {editingCategory.name}</span>
              <Button 
                onClick={() => setShowTopicForm(true)} 
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Topic
              </Button>
            </CardTitle>
            <CardDescription>
              Manage sub-categories (topics) for this category. These will appear as "Markets", "Economy", etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Topic Form */}
            {showTopicForm && (
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-medium mb-3">
                  {editingTopic ? "Edit Topic" : "Add New Topic"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={topicFormData.title}
                      onChange={(e) => handleTopicTitleChange(e.target.value)}
                      placeholder="e.g. Markets, Economy, Companies..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={topicFormData.slug}
                      onChange={(e) => setTopicFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="e.g. markets, economy, companies..."
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={saveTopic} 
                    disabled={isLoading}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingTopic ? "Update Topic" : "Add Topic"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetTopicForm} 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Topics List */}
            {topics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No topics yet for this category.</p>
                <p>Click "Add Topic" to create sub-categories like "Markets", "Economy", etc.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Sub-categories (topics) for {editingCategory.name}:
                </p>
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{topic.title}</h4>
                        <Badge variant="outline" className="text-xs">{topic.slug}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditingTopic(topic)}
                        disabled={isLoading}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTopic(topic.id, topic.title)}
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
      )}

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
                      Edit & Manage Topics
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
