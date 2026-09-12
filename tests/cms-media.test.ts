import assert from "node:assert/strict";
import { test } from "node:test";
import { getApiOrigin, resolveCmsMediaSrc } from "../src/lib/cms-media.ts";

test("API origin strips a GraphQL suffix", () => {
  const previous = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com/graphql";
  assert.equal(getApiOrigin(), "https://api.example.com");
  process.env.NEXT_PUBLIC_API_URL = previous;
});

test("CMS media previews keep relative upload paths and prefix tenant files", () => {
  const previous = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000/graphql";
  assert.equal(resolveCmsMediaSrc("/uploads/hero.jpg"), "/uploads/hero.jpg");
  assert.equal(
    resolveCmsMediaSrc("/media/files/tenant-a/hero.jpg"),
    "http://localhost:4000/media/files/tenant-a/hero.jpg"
  );
  assert.equal(
    resolveCmsMediaSrc("http:/media/files/tenant-a/hero.jpg"),
    "http://localhost:4000/media/files/tenant-a/hero.jpg"
  );
  process.env.NEXT_PUBLIC_API_URL = previous;
});
