"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Category } from "@/services/category.gql";

interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface CategoryFormData {
  name: string;
  slug: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CategoryForm({ category, onSubmit, onCancel, isLoading = false }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || "",
    slug: category?.slug || "",
  });

  const [errors, setErrors] = useState<Partial<CategoryFormData>>({});
  const [autoSlug, setAutoSlug] = useState(!category); // Auto-generate slug for new categories

  // Auto-generate slug when name changes (only for new categories)
  useEffect(() => {
    if (autoSlug && formData.name) {
      setFormData(prev => ({
        ...prev,
        slug: slugify(formData.name)
      }));
    }
  }, [formData.name, autoSlug]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CategoryFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (formData.slug.trim().length < 2) {
      newErrors.slug = "Slug must be at least 2 characters";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description?.trim() || undefined,
      });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({ ...prev, name }));
    
    // Clear name error when user starts typing
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value;
    setFormData(prev => ({ ...prev, slug }));
    setAutoSlug(false); // Disable auto-generation when user manually edits slug
    
    // Clear slug error when user starts typing
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: undefined }));
    }
  };



  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={handleNameChange}
          placeholder="e.g. Technology"
          className={errors.name ? "border-red-500" : ""}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="block text-sm font-medium text-slate-700">
          Slug <span className="text-red-500">*</span>
        </label>
        <Input
          id="slug"
          type="text"
          value={formData.slug}
          onChange={handleSlugChange}
          placeholder="e.g. technology"
          className={errors.slug ? "border-red-500" : ""}
          disabled={isLoading}
        />
        {errors.slug && (
          <p className="text-sm text-red-500">{errors.slug}</p>
        )}
        <p className="text-xs text-slate-500">
          Used in URLs. Only lowercase letters, numbers, and hyphens allowed.
        </p>
      </div>



      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : category ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
