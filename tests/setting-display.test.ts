import assert from "node:assert/strict";
import { test } from "node:test";
import { presentSetting } from "../src/lib/setting-display";
import { SettingType, type Setting } from "../src/services/settings.gql";

function setting(partial: Partial<Setting> = {}): Setting {
  return {
    id: "1",
    key: "site.dashboard_favicon_url",
    value: "",
    type: SettingType.SITE,
    label: "Tenant Dashboard Favicon URL",
    description: "Favicon used for this sub-tenant admin dashboard",
    isPublic: true,
    isRequired: false,
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

test("sub-tenant branding settings use public website labels", () => {
  const logo = presentSetting(setting({
    key: "site.logo_url",
    label: "Logo URL",
    description: "URL to your site logo image",
  }));
  const ogImage = presentSetting(setting({
    key: "site.og_image_url",
    label: "OG Image",
    description: "Share image",
  }));

  assert.equal(logo.label, "Public Website Logo URL");
  assert.equal(ogImage.label, "Open Graph Image URL");
});

test("dashboard favicon never keeps the tenant label", () => {
  const presented = presentSetting(setting());
  assert.equal(presented.label, "Admin Dashboard Favicon URL");
  assert.equal(presented.description, "Favicon used for this admin dashboard");
});
