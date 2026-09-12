import assert from "node:assert/strict";
import { test } from "node:test";
import { getForwardedTenantHeaders } from "../src/lib/tenant-request-headers.ts";

test("an explicit tenant id wins over the incoming host", () => {
  const headers = getForwardedTenantHeaders(
    new Request("http://cms.example.com/api/media/upload", {
      headers: {
        "x-tenant-id": " tenant-a ",
        host: "cms.example.com",
      },
    })
  );

  assert.deepEqual(headers, { "x-tenant-id": "tenant-a" });
});

test("host-only requests forward a lowercase tenant host", () => {
  const headers = getForwardedTenantHeaders(
    new Request("http://CMS.News.Example.com/api/media/upload", {
      headers: { host: "CMS.News.Example.com" },
    })
  );

  assert.deepEqual(headers, { "x-tenant-host": "cms.news.example.com" });
});
