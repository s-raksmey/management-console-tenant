import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getTenantDisplayName,
  getTenantLogoUrl,
  isSubTenantDisplay,
  withTenantLogoUrl,
} from "../src/lib/tenant-display";

test("sub-tenant UI uses the primary site name", () => {
  const name = getTenantDisplayName(
    {
      name: "Tenant row name",
      isMainTenant: false,
      sites: [{ name: "City News", isPrimary: true, isActive: true }],
    },
    "Sub-tenant",
  );

  assert.equal(name, "City News");
});

test("main tenant is never shown as the sub-tenant brand", () => {
  const name = getTenantDisplayName(
    {
      name: "Pulse News",
      isMainTenant: true,
      sites: [{ name: "Pulse News", isPrimary: true, isActive: true }],
    },
    "Sub-tenant",
  );

  assert.equal(name, "Sub-tenant");
});

test("sub-tenant logo comes from the primary site", () => {
  const logoUrl = getTenantLogoUrl({
    name: "Tenant row name",
    isMainTenant: false,
    sites: [
      {
        name: "City News",
        logoUrl: "/media/files/tenant-a/logo.jpg",
        isPrimary: true,
        isActive: true,
      },
    ],
  });

  assert.equal(logoUrl, "/media/files/tenant-a/logo.jpg");
});

test("main tenant does not expose a public site logo", () => {
  const logoUrl = getTenantLogoUrl({
    name: "Pulse News",
    isMainTenant: true,
    sites: [{ name: "Pulse News", logoUrl: "/media/files/main/logo.jpg", isPrimary: true }],
  });

  assert.equal(logoUrl, null);
});

test("settings logo is applied onto the primary site", () => {
  const tenant = withTenantLogoUrl(
    {
      name: "City News",
      isMainTenant: false,
      sites: [{ name: "City News", isPrimary: true, isActive: true }],
    },
    "/media/files/tenant-a/logo.png",
  );

  assert.equal(isSubTenantDisplay(tenant), true);
  assert.equal(getTenantLogoUrl(tenant), "/media/files/tenant-a/logo.png");
});
