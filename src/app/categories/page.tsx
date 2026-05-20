"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCategories, useGraphQL } from "@/hooks/useGraphQL";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Edit,
  FolderTree,
  Languages,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useToastHelpers } from "@/components/ui/toast";
import {
  Category,
  M_CREATE_CATEGORY,
  M_UPDATE_CATEGORY,
  M_DELETE_CATEGORY,
} from "@/services/category.gql";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import {
  PermissionGuard,
  Permission,
} from "@/components/permissions/PermissionGuard";

interface Topic {
  id: string;
  slug: string;
  title: string;
  titleKhmer?: string | null;
  description?: string;
  descriptionKhmer?: string | null;
  category: {
    id: string;
    name: string;
    nameKhmer?: string | null;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  nameKhmer: string;
  slug: string;
}

interface TopicFormData {
  title: string;
  titleKhmer: string;
  slug: string;
}

type ConfirmationState = {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [pendingTopics, setPendingTopics] = useState<TopicFormData[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    open: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    variant: "default",
    onConfirm: () => {},
  });

  const { getCategories, loading: categoriesLoading } = useCategories();
  const { query } = useGraphQL();
  const { showSuccess, showError } = useToastHelpers();
  const client = getAuthenticatedGqlClient();
  const showErrorRef = useRef(showError);

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    nameKhmer: "",
    slug: "",
  });

  const [topicFormData, setTopicFormData] = useState<TopicFormData>({
    title: "",
    titleKhmer: "",
    slug: "",
  });

  const loadCategories = useCallback(async () => {
    try {
      console.log("🔄 Loading categories...");
      const response = await getCategories();
      console.log("📦 Categories response:", response);
      if (response?.categories) {
        console.log(`✅ Setting ${response.categories.length} categories`);
        setCategories(response.categories);
      } else {
        console.warn("⚠️ No categories in response");
      }
    } catch (err) {
      console.error("❌ Error loading categories:", err);
      showErrorRef.current("Error", "Failed to load categories");
    }
  }, [getCategories]);

  const loadTopicsForCategory = useCallback(
    async (categorySlug: string) => {
      try {
        const TOPICS_BY_CATEGORY_QUERY = `
        query GetTopicsByCategory($categorySlug: String!) {
          topicsByCategory(categorySlug: $categorySlug) {
            id
            slug
            title
            titleKhmer
            description
            descriptionKhmer
            category {
              id
              name
              nameKhmer
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
        showErrorRef.current("Error", "Failed to load topics");
      }
    },
    [query],
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Load topics when editing a category
  useEffect(() => {
    if (editingCategory) {
      loadTopicsForCategory(editingCategory.slug);
    } else {
      setTopics([]);
    }
  }, [editingCategory, loadTopicsForCategory]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const handleTopicTitleChange = (title: string) => {
    setTopicFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nameKhmer: "",
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
      titleKhmer: "",
      slug: "",
    });
    setShowTopicForm(false);
    setEditingTopic(null);
  };

  const startEditing = (category: Category) => {
    setFormData({
      name: category.name,
      nameKhmer: category.nameKhmer || "",
      slug: category.slug,
    });
    setEditingCategory(category);
    setPendingTopics([]); // Clear pending topics when editing existing category
  };

  const startEditingTopic = (topic: Topic) => {
    setTopicFormData({
      title: topic.title,
      titleKhmer: topic.titleKhmer || "",
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
    if (pendingTopics.some((t) => t.slug === topicFormData.slug)) {
      showError("Validation Error", "Topic slug must be unique");
      return;
    }

    setPendingTopics((prev) => [...prev, { ...topicFormData }]);
    resetTopicForm();
    showSuccess("Success", "Topic added to list");
  };

  const removePendingTopic = (index: number) => {
    setPendingTopics((prev) => prev.filter((_, i) => i !== index));
  };

  const openConfirmation = (config: Omit<ConfirmationState, "open">) => {
    setConfirmation({
      ...config,
      open: true,
    });
  };

  const requestSaveCategory = () => {
    if (!formData.name.trim()) {
      showError("Validation Error", "Name is required");
      return;
    }

    if (!formData.slug.trim()) {
      showError("Validation Error", "Slug is required");
      return;
    }

    openConfirmation({
      title: editingCategory ? "Update Category?" : "Create Category?",
      description: editingCategory
        ? `Save changes to "${formData.name}"?`
        : `Create "${formData.name}"${pendingTopics.length > 0 ? ` with ${pendingTopics.length} sub-categor${pendingTopics.length === 1 ? "y" : "ies"}` : ""}?`,
      confirmText: editingCategory ? "Update Category" : "Create Category",
      variant: "default",
      onConfirm: () => {
        void saveCategory();
      },
    });
  };

  const requestSaveTopic = () => {
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

    openConfirmation({
      title: editingTopic ? "Update Sub-Category?" : "Create Sub-Category?",
      description: editingTopic
        ? `Save changes to "${topicFormData.title}"?`
        : `Create "${topicFormData.title}" under "${editingCategory.name}"?`,
      confirmText: editingTopic ? "Update Topic" : "Create Topic",
      variant: "default",
      onConfirm: () => {
        void saveTopic();
      },
    });
  };

  const requestDeleteTopic = (topicId: string, topicTitle: string) => {
    openConfirmation({
      title: "Delete Sub-Category?",
      description: `Delete "${topicTitle}"? This action cannot be undone.`,
      confirmText: "Delete Topic",
      variant: "destructive",
      onConfirm: () => {
        void deleteTopic(topicId);
      },
    });
  };

  const requestDeleteCategory = (categoryId: string, categoryName: string) => {
    openConfirmation({
      title: "Delete Category?",
      description: `Delete "${categoryName}"? This action cannot be undone.`,
      confirmText: "Delete Category",
      variant: "destructive",
      onConfirm: () => {
        void deleteCategory(categoryId);
      },
    });
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
        nameKhmer: formData.nameKhmer || null,
        slug: formData.slug,
      };

      let savedCategory;

      if (editingCategory) {
        // Update existing category
        await client.request(M_UPDATE_CATEGORY, {
          id: editingCategory.id,
          input,
        });
        savedCategory = { ...editingCategory, ...input };
        showSuccess("Success", "Category updated successfully");
      } else {
        // Create new category
        const result = await client.request(M_CREATE_CATEGORY, {
          input,
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
              showError(
                "Warning",
                `Failed to create topic: ${pendingTopic.title}`,
              );
            }
          }
          showSuccess(
            "Success",
            `Created ${pendingTopics.length} topics for ${savedCategory.name}`,
          );
        }
      }

      // Reload categories and reset form
      await loadCategories();
      resetForm();
    } catch (err: any) {
      console.error("Error saving category:", err);
      showError("Error", err.message || "Failed to save category");
    } finally {
      setIsLoading(false);
    }
  };

  const createTopicForCategory = async (
    categorySlug: string,
    topicData: TopicFormData,
  ) => {
    const UPSERT_TOPIC_MUTATION = `
      mutation UpsertTopic($id: ID, $input: UpsertTopicInput!) {
        upsertTopic(id: $id, input: $input) {
          id
          slug
          title
          titleKhmer
          description
          descriptionKhmer
          category {
            id
            name
            nameKhmer
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
      titleKhmer: topicData.titleKhmer || null,
      description: null,
      descriptionKhmer: null,
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
      const result = await createTopicForCategory(
        editingCategory.slug,
        topicFormData,
      );

      if (result.upsertTopic) {
        showSuccess(
          "Success",
          editingTopic
            ? "Topic updated successfully"
            : "Topic created successfully",
        );
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

  const deleteTopic = async (topicId: string) => {
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

  const deleteCategory = async (categoryId: string) => {
    setIsLoading(true);

    try {
      await client.request(M_DELETE_CATEGORY, {
        id: categoryId,
      });

      // Immediately update local state to remove the deleted category
      setCategories((prevCategories) =>
        prevCategories.filter((category) => category.id !== categoryId),
      );

      showSuccess("Success", "Category deleted successfully");

      // Also refresh from server to ensure consistency
      try {
        await loadCategories();
      } catch (refreshErr) {
        console.warn(
          "Failed to refresh categories after deletion:",
          refreshErr,
        );
        // Don't show error to user since deletion was successful
      }
    } catch (err: any) {
      console.error("Error deleting category:", err);
      showError("Error", err.message || "Failed to delete category");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-5 px-4 py-6 sm:px-6">
      <div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Category Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create bilingual categories and organize their sub-categories.
          </p>
        </div>
      </div>

      {/* Category Form - Always visible for create, switches to edit mode */}
      <PermissionGuard
        permissions={
          editingCategory
            ? [Permission.UPDATE_CATEGORY]
            : [Permission.CREATE_CATEGORY]
        }
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Access Restricted</CardTitle>
              <CardDescription>
                You don&apos;t have permission to{" "}
                {editingCategory ? "edit categories" : "create new categories"}.
                Contact your administrator for access.
              </CardDescription>
            </CardHeader>
          </Card>
        }
      >
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-white px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderTree className="h-5 w-5 text-blue-600" />
                  {editingCategory ? "Edit Category" : "Create Category"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {editingCategory
                    ? `Editing ${editingCategory.name}`
                    : "Add the English and Khmer labels used across the public website."}
                </CardDescription>
              </div>
              {editingCategory && (
                <Badge variant="secondary" className="w-fit">
                  {editingCategory.slug}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-6 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_260px]">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  English Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Business"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Languages className="h-4 w-4 text-slate-400" />
                  Khmer Name
                </label>
                <Input
                  value={formData.nameKhmer}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nameKhmer: e.target.value,
                    }))
                  }
                  placeholder="ពាណិជ្ជកម្ម"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Slug <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="category-slug"
                />
              </div>
            </div>

            {/* Topic Management for New Categories */}
            {!editingCategory && (
              <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-slate-950">
                      Sub-Categories
                    </h4>
                    <p className="text-sm text-slate-500">
                      Optional topics can be created with this category.
                    </p>
                  </div>
                  <PermissionGuard permissions={[Permission.CREATE_TOPIC]} fallback={null}>
                    <Button
                      onClick={() => setShowTopicForm(true)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Topic
                    </Button>
                  </PermissionGuard>
                </div>

                {/* Topic Form */}
                {showTopicForm && (
                  <PermissionGuard permissions={[Permission.CREATE_TOPIC]} fallback={null}>
                  <div className="mb-3 rounded-md border bg-white p-4">
                    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_220px]">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">
                          English Title <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={topicFormData.title}
                          onChange={(e) =>
                            handleTopicTitleChange(e.target.value)
                          }
                          placeholder="e.g. Markets, Economy, Companies..."
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">
                          Khmer Title
                        </label>
                        <Input
                          value={topicFormData.titleKhmer}
                          onChange={(e) =>
                            setTopicFormData((prev) => ({
                              ...prev,
                              titleKhmer: e.target.value,
                            }))
                          }
                          placeholder="ទីផ្សារ"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">
                          Topic Slug <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={topicFormData.slug}
                          onChange={(e) =>
                            setTopicFormData((prev) => ({
                              ...prev,
                              slug: e.target.value,
                            }))
                          }
                          placeholder="e.g. markets, economy, companies..."
                          className="h-8"
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
                  </PermissionGuard>
                )}

                {/* Pending Topics List */}
                {pendingTopics.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">
                      Topics to be created
                    </p>
                    {pendingTopics.map((topic, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                      >
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="font-medium text-sm">
                            {topic.title}
                          </span>
                          {topic.titleKhmer && (
                            <span className="text-sm text-muted-foreground">
                              {topic.titleKhmer}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {topic.slug}
                          </Badge>
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
                ) : (
                  !showTopicForm && (
                    <div className="rounded-md border border-dashed bg-white px-4 py-8 text-center text-sm text-slate-500">
                      No sub-categories added yet.
                    </div>
                  )
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t pt-5">
              <Button
                onClick={requestSaveCategory}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {editingCategory ? "Update Category" : "Create Category"}
                {!editingCategory &&
                  pendingTopics.length > 0 &&
                  ` & ${pendingTopics.length} Topics`}
              </Button>
              {editingCategory && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </PermissionGuard>

      {/* Topics Management - Only show when editing a category */}
      {editingCategory && (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-white px-6 py-5">
            <CardTitle className="flex items-center justify-between gap-3 text-lg">
              <span>Sub-Categories for {editingCategory.name}</span>
              <PermissionGuard permissions={[Permission.CREATE_TOPIC]}>
                <Button
                  onClick={() => setShowTopicForm(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Topic
                </Button>
              </PermissionGuard>
            </CardTitle>
            <CardDescription className="mt-1">
              Maintain the topic labels shown in the public navigation and
              article paths.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-5">
            {/* Topic Form */}
            {showTopicForm && (
              <PermissionGuard permissions={[Permission.CREATE_TOPIC]}>
                <div className="rounded-md border bg-slate-50/70 p-4">
                  <h4 className="mb-3 font-medium text-slate-950">
                    {editingTopic ? "Edit Topic" : "Add New Topic"}
                  </h4>
                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_240px]">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        English Title <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={topicFormData.title}
                        onChange={(e) => handleTopicTitleChange(e.target.value)}
                        placeholder="e.g. Markets, Economy, Companies..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Khmer Title
                      </label>
                      <Input
                        value={topicFormData.titleKhmer}
                        onChange={(e) =>
                          setTopicFormData((prev) => ({
                            ...prev,
                            titleKhmer: e.target.value,
                          }))
                        }
                        placeholder="ទីផ្សារ"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Slug <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={topicFormData.slug}
                        onChange={(e) =>
                          setTopicFormData((prev) => ({
                            ...prev,
                            slug: e.target.value,
                          }))
                        }
                        placeholder="e.g. markets, economy, companies..."
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={requestSaveTopic}
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
              </PermissionGuard>
            )}

            {/* Topics List */}
            {topics.length === 0 ? (
              <div className="rounded-md border border-dashed py-10 text-center text-sm text-slate-500">
                No sub-categories yet.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="mb-3 text-sm font-medium text-slate-700">
                  {topics.length} sub-categor{topics.length === 1 ? "y" : "ies"}
                </p>
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between gap-4 rounded-md border bg-white p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h4 className="font-medium">{topic.title}</h4>
                        {topic.titleKhmer && (
                          <span className="text-sm text-muted-foreground">
                            {topic.titleKhmer}
                          </span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {topic.slug}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PermissionGuard permissions={[Permission.UPDATE_TOPIC]} fallback={null}>
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
                      </PermissionGuard>
                      <PermissionGuard permissions={[Permission.DELETE_TOPIC]} fallback={null}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            requestDeleteTopic(topic.id, topic.title)
                          }
                          disabled={isLoading}
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

      {/* Categories List */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-white px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">All Categories</CardTitle>
              <CardDescription className="mt-1">
                {categories.length === 0
                  ? "No categories found."
                  : `${categories.length} categor${categories.length === 1 ? "y" : "ies"} found`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <p>No categories yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{category.name}</h3>
                      {category.nameKhmer && (
                        <span className="text-sm text-slate-500">
                          {category.nameKhmer}
                        </span>
                      )}
                      <Badge variant="secondary">{category.slug}</Badge>
                    </div>
                    <div className="text-xs text-slate-500">
                      Created{" "}
                      {new Date(category.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PermissionGuard permissions={[Permission.UPDATE_CATEGORY]} fallback={null}>
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
                    </PermissionGuard>
                    <PermissionGuard permissions={[Permission.DELETE_CATEGORY]} fallback={null}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          requestDeleteCategory(category.id, category.name)
                        }
                        disabled={isLoading}
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

      {categoriesLoading && (
        <div className="text-center py-4">
          <p>Loading...</p>
        </div>
      )}

      <ConfirmationDialog
        open={confirmation.open}
        onOpenChange={(open) =>
          setConfirmation((current) => ({ ...current, open }))
        }
        title={confirmation.title}
        description={confirmation.description}
        confirmText={confirmation.confirmText}
        cancelText="Cancel"
        variant={confirmation.variant}
        onConfirm={confirmation.onConfirm}
      />
    </div>
  );
}
