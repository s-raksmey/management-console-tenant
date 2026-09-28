import type { Setting } from "@/services/settings.gql";

const SETTING_DISPLAY: Record<string, Pick<Setting, "label" | "description">> = {
  "site.logo_url": {
    label: "Public Website Logo",
    description: "Upload a square logo from this device. It appears next to the site name in the admin dashboard, public header, and footer.",
  },
  "site.og_image_url": {
    label: "Open Graph Image",
    description: "Upload the default image used when this public website is shared on social media.",
  },
  "site.management_logo_url": {
    label: "Management Console Logo",
    description: "Upload the logo shown in the management console sidebar and header.",
  },
  "site.management_og_image_url": {
    label: "Open Graph Image",
    description: "Upload the default image used when the management console is shared in search or social previews.",
  },
  "site.dashboard_logo_url": {
    label: "Admin Dashboard Logo",
    description: "Upload the logo shown in this admin dashboard sidebar and header. If empty, the public website logo is used.",
  },
  "site.dashboard_favicon_url": {
    label: "Admin Dashboard Favicon",
    description: "Upload the favicon used for this admin dashboard.",
  },
  "site.favicon_url": {
    label: "Favicon",
    description: "Upload one favicon. It is used on the public website and in this admin dashboard.",
  },
  "site.management_favicon_url": {
    label: "Management Console Favicon",
    description: "Upload the favicon used for the super admin management console.",
  },
  "site.public_base_url": {
    label: "Public Website URL",
    description: "Set by Super Admin on the Tenants page. Used for public links and Host matching.",
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
