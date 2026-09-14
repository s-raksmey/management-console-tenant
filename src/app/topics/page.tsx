"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useGraphQL } from "@/hooks/useGraphQL";
import { useCategories } from "@/hooks/useGraphQL";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Save, X } from "lucide-react";
import { DeviceImageUpload } from "@/components/media/device-image-upload";
import { useToastHelpers } from "@/components/ui/toast";
import { PermissionGuard, Permission } from "@/components/permissions/PermissionGuard";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useAdminLocale } from "@/hooks/useAdminLocale";

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

const topicsCopy = {
  en: {
    error: "Error",
    success: "Success",
    loadCategoriesFailed: "Failed to load categories",
    loadTopicsFailed: "Failed to load topics",
    selectCategoryFirst: "Please select a category first",
    validationError: "Validation Error",
    titleRequired: "Title is required",
    slugRequired: "Slug is required",
    categoryRequired: "Category is required",
    topicUpdated: "Topic updated successfully",
    topicCreated: "Topic created successfully",
    saveTopicFailed: "Failed to save topic",
    topicDeleted: "Topic deleted successfully",
    deleteTopicFailed: "Failed to delete topic",
    pageTitle: "Topic Management",
    pageDescription: "Create and manage topics (sub-categories) for your categories",
    selectCategory: "Select Category",
    selectCategoryDescription: "Choose a category to view and manage its topics",
    selectCategoryPlaceholder: "Select a category...",
    addTopic: "Add Topic",
    accessRestricted: "Access Restricted",
    permissionDescription: (isEditing: boolean) =>
      `You don't have permission to ${isEditing ? "edit topics" : "create new topics"}. Contact your administrator for access.`,
    editTopic: "Edit Topic",
    createNewTopic: "Create New Topic",
    editingInCategory: (name?: string) => `Editing topic in ${name} category`,
    creatingInCategory: (name?: string) => `Creating new topic in ${name} category`,
    title: "Title",
    titlePlaceholder: "Enter topic title...",
    slug: "Slug",
    description: "Description",
    descriptionPlaceholder: "Optional description for this topic...",
    coverImage: "Cover image",
    coverVideoUrl: "Cover Video URL",
    updateTopic: "Update Topic",
    createTopic: "Create Topic",
    cancel: "Cancel",
    topicsIn: (name?: string) => `Topics in ${name}`,
    noTopicsFound: "No topics found for this category. Create your first topic above.",
    topicCount: (count: number) => `${count} topic${count === 1 ? "" : "s"} found`,
    noTopicsYet: "No topics yet for this category.",
    addFirstTopic: 'Click "Add Topic" to create the first one!',
    created: "Created",
    hasCoverImage: "Has cover image",
    hasCoverVideo: "Has cover video",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading...",
    errorLabel: "Error",
    deleteTopicTitle: "Delete Topic?",
    deleteTopicDescription: (title?: string) =>
      `This will permanently delete "${title || "this topic"}". This action cannot be undone.`,
    deleteTopic: "Delete Topic",
  },
  km: {
    error: "បញ្ហា",
    success: "ជោគជ័យ",
    loadCategoriesFailed: "មិនអាចផ្ទុកប្រភេទបានទេ",
    loadTopicsFailed: "មិនអាចផ្ទុកប្រធានបទបានទេ",
    selectCategoryFirst: "សូមជ្រើសប្រភេទជាមុនសិន",
    validationError: "ទិន្នន័យមិនត្រឹមត្រូវ",
    titleRequired: "ត្រូវការចំណងជើង",
    slugRequired: "ត្រូវការស្លាក URL",
    categoryRequired: "ត្រូវការប្រភេទ",
    topicUpdated: "បានកែប្រធានបទដោយជោគជ័យ",
    topicCreated: "បានបង្កើតប្រធានបទដោយជោគជ័យ",
    saveTopicFailed: "មិនអាចរក្សាទុកប្រធានបទបានទេ",
    topicDeleted: "បានលុបប្រធានបទដោយជោគជ័យ",
    deleteTopicFailed: "មិនអាចលុបប្រធានបទបានទេ",
    pageTitle: "គ្រប់គ្រងប្រធានបទ",
    pageDescription: "បង្កើត និងគ្រប់គ្រងប្រធានបទរងសម្រាប់ប្រភេទ",
    selectCategory: "ជ្រើសប្រភេទ",
    selectCategoryDescription: "ជ្រើសប្រភេទដើម្បីមើល និងគ្រប់គ្រងប្រធានបទ",
    selectCategoryPlaceholder: "ជ្រើសប្រភេទ...",
    addTopic: "បន្ថែមប្រធានបទ",
    accessRestricted: "សិទ្ធិត្រូវបានកំណត់",
    permissionDescription: (isEditing: boolean) =>
      `អ្នកមិនមានសិទ្ធិ${isEditing ? "កែប្រធានបទ" : "បង្កើតប្រធានបទថ្មី"}ទេ។ សូមទាក់ទងអ្នកគ្រប់គ្រង។`,
    editTopic: "កែប្រធានបទ",
    createNewTopic: "បង្កើតប្រធានបទថ្មី",
    editingInCategory: (name?: string) => `កំពុងកែប្រធានបទក្នុងប្រភេទ ${name}`,
    creatingInCategory: (name?: string) => `កំពុងបង្កើតប្រធានបទថ្មីក្នុងប្រភេទ ${name}`,
    title: "ចំណងជើង",
    titlePlaceholder: "បញ្ចូលចំណងជើងប្រធានបទ...",
    slug: "ស្លាក URL",
    description: "ពណ៌នា",
    descriptionPlaceholder: "ពណ៌នាបន្ថែមសម្រាប់ប្រធានបទនេះ...",
    coverImage: "រូបគម្រប",
    coverVideoUrl: "URL វីដេអូគម្រប",
    updateTopic: "កែប្រធានបទ",
    createTopic: "បង្កើតប្រធានបទ",
    cancel: "បោះបង់",
    topicsIn: (name?: string) => `ប្រធានបទក្នុង ${name}`,
    noTopicsFound: "រកមិនឃើញប្រធានបទសម្រាប់ប្រភេទនេះ។ បង្កើតប្រធានបទដំបូងខាងលើ។",
    topicCount: (count: number) => `រកឃើញប្រធានបទ ${count}`,
    noTopicsYet: "មិនទាន់មានប្រធានបទសម្រាប់ប្រភេទនេះ។",
    addFirstTopic: 'ចុច "បន្ថែមប្រធានបទ" ដើម្បីបង្កើតដំបូង!',
    created: "បានបង្កើត",
    hasCoverImage: "មានរូបគម្រប",
    hasCoverVideo: "មានវីដេអូគម្រប",
    edit: "កែ",
    delete: "លុប",
    loading: "កំពុងផ្ទុក...",
    errorLabel: "បញ្ហា",
    deleteTopicTitle: "លុបប្រធានបទ?",
    deleteTopicDescription: (title?: string) =>
      `វានឹងលុប "${title || "ប្រធានបទនេះ"}" ជាអចិន្ត្រៃយ៍។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
    deleteTopic: "លុបប្រធានបទ",
  },
};

export default function TopicsPage() {
  const { locale } = useAdminLocale();
  const copy = topicsCopy[locale];
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

  const loadCategories = useCallback(async () => {
    try {
      const result = await getCategories();
      setCategories(result.categories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
      showError(copy.error, copy.loadCategoriesFailed);
    }
  }, [copy.error, copy.loadCategoriesFailed, getCategories, showError]);

  const loadTopicsForCategory = useCallback(async (categorySlug: string) => {
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
      showError(copy.error, copy.loadTopicsFailed);
    }
  }, [copy.error, copy.loadTopicsFailed, query, showError]);

  // Load categories on mount and reload topics when the category changes.
  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (selectedCategorySlug) {
      void loadTopicsForCategory(selectedCategorySlug);
    } else {
      setTopics([]);
    }
  }, [loadTopicsForCategory, selectedCategorySlug]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const shouldSyncSlugFromTitle = (currentSlug: string, previousTitle: string) => {
    return !currentSlug || currentSlug === generateSlug(previousTitle);
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: shouldSyncSlugFromTitle(prev.slug, prev.title) ? generateSlug(title) : prev.slug
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
      showError(copy.error, copy.selectCategoryFirst);
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
      showError(copy.validationError, copy.titleRequired);
      return;
    }

    if (!formData.slug.trim()) {
      showError(copy.validationError, copy.slugRequired);
      return;
    }

    if (!formData.categorySlug) {
      showError(copy.validationError, copy.categoryRequired);
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
        showSuccess(copy.success, editingTopic ? copy.topicUpdated : copy.topicCreated);
        resetForm();
        loadTopicsForCategory(selectedCategorySlug);
      }
    } catch (err: any) {
      console.error("Failed to save topic:", err);
      showError(copy.error, locale === "en" ? err.message || copy.saveTopicFailed : copy.saveTopicFailed);
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
        showSuccess(copy.success, copy.topicDeleted);
        loadTopicsForCategory(selectedCategorySlug);
      }
    } catch (err: any) {
      console.error("Failed to delete topic:", err);
      showError(copy.error, locale === "en" ? err.message || copy.deleteTopicFailed : copy.deleteTopicFailed);
    }
  };

  const selectedCategory = categories.find(cat => cat.slug === selectedCategorySlug);
  const isFormVisible = isCreating || editingTopic;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{copy.pageTitle}</h1>
          <p className="text-muted-foreground">
            {copy.pageDescription}
          </p>
        </div>
      </div>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{copy.selectCategory}</CardTitle>
          <CardDescription>
            {copy.selectCategoryDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedCategorySlug} onValueChange={setSelectedCategorySlug}>
                <SelectTrigger>
                  <SelectValue placeholder={copy.selectCategoryPlaceholder} />
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
                  {copy.addTopic}
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
                <CardTitle>{copy.accessRestricted}</CardTitle>
                <CardDescription>
                  {copy.permissionDescription(Boolean(editingTopic))}
                </CardDescription>
              </CardHeader>
            </Card>
          }
        >
          <Card>
          <CardHeader>
            <CardTitle>
              {editingTopic ? copy.editTopic : copy.createNewTopic}
            </CardTitle>
            <CardDescription>
              {editingTopic 
                ? copy.editingInCategory(selectedCategory?.name)
                : copy.creatingInCategory(selectedCategory?.name)
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {copy.title} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={copy.titlePlaceholder}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {copy.slug} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="topic-slug"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{copy.description}</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={copy.descriptionPlaceholder}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{copy.coverImage}</label>
                <DeviceImageUpload
                  value={formData.coverImageUrl}
                  onChange={(coverImageUrl) =>
                    setFormData((prev) => ({ ...prev, coverImageUrl }))
                  }
                  folder="topics"
                  maxWidth={1600}
                  maxHeight={900}
                  tags={["topics", "cover"]}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{copy.coverVideoUrl}</label>
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
                {editingTopic ? copy.updateTopic : copy.createTopic}
              </Button>
              <Button variant="outline" onClick={resetForm} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                {copy.cancel}
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
              {copy.topicsIn(selectedCategory?.name)}
            </CardTitle>
            <CardDescription>
              {topics.length === 0 
                ? copy.noTopicsFound
                : copy.topicCount(topics.length)
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{copy.noTopicsYet}</p>
                <p>{copy.addFirstTopic}</p>
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
                        <span>{copy.created}: {new Date(topic.createdAt).toLocaleDateString(locale === "km" ? "km-KH" : undefined)}</span>
                        {topic.coverImageUrl && <span>{copy.hasCoverImage}</span>}
                        {topic.coverVideoUrl && <span>{copy.hasCoverVideo}</span>}
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
                          {copy.edit}
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
                          {copy.delete}
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
          <p>{copy.loading}</p>
        </div>
      )}

      {error && (
        <div className="text-center py-4 text-red-600">
          <p>{copy.errorLabel}: {error}</p>
        </div>
      )}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((current) => ({ ...current, open }))}
        title={copy.deleteTopicTitle}
        description={copy.deleteTopicDescription(deleteDialog.topic?.title)}
        confirmText={copy.deleteTopic}
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
