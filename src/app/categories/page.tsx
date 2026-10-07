"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCategories, useGraphQL } from "@/hooks/useGraphQL";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ChevronDown, Plus, Save, X } from "lucide-react";
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
    newCategory: "New category",
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
    save: "Save",
    nameEnglishColumn: "Name (English)",
    nameKhmerColumn: "Name (Khmer)",
    slugColumn: "Slug",
    actionsColumn: "Actions",
    addSubcategory: "Add subcategory",
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
    newCategory: "ប្រភេទថ្មី",
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
    save: "រក្សាទុក",
    nameEnglishColumn: "ឈ្មោះ (អង់គ្លេស)",
    nameKhmerColumn: "ឈ្មោះ (ខ្មែរ)",
    slugColumn: "ស្លាក URL",
    actionsColumn: "សកម្មភាព",
    addSubcategory: "បន្ថែមប្រភេទរង",
  },
};

export default function CategoriesPage() {
  const { locale } = useAdminLocale();
  const copy = categoryCopy[locale];
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTopics, setCategoryTopics] = useState<Record<string, Topic[]>>({});
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<Set<string>>(new Set());
  const [manageSubcategories, setManageSubcategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [pageReady, setPageReady] = useState(false);
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
  const canCreateTopic = hasPermission(Permission.CREATE_TOPIC);
  const canUpdateTopic = hasPermission(Permission.UPDATE_TOPIC);
  const formOpen = (creating && canCreateCategory) || Boolean(
    editingCategory &&
      (editingTopic
        ? canUpdateTopic
        : manageSubcategories
          ? canCreateTopic
          : canUpdateCategory),
  );

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  const loadCategoryTopics = useCallback(async () => {
    const result = await query(`
      query GetCategoryDashboardTopics {
        topics {
          id
          slug
          title
          titleKhmer
          category { id }
        }
      }
    `);
    const groupedTopics: Record<string, Topic[]> = {};
    for (const topic of result?.topics ?? []) {
      const categoryId = topic.category?.id;
      if (!categoryId) continue;
      (groupedTopics[categoryId] ??= []).push(topic);
    }
    setCategoryTopics(groupedTopics);
  }, [query]);

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
      const [response] = await Promise.all([getCategories(), loadCategoryTopics()]);
      if (response?.categories) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      showErrorRef.current(copy.error, copy.loadCategoriesFailed);
    } finally {
      setPageReady(true);
    }
  }, [copy.error, copy.loadCategoriesFailed, getCategories, loadCategoryTopics]);

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
    if (permissionsLoading) return;
    if (!canListCategories) {
      setPageReady(true);
      return;
    }
    void loadCategories();
  }, [canListCategories, loadCategories, permissionsLoading]);

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
    setManageSubcategories(false);
    setPendingTopics([]);
    setCreating(false);
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

  const startCreating = () => {
    setFormData({ name: "", nameKhmer: "", slug: "" });
    setEditingCategory(null);
    setTopics([]);
    setPendingTopics([]);
    setShowTopicForm(false);
    setEditingTopic(null);
    setTopicFormData({ title: "", titleKhmer: "", slug: "" });
    setManageSubcategories(false);
    setCreating(true);
  };

  const startEditing = (category: Category) => {
    setFormData({
      name: category.name,
      nameKhmer: category.nameKhmer || "",
      slug: category.slug,
    });
    setEditingCategory(category);
    setCreating(false);
    setPendingTopics([]);
    setShowTopicForm(false);
    setEditingTopic(null);
    setManageSubcategories(false);
  };

  const startAddingSubcategory = (category: Category) => {
    startEditing(category);
    setManageSubcategories(true);
    setTopicFormData({ title: "", titleKhmer: "", slug: "" });
    setShowTopicForm(true);
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
        resetForm();
        loadTopicsForCategory(editingCategory.slug);
        void loadCategoryTopics();
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
        void loadCategoryTopics();
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

  if (!pageReady) {
    return null;
  }

  return (
    <PermissionGuard permissions={[Permission.LIST_CATEGORIES]} showError>
      <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {copy.pageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {copy.pageDescription}
          </p>
        </div>
        {canCreateCategory && (
          <Button onClick={startCreating} className="w-full items-center gap-2 sm:w-auto">
            <Plus className="h-4 w-4" />
            {copy.newCategory}
          </Button>
        )}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open && !confirmation.open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader className="pr-8">
            <DialogTitle>
              {editingTopic
                ? copy.editTopic
                : manageSubcategories && editingCategory
                  ? copy.subCategoriesFor(editingCategory.name)
                  : editingCategory
                    ? copy.editCategory
                    : copy.createCategory}
            </DialogTitle>
            <DialogDescription>
              {editingTopic
                ? copy.editing(editingTopic.title)
                : editingCategory
                ? copy.editing(editingCategory.name)
                : copy.formDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {!editingTopic && !manageSubcategories && <div className="grid gap-4 sm:grid-cols-2">
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
                <label className="block text-sm font-medium text-slate-700">
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
              <div className="space-y-2 sm:col-span-2">
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
            </div>}

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
                    <div className="mb-4 space-y-3">
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
                          <span className="text-xs text-slate-400">{topic.slug}</span>
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
                    <p className="text-sm text-slate-500">{copy.noSubCategoriesAdded}</p>
                  )
                )}
              </div>
            )}

            {editingCategory && (manageSubcategories || editingTopic) && (
              <div className="border-t pt-5">
                {manageSubcategories && !editingTopic && <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-slate-950">{copy.subCategories}</h4>
                  </div>
                </div>}

                {showTopicForm && (
                  <PermissionGuard permissions={[editingTopic ? Permission.UPDATE_TOPIC : Permission.CREATE_TOPIC]} fallback={null}>
                    <div className="mb-4 space-y-3">
                      <h4 className="text-sm font-medium text-slate-950">
                        {editingTopic ? copy.editTopic : copy.addNewTopic}
                      </h4>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-slate-700">
                            {copy.englishTitle} <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={topicFormData.title}
                            onChange={(e) => handleTopicTitleChange(e.target.value)}
                            placeholder={copy.englishTopicPlaceholder}
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
                          />
                        </div>
                        <div className="space-y-1.5">
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
                    </div>
                  </PermissionGuard>
                )}

                {manageSubcategories && !editingTopic && (topics.length === 0 ? (
                  <p className="text-sm text-slate-500">{copy.noSubCategoriesYet}</p>
                ) : (
                  <div className="divide-y">
                    {topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950">{topic.title}</p>
                          <p className="truncate text-xs text-slate-500">
                            {[topic.titleKhmer, topic.slug].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center">
                          <PermissionGuard permissions={[Permission.UPDATE_TOPIC]} fallback={null}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingTopic(topic)}
                              disabled={isLoading}
                              className="h-8 px-2"
                            >
                              {copy.edit}
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard permissions={[Permission.DELETE_TOPIC]} fallback={null}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => requestDeleteTopic(topic.id, topic.title)}
                              disabled={isLoading}
                              className="h-8 px-2 text-red-600 hover:text-red-700"
                            >
                              {copy.delete}
                            </Button>
                          </PermissionGuard>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            {manageSubcategories && showTopicForm && !editingTopic ? (
              <Button onClick={requestSaveTopic} disabled={isLoading} className="items-center gap-2">
                <Save className="h-4 w-4" />
                {copy.save}
              </Button>
            ) : !manageSubcategories ? (
              <Button
                onClick={editingTopic ? requestSaveTopic : requestSaveCategory}
                disabled={isLoading}
                className="items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {editingTopic
                  ? copy.updateTopic
                  : editingCategory
                    ? copy.updateCategory
                    : copy.createCategory}
                {!editingCategory &&
                  pendingTopics.length > 0 &&
                  ` & ${pendingTopics.length} ${copy.subCategories}`}
              </Button>
            ) : null}
            <Button variant="outline" onClick={resetForm} disabled={isLoading}>
              {copy.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {categories.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            {categoriesLoading ? copy.loading : copy.noCategoriesYet}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1.5fr)_minmax(0,1.2fr)_220px] items-center gap-4 border-b border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <span>{copy.nameEnglishColumn}</span>
                <span>{copy.nameKhmerColumn}</span>
                <span>{copy.slugColumn}</span>
                <span>{copy.actionsColumn}</span>
              </div>
              {categories.map((category) => {
                const collapsed = collapsedCategoryIds.has(category.id);
                const selected = editingCategory?.id === category.id;
                const categorySubcategories = categoryTopics[category.id] ?? [];
                return (
                  <div key={category.id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                    <div className={`grid grid-cols-[minmax(0,1.8fr)_minmax(0,1.5fr)_minmax(0,1.2fr)_220px] items-center gap-4 px-5 py-3 ${selected ? "bg-blue-50/70 dark:bg-blue-950/30" : "bg-slate-50/80 dark:bg-slate-800/60"}`}>
                      <div className="flex min-w-0 items-center gap-2">
                        <button
                          type="button"
                          aria-label={`${collapsed ? "Expand" : "Collapse"} ${category.name}`}
                          aria-expanded={!collapsed}
                          onClick={() => setCollapsedCategoryIds((current) => {
                            const next = new Set(current);
                            if (next.has(category.id)) next.delete(category.id);
                            else next.add(category.id);
                            return next;
                          })}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
                        </button>
                        <span className="truncate font-semibold text-slate-950 dark:text-slate-100">{category.name}</span>
                      </div>
                      <span className="truncate text-slate-700 dark:text-slate-300">{category.nameKhmer || "—"}</span>
                      <span className="truncate text-sm text-slate-500 dark:text-slate-400">{category.slug}</span>
                      <div className="flex items-center gap-1">
                        <PermissionGuard permissions={[Permission.UPDATE_CATEGORY]} fallback={null}>
                          <Button variant="ghost" size="sm" onClick={() => startEditing(category)} disabled={isLoading} className="h-8 px-2">{copy.edit}</Button>
                        </PermissionGuard>
                        <PermissionGuard permissions={[Permission.CREATE_TOPIC]} fallback={null}>
                          <Button variant="outline" size="sm" onClick={() => startAddingSubcategory(category)} disabled={isLoading} className="h-8 gap-1 px-2"><Plus className="h-3.5 w-3.5" />{copy.addSubcategory}</Button>
                        </PermissionGuard>
                        <PermissionGuard permissions={[Permission.DELETE_CATEGORY]} fallback={null}>
                          <Button variant="ghost" size="sm" onClick={() => requestDeleteCategory(category.id, category.name)} disabled={isLoading} className="h-8 px-2 text-red-600 hover:text-red-700">{copy.delete}</Button>
                        </PermissionGuard>
                      </div>
                    </div>
                    {!collapsed && categorySubcategories.map((topic, index) => (
                      <div key={topic.id} className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1.5fr)_minmax(0,1.2fr)_220px] items-center gap-4 border-t border-slate-100 bg-white px-5 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex min-w-0 items-center gap-3 pl-3">
                          <span className={`h-6 w-5 shrink-0 border-l border-slate-200 dark:border-slate-700 ${index === categorySubcategories.length - 1 ? "border-b" : ""}`} />
                          <span className="truncate text-slate-800 dark:text-slate-200">{topic.title}</span>
                        </div>
                        <span className="truncate text-slate-600 dark:text-slate-400">{topic.titleKhmer || "—"}</span>
                        <span className="truncate text-sm text-slate-500 dark:text-slate-400">{topic.slug}</span>
                        <div className="flex items-center gap-2">
                          <PermissionGuard permissions={[Permission.UPDATE_TOPIC]} fallback={null}>
                            <Button variant="ghost" size="sm" onClick={() => { startEditing(category); startEditingTopic(topic); }} disabled={isLoading} className="h-8 px-2">{copy.edit}</Button>
                          </PermissionGuard>
                          <PermissionGuard permissions={[Permission.DELETE_TOPIC]} fallback={null}>
                            <Button variant="ghost" size="sm" onClick={() => requestDeleteTopic(topic.id, topic.title)} disabled={isLoading} className="h-8 px-2 text-red-600 hover:text-red-700">{copy.delete}</Button>
                          </PermissionGuard>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
