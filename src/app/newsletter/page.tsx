"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Mail, Send } from "lucide-react";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import { Permission } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminLocale } from "@/hooks/useAdminLocale";

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

const M_RESEND_NEWSLETTER_VERIFICATION = `
  mutation ResendNewsletterVerification($email: String!) {
    resendNewsletterVerification(email: $email) { success message }
  }
`;

const newsletterCopy = {
  en: {
    sendSuccess: (count: number) => `Digest processed for ${count} active subscribers.`,
    sendFailed: "Unable to send the digest. Check the content and email settings.",
    accessDenied: "Access denied: Settings permission required.",
    audience: "Audience",
    title: "Newsletter Subscribers",
    description: "Export active subscribers for your newsletter delivery workflow.",
    exportCsv: "Export CSV",
    activeCurrentView: "Active in current view",
    statuses: {
      ACTIVE: "Active",
      PENDING: "Pending confirmation",
      UNSUBSCRIBED: "Unsubscribed",
      ALL: "All statuses",
    },
    sendDigestTitle: "Send Newsletter Digest",
    sendDigestDescription: "Sends to confirmed active subscribers and includes a token-based unsubscribe link.",
    subjectPlaceholder: "Digest subject",
    bodyPlaceholder: "Digest content",
    sending: "Sending...",
    sendDigest: "Send Digest",
    recentSends: "Recent Sends",
    noDigests: "No digests sent yet.",
    recipients: (count: number) => `${count} recipients`,
    loadingSubscribers: "Loading subscribers...",
    emptySubscribers: "No subscribers match this view.",
    resend: "Resend confirmation",
    resending: "Resending...",
    resendFailed: "Unable to resend the confirmation email.",
  },
  km: {
    sendSuccess: (count: number) => `បានដំណើរការសង្ខេបសម្រាប់អ្នកជាវសកម្ម ${count} នាក់។`,
    sendFailed: "មិនអាចផ្ញើសង្ខេបបានទេ។ សូមពិនិត្យមាតិកា និងការកំណត់អ៊ីមែល។",
    accessDenied: "គ្មានសិទ្ធិ៖ ត្រូវការសិទ្ធិការកំណត់។",
    audience: "អ្នកអាន",
    title: "អ្នកជាវព្រឹត្តិបត្រ",
    description: "នាំចេញអ្នកជាវសកម្មសម្រាប់ដំណើរការផ្ញើព្រឹត្តិបត្រ។",
    exportCsv: "នាំចេញ CSV",
    activeCurrentView: "សកម្មក្នុងទិដ្ឋភាពនេះ",
    statuses: {
      ACTIVE: "សកម្ម",
      PENDING: "រង់ចាំបញ្ជាក់",
      UNSUBSCRIBED: "បានឈប់ជាវ",
      ALL: "ស្ថានភាពទាំងអស់",
    },
    sendDigestTitle: "ផ្ញើសង្ខេបព្រឹត្តិបត្រ",
    sendDigestDescription: "ផ្ញើទៅអ្នកជាវសកម្មដែលបានបញ្ជាក់ និងភ្ជាប់តំណឈប់ជាវដែលមាន token។",
    subjectPlaceholder: "ចំណងជើងសង្ខេប",
    bodyPlaceholder: "មាតិកាសង្ខេប",
    sending: "កំពុងផ្ញើ...",
    sendDigest: "ផ្ញើសង្ខេប",
    recentSends: "ការផ្ញើថ្មីៗ",
    noDigests: "មិនទាន់មានសង្ខេបដែលបានផ្ញើទេ។",
    recipients: (count: number) => `${count} អ្នកទទួល`,
    loadingSubscribers: "កំពុងផ្ទុកអ្នកជាវ...",
    emptySubscribers: "គ្មានអ្នកជាវត្រូវនឹងទិដ្ឋភាពនេះទេ។",
    resend: "Resend confirmation",
    resending: "Resending...",
    resendFailed: "Unable to resend the confirmation email.",
  },
} as const;

