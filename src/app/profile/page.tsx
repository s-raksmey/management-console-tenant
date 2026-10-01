"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  AlertCircle,
  CalendarDays,
  Camera,
  ChevronRight,
  Crown,
  Globe,
  IdCard,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Monitor,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserManagement, type User } from "@/hooks/useUserManagement";
import { useToastHelpers } from "@/components/ui/toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminLocale, type AdminLocale } from "@/hooks/useAdminLocale";
import { useTenant } from "@/contexts/TenantContext";
import { IdentityService, identityErrorMessage } from "@/services/identity.gql";
import { getAuthFetchHeaders } from "@/services/graphql-client";
import { resolveCmsMediaSrc } from "@/lib/cms-media";

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

const roleLabels = {
  en: {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    EDITOR: "Editor",
    AUTHOR: "Author",
  },
  km: {
    SUPER_ADMIN: "អ្នកគ្រប់គ្រងកំពូល",
    ADMIN: "អ្នកគ្រប់គ្រង",
    EDITOR: "អ្នកកែសម្រួល",
    AUTHOR: "អ្នកនិពន្ធ",
  },
} as const;

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

function roleLabel(role: string | null | undefined, locale: AdminLocale, fallback: string) {
  if (!role) return fallback;
  const labels = roleLabels[locale];
  return role in labels ? labels[role as keyof typeof labels] : role;
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
    description: "Your account and identity, created together.",
    role: "Role",
    status: "Account",
    joined: "Joined",
    active: "Active",
    inactive: "Inactive",
    name: "Name",
    email: "Email",
    editName: "Edit name",
    editProfile: "Edit profile",
    uploadPhoto: "Upload photo",
    photoUpdated: "Profile photo updated",
    photoFailed: "Could not update the profile photo",
    photoImageOnly: "Please choose an image file.",
    editNameTitle: "Edit name",
    editNameDescription: "The name on this card follows your account.",
    cancel: "Cancel",
    saveName: "Save name",
    changePassword: "Change password",
    passwordTitle: "Change password",
    passwordDescription: "Update the password you use to sign in.",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    updatePassword: "Update Password",
    identityNumber: "Identity number",
    identityStatus: "Identity",
    identityHint: "This number was created with the account. It is not a password.",
    cardMark: "Digital identity",
    staff: "Staff",
    consoleName: "Management Console",
    identityLoading: "Loading identity...",
    identityFailed: "Could not load your identity",
    retry: "Try again",
    copyId: "Copy",
    copied: "Copied",
    copyFailed: "Could not copy the identity number.",
    twoFactorOn: "2FA enabled",
    twoFactorOff: "2FA not set up",
    digitalId: "Digital ID",
    digitalIdHint: "Reference only",
    accessTitle: "Access & memberships",
    viewAll: "View all",
    mainConsole: "Main Console",
    mainConsoleDetail: "System administration",
    allTenants: "All Tenants",
    allTenantsDetail: "Create and manage websites",
    analyticsAudit: "Analytics & Audit",
    analyticsAuditDetail: "System data and logs",
    accessible: "Accessible",
    manage: "Manage",
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
    description: "គណនី និងអត្តសញ្ញាណរបស់អ្នក បង្កើតជាមួយគ្នា។",
    role: "តួនាទី",
    status: "គណនី",
    joined: "បានចូលរួម",
    active: "សកម្ម",
    inactive: "អសកម្ម",
    name: "ឈ្មោះ",
    email: "អ៊ីមែល",
    editName: "កែឈ្មោះ",
    editProfile: "កែប្រវត្តិរូប",
    uploadPhoto: "ផ្ទុករូប",
    photoUpdated: "បានកែរូបប្រវត្តិ",
    photoFailed: "មិនអាចកែរូបប្រវត្តិបានទេ",
    photoImageOnly: "សូមជ្រើសឯកសាររូបភាព។",
    editNameTitle: "កែឈ្មោះ",
    editNameDescription: "ឈ្មោះលើកាតនេះធ្វើតាមគណនីរបស់អ្នក។",
    cancel: "បោះបង់",
    saveName: "រក្សាទុកឈ្មោះ",
    changePassword: "ប្តូរពាក្យសម្ងាត់",
    passwordTitle: "ប្តូរពាក្យសម្ងាត់",
    passwordDescription: "កែប្រែពាក្យសម្ងាត់សម្រាប់ចូលប្រើ។",
    currentPassword: "ពាក្យសម្ងាត់បច្ចុប្បន្ន",
    newPassword: "ពាក្យសម្ងាត់ថ្មី",
    confirmPassword: "បញ្ជាក់ពាក្យសម្ងាត់",
    updatePassword: "កែប្រែពាក្យសម្ងាត់",
    identityNumber: "លេខអត្តសញ្ញាណ",
    identityStatus: "អត្តសញ្ញាណ",
    identityHint: "លេខនេះបង្កើតជាមួយគណនី។ វាមិនមែនជាពាក្យសម្ងាត់ទេ។",
    cardMark: "អត្តសញ្ញាណឌីជីថល",
    staff: "បុគ្គលិក",
    consoleName: "ផ្ទាំងគ្រប់គ្រង",
    identityLoading: "កំពុងផ្ទុកអត្តសញ្ញាណ...",
    identityFailed: "មិនអាចផ្ទុកអត្តសញ្ញាណរបស់អ្នកបានទេ",
    retry: "ព្យាយាមម្តងទៀត",
    copyId: "ចម្លង",
    copied: "បានចម្លង",
    copyFailed: "មិនអាចចម្លងលេខអត្តសញ្ញាណបានទេ។",
    twoFactorOn: "បានបើក 2FA",
    twoFactorOff: "មិនទាន់បើក 2FA",
    digitalId: "អត្តសញ្ញាណឌីជីថល",
    digitalIdHint: "សម្រាប់យោងតែប៉ុណ្ណោះ",
    accessTitle: "សិទ្ធិ និងសមាជិកភាព",
    viewAll: "មើលទាំងអស់",
    mainConsole: "កុងសូលមេ",
    mainConsoleDetail: "គ្រប់គ្រងប្រព័ន្ធ",
    allTenants: "គេហទំព័រទាំងអស់",
    allTenantsDetail: "បង្កើត និងគ្រប់គ្រងគេហទំព័រ",
    analyticsAudit: "វិភាគ និងកំណត់ហេតុ",
    analyticsAuditDetail: "ទិន្នន័យ និងកំណត់ហេតុប្រព័ន្ធ",
    accessible: "អាចចូលបាន",
    manage: "គ្រប់គ្រង",
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

function EmailAddress({ email }: { email: string }) {
  const at = email.lastIndexOf("@");
  if (at < 1) return <>{email}</>;

  return (
    <>
      {email.slice(0, at)}
      <wbr />
      {email.slice(at)}
    </>
  );
}

function IdentityQr({ value, label }: { value: string; label: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(value, {
      margin: 1,
      width: 112,
      color: { dark: "#1e3a8a", light: "#ffffff" },
    }).then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [value]);

  if (!src) {
    return <div className="h-24 w-24 rounded-md bg-slate-100" aria-hidden />;
  }

  return <img src={src} alt={label} className="h-24 w-24" />;
}

export default function ProfilePage() {
  const { locale } = useAdminLocale();
  const { activeTenant } = useTenant();
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
  const [nameOpen, setNameOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [identityNumber, setIdentityNumber] = useState<string | null>(null);
  const [identityStatus, setIdentityStatus] = useState<"ACTIVE" | "INACTIVE" | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [identityLoading, setIdentityLoading] = useState(true);
  const [identityError, setIdentityError] = useState<string | null>(null);

  const activeProfile = profile ?? user;
  const shownRole = roleLabel(activeProfile?.role, locale, copy.roleFallback);

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

  const loadIdentity = useCallback(async () => {
    setIdentityLoading(true);
    setIdentityError(null);
    try {
      const identity = await IdentityService.getMine();
      setIdentityNumber(identity.identityNumber);
      setIdentityStatus(identity.status);
      setPhotoUrl(identity.profilePhotoUrl || null);
    } catch (loadError) {
      setIdentityNumber(null);
      setPhotoUrl(null);
      setIdentityError(identityErrorMessage(loadError, copy.identityFailed));
    } finally {
      setIdentityLoading(false);
    }
  }, [copy.identityFailed]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    void loadIdentity();
  }, [loadIdentity]);

  const openNameDialog = () => {
    setProfileForm({
      name: activeProfile?.name ?? "",
      email: activeProfile?.email ?? "",
    });
    setNameOpen(true);
  };

  const openPasswordDialog = () => {
    setPasswordForm(emptyPasswordForm);
    setPasswordOpen(true);
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showError(copy.photoFailed, copy.photoImageOnly);
      return;
    }

    const displayName = (activeProfile?.name || "").trim().slice(0, 120);
    if (!displayName) {
      showError(copy.photoFailed, copy.signInAgain);
      return;
    }

    setUploadingPhoto(true);
    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append(
        "options",
        JSON.stringify({
          folder: "profiles",
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 95,
          fit: "cover",
          tags: ["profile"],
        }),
      );

      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: getAuthFetchHeaders({ includeSelectedTenant: true }),
        body: payload,
      });
      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        file?: { url?: string };
      };

      if (!response.ok || !result.success || !result.file?.url) {
        throw new Error(result.message || copy.photoFailed);
      }

      const saved = await IdentityService.updatePhoto({
        displayName,
        profilePhotoUrl: result.file.url,
      });
      if (!saved.success) {
        throw new Error(saved.message || copy.photoFailed);
      }

      setPhotoUrl(saved.profilePhotoUrl || result.file.url);
      showSuccess(copy.photoUpdated, locale === "en" ? saved.message : copy.photoUpdated);
    } catch (error) {
      showError(
        copy.photoFailed,
        locale === "en" && error instanceof Error ? error.message : copy.photoFailed,
      );
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

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
        setNameOpen(false);
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
      showError(copy.validationError, copy.passwordMinLength);
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
        setPasswordOpen(false);
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
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">{copy.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{copy.description}</p>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <span>{error}</span>
        </div>
      ) : null}

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside
            className="relative flex flex-col items-center overflow-hidden bg-blue-700 bg-cover bg-center px-6 py-8 text-center text-white"
            style={{ backgroundImage: "url(/profile-id-bg.jpg)" }}
          >
            <div className="pointer-events-none absolute inset-0 bg-blue-950/25" aria-hidden />
            <span className="relative rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-800">
              {copy.staff}
            </span>
            <div className="relative mt-8">
              <Avatar className="h-32 w-32 ring-4 ring-white">
                <AvatarFallback className="bg-white text-3xl font-semibold text-blue-700">
                  {getInitials(activeProfile?.name)}
                </AvatarFallback>
                <img
                  src={photoUrl ? resolveCmsMediaSrc(photoUrl) : "/avatar.png"}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </Avatar>
              <button
                type="button"
                className="absolute -bottom-1 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-white text-blue-700 shadow-md ring-2 ring-white disabled:opacity-60"
                aria-label={copy.uploadPhoto}
                disabled={uploadingPhoto}
                onClick={() => photoInputRef.current?.click()}
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadProfilePhoto(file);
                }}
              />
              <span
                className={`absolute bottom-2 right-2 h-4 w-4 rounded-full ring-4 ring-white ${
                  activeProfile?.isActive ? "bg-emerald-600" : "bg-amber-500"
                }`}
              />
            </div>
            <h2 className="relative mt-5 max-w-full break-words text-2xl font-semibold">
              {activeProfile?.name ?? copy.user}
            </h2>
            <p className="relative mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              {copy.cardMark}
            </p>
            <p className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-800">
              <span
                className={`h-2 w-2 rounded-full ${
                  activeProfile?.isActive ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {copy.status} {activeProfile?.isActive ? copy.active : copy.inactive}
            </p>
            {profile ? (
              <p className="relative mt-4 inline-flex items-center gap-2 text-xs font-medium text-white">
                <Lock className="h-3.5 w-3.5" />
                {profile.twoFactorEnabled ? copy.twoFactorOn : copy.twoFactorOff}
              </p>
            ) : null}
          </aside>

          <div className="min-w-0 px-5 py-6 sm:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <h3 className="break-words text-3xl font-semibold tracking-tight text-slate-950">
                  {activeProfile?.name ?? copy.user}
                </h3>
                <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span className="min-w-0 text-slate-800">
                    <EmailAddress email={activeProfile?.email ?? copy.noEmail} />
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={openNameDialog}>
                  <UserRound className="h-3.5 w-3.5" />
                  {copy.editProfile}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={openPasswordDialog}>
                  <KeyRound className="h-3.5 w-3.5" />
                  {copy.changePassword}
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {copy.identityNumber}
                </p>
                {identityLoading ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {copy.identityLoading}
                  </p>
                ) : identityError ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="text-sm text-red-700">{identityError}</p>
                    <Button type="button" size="sm" variant="outline" onClick={() => void loadIdentity()}>
                      {copy.retry}
                    </Button>
                  </div>
                ) : (
                  <p className="mt-2 overflow-x-auto whitespace-nowrap font-mono text-xs font-medium leading-5 tracking-tight text-slate-950 sm:text-sm">
                    {identityNumber ?? copy.notAvailable}
                  </p>
                )}
                <p className="mt-2 text-xs leading-5 text-slate-500">{copy.identityHint}</p>
              </div>
              {identityNumber ? (
                <div className="flex shrink-0 flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:w-36 sm:flex-col sm:justify-center">
                  <IdentityQr value={identityNumber} label={copy.digitalId} />
                  <div className="text-left sm:text-center">
                    <p className="text-xs font-semibold text-slate-800">{copy.digitalId}</p>
                    <p className="text-[11px] text-slate-500">{copy.digitalIdHint}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="min-w-0 rounded-xl bg-amber-50 px-4 py-3">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                  <Crown className="h-3.5 w-3.5" />
                  {copy.role}
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-slate-950">{shownRole}</p>
              </div>
              <div className="min-w-0 rounded-xl bg-emerald-50 px-4 py-3">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  <IdCard className="h-3.5 w-3.5" />
                  {copy.identityStatus}
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-emerald-700">
                  {identityStatus === "INACTIVE"
                    ? copy.inactive
                    : identityStatus === "ACTIVE"
                      ? copy.active
                      : copy.notAvailable}
                </p>
              </div>
              <div className="min-w-0 rounded-xl bg-blue-50 px-4 py-3">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                  <UserRound className="h-3.5 w-3.5" />
                  {copy.status}
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-slate-950">
                  {activeProfile?.isActive ? copy.active : copy.inactive}
                </p>
              </div>
              <div className="min-w-0 rounded-xl bg-violet-50 px-4 py-3">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-700">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {copy.joined}
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-slate-950">
                  {formatJoinedDate(profile?.createdAt, locale, copy.notAvailable)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {copy.accessTitle}
                </p>
                {activeProfile?.role === "SUPER_ADMIN" ? (
                  <Link href="/tenants" className="inline-flex items-center gap-1 text-sm font-medium text-blue-700">
                    {copy.viewAll}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link href="/" className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 px-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                    <Monitor className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-semibold text-slate-950">
                      {activeTenant?.name || copy.mainConsole}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {copy.mainConsoleDetail}
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                        {copy.accessible}
                      </span>
                    </span>
                  </span>
                </Link>
                {activeProfile?.role === "SUPER_ADMIN" ? (
                  <Link href="/tenants" className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 px-3 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <Globe className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-950">{copy.allTenants}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {copy.allTenantsDetail}
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                          {copy.manage}
                        </span>
                      </span>
                    </span>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </article>
      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.editNameTitle}</DialogTitle>
            <DialogDescription>{copy.editNameDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNameOpen(false)}>
                {copy.cancel}
              </Button>
              <Button type="submit" disabled={isSavingProfile || !hasProfileChanges}>
                {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {copy.saveName}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.passwordTitle}</DialogTitle>
            <DialogDescription>{copy.passwordDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>
                {copy.cancel}
              </Button>
              <Button
                type="submit"
                disabled={
                  isChangingPassword ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
              >
                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {copy.updatePassword}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
