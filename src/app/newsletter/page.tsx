"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Mail, Send } from "lucide-react";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import { Permission } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Subscriber = {
  id: string;
  email: string;
  status: "PENDING" | "ACTIVE" | "UNSUBSCRIBED";
  verifiedAt?: string | null;
  createdAt: string;
};

type Delivery = {
  id: string;
  subject: string;
  body: string;
  recipientCount: number;
  createdAt: string;
};

const Q_NEWSLETTER_SUBSCRIBERS = `
  query NewsletterSubscribers($status: NewsletterSubscriberStatus) {
    newsletterSubscribers(status: $status) {
      id
      email
      status
      verifiedAt
      createdAt
    }
    newsletterDeliveries {
      id subject body recipientCount createdAt
    }
  }
`;

const M_SEND_NEWSLETTER_DIGEST = `
  mutation SendNewsletterDigest($input: NewsletterDigestInput!) {
    sendNewsletterDigest(input: $input) { id subject body recipientCount createdAt }
  }
`;

export default function NewsletterPage() {
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canView = hasPermission(Permission.VIEW_SETTINGS);
  const canSend = hasPermission(Permission.UPDATE_SETTINGS);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filter, setFilter] = useState<Subscriber["status"] | "ALL">("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [digest, setDigest] = useState({ subject: "", body: "" });

  const loadSubscribers = useCallback(async () => {
    if (permissionsLoading || !canView) return;
    setLoading(true);
    try {
      const response = await getAuthenticatedGqlClient().request<{
        newsletterSubscribers: Subscriber[];
        newsletterDeliveries: Delivery[];
      }>(Q_NEWSLETTER_SUBSCRIBERS, { status: filter === "ALL" ? null : filter });
      setSubscribers(response.newsletterSubscribers ?? []);
      setDeliveries(response.newsletterDeliveries ?? []);
    } finally {
      setLoading(false);
    }
  }, [canView, filter, permissionsLoading]);

  useEffect(() => {
    void loadSubscribers();
  }, [loadSubscribers]);

  const activeCount = useMemo(
    () => subscribers.filter((subscriber) => subscriber.status === "ACTIVE").length,
    [subscribers],
  );

  const exportCsv = () => {
    const rows = [["email", "status", "subscribed_at"], ...subscribers.map((subscriber) => [
      subscriber.email,
      subscriber.status,
      subscriber.createdAt,
    ])];
    const csv = rows.map((row) => row.map((value) => JSON.stringify(value)).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sendDigest = async () => {
    setSending(true);
    setMessage("");
    try {
      const response = await getAuthenticatedGqlClient().request<{
        sendNewsletterDigest: Delivery;
      }>(M_SEND_NEWSLETTER_DIGEST, { input: digest });
      setDeliveries((current) => [response.sendNewsletterDigest, ...current]);
      setDigest({ subject: "", body: "" });
      setMessage(`Digest processed for ${response.sendNewsletterDigest.recipientCount} active subscribers.`);
    } catch {
      setMessage("Unable to send the digest. Check the content and email settings.");
    } finally {
      setSending(false);
    }
  };

  if (!permissionsLoading && !canView) return <div className="text-sm text-red-600">Access denied: Settings permission required.</div>;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-blue-700"><Mail className="h-4 w-4" />Audience</div>
          <h1 className="text-3xl font-bold text-slate-950">Newsletter Subscribers</h1>
          <p className="mt-2 text-sm text-slate-600">Export active subscribers for your newsletter delivery workflow.</p>
        </div>
        <Button onClick={exportCsv} disabled={subscribers.length === 0}><Download className="h-4 w-4" />Export CSV</Button>
      </header>
      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div><p className="text-2xl font-bold text-slate-950">{activeCount}</p><p className="text-xs text-slate-500">Active in current view</p></div>
        <select value={filter} onChange={(event) => setFilter(event.target.value as Subscriber["status"] | "ALL")} className="ml-auto h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
          <option value="ACTIVE">Active</option><option value="PENDING">Pending confirmation</option><option value="UNSUBSCRIBED">Unsubscribed</option><option value="ALL">All statuses</option>
        </select>
      </section>
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3">
          <div><h2 className="font-semibold text-slate-950">Send Newsletter Digest</h2><p className="mt-1 text-sm text-slate-500">Sends to confirmed active subscribers and includes a token-based unsubscribe link.</p></div>
          <input value={digest.subject} onChange={(event) => setDigest({ ...digest, subject: event.target.value })} placeholder="Digest subject" className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
          <textarea rows={7} value={digest.body} onChange={(event) => setDigest({ ...digest, body: event.target.value })} placeholder="Digest content" className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
          <div className="flex flex-wrap items-center gap-3"><Button onClick={() => void sendDigest()} disabled={!canSend || sending || digest.subject.trim().length < 3 || digest.body.trim().length < 10}><Send className="h-4 w-4" />{sending ? "Sending..." : "Send Digest"}</Button>{message && <p className="text-sm text-slate-600">{message}</p>}</div>
        </div>
        <div><h2 className="font-semibold text-slate-950">Recent Sends</h2><div className="mt-3 space-y-2">{deliveries.length === 0 ? <p className="text-sm text-slate-500">No digests sent yet.</p> : deliveries.slice(0, 6).map((delivery) => <div key={delivery.id} className="rounded-md border border-slate-100 p-3"><p className="truncate text-sm font-medium text-slate-900">{delivery.subject}</p><p className="mt-1 text-xs text-slate-500">{delivery.recipientCount} recipients / {new Date(delivery.createdAt).toLocaleString()}</p></div>)}</div></div>
      </section>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? <div className="flex items-center justify-center py-16 text-sm text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading subscribers...</div> : subscribers.length === 0 ? <p className="py-16 text-center text-sm text-slate-500">No subscribers match this view.</p> : (
          <div className="divide-y divide-slate-100">{subscribers.map((subscriber) => (
            <div key={subscriber.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{subscriber.email}</p>
              <Badge variant={subscriber.status === "ACTIVE" ? "success" : subscriber.status === "PENDING" ? "warning" : "secondary"}>{subscriber.status}</Badge>
              <time className="text-xs text-slate-400">{new Date(subscriber.createdAt).toLocaleDateString()}</time>
            </div>
          ))}</div>
        )}
      </section>
    </div>
  );
}
