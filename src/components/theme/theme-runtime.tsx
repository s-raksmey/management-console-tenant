"use client";

import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { getGqlClient } from "@/services/graphql-client";
import { Q_PUBLIC_SETTINGS } from "@/services/settings.gql";
import {
  THEME_SETTINGS_CHANGED_EVENT,
  applyTweakCnTheme,
  getThemeSettingKeyForRole,
} from "@/lib/tweakcn-theme";

type PublicSetting = {
  key: string;
  value: unknown;
};

export function ThemeRuntime() {
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function loadTheme() {
      try {
        const response = await getGqlClient().request<{
          publicSettings?: PublicSetting[];
        }>(Q_PUBLIC_SETTINGS);

        if (cancelled) return;

        const settings = response.publicSettings || [];
        const themeKey = getThemeSettingKeyForRole(user?.role);
        const themeValue =
          settings.find((setting) => setting.key === themeKey)?.value ||
          settings.find((setting) => setting.key === "theme.admin_tweakcn")?.value;

        applyTweakCnTheme(themeValue);
      } catch (error) {
        console.warn("Failed to load theme settings", error);
      }
    }

    void loadTheme();
    window.addEventListener(THEME_SETTINGS_CHANGED_EVENT, loadTheme);

    return () => {
      cancelled = true;
      window.removeEventListener(THEME_SETTINGS_CHANGED_EVENT, loadTheme);
    };
  }, [user?.role]);

  return null;
}
