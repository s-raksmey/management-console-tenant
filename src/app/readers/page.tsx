"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Loader2, UserRound } from "lucide-react";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import { Permission } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import { useAdminLocale } from "@/hooks/useAdminLocale";
import { shouldBypassImageOptimizer } from "@/lib/cms-media";

type Reader = { id: string; name: string; email: string; avatarUrl?: string | null; lastLoginAt: string; createdAt: string; commentCount: number };
const Q_READERS = `query Readers { tenantPublicReaders { id name email avatarUrl lastLoginAt createdAt commentCount } }`;

const readersCopy = {
  en: {
    accessDenied: "Access denied: Settings permission required.",
    eyebrow: "Audience",
    title: "Public Readers",
    description: "Google readers who signed in on this sub-tenant website. These are passwordless public accounts, separate from CMS users.",
    loading: "Loading readers...",
    empty: "No public readers have signed in yet.",
    comments: (count: number) => `${count} comment${count === 1 ? "" : "s"}`,
    lastLogin: "Last login",
  },
  km: {
    accessDenied: "គ្មានសិទ្ធិ៖ ត្រូវការសិទ្ធិការកំណត់។",
    eyebrow: "អ្នកអាន",
    title: "អ្នកអានសាធារណៈ",
    description: "អ្នកអាន Google ដែលបានចូលប្រើលើគេហទំព័រនេះ។ គណនីទាំងនេះជាគណនីសាធារណៈដែលមិនប្រើពាក្យសម្ងាត់ ហើយដាច់ដោយឡែកពីអ្នកប្រើ CMS។",
    loading: "កំពុងផ្ទុកអ្នកអាន...",
    empty: "មិនទាន់មានអ្នកអានសាធារណៈបានចូលប្រើទេ។",
    comments: (count: number) => `${count} មតិយោបល់`,
    lastLogin: "ចូលប្រើចុងក្រោយ",
  },
} as const;

export default function ReadersPage() {
  const { locale } = useAdminLocale();
  const copy = readersCopy[locale];
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canView = hasPermission(Permission.VIEW_SETTINGS);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (permissionsLoading || !canView) return;
    void getAuthenticatedGqlClient().request<{ tenantPublicReaders: Reader[] }>(Q_READERS).then((response) => setReaders(response.tenantPublicReaders ?? [])).finally(() => setLoading(false));
  }, [canView, permissionsLoading]);

  if (!permissionsLoading && !canView) return <div className="text-sm text-red-600">{copy.accessDenied}</div>;

  return <div className="space-y-5">
    <header className="border-b border-slate-200 pb-5"><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-blue-700"><UserRound className="h-4 w-4" />{copy.eyebrow}</div><h1 className="text-3xl font-bold text-slate-950">{copy.title}</h1><p className="mt-2 text-sm text-slate-600">{copy.description}</p></header>
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">{loading ? <div className="flex items-center justify-center py-16 text-sm text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />{copy.loading}</div> : readers.length === 0 ? <p className="py-16 text-center text-sm text-slate-500">{copy.empty}</p> : <div className="divide-y divide-slate-100">{readers.map((reader) => <div key={reader.id} className="flex flex-wrap items-center gap-3 p-4">{reader.avatarUrl ? <Image src={reader.avatarUrl} alt="" width={40} height={40} unoptimized={shouldBypassImageOptimizer(reader.avatarUrl)} className="h-10 w-10 rounded-full object-cover" /> : <UserRound className="h-10 w-10 rounded-full bg-slate-100 p-2 text-slate-500" />}<div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{reader.name}</p><p className="truncate text-xs text-slate-500">{reader.email}</p></div><Badge variant="outline">{copy.comments(reader.commentCount)}</Badge><div className="text-right text-xs text-slate-400"><p>{copy.lastLogin}</p><time>{new Date(reader.lastLoginAt).toLocaleString(locale === "km" ? "km-KH" : undefined)}</time></div></div>)}</div>}</section>
  </div>;
}
