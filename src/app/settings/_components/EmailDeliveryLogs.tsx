"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import {
  EmailDeliveryLog,
  M_RETRY_EMAIL_DELIVERY,
  Q_EMAIL_DELIVERY_LOGS,
} from "@/services/settings.gql";
import { useAdminLocale } from "@/hooks/useAdminLocale";

const copy = {
  en: {
    title: "Recent email deliveries",
    description: "Failed and skipped messages can be retried after SMTP is fixed.",
    empty: "No email attempts have been logged yet.",
    loadFailed: "Unable to load email delivery logs.",
    retryFailed: "Unable to retry this email.",
    retry: "Retry",
    retrying: "Retrying...",
    refresh: "Refresh",
    attempts: (count: number) => `${count} attempt${count === 1 ? "" : "s"}`,
    statuses: {
      SENT: "Sent",
      FAILED: "Failed",
      SKIPPED: "Skipped",
    },
  },
  km: {
    title: "Recent email deliveries",
    description: "Failed and skipped messages can be retried after SMTP is fixed.",
    empty: "No email attempts have been logged yet.",
    loadFailed: "Unable to load email delivery logs.",
    retryFailed: "Unable to retry this email.",
    retry: "Retry",
    retrying: "Retrying...",
    refresh: "Refresh",
    attempts: (count: number) => `${count} attempt${count === 1 ? "" : "s"}`,
    statuses: {
      SENT: "Sent",
      FAILED: "Failed",
      SKIPPED: "Skipped",
    },
  },
} as const;

export function EmailDeliveryLogs({ canRetry }: { canRetry: boolean }) {
  const { locale } = useAdminLocale();
  const labels = copy[locale];
  const [logs, setLogs] = useState<EmailDeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await getAuthenticatedGqlClient().request<{
        emailDeliveryLogs: EmailDeliveryLog[];
      }>(Q_EMAIL_DELIVERY_LOGS, { take: 12 });
      setLogs(response.emailDeliveryLogs ?? []);
    } catch {
      setMessage(labels.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [labels.loadFailed]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const retryLog = async (id: string) => {
    setRetryingId(id);
    setMessage("");
    try {
      const response = await getAuthenticatedGqlClient().request<{
        retryEmailDelivery: EmailDeliveryLog;
      }>(M_RETRY_EMAIL_DELIVERY, { id });
      setLogs((current) =>
        current.map((log) => (log.id === id ? response.retryEmailDelivery : log))
      );
    } catch {
      setMessage(labels.retryFailed);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-slate-950">{labels.title}</h4>
          <p className="mt-1 text-sm text-slate-600">{labels.description}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void loadLogs()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {labels.refresh}
        </Button>
      </div>
      {message ? <p className="mb-3 text-sm text-red-600">{message}</p> : null}
      {loading ? (
        <p className="flex items-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        </p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-slate-500">{labels.empty}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{log.subject}</p>
                <p className="truncate text-xs text-slate-500">
                  {log.to} · {log.purpose} · {labels.attempts(log.attemptCount)}
                </p>
                {log.errorMessage ? (
                  <p className="mt-1 line-clamp-2 text-xs text-red-600">{log.errorMessage}</p>
                ) : null}
              </div>
              <Badge
                variant={
                  log.status === "SENT" ? "success" : log.status === "FAILED" ? "destructive" : "secondary"
                }
              >
                {labels.statuses[log.status]}
              </Badge>
              {canRetry && log.status !== "SENT" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={retryingId === log.id || log.attemptCount >= 5}
                  onClick={() => void retryLog(log.id)}
                >
                  {retryingId === log.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  {retryingId === log.id ? labels.retrying : labels.retry}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
