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
import { usePermissions } from "@/hooks/usePermissions";
import { useAdminLocale } from "@/hooks/useAdminLocale";

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

const categoryCopy = {
  en: {
    confirm: "Confirm",
    cancel: "Cancel",
    error: "Error",
    warning: "Warning",
    success: "Success",
    validationError: "Validation Error",
    loadCategoriesFailed: "Failed to load categories",
    loadTopicsFailed: "Failed to load topics",
    topicTitleRequired: "Topic title is required",
    topicSlugRequired: "Topic slug is required",
    topicSlugUnique: "Topic slug must be unique",
    topicAdded: "Topic added to list",
    nameRequired: "Name is required",
    slugRequired: "Slug is required",
    saveCategoryFirst: "Please save the category first",
    updateCategoryTitle: "Update Category?",
    createCategoryTitle: "Create Category?",
    saveChangesTo: (name: string) => `Save changes to "${name}"?`,
    createCategoryDescription: (name: string, count: number) =>
      `Create "${name}"${count > 0 ? ` with ${count} sub-categor${count === 1 ? "y" : "ies"}` : ""}?`,
    updateCategory: "Update Category",
    createCategory: "Create Category",
    updateSubCategoryTitle: "Update Sub-Category?",
    createSubCategoryTitle: "Create Sub-Category?",
    createTopicUnder: (title: string, category: string) => `Create "${title}" under "${category}"?`,
    updateTopic: "Update Topic",
    createTopic: "Create Topic",
    deleteSubCategoryTitle: "Delete Sub-Category?",
    deleteDescription: (name: string) => `Delete "${name}"? This action cannot be undone.`,
    deleteTopic: "Delete Topic",
    deleteCategoryTitle: "Delete Category?",
    deleteCategory: "Delete Category",
    categoryUpdated: "Category updated successfully",
    categoryCreated: "Category created successfully",
    failedCreateTopic: (title: string) => `Failed to create topic: ${title}`,
    createdTopicsFor: (count: number, name: string) => `Created ${count} topics for ${name}`,
    saveCategoryFailed: "Failed to save category",
    topicUpdated: "Topic updated successfully",
    topicCreated: "Topic created successfully",
    saveTopicFailed: "Failed to save topic",
    topicDeleted: "Topic deleted successfully",
    deleteTopicFailed: "Failed to delete topic",
    categoryDeleted: "Category deleted successfully",
    deleteCategoryFailed: "Failed to delete category",
    pageTitle: "Category Management",
    pageDescription: "Create bilingual categories and organize their sub-categories.",
    editCategory: "Edit Category",
    editTopic: "Edit Topic",
    editing: (name: string) => `Editing ${name}`,
    formDescription: "Add the English and Khmer labels used across the public website.",
    englishName: "English Name",
    khmerName: "Khmer Name",
    slug: "Slug",
    subCategories: "Sub-Categories",
    optionalTopics: "Optional topics can be created with this category.",
    addTopic: "Add Topic",
    englishTitle: "English Title",
    khmerTitle: "Khmer Title",
    topicSlug: "Topic Slug",
    addToList: "Add to List",
    topicsToCreate: "Topics to be created",
    noSubCategoriesAdded: "No sub-categories added yet.",
    subCategoriesFor: (name: string) => `Sub-Categories for ${name}`,
    topicManagementDescription: "Maintain the topic labels shown in the public navigation and article paths.",
    addNewTopic: "Add New Topic",
    englishTopicPlaceholder: "e.g. Markets, Economy, Companies...",
    khmerTopicPlaceholder: "ទីផ្សារ",
    topicSlugPlaceholder: "e.g. markets, economy, companies...",
    subCategoryCount: (count: number) => `${count} sub-categor${count === 1 ? "y" : "ies"}`,
    noSubCategoriesYet: "No sub-categories yet.",
    edit: "Edit",
    allCategories: "All Categories",
    noCategoriesFound: "No categories found.",
    categoriesFound: (count: number) => `${count} categor${count === 1 ? "y" : "ies"} found`,
    noCategoriesYet: "No categories yet.",
    created: "Created",
    editManageTopics: "Edit & Manage Topics",
    delete: "Delete",
    loading: "Loading...",
  },
  km: {
    confirm: "បញ្ជាក់",
    cancel: "បោះបង់",
    error: "បញ្ហា",
    warning: "ព្រមាន",
    success: "ជោគជ័យ",
    validationError: "ទិន្នន័យមិនត្រឹមត្រូវ",
    loadCategoriesFailed: "មិនអាចផ្ទុកប្រភេទបានទេ",
    loadTopicsFailed: "មិនអាចផ្ទុកប្រធានបទបានទេ",
    topicTitleRequired: "ត្រូវការចំណងជើងប្រធានបទ",
    topicSlugRequired: "ត្រូវការស្លាក URL របស់ប្រធានបទ",
    topicSlugUnique: "ស្លាក URL របស់ប្រធានបទត្រូវតែមិនស្ទួន",
    topicAdded: "បានបន្ថែមប្រធានបទទៅក្នុងបញ្ជី",
    nameRequired: "ត្រូវការឈ្មោះ",
    slugRequired: "ត្រូវការស្លាក URL",
    saveCategoryFirst: "សូមរក្សាទុកប្រភេទជាមុនសិន",
    updateCategoryTitle: "កែប្រភេទ?",
    createCategoryTitle: "បង្កើតប្រភេទ?",
    saveChangesTo: (name: string) => `រក្សាទុកការកែប្រែ "${name}"?`,
    createCategoryDescription: (name: string, count: number) =>
      `បង្កើត "${name}"${count > 0 ? ` ជាមួយប្រភេទរង ${count}` : ""}?`,
    updateCategory: "កែប្រភេទ",
    createCategory: "បង្កើតប្រភេទ",
    updateSubCategoryTitle: "កែប្រភេទរង?",
    createSubCategoryTitle: "បង្កើតប្រភេទរង?",
    createTopicUnder: (title: string, category: string) => `បង្កើត "${title}" ក្រោម "${category}"?`,
    updateTopic: "កែប្រធានបទ",
    createTopic: "បង្កើតប្រធានបទ",
    deleteSubCategoryTitle: "លុបប្រភេទរង?",
    deleteDescription: (name: string) => `លុប "${name}"? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
    deleteTopic: "លុបប្រធានបទ",
    deleteCategoryTitle: "លុបប្រភេទ?",
    deleteCategory: "លុបប្រភេទ",
    categoryUpdated: "បានកែប្រភេទដោយជោគជ័យ",
    categoryCreated: "បានបង្កើតប្រភេទដោយជោគជ័យ",
    failedCreateTopic: (title: string) => `មិនអាចបង្កើតប្រធានបទ: ${title}`,
    createdTopicsFor: (count: number, name: string) => `បានបង្កើតប្រធានបទ ${count} សម្រាប់ ${name}`,
    saveCategoryFailed: "មិនអាចរក្សាទុកប្រភេទបានទេ",
    topicUpdated: "បានកែប្រធានបទដោយជោគជ័យ",
    topicCreated: "បានបង្កើតប្រធានបទដោយជោគជ័យ",
    saveTopicFailed: "មិនអាចរក្សាទុកប្រធានបទបានទេ",
    topicDeleted: "បានលុបប្រធានបទដោយជោគជ័យ",
    deleteTopicFailed: "មិនអាចលុបប្រធានបទបានទេ",
    categoryDeleted: "បានលុបប្រភេទដោយជោគជ័យ",
    deleteCategoryFailed: "មិនអាចលុបប្រភេទបានទេ",
    pageTitle: "គ្រប់គ្រងប្រភេទ",
    pageDescription: "បង្កើតប្រភេទពីរភាសា និងរៀបចំប្រភេទរង។",
    editCategory: "កែប្រភេទ",
    editTopic: "កែប្រធានបទ",
    editing: (name: string) => `កំពុងកែ ${name}`,
    formDescription: "បន្ថែមស្លាកអង់គ្លេស និងខ្មែរសម្រាប់គេហទំព័រសាធារណៈ។",
    englishName: "ឈ្មោះអង់គ្លេស",
    khmerName: "ឈ្មោះខ្មែរ",
    slug: "ស្លាក URL",
    subCategories: "ប្រភេទរង",
    optionalTopics: "ប្រធានបទជាជម្រើសអាចបង្កើតជាមួយប្រភេទនេះបាន។",
    addTopic: "បន្ថែមប្រធានបទ",
    englishTitle: "ចំណងជើងអង់គ្លេស",
    khmerTitle: "ចំណងជើងខ្មែរ",
    topicSlug: "ស្លាក URL ប្រធានបទ",
    addToList: "បន្ថែមទៅបញ្ជី",
    topicsToCreate: "ប្រធានបទដែលនឹងបង្កើត",
    noSubCategoriesAdded: "មិនទាន់មានប្រភេទរង។",
    subCategoriesFor: (name: string) => `ប្រភេទរងសម្រាប់ ${name}`,
    topicManagementDescription: "គ្រប់គ្រងស្លាកប្រធានបទដែលបង្ហាញក្នុងមឺនុយសាធារណៈ និងផ្លូវអត្ថបទ។",
    addNewTopic: "បន្ថែមប្រធានបទថ្មី",
    englishTopicPlaceholder: "ឧ. Markets, Economy, Companies...",
    khmerTopicPlaceholder: "ទីផ្សារ",
    topicSlugPlaceholder: "ឧ. markets, economy, companies...",
    subCategoryCount: (count: number) => `ប្រភេទរង ${count}`,
    noSubCategoriesYet: "មិនទាន់មានប្រភេទរង។",
    edit: "កែ",
    allCategories: "ប្រភេទទាំងអស់",
    noCategoriesFound: "រកមិនឃើញប្រភេទ។",
    categoriesFound: (count: number) => `រកឃើញប្រភេទ ${count}`,
    noCategoriesYet: "មិនទាន់មានប្រភេទ។",
    created: "បានបង្កើត",
    editManageTopics: "កែ និងគ្រប់គ្រងប្រធានបទ",
    delete: "លុប",
    loading: "កំពុងផ្ទុក...",
  },
};

export default function CategoriesPage() {
  const { locale } = useAdminLocale();
  const copy = categoryCopy[locale];
  const { hasPermission } = usePermissions();
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
    confirmText: copy.confirm,
    variant: "default",
    onConfirm: () => {},
  });

  const { getCategories, loading: categoriesLoading } = useCategories();
  const { query } = useGraphQL();
  const { showSuccess, showError } = useToastHelpers();
  const client = getAuthenticatedGqlClient();
  const showErrorRef = useRef(showError);
  const canListCategories = hasPermission(Permission.LIST_CATEGORIES);
  const canCreateCategory = hasPermission(Permission.CREATE_CATEGORY);
  const canUpdateCategory = hasPermission(Permission.UPDATE_CATEGORY);
  const canShowCategoryForm = editingCategory ? canUpdateCategory : canCreateCategory;

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
      showErrorRef.current(copy.error, copy.loadCategoriesFailed);
    }
  }, [copy.error, copy.loadCategoriesFailed, getCategories]);

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
        showErrorRef.current(copy.error, copy.loadTopicsFailed);
      }
    },
    [copy.error, copy.loadTopicsFailed, query],
  );

  useEffect(() => {
    if (canListCategories) {
      loadCategories();
    }
  }, [canListCategories, loadCategories]);

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
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const shouldSyncSlugFromTitle = (currentSlug: string, previousTitle: string) => {
    return !currentSlug || currentSlug === generateSlug(previousTitle);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: shouldSyncSlugFromTitle(prev.slug, prev.name) ? generateSlug(name) : prev.slug,
    }));
  };

  const handleTopicTitleChange = (title: string) => {
    setTopicFormData((prev) => ({
      ...prev,
      title,
      slug: shouldSyncSlugFromTitle(prev.slug, prev.title) ? generateSlug(title) : prev.slug,
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
      showError(copy.validationError, copy.topicTitleRequired);
      return;
    }

    if (!topicFormData.slug.trim()) {
      showError(copy.validationError, copy.topicSlugRequired);
      return;
    }

    // Check for duplicate slugs in pending topics
    if (pendingTopics.some((t) => t.slug === topicFormData.slug)) {
      showError(copy.validationError, copy.topicSlugUnique);
      return;
    }

    setPendingTopics((prev) => [...prev, { ...topicFormData }]);
    resetTopicForm();
    showSuccess(copy.success, copy.topicAdded);
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
      showError(copy.validationError, copy.nameRequired);
      return;
    }

    if (!formData.slug.trim()) {
      showError(copy.validationError, copy.slugRequired);
      return;
    }

    openConfirmation({
      title: editingCategory ? copy.updateCategoryTitle : copy.createCategoryTitle,
      description: editingCategory
        ? copy.saveChangesTo(formData.name)
        : copy.createCategoryDescription(formData.name, pendingTopics.length),
      confirmText: editingCategory ? copy.updateCategory : copy.createCategory,
      variant: "default",
      onConfirm: () => {
        void saveCategory();
      },
    });
  };

  const requestSaveTopic = () => {
    if (!editingCategory) {
      showError(copy.error, copy.saveCategoryFirst);
      return;
    }

    if (!topicFormData.title.trim()) {
      showError(copy.validationError, copy.topicTitleRequired);
      return;
    }

    if (!topicFormData.slug.trim()) {
      showError(copy.validationError, copy.topicSlugRequired);
      return;
    }

    openConfirmation({
      title: editingTopic ? copy.updateSubCategoryTitle : copy.createSubCategoryTitle,
      description: editingTopic
        ? copy.saveChangesTo(topicFormData.title)
        : copy.createTopicUnder(topicFormData.title, editingCategory.name),
      confirmText: editingTopic ? copy.updateTopic : copy.createTopic,
      variant: "default",
      onConfirm: () => {
        void saveTopic();
      },
    });
  };

  const requestDeleteTopic = (topicId: string, topicTitle: string) => {
    openConfirmation({
      title: copy.deleteSubCategoryTitle,
      description: copy.deleteDescription(topicTitle),
      confirmText: copy.deleteTopic,
      variant: "destructive",
      onConfirm: () => {
        void deleteTopic(topicId);
      },
    });
  };

  const requestDeleteCategory = (categoryId: string, categoryName: string) => {
    openConfirmation({
      title: copy.deleteCategoryTitle,
      description: copy.deleteDescription(categoryName),
      confirmText: copy.deleteCategory,
      variant: "destructive",
      onConfirm: () => {
        void deleteCategory(categoryId);
      },
    });
  };

  const saveCategory = async () => {
    if (!formData.name.trim()) {
      showError(copy.validationError, copy.nameRequired);
      return;
    }

    if (!formData.slug.trim()) {
      showError(copy.validationError, copy.slugRequired);
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
        showSuccess(copy.success, copy.categoryUpdated);
      } else {
        // Create new category
        const result = await client.request(M_CREATE_CATEGORY, {
          input,
        });
        savedCategory = result.createCategory;
        showSuccess(copy.success, copy.categoryCreated);

        // Create pending topics for new category
        if (pendingTopics.length > 0) {
          for (const pendingTopic of pendingTopics) {
            try {
              await createTopicForCategory(savedCategory.slug, pendingTopic);
            } catch (err) {
              console.error("Failed to create topic:", pendingTopic.title, err);
              showError(
                copy.warning,
                copy.failedCreateTopic(pendingTopic.title),
              );
            }
          }
          showSuccess(
            copy.success,
            copy.createdTopicsFor(pendingTopics.length, savedCategory.name),
          );
        }
      }

      // Reload categories and reset form
      await loadCategories();
      resetForm();
    } catch (err: any) {
      console.error("Error saving category:", err);
      showError(copy.error, locale === "en" ? err.message || copy.saveCategoryFailed : copy.saveCategoryFailed);
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
      showError(copy.error, copy.saveCategoryFirst);
      return;
    }

    if (!topicFormData.title.trim()) {
      showError(copy.validationError, copy.topicTitleRequired);
      return;
    }

    if (!topicFormData.slug.trim()) {
      showError(copy.validationError, copy.topicSlugRequired);
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
          copy.success,
          editingTopic
            ? copy.topicUpdated
            : copy.topicCreated,
        );
        resetTopicForm();
        loadTopicsForCategory(editingCategory.slug);
      }
    } catch (err: any) {
      console.error("Failed to save topic:", err);
      showError(copy.error, locale === "en" ? err.message || copy.saveTopicFailed : copy.saveTopicFailed);
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
        showSuccess(copy.success, copy.topicDeleted);
        if (editingCategory) {
          loadTopicsForCategory(editingCategory.slug);
        }
      }
    } catch (err: any) {
      console.error("Failed to delete topic:", err);
      showError(copy.error, locale === "en" ? err.message || copy.deleteTopicFailed : copy.deleteTopicFailed);
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

      showSuccess(copy.success, copy.categoryDeleted);

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
      showError(copy.error, locale === "en" ? err.message || copy.deleteCategoryFailed : copy.deleteCategoryFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PermissionGuard permissions={[Permission.LIST_CATEGORIES]} showError>
      <div className="mx-auto min-h-screen max-w-7xl space-y-5 px-3 py-5 pb-24 sm:px-6 sm:py-6">
      <div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {copy.pageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {copy.pageDescription}
          </p>
        </div>
      </div>

      {/* Category Form - visible only when the role can create or edit categories */}
      {canShowCategoryForm && (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-white px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderTree className="h-5 w-5 text-blue-600" />
                  {editingCategory ? copy.editCategory : copy.createCategory}
                </CardTitle>
                <CardDescription className="mt-1">
                  {editingCategory
                    ? copy.editing(editingCategory.name)
                    : copy.formDescription}
                </CardDescription>
              </div>
              {editingCategory && (
                <Badge variant="secondary" className="w-fit">
                  {editingCategory.slug}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_260px]">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  {copy.englishName} <span className="text-red-500">*</span>
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
                  {copy.khmerName}
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
                  {copy.slug} <span className="text-red-500">*</span>
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
              <div className="py-2">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="font-medium text-slate-950">
                      {copy.subCategories}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {copy.optionalTopics}
                    </p>
                  </div>
                  <PermissionGuard permissions={[Permission.CREATE_TOPIC]} fallback={null}>
                    <Button
                      onClick={() => setShowTopicForm(true)}
                      size="sm"
                      variant="outline"
                      className="w-full items-center gap-2 sm:w-auto"
                    >
                      <Plus className="h-4 w-4" />
                      {copy.addTopic}
                    </Button>
                  </PermissionGuard>
                </div>

                {/* Topic Form */}
                {showTopicForm && (
                  <PermissionGuard permissions={[Permission.CREATE_TOPIC]} fallback={null}>
                  <div className="mb-3 py-2">
                    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_220px]">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">
                          {copy.englishTitle} <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={topicFormData.title}
                          onChange={(e) =>
                            handleTopicTitleChange(e.target.value)
                          }
                  placeholder={copy.englishTopicPlaceholder}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">
                          {copy.khmerTitle}
                        </label>
                        <Input
                          value={topicFormData.titleKhmer}
                          onChange={(e) =>
                            setTopicFormData((prev) => ({
                              ...prev,
                              titleKhmer: e.target.value,
                            }))
                          }
                          placeholder={copy.khmerTopicPlaceholder}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">
                          {copy.topicSlug} <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={topicFormData.slug}
                          onChange={(e) =>
                            setTopicFormData((prev) => ({
                              ...prev,
                              slug: e.target.value,
                            }))
                          }
                          placeholder={copy.topicSlugPlaceholder}
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
                        {copy.addToList}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetTopicForm}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <X className="h-3 w-3" />
                        {copy.cancel}
                      </Button>
                    </div>
                  </div>
                  </PermissionGuard>
                )}

                {/* Pending Topics List */}
                {pendingTopics.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">
                      {copy.topicsToCreate}
                    </p>
                    {pendingTopics.map((topic, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-1 py-2"
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
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      {copy.noSubCategoriesAdded}
                    </div>
                  )
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t pt-5 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                onClick={requestSaveCategory}
                disabled={isLoading}
                className="w-full items-center gap-2 sm:w-auto"
              >
                <Save className="h-4 w-4" />
                {editingCategory ? copy.updateCategory : copy.createCategory}
                {!editingCategory &&
                  pendingTopics.length > 0 &&
                  ` & ${pendingTopics.length} ${copy.subCategories}`}
              </Button>
              {editingCategory && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="w-full items-center gap-2 sm:w-auto"
                >
                  <X className="h-4 w-4" />
                  {copy.cancel}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topics Management - Only show when editing a category */}
      {editingCategory && (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-white px-6 py-5">
            <CardTitle className="flex items-center justify-between gap-3 text-lg">
              <span>{copy.subCategoriesFor(editingCategory.name)}</span>
              <PermissionGuard permissions={[Permission.CREATE_TOPIC]}>
                <Button
                  onClick={() => setShowTopicForm(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {copy.addTopic}
                </Button>
              </PermissionGuard>
            </CardTitle>
            <CardDescription className="mt-1">
              {copy.topicManagementDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-5">
            {/* Topic Form */}
            {showTopicForm && (
              <PermissionGuard permissions={[Permission.CREATE_TOPIC]}>
                <div className="py-2">
                  <h4 className="mb-3 font-medium text-slate-950">
                    {editingTopic ? copy.editTopic : copy.addNewTopic}
                  </h4>
                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_240px]">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        {copy.englishTitle} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={topicFormData.title}
                        onChange={(e) => handleTopicTitleChange(e.target.value)}
                        placeholder={copy.englishTopicPlaceholder}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        {copy.khmerTitle}
                      </label>
                      <Input
                        value={topicFormData.titleKhmer}
                        onChange={(e) =>
                          setTopicFormData((prev) => ({
                            ...prev,
                            titleKhmer: e.target.value,
                          }))
                        }
                        placeholder={copy.khmerTopicPlaceholder}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        {copy.slug} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={topicFormData.slug}
                        onChange={(e) =>
                          setTopicFormData((prev) => ({
                            ...prev,
                            slug: e.target.value,
                          }))
                        }
                        placeholder={copy.topicSlugPlaceholder}
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
                      {editingTopic ? copy.updateTopic : copy.addTopic}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetTopicForm}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      {copy.cancel}
                    </Button>
                  </div>
                </div>
              </PermissionGuard>
            )}

            {/* Topics List */}
            {topics.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                {copy.noSubCategoriesYet}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="mb-3 text-sm font-medium text-slate-700">
                  {copy.subCategoryCount(topics.length)}
                </p>
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between gap-4 py-3"
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
                          {copy.edit}
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

      {/* Categories List */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-white px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{copy.allCategories}</CardTitle>
              <CardDescription className="mt-1">
                {categories.length === 0
                  ? copy.noCategoriesFound
                  : copy.categoriesFound(categories.length)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <p>{copy.noCategoriesYet}</p>
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
                      {copy.created}{" "}
                      {new Date(category.createdAt).toLocaleDateString(locale === "km" ? "km-KH" : undefined)}
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
                        {copy.editManageTopics}
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

      {categoriesLoading && (
        <div className="text-center py-4">
          <p>{copy.loading}</p>
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
        cancelText={copy.cancel}
        variant={confirmation.variant}
        onConfirm={confirmation.onConfirm}
      />
      </div>
    </PermissionGuard>
  );
}
