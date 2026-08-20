"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  KeyRound,
  Loader2,
  Mail,
  Save,
  Shield,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserManagement, type User } from "@/hooks/useUserManagement";
import { useToastHelpers } from "@/components/ui/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminLocale, type AdminLocale } from "@/hooks/useAdminLocale";

type ProfileForm = {
  name: string;
  email: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyPasswordForm: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function getInitials(name?: string | null) {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleBadgeColor(role?: string | null) {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-800";
    case "EDITOR":
      return "bg-blue-100 text-blue-800";
    case "AUTHOR":
      return "bg-green-100 text-green-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

const profileCopy = {
  en: {
    notAvailable: "Not available",
    user: "User",
    noEmail: "No email",
    roleFallback: "USER",
    profileError: "Profile Error",
    passwordError: "Password Error",
    validationError: "Validation Error",
    signInAgain: "You need to sign in again.",
    nameEmailRequired: "Name and email are required.",
    profileUpdated: "Profile Updated",
    profileUpdateFailed: "Failed to update profile.",
    passwordMinLength: "New password must be at least 8 characters.",
    passwordMismatch: "New passwords do not match.",
    passwordUpdated: "Password Updated",
    passwordUpdateFailed: "Failed to update password.",
    title: "Profile",
    description: "Manage your account details and password.",
    role: "Role",
    status: "Status",
    joined: "Joined",
    active: "Active",
    inactive: "Inactive",
    accountDetails: "Account Details",
    accountDetailsDescription: "Name and email shown in the admin.",
    name: "Name",
    email: "Email",
    saveChanges: "Save Changes",
    password: "Password",
    passwordDescription: "Update your sign-in password.",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    updatePassword: "Update Password",
  },
  km: {
    notAvailable: "មិនមាន",
    user: "អ្នកប្រើ",
    noEmail: "គ្មានអ៊ីមែល",
    roleFallback: "អ្នកប្រើ",
    profileError: "បញ្ហាប្រវត្តិរូប",
    passwordError: "បញ្ហាពាក្យសម្ងាត់",
    validationError: "បញ្ហាពិនិត្យទិន្នន័យ",
    signInAgain: "អ្នកត្រូវចូលប្រើម្តងទៀត។",
    nameEmailRequired: "ត្រូវបញ្ចូលឈ្មោះ និងអ៊ីមែល។",
    profileUpdated: "បានកែប្រែប្រវត្តិរូប",
    profileUpdateFailed: "កែប្រែប្រវត្តិរូបមិនបានសម្រេច។",
    passwordMinLength: "ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ 8 តួអក្សរ។",
    passwordMismatch: "ពាក្យសម្ងាត់ថ្មីមិនដូចគ្នាទេ។",
    passwordUpdated: "បានកែប្រែពាក្យសម្ងាត់",
    passwordUpdateFailed: "កែប្រែពាក្យសម្ងាត់មិនបានសម្រេច។",
    title: "ប្រវត្តិរូប",
    description: "គ្រប់គ្រងព័ត៌មានគណនី និងពាក្យសម្ងាត់របស់អ្នក។",
    role: "តួនាទី",
    status: "ស្ថានភាព",
    joined: "បានចូលរួម",
    active: "សកម្ម",
    inactive: "អសកម្ម",
    accountDetails: "ព័ត៌មានគណនី",
    accountDetailsDescription: "ឈ្មោះ និងអ៊ីមែលដែលបង្ហាញក្នុងផ្នែកគ្រប់គ្រង។",
    name: "ឈ្មោះ",
    email: "អ៊ីមែល",
    saveChanges: "រក្សាទុកការកែប្រែ",
    password: "ពាក្យសម្ងាត់",
    passwordDescription: "កែប្រែពាក្យសម្ងាត់សម្រាប់ចូលប្រើ។",
    currentPassword: "ពាក្យសម្ងាត់បច្ចុប្បន្ន",
    newPassword: "ពាក្យសម្ងាត់ថ្មី",
    confirmPassword: "បញ្ជាក់ពាក្យសម្ងាត់",
    updatePassword: "កែប្រែពាក្យសម្ងាត់",
  },
} as const;

function formatJoinedDate(value: string | null | undefined, locale: AdminLocale, fallback: string) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale === "km" ? "km-KH" : "en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function ProfilePage() {
  const { locale } = useAdminLocale();
  const copy = profileCopy[locale];
  const { user, refreshUser } = useAuth();
  const { getUserById, updateUserProfile, changePassword, loading, error } =
    useUserManagement();
  const { showSuccess, showError } = useToastHelpers();
  const [profile, setProfile] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] =
    useState<PasswordForm>(emptyPasswordForm);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const activeProfile = profile ?? user;

  const hasProfileChanges = useMemo(() => {
    return (
      profileForm.name.trim() !== (activeProfile?.name ?? "") ||
      profileForm.email.trim() !== (activeProfile?.email ?? "")
    );
  }, [
    activeProfile?.email,
    activeProfile?.name,
    profileForm.email,
    profileForm.name,
  ]);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    const currentUser = await getUserById(user.id);
    if (currentUser) {
      setProfile(currentUser);
      setProfileForm({
        name: currentUser.name,
        email: currentUser.email,
      });
      return;
    }

    setProfileForm({
      name: user.name,
      email: user.email,
    });
  }, [getUserById, user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.id) {
      showError(copy.profileError, copy.signInAgain);
      return;
    }

    const name = profileForm.name.trim();
    const email = profileForm.email.trim();

    if (!name || !email) {
      showError(copy.validationError, copy.nameEmailRequired);
      return;
    }

    setIsSavingProfile(true);
    try {
      const result = await updateUserProfile({
        userId: user.id,
        name,
        email,
      });

      if (result?.success && result.user) {
        setProfile(result.user);
        setProfileForm({
          name: result.user.name,
          email: result.user.email,
        });
        await refreshUser();
        showSuccess(copy.profileUpdated, locale === "en" ? result.message : copy.profileUpdated);
      } else {
        showError(
          copy.profileError,
          locale === "en" ? result?.message || copy.profileUpdateFailed : copy.profileUpdateFailed,
        );
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.id) {
      showError(copy.passwordError, copy.signInAgain);
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showError(
        copy.validationError,
        copy.passwordMinLength,
      );
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError(copy.validationError, copy.passwordMismatch);
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword({
        userId: user.id,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (result?.success) {
        setPasswordForm(emptyPasswordForm);
        showSuccess(copy.passwordUpdated, locale === "en" ? result.message : copy.passwordUpdated);
      } else {
        showError(
          copy.passwordError,
          locale === "en" ? result?.message || copy.passwordUpdateFailed : copy.passwordUpdateFailed,
        );
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">{copy.title}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {copy.description}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={`w-fit px-3 py-1 ${getRoleBadgeColor(activeProfile?.role)}`}
        >
          {activeProfile?.role ?? copy.roleFallback}
        </Badge>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src="/avatar.png" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-semibold text-white">
                {getInitials(activeProfile?.name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">
              {activeProfile?.name ?? copy.user}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeProfile?.email ?? copy.noEmail}
            </p>
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-slate-500" />
              <span className="text-slate-500">{copy.role}</span>
              <span className="ml-auto font-medium text-slate-900">
                {activeProfile?.role ?? copy.roleFallback}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-slate-500">{copy.status}</span>
              <span className="ml-auto font-medium text-slate-900">
                {activeProfile?.isActive ? copy.active : copy.inactive}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              <span className="text-slate-500">{copy.joined}</span>
              <span className="ml-auto font-medium text-slate-900">
                {formatJoinedDate(profile?.createdAt, locale, copy.notAvailable)}
              </span>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>{copy.accountDetails}</CardTitle>
                  <CardDescription>
                    {copy.accountDetailsDescription}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">{copy.name}</Label>
                    <Input
                      id="profile-name"
                      value={profileForm.name}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      disabled={isSavingProfile || loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">{copy.email}</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      disabled={isSavingProfile || loading}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSavingProfile || !hasProfileChanges}
                  >
                    {isSavingProfile ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {copy.saveChanges}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>{copy.password}</CardTitle>
                  <CardDescription>
                    {copy.passwordDescription}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">{copy.currentPassword}</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          currentPassword: event.target.value,
                        }))
                      }
                      disabled={isChangingPassword}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{copy.newPassword}</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      disabled={isChangingPassword}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{copy.confirmPassword}</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      disabled={isChangingPassword}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={
                      isChangingPassword ||
                      !passwordForm.currentPassword ||
                      !passwordForm.newPassword ||
                      !passwordForm.confirmPassword
                    }
                  >
                    {isChangingPassword ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="mr-2 h-4 w-4" />
                    )}
                    {copy.updatePassword}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
