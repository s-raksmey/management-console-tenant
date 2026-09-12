import type { Setting } from "@/services/settings.gql";

const SETTING_DISPLAY: Record<string, Pick<Setting, "label" | "description">> = {
  "site.logo_url": {
    label: "Public Website Logo URL",
    description: "Square logo shown next to the site name in the admin dashboard, public header, and footer",
  },
  "site.og_image_url": {
    label: "Open Graph Image URL",
    description: "Default image used when this public website is shared on social media",
  },
  "site.dashboard_favicon_url": {
    label: "Admin Dashboard Favicon URL",
    description: "Favicon used for this admin dashboard",
  },
  "site.favicon_url": {
    label: "Public Website Favicon URL",
    description: "Favicon used for this public website",
  },
  "site.public_base_url": {
    label: "Public Website URL",
    description: "Public website URL for this website, used in verification and login links",
  },
  "theme.admin_tweakcn": {
    label: "Admin Theme",
    description: "TweakCN shadcn CSS variables for this admin dashboard",
  },
};

export function presentSetting(setting: Setting): Setting {
  const override = SETTING_DISPLAY[setting.key];
  if (!override) return setting;

  return {
    ...setting,
    label: override.label,
    description: override.description,
  };
}
