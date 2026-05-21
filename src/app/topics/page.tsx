"use client";

import { useState, useEffect, useMemo } from "react";
import { useGraphQL } from "@/hooks/useGraphQL";
import { useCategories } from "@/hooks/useGraphQL";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Save, X } from "lucide-react";
import { useToastHelpers } from "@/components/ui/toast";
import { PermissionGuard, Permission } from "@/components/permissions/PermissionGuard";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface Topic {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  coverVideoUrl?: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function TopicsPage() {
  const { query, loading, error } = useGraphQL();
  const { getCategories } = useCategories();
  const { showSuccess, showError } = useToastHelpers();
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    topic: Topic | null;
  }>({ open: false, topic: null });
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    coverImageUrl: "",
    coverVideoUrl: "",
    categorySlug: "",
  });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load topics when category is selected
  useEffect(() => {
    if (selectedCategorySlug) {
      loadTopicsForCategory(selectedCategorySlug);
    } else {
      setTopics([]);
    }
  }, [selectedCategorySlug]);

  const loadCategories = async () => {
    try {
      const result = await getCategories();
      setCategories(result.categories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
      showError("Error", "Failed to load categories");
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
            coverImageUrl
            coverVideoUrl
            categoryId
            createdAt
            updatedAt
            category {
              id
              name
              slug
            }
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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      coverImageUrl: "",
      coverVideoUrl: "",
      categorySlug: selectedCategorySlug,
    });
    setIsCreating(false);
    setEditingTopic(null);
  };

  const startCreating = () => {
    if (!selectedCategorySlug) {
      showError("Error", "Please select a category first");
      return;
    }
    setFormData({
      title: "",
      slug: "",
      description: "",
      coverImageUrl: "",
      coverVideoUrl: "",
      categorySlug: selectedCategorySlug,
    });
    setIsCreating(true);
    setEditingTopic(null);
  };

  const startEditing = (topic: Topic) => {
    setFormData({
      title: topic.title,
      slug: topic.slug,
      description: topic.description || "",
      coverImageUrl: topic.coverImageUrl || "",
      coverVideoUrl: topic.coverVideoUrl || "",
      categorySlug: topic.category.slug,
    });
    setEditingTopic(topic);
    setIsCreating(false);
  };

  const saveTopic = async () => {
    if (!formData.title.trim()) {
      showError("Validation Error", "Title is required");
      return;
    }

    if (!formData.slug.trim()) {
      showError("Validation Error", "Slug is required");
      return;
    }

    if (!formData.categorySlug) {
      showError("Validation Error", "Category is required");
      return;
    }

    try {
      const UPSERT_TOPIC_MUTATION = `
        mutation UpsertTopic($id: ID, $input: UpsertTopicInput!) {
          upsertTopic(id: $id, input: $input) {
            id
            slug
            title
            description
            coverImageUrl
            coverVideoUrl
            categoryId
            createdAt
            updatedAt
            category {
              id
              name
              slug
            }
          }
        }
      `;

      const input = {
        categorySlug: formData.categorySlug,
        slug: formData.slug,
        title: formData.title,
        description: formData.description || null,
        coverImageUrl: formData.coverImageUrl || null,
        coverVideoUrl: formData.coverVideoUrl || null,
      };

      const variables = {
        id: editingTopic?.id || null,
        input,
      };

      const result = await query(UPSERT_TOPIC_MUTATION, variables);
      
      if (result.upsertTopic) {
        showSuccess("Success", editingTopic ? "Topic updated successfully" : "Topic created successfully");
        resetForm();
        loadTopicsForCategory(selectedCategorySlug);
      }
    } catch (err: any) {
      console.error("Failed to save topic:", err);
      showError("Error", err.message || "Failed to save topic");
    }
  };

  const deleteTopic = async (topicId: string, topicTitle: string) => {
    try {
      const DELETE_TOPIC_MUTATION = `
        mutation DeleteTopic($id: ID!) {
          deleteTopic(id: $id)
        }
      `;

      const result = await query(DELETE_TOPIC_MUTATION, { id: topicId });
      
      if (result.deleteTopic) {
        showSuccess("Success", "Topic deleted successfully");
        loadTopicsForCategory(selectedCategorySlug);
      }
    } catch (err: any) {
      console.error("Failed to delete topic:", err);
      showError("Error", err.message || "Failed to delete topic");
    }
  };

  const selectedCategory = categories.find(cat => cat.slug === selectedCategorySlug);
  const isFormVisible = isCreating || editingTopic;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Topic Management</h1>
          <p className="text-muted-foreground">
            Create and manage topics (sub-categories) for your categories
          </p>
        </div>
      </div>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Category</CardTitle>
          <CardDescription>
            Choose a category to view and manage its topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedCategorySlug} onValueChange={setSelectedCategorySlug}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCategorySlug && (
              <PermissionGuard permissions={[Permission.CREATE_TOPIC]}>
                <Button onClick={startCreating} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Topic
                </Button>
              </PermissionGuard>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Topic Form */}
      {isFormVisible && (
        <PermissionGuard 
          permissions={editingTopic ? [Permission.UPDATE_TOPIC] : [Permission.CREATE_TOPIC]}
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Access Restricted</CardTitle>
                <CardDescription>
                  You don't have permission to {editingTopic ? "edit topics" : "create new topics"}. Contact your administrator for access.
                </CardDescription>
              </CardHeader>
            </Card>
          }
        >
          <Card>
          <CardHeader>
            <CardTitle>
              {editingTopic ? "Edit Topic" : "Create New Topic"}
            </CardTitle>
            <CardDescription>
              {editingTopic 
                ? `Editing topic in ${selectedCategory?.name} category`
                : `Creating new topic in ${selectedCategory?.name} category`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter topic title..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Slug <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="topic-slug"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description for this topic..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cover Image URL</label>
                <Input
                  value={formData.coverImageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Cover Video URL</label>
                <Input
                  value={formData.coverVideoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverVideoUrl: e.target.value }))}
                  placeholder="https://example.com/video.mp4"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={saveTopic} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {editingTopic ? "Update Topic" : "Create Topic"}
              </Button>
              <Button variant="outline" onClick={resetForm} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
          </Card>
        </PermissionGuard>
      )}

      {/* Topics List */}
      {selectedCategorySlug && (
        <Card>
          <CardHeader>
            <CardTitle>
              Topics in {selectedCategory?.name}
            </CardTitle>
            <CardDescription>
              {topics.length === 0 
                ? "No topics found for this category. Create your first topic above."
                : `${topics.length} topic${topics.length === 1 ? '' : 's'} found`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No topics yet for this category.</p>
                <p>Click "Add Topic" to create the first one!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{topic.title}</h3>
                        <Badge variant="secondary">{topic.slug}</Badge>
                      </div>
                      {topic.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {topic.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {new Date(topic.createdAt).toLocaleDateString()}</span>
                        {topic.coverImageUrl && <span>Has cover image</span>}
                        {topic.coverVideoUrl && <span>Has cover video</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PermissionGuard permissions={[Permission.UPDATE_TOPIC]} fallback={null}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(topic)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permissions={[Permission.DELETE_TOPIC]} fallback={null}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, topic })}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </PermissionGuard>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-4">
          <p>Loading...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-4 text-red-600">
          <p>Error: {error}</p>
        </div>
      )}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((current) => ({ ...current, open }))}
        title="Delete Topic?"
        description={`This will permanently delete "${deleteDialog.topic?.title || 'this topic'}". This action cannot be undone.`}
        confirmText="Delete Topic"
        variant="destructive"
        onConfirm={() => {
          if (deleteDialog.topic) {
            void deleteTopic(deleteDialog.topic.id, deleteDialog.topic.title);
          }
        }}
      />
    </div>
  );
}
