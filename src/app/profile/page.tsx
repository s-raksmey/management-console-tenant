"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
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

function formatJoinedDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return format(date, "MMM d, yyyy");
}

export default function ProfilePage() {
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
      showError("Profile Error", "You need to sign in again.");
      return;
    }

    const name = profileForm.name.trim();
    const email = profileForm.email.trim();

    if (!name || !email) {
      showError("Validation Error", "Name and email are required.");
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
        showSuccess("Profile Updated", result.message);
      } else {
        showError(
          "Profile Error",
          result?.message || "Failed to update profile.",
        );
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.id) {
      showError("Password Error", "You need to sign in again.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showError(
        "Validation Error",
        "New password must be at least 8 characters.",
      );
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError("Validation Error", "New passwords do not match.");
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
        showSuccess("Password Updated", result.message);
      } else {
        showError(
          "Password Error",
          result?.message || "Failed to update password.",
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
          <h1 className="text-3xl font-bold text-slate-950">Profile</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage your account details and password.
          </p>
        </div>
        <Badge
          variant="secondary"
          className={`w-fit px-3 py-1 ${getRoleBadgeColor(activeProfile?.role)}`}
        >
          {activeProfile?.role ?? "USER"}
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
              {activeProfile?.name ?? "User"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeProfile?.email ?? "No email"}
            </p>
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-slate-500" />
              <span className="text-slate-500">Role</span>
              <span className="ml-auto font-medium text-slate-900">
                {activeProfile?.role ?? "USER"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-slate-500">Status</span>
              <span className="ml-auto font-medium text-slate-900">
                {activeProfile?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              <span className="text-slate-500">Joined</span>
              <span className="ml-auto font-medium text-slate-900">
                {formatJoinedDate(profile?.createdAt)}
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
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>
                    Name and email shown in the admin.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Name</Label>
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
                    <Label htmlFor="profile-email">Email</Label>
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
                    Save Changes
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
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Update your sign-in password.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
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
                    <Label htmlFor="new-password">New Password</Label>
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
                    <Label htmlFor="confirm-password">Confirm Password</Label>
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
                    Update Password
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
