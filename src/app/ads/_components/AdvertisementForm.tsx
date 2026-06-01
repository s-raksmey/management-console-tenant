"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Link2, Loader2, Save, UploadCloud, X } from "lucide-react";
import { getAuthenticatedGqlClient, getAuthFetchHeaders } from "@/services/graphql-client";
import { Advertisement, AdvertisementFormat, AdvertisementInput, AdvertisementPlacement, AdvertisementStatus, AdvertisementTargetScope, M_CREATE_ADVERTISEMENT, M_UPDATE_ADVERTISEMENT } from "@/services/ads.gql";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToastHelpers } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { Tenant, TenantService } from "@/services/tenant.gql";
import { Category, Q_CATEGORIES } from "@/services/category.gql";
import { Q_TOPICS, Topic } from "@/services/topic.gql";
import { Q_ARTICLES } from "@/services/article.gql";

const placements: AdvertisementPlacement[] = ["HOME_TOP", "HOME_SIDEBAR", "CATEGORY_TOP", "ARTICLE_INLINE", "ARTICLE_SIDEBAR", "FOOTER"];
const statuses: AdvertisementStatus[] = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"];
const formats: AdvertisementFormat[] = ["IMAGE", "TEXT", "HTML"];
const targetScopes: AdvertisementTargetScope[] = ["GLOBAL", "CATEGORY", "TOPIC", "ARTICLE"];
const emptyForm: AdvertisementInput = { name: "", placement: "HOME_TOP", format: "IMAGE", status: "DRAFT", imageUrl: "", targetUrl: "", headline: "", body: "", sponsorName: "", html: "", startAt: "", endAt: "", priority: 0, targetScope: "GLOBAL", categorySlug: "", topicSlug: "", articleId: "" };

function label(value: string) { return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function dateInput(value?: string | null) { return value ? new Date(value).toISOString().slice(0, 10) : ""; }
function toForm(ad?: Advertisement | null): AdvertisementInput { return ad ? { name: ad.name, placement: ad.placement, format: ad.format, status: ad.status, imageUrl: ad.imageUrl ?? "", targetUrl: ad.targetUrl ?? "", headline: ad.headline ?? "", body: ad.body ?? "", sponsorName: ad.sponsorName ?? "", html: ad.html ?? "", startAt: dateInput(ad.startAt), endAt: dateInput(ad.endAt), priority: ad.priority, targetScope: ad.targetScope ?? "GLOBAL", categorySlug: ad.categorySlug ?? "", topicSlug: ad.topicSlug ?? "", articleId: ad.articleId ?? "" } : emptyForm; }
function imageUrl(value?: string | null) { if (!value) return null; if (value.startsWith("/uploads/")) return value; try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString() : null; } catch { return null; } }
function clean(value?: string | null) { const next = value?.trim(); return next || null; }
function scopesForPlacement(placement: AdvertisementPlacement) {
  if (placement === "ARTICLE_INLINE" || placement === "ARTICLE_SIDEBAR") return targetScopes;
  if (placement === "CATEGORY_TOP") return targetScopes.filter((scope) => scope === "GLOBAL" || scope === "CATEGORY");
  return targetScopes.filter((scope) => scope === "GLOBAL");
}

