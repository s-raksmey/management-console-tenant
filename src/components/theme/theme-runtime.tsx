"use client";

import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { getGqlClient } from "@/services/graphql-client";
import { Q_PUBLIC_SETTINGS } from "@/services/settings.gql";
import {
  COLOR_SCHEME_CHANGED_EVENT,
  THEME_SETTINGS_CHANGED_EVENT,
  applyThemeSettings,
} from "@/lib/tweakcn-theme";
import { useTenant } from "@/contexts/TenantContext";

type PublicSetting = {
  key: string;
  value: unknown;
};

function getSettingValue(settings: PublicSetting[], key: string) {
  return settings.find((setting) => setting.key === key)?.value;
}

function valueToString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function updateFavicon(settings: PublicSetting[], role?: string | null) {
  const faviconUrl =
    role === "SUPER_ADMIN"
      ? valueToString(getSettingValue(settings, "site.management_favicon_url")) ||
        valueToString(getSettingValue(settings, "site.favicon_url"))
      : valueToString(getSettingValue(settings, "site.dashboard_favicon_url")) ||
        valueToString(getSettingValue(settings, "site.favicon_url"));

  if (!faviconUrl) return;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  link.href = faviconUrl;
}

export function ThemeRuntime() {
  const { user } = useAuth();
  const { activeTenant } = useTenant();

  useEffect(() => {
    let cancelled = false;

    async function loadTheme() {
      try {
        const response = await getGqlClient().request<{
          publicSettings?: PublicSetting[];
        }>(Q_PUBLIC_SETTINGS);

        if (cancelled) return;

        applyThemeSettings(response.publicSettings || [], user?.role);
        updateFavicon(response.publicSettings || [], user?.role);
      } catch (error) {
        console.warn("Failed to load theme settings", error);
      }
    }

    void loadTheme();
    window.addEventListener(THEME_SETTINGS_CHANGED_EVENT, loadTheme);
    window.addEventListener(COLOR_SCHEME_CHANGED_EVENT, loadTheme);

    return () => {
      cancelled = true;
      window.removeEventListener(THEME_SETTINGS_CHANGED_EVENT, loadTheme);
      window.removeEventListener(COLOR_SCHEME_CHANGED_EVENT, loadTheme);
    };
  }, [activeTenant?.id, user?.role]);

  return null;
}