export default function NewsletterPage() {
  const { locale } = useAdminLocale();
  const copy = newsletterCopy[locale];
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
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

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
      setMessage(copy.sendSuccess(response.sendNewsletterDigest.recipientCount));
    } catch {
      setMessage(copy.sendFailed);
    } finally {
      setSending(false);
    }
  };

  const resendVerification = async (email: string) => {
    setResendingEmail(email);
    setMessage("");
    try {
      const response = await getAuthenticatedGqlClient().request<{
        resendNewsletterVerification: { success: boolean; message: string };
      }>(M_RESEND_NEWSLETTER_VERIFICATION, { email });
      setMessage(response.resendNewsletterVerification.message);
    } catch {
      setMessage(copy.resendFailed);
    } finally {
      setResendingEmail(null);
    }
  };

  if (!permissionsLoading && !canView) return <div className="text-sm text-red-600">{copy.accessDenied}</div>;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-blue-700"><Mail className="h-4 w-4" />{copy.audience}</div>
          <h1 className="text-3xl font-bold text-slate-950">{copy.title}</h1>
          <p className="mt-2 text-sm text-slate-600">{copy.description}</p>
        </div>
        <Button onClick={exportCsv} disabled={subscribers.length === 0}><Download className="h-4 w-4" />{copy.exportCsv}</Button>
      </header>
      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div><p className="text-2xl font-bold text-slate-950">{activeCount}</p><p className="text-xs text-slate-500">{copy.activeCurrentView}</p></div>
        <select value={filter} onChange={(event) => setFilter(event.target.value as Subscriber["status"] | "ALL")} className="ml-auto h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
          <option value="ACTIVE">{copy.statuses.ACTIVE}</option><option value="PENDING">{copy.statuses.PENDING}</option><option value="UNSUBSCRIBED">{copy.statuses.UNSUBSCRIBED}</option><option value="ALL">{copy.statuses.ALL}</option>
        </select>
      </section>
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3">
          <div><h2 className="font-semibold text-slate-950">{copy.sendDigestTitle}</h2><p className="mt-1 text-sm text-slate-500">{copy.sendDigestDescription}</p></div>
          <input value={digest.subject} onChange={(event) => setDigest({ ...digest, subject: event.target.value })} placeholder={copy.subjectPlaceholder} className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
          <textarea rows={7} value={digest.body} onChange={(event) => setDigest({ ...digest, body: event.target.value })} placeholder={copy.bodyPlaceholder} className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
          <div className="flex flex-wrap items-center gap-3"><Button onClick={() => void sendDigest()} disabled={!canSend || sending || digest.subject.trim().length < 3 || digest.body.trim().length < 10}><Send className="h-4 w-4" />{sending ? copy.sending : copy.sendDigest}</Button>{message && <p className="text-sm text-slate-600">{message}</p>}</div>
        </div>
        <div><h2 className="font-semibold text-slate-950">{copy.recentSends}</h2><div className="mt-3 space-y-2">{deliveries.length === 0 ? <p className="text-sm text-slate-500">{copy.noDigests}</p> : deliveries.slice(0, 6).map((delivery) => <div key={delivery.id} className="rounded-md border border-slate-100 p-3"><p className="truncate text-sm font-medium text-slate-900">{delivery.subject}</p><p className="mt-1 text-xs text-slate-500">{copy.recipients(delivery.recipientCount)} / {new Date(delivery.createdAt).toLocaleString(locale === "km" ? "km-KH" : undefined)}</p></div>)}</div></div>
      </section>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? <div className="flex items-center justify-center py-16 text-sm text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />{copy.loadingSubscribers}</div> : subscribers.length === 0 ? <p className="py-16 text-center text-sm text-slate-500">{copy.emptySubscribers}</p> : (
          <div className="divide-y divide-slate-100">{subscribers.map((subscriber) => (
            <div key={subscriber.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{subscriber.email}</p>
              <Badge variant={subscriber.status === "ACTIVE" ? "success" : subscriber.status === "PENDING" ? "warning" : "secondary"}>{copy.statuses[subscriber.status]}</Badge>
              {subscriber.status === "PENDING" && canSend ? (
                <Button type="button" variant="outline" size="sm" disabled={resendingEmail === subscriber.email} onClick={() => void resendVerification(subscriber.email)}>
                  {resendingEmail === subscriber.email ? copy.resending : copy.resend}
                </Button>
              ) : null}
              <time className="text-xs text-slate-400">{new Date(subscriber.createdAt).toLocaleDateString(locale === "km" ? "km-KH" : undefined)}</time>
            </div>
          ))}</div>
        )}
      </section>
    </div>
  );
}
