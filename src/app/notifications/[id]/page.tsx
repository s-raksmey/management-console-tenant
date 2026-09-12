"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Bell, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications, type NotificationRecord } from "@/hooks/useNotifications";

function relatedTarget(notification: NotificationRecord) {
  if (notification.articleId) return `/articles/${notification.articleId}/edit`;
  if (notification.type === "SUBMISSION") return "/review";
  if (notification.type === "ACCOUNT_REQUEST") return "/users/requests";
  if (notification.type === "SYSTEM_ALERT") return "/settings";
  if (notification.type === "SECURITY_ALERT") return "/audit";

  if (notification.type === "USER_ACTIVITY") {
    const metadata = notification.metadata as Record<string, unknown> | null;
    const explicitId = metadata?.targetUserId ||
      (metadata?.resourceType === "User" ? metadata.resourceId : undefined);
    const legacyId = notification.message?.match(/\bTarget:\s*([a-zA-Z0-9_-]+)/)?.[1];
    const userId = typeof explicitId === "string" && explicitId ? explicitId : legacyId;
    return userId ? `/users/${encodeURIComponent(userId)}/edit` : "/audit";
  }

  return null;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default function NotificationDetailPage() {
  const params = useParams<{ id: string }>();
  const { getNotificationById, markNotificationRead } = useNotifications();
  const [notification, setNotification] = useState<NotificationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    void getNotificationById(params.id).then((result) => {
      if (!active) return;
      const item = result?.notificationById ?? null;
      setNotification(item);
      setNotFound(!item);
      setIsLoading(false);
      if (item && !item.isRead) void markNotificationRead(item.id);
    });
    return () => { active = false; };
  }, [getNotificationById, markNotificationRead, params.id]);

  const target = useMemo(() => notification ? relatedTarget(notification) : null, [notification]);

  if (isLoading) return <main className="p-6 text-slate-500">Loading notification…</main>;
  if (notFound || !notification) {
    return <main className="p-6"><Card><CardContent className="p-8 text-center">Notification not found or you do not have access to it.</CardContent></Card></main>;
  }

  const metadata = notification.metadata && typeof notification.metadata === "object"
    ? Object.entries(notification.metadata)
    : [];

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <Button variant="ghost" asChild className="mb-4"><Link href="/"><ArrowLeft />Back</Link></Button>
      <Card>
        <CardHeader className="border-b">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700"><Bell /></div>
          <CardTitle className="text-2xl">{notification.title}</CardTitle>
          <CardDescription>{new Date(notification.createdAt).toLocaleString()} · {notification.type.replaceAll("_", " ")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {notification.message && <p className="whitespace-pre-wrap text-base leading-7 text-slate-700 dark:text-slate-200">{notification.message}</p>}
          {notification.fromUser && (
            <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</p><p className="mt-1">{notification.fromUser.name || notification.fromUser.email}</p></div>
          )}
          {metadata.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Details</h2>
              <dl className="divide-y rounded-lg border">
                {metadata.map(([key, value]) => (
                  <div key={key} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr]">
                    <dt className="text-sm font-medium text-slate-500">{key.replace(/([A-Z])/g, " $1")}</dt>
                    <dd className="whitespace-pre-wrap break-all text-sm">{displayValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {target && <Button asChild><Link href={target}>Open related item <ExternalLink /></Link></Button>}
        </CardContent>
      </Card>
    </main>
  );
}
