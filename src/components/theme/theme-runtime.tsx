"use client";

import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { getGqlClient } from "@/services/graphql-client";
import { Q_PUBLIC_SETTINGS } from "@/services/settings.gql";
import {
  COLOR_SCHEME_CHANGED_EVENT,
  THEME_SETTINGS_CHANGED_EVENT,
  applyThemeSettings,
  reapplyCachedTheme,
} from "@/lib/tweakcn-theme";
import { useTenant } from "@/contexts/TenantContext";
import { resolveCmsMediaSrc } from "@/lib/cms-media";

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

function upsertMeta(attribute: "property" | "name", key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`;
  let meta = document.head.querySelector<HTMLMetaElement>(selector);

  if (!content) {
    meta?.remove();
    return;
  }

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }

  meta.content = content;
}

function updateOpenGraphImage(settings: PublicSetting[]) {
  const imageUrl = valueToString(getSettingValue(settings, "site.og_image_url"));
  const absoluteUrl = imageUrl
    ? new URL(resolveCmsMediaSrc(imageUrl), window.location.origin).toString()
    : "";

  upsertMeta("property", "og:image", absoluteUrl);
  upsertMeta("name", "twitter:image", absoluteUrl);
  upsertMeta("name", "twitter:card", absoluteUrl ? "summary_large_image" : "");
}

function updateFavicon(settings: PublicSetting[]) {
  const faviconUrl =
    valueToString(getSettingValue(settings, "site.favicon_url")) ||
    valueToString(getSettingValue(settings, "site.dashboard_favicon_url"));

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (!faviconUrl) {
    if (link) {
      link.remove();
    }
    return;
  }

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  link.href = resolveCmsMediaSrc(faviconUrl);
}

export function ThemeRuntime() {
  const { user } = useAuth();
  const { activeTenant } = useTenant();

  useEffect(() => {
    let cancelled = false;

    async function loadTheme() {
      reapplyCachedTheme();
      try {
        const response = await getGqlClient().request<{
          publicSettings?: PublicSetting[];
        }>(Q_PUBLIC_SETTINGS);

        if (cancelled) return;

        applyThemeSettings(response.publicSettings || [], user?.role);
        updateFavicon(response.publicSettings || []);
        updateOpenGraphImage(response.publicSettings || []);
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