export function AdvertisementForm({ advertisement, initialTenantId = "" }: { advertisement?: Advertisement | null; initialTenantId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToastHelpers();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [form, setForm] = useState<AdvertisementInput>(() => toForm(advertisement));
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState(initialTenantId || advertisement?.tenantId || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [articles, setArticles] = useState<Array<{ id: string; title: string; category?: { slug: string } | null; topic?: string | null }>>([]);
  const previewImage = imageUrl(form.imageUrl);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let mounted = true;
    void TenantService.listTenants().then((items) => {
      if (!mounted) return;
      const active = items.filter((tenant) => tenant.status === "ACTIVE");
      setTenants(active);
      setSelectedTenantId((current) => current || active[0]?.id || "");
    }).catch(() => showError("Error", "Failed to load tenant options."));
    return () => { mounted = false; };
  }, [isSuperAdmin, showError]);

  useEffect(() => {
    const loadTargetingOptions = async () => {
      if (isSuperAdmin && !selectedTenantId) return;
      try {
        const client = getAuthenticatedGqlClient();
        if (isSuperAdmin && selectedTenantId) client.setHeader("x-tenant-id", selectedTenantId);
        const [categoryResult, topicResult, articleResult] = await Promise.all([
          client.request<{ categories: Category[] }>(Q_CATEGORIES),
          client.request<{ topics: Topic[] }>(Q_TOPICS),
          client.request<{ articles: Array<{ id: string; title: string; category?: { slug: string } | null; topic?: string | null }> }>(Q_ARTICLES, { take: 200, skip: 0 }),
        ]);
        setCategories(categoryResult.categories ?? []);
        setTopics(topicResult.topics ?? []);
        setArticles(articleResult.articles ?? []);
      } catch {
        showError("Error", "Failed to load targeting options.");
      }
    };
    void loadTargetingOptions();
  }, [isSuperAdmin, selectedTenantId, showError]);

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return showError("Upload Error", "Please select an image file.");
    setUploading(true);
    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("options", JSON.stringify({ folder: "ads", maxWidth: 1920, maxHeight: 1080, quality: 90 }));
      const response = await fetch("/api/media/upload", { method: "POST", headers: { ...getAuthFetchHeaders(), ...(isSuperAdmin && selectedTenantId ? { "x-tenant-id": selectedTenantId } : {}) }, body: payload });
      const data = await response.json();
      if (!response.ok || !data.success || !data.file?.url) throw new Error(data.message || "Upload failed");
      setForm((current) => ({ ...current, imageUrl: data.file.url }));
      showSuccess("Image Uploaded", "Advertisement image is ready.");
    } catch (error) {
      showError("Upload Error", error instanceof Error ? error.message : "Failed to upload image.");
    } finally { setUploading(false); }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return showError("Validation Error", "Internal name is required.");
    if (isSuperAdmin && !selectedTenantId) return showError("Validation Error", "Select a tenant website.");
    if (form.status === "ACTIVE" && form.format !== "HTML" && !form.targetUrl?.trim()) return showError("Target URL Required", "Add a destination URL before publishing this ad.");
    setSaving(true);
    try {
      const client = getAuthenticatedGqlClient();
      if (isSuperAdmin && selectedTenantId) client.setHeader("x-tenant-id", selectedTenantId);
      const input = { ...form, imageUrl: clean(form.imageUrl), targetUrl: clean(form.targetUrl), headline: clean(form.headline), body: clean(form.body), sponsorName: clean(form.sponsorName), html: clean(form.html), startAt: clean(form.startAt), endAt: clean(form.endAt), priority: Number(form.priority ?? 0), categorySlug: form.targetScope === "CATEGORY" || form.targetScope === "TOPIC" ? clean(form.categorySlug) : null, topicSlug: form.targetScope === "TOPIC" ? clean(form.topicSlug) : null, articleId: form.targetScope === "ARTICLE" ? clean(form.articleId) : null };
      if (advertisement) await client.request(M_UPDATE_ADVERTISEMENT, { id: advertisement.id, input });
      else await client.request(M_CREATE_ADVERTISEMENT, { input });
      showSuccess("Saved", advertisement ? "Advertisement updated." : "Advertisement created.");
      router.push("/ads");
      router.refresh();
    } catch (error: any) {
      showError("Error", error?.response?.errors?.[0]?.message || "Failed to save advertisement.");
    } finally { setSaving(false); }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card><CardHeader><CardTitle>{advertisement ? "Edit Advertisement" : "Create Advertisement"}</CardTitle><CardDescription>Manage creative, destination, placement, and delivery schedule.</CardDescription></CardHeader><CardContent>
        <form className="space-y-6" onSubmit={submit}>
          {isSuperAdmin && <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4"><Label htmlFor="tenant">Tenant Website</Label><select id="tenant" value={selectedTenantId} disabled={!!advertisement} onChange={(event) => setSelectedTenantId(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm disabled:opacity-60"><option value="">Select tenant</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name} /{tenant.slug}</option>)}</select></div>}
          <section className="space-y-4"><p className="text-xs font-semibold uppercase text-slate-500">Campaign Setup</p><div className="space-y-2"><Label htmlFor="name">Internal name</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="placement">Placement</Label><select id="placement" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value as AdvertisementPlacement, targetScope: "GLOBAL", categorySlug: "", topicSlug: "", articleId: "" })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{placements.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></div><div className="space-y-2"><Label htmlFor="priority">Priority</Label><Input id="priority" type="number" min={0} value={form.priority ?? 0} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} /></div></div><div className="space-y-2"><Label>Creative format</Label><div className="grid grid-cols-3 rounded-md border border-slate-200 bg-slate-50 p-1">{formats.map((value) => <button key={value} type="button" onClick={() => setForm({ ...form, format: value })} className={`rounded px-2 py-2 text-xs font-medium ${form.format === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>{label(value)}</button>)}</div></div><div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="space-y-2"><Label htmlFor="target-scope">Page targeting</Label><select id="target-scope" value={form.targetScope ?? "GLOBAL"} onChange={(e) => setForm({ ...form, targetScope: e.target.value as AdvertisementTargetScope, categorySlug: "", topicSlug: "", articleId: "" })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{scopesForPlacement(form.placement).map((value) => <option key={value} value={value}>{value === "GLOBAL" ? "All matching pages" : value === "CATEGORY" ? "Specific category" : value === "TOPIC" ? "Specific sub-category" : "Specific article"}</option>)}</select></div>{(form.targetScope === "CATEGORY" || form.targetScope === "TOPIC") && <div className="space-y-2"><Label htmlFor="target-category">Category</Label><select id="target-category" value={form.categorySlug ?? ""} onChange={(e) => setForm({ ...form, categorySlug: e.target.value, topicSlug: "" })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></div>}{form.targetScope === "TOPIC" && <div className="space-y-2"><Label htmlFor="target-topic">Sub-category</Label><select id="target-topic" value={form.topicSlug ?? ""} onChange={(e) => setForm({ ...form, topicSlug: e.target.value })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">Select sub-category</option>{topics.filter((topic) => topic.category.slug === form.categorySlug).map((topic) => <option key={topic.id} value={topic.slug}>{topic.title}</option>)}</select></div>}{form.targetScope === "ARTICLE" && <div className="space-y-2"><Label htmlFor="target-article">Article</Label><select id="target-article" value={form.articleId ?? ""} onChange={(e) => setForm({ ...form, articleId: e.target.value })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">Select article</option>{articles.map((article) => <option key={article.id} value={article.id}>{article.title}</option>)}</select></div>}<p className="text-xs text-slate-500">More specific ads override broader fallback ads in the same placement.</p></div></section>
          <section className="space-y-4 border-t border-slate-200 pt-5"><p className="text-xs font-semibold uppercase text-slate-500">Creative</p>{form.format !== "HTML" && <><div className="space-y-2"><Label htmlFor="image">Image URL</Label><div className="flex gap-2"><Input id="image" value={form.imageUrl ?? ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/uploads/ads/image.jpg" /><Button type="button" variant="outline" disabled={uploading} asChild><label className="cursor-pointer">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}Upload<input type="file" accept="image/*" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void uploadImage(file); }} /></label></Button></div></div><div className="space-y-2"><Label htmlFor="headline">Public headline</Label><Input id="headline" value={form.headline ?? ""} onChange={(e) => setForm({ ...form, headline: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="body">Description</Label><Textarea id="body" value={form.body ?? ""} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} /></div><div className="space-y-2"><Label htmlFor="sponsor">Sponsor name</Label><Input id="sponsor" value={form.sponsorName ?? ""} onChange={(e) => setForm({ ...form, sponsorName: e.target.value })} /></div></>}{form.format === "HTML" && <div className="space-y-2"><Label htmlFor="html">Trusted HTML</Label><Textarea id="html" value={form.html ?? ""} onChange={(e) => setForm({ ...form, html: e.target.value })} rows={8} className="font-mono text-xs" /></div>}<div className="space-y-2"><Label htmlFor="target">Destination URL</Label><div className="relative"><Link2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input id="target" value={form.targetUrl ?? ""} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} placeholder="https://sponsor.example" className="pl-9" /></div></div></section>
          <section className="space-y-4 border-t border-slate-200 pt-5"><p className="text-xs font-semibold uppercase text-slate-500">Delivery</p><div className="space-y-2"><Label>Publishing status</Label><div className="grid grid-cols-4 rounded-md border border-slate-200 bg-slate-50 p-1">{statuses.map((value) => <button key={value} type="button" onClick={() => setForm({ ...form, status: value })} className={`rounded px-1 py-2 text-xs font-medium ${form.status === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>{label(value)}</button>)}</div></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="start">Starts</Label><Input id="start" type="date" value={form.startAt ?? ""} onChange={(e) => setForm({ ...form, startAt: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="end">Ends</Label><Input id="end" type="date" value={form.endAt ?? ""} onChange={(e) => setForm({ ...form, endAt: e.target.value })} /></div></div></section>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-5"><Button type="button" variant="outline" onClick={() => router.push("/ads")}><X className="h-4 w-4" />Cancel</Button><Button type="submit" disabled={saving || uploading}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{advertisement ? "Update Advertisement" : "Create Advertisement"}</Button></div>
        </form>
      </CardContent></Card>
      <aside><Card><CardHeader><CardTitle>Preview</CardTitle><CardDescription>Public creative preview.</CardDescription></CardHeader><CardContent><div className="overflow-hidden rounded-md border border-slate-200 bg-slate-100">{previewImage ? <img src={previewImage} alt={form.headline || form.name} className="aspect-[16/9] w-full object-cover" /> : <div className="flex aspect-[16/9] items-center justify-center"><ImageIcon className="h-9 w-9 text-slate-400" /></div>}<div className="bg-white p-4"><p className="text-xs font-semibold uppercase text-blue-700">{form.sponsorName || "Sponsored"}</p><h3 className="mt-2 font-semibold text-slate-950">{form.headline || "Public headline"}</h3><p className="mt-1 text-sm text-slate-600">{form.body || "Supporting message for this advertisement."}</p></div></div></CardContent></Card></aside>
    </div>
  );
}
