"use client";

import { CarouselSlideForm } from "../_components/CarouselSlideForm";
import { Permission } from "@/components/permissions/PermissionGuard";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useAdminLocale } from "@/hooks/useAdminLocale";

const newCarouselCopy = {
  en: {
    loadingPermissions: "Loading permissions...",
    accessDenied: "Access denied: Insufficient permissions",
    title: "Create Slide",
    description: "Add a new public hero carousel slide with image or video media.",
  },
  km: {
    loadingPermissions: "កំពុងផ្ទុកសិទ្ធិ...",
    accessDenied: "គ្មានសិទ្ធិ៖ សិទ្ធិមិនគ្រប់គ្រាន់",
    title: "បង្កើតស្លាយ",
    description: "បន្ថែមស្លាយមុខសាធារណៈថ្មីជាមួយរូបភាព ឬវីដេអូ។",
  },
} as const;

export default function NewCarouselSlidePage() {
  const { locale } = useAdminLocale();
  const copy = newCarouselCopy[locale];
  const { user } = useAuth();
  const { hasPermission, isLoading } = usePermissions();
  const canCreate =
    user?.role === "SUPER_ADMIN" || hasPermission(Permission.CREATE_CAROUSEL);

  if (isLoading) {
    return <div className="text-sm text-slate-500">{copy.loadingPermissions}</div>;
  }

  if (!canCreate) {
    return (
      <div className="text-sm text-red-600">
        {copy.accessDenied}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">{copy.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {copy.description}
        </p>
      </div>

      <CarouselSlideForm />
    </div>
  );
}
