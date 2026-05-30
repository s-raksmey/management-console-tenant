"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Share2 } from "lucide-react";
import { Article, ArticleSharePlatform, ArticleShareTarget } from "@/types/article";
import { useArticleMutations } from "@/hooks/useGraphQL";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type PlatformStatus = "idle" | "ready" | "opened" | "copied";

type SharePlatform = {
  id: ArticleSharePlatform;
  label: string;
  helper: string;
};

const STORAGE_KEY = "pulse-news-share-platforms";

const PLATFORMS: SharePlatform[] = [
  {
    id: "FACEBOOK",
    label: "Facebook",
    helper: "Open Facebook composer for the published link.",
  },
  {
    id: "X",
    label: "X / Twitter",
    helper: "Open a prepared post with the article link.",
  },
  {
    id: "LINKEDIN",
    label: "LinkedIn",
    helper: "Open LinkedIn share for professional pages.",
  },
  {
    id: "TELEGRAM",
    label: "Telegram",
    helper: "Send the article into Telegram channels or chats.",
  },
  {
    id: "WHATSAPP",
    label: "WhatsApp",
    helper: "Open WhatsApp with the caption ready.",
  },
  {
    id: "EMAIL",
    label: "Email",
    helper: "Open your default mail composer.",
  },
  {
    id: "YOUTUBE",
    label: "YouTube",
    helper: "Copy caption and open YouTube Studio.",
  },
];

interface ArticleShareDialogProps {
  article: Article | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicBaseUrl?: string | null;
}

function getInitialPlatforms() {
  if (typeof window === "undefined") {
    return new Set<ArticleSharePlatform>(["FACEBOOK", "X"]);
  }

  try {
    const saved = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || "[]",
    ) as ArticleSharePlatform[];
    const valid = saved.filter((platform) =>
      PLATFORMS.some((item) => item.id === platform),
    );

    return new Set<ArticleSharePlatform>(
      valid.length ? valid : ["FACEBOOK", "X"],
    );
  } catch {
    return new Set<ArticleSharePlatform>(["FACEBOOK", "X"]);
  }
}

function getPreviewArticleUrl(article: Article | null, publicBaseUrl?: string | null) {
  if (!article) return "";
  const base =
    publicBaseUrl?.trim() ||
    (typeof window !== "undefined" ? window.location.origin.replace(":3001", ":3000") : "");
  const category = article.category?.slug || "news";
  const topic = article.topic || "latest";

  return `${base.replace(/\/+$/, "")}/${category}/${topic}/${article.slug}`;
}

async function copyText(value: string) {
  if (!navigator.clipboard) return false;
  await navigator.clipboard.writeText(value);
  return true;
}

export function ArticleShareDialog({
  article,
  open,
  onOpenChange,
  publicBaseUrl,
}: ArticleShareDialogProps) {
  const { prepareArticleShare, loading } = useArticleMutations();
  const [selected, setSelected] = useState<Set<ArticleSharePlatform>>(getInitialPlatforms);
  const [message, setMessage] = useState("");
  const [targets, setTargets] = useState<ArticleShareTarget[]>([]);
  const [statuses, setStatuses] = useState<Partial<Record<ArticleSharePlatform, PlatformStatus>>>({});
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const previewUrl = useMemo(
    () => getPreviewArticleUrl(article, publicBaseUrl),
    [article, publicBaseUrl],
  );
  const canShare = article?.status === "PUBLISHED";
  const activeTargets = targets.filter((target) => selected.has(target.platform));
  const preparedMessage = targets[0]?.message || message;

  useEffect(() => {
    if (!open || !article) return;

    const nextMessage = `${article.title}\n\n${previewUrl}`;
    setMessage(nextMessage);
    setTargets([]);
    setError(null);
    setStatuses({});
    setCopied(false);
  }, [article, open, previewUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selected)));
  }, [selected]);

  const togglePlatform = (platform: ArticleSharePlatform) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const prepareTargets = async () => {
    if (!article || !canShare || selected.size === 0) return [];

    setError(null);
    const response = await prepareArticleShare({
      articleId: article.id,
      platforms: Array.from(selected),
      message,
    });

    const nextTargets = (response?.prepareArticleShare || []) as ArticleShareTarget[];
    if (!nextTargets.length) {
      setError("Unable to prepare sharing. Check the public website URL setting.");
      return [];
    }

    setTargets(nextTargets);
    setStatuses(
      nextTargets.reduce<Partial<Record<ArticleSharePlatform, PlatformStatus>>>(
        (acc, target) => ({ ...acc, [target.platform]: "ready" as PlatformStatus }),
        {},
      ),
    );
    setMessage(nextTargets[0].message);
    return nextTargets;
  };

  const handleCopy = async (value = preparedMessage) => {
    if (!value) return;
    const didCopy = await copyText(value);
    setCopied(didCopy);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const openTargets = async () => {
    const nextTargets = activeTargets.length ? activeTargets : await prepareTargets();
    if (!nextTargets.length) return;

    for (const target of nextTargets) {
      if (target.method === "COPY_AND_OPEN") {
        await copyText(target.message);
        setStatuses((current) => ({ ...current, [target.platform]: "copied" }));
      } else {
        setStatuses((current) => ({ ...current, [target.platform]: "opened" }));
      }

      window.open(target.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            Share published article
          </DialogTitle>
          <DialogDescription>
            Select platforms once, prepare the post text, then open all selected share composers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          {!canShare ? (
            <div className="rounded-lg border bg-amber-50 p-4 text-sm text-amber-800">
              This action is available only after the article is published.
            </div>
          ) : (
            <>
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="truncate text-sm font-semibold text-slate-950" title={article?.title}>
                  {article?.title}
                </p>
                <p className="mt-1 break-all text-xs text-slate-600">{previewUrl}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {PLATFORMS.map((platform) => {
                  const checked = selected.has(platform.id);
                  const status = statuses[platform.id];

                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        checked
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-950">{platform.label}</span>
                        {status && status !== "idle" ? (
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <CheckCircle2 className="h-3 w-3" />
                            {status}
                          </Badge>
                        ) : checked ? (
                          <Badge className="text-[10px]">Selected</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{platform.helper}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Caption
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleCopy()}>
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Textarea
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    setTargets([]);
                    setStatuses({});
                  }}
                  className="mt-3 min-h-28 resize-y"
                  placeholder="Write the caption to use with this article link..."
                />
                <p className="mt-2 text-xs text-slate-500">
                  Prepared by the server using the tenant public URL. True auto-posting will need
                  OAuth credentials for each platform.
                </p>
              </div>

              {targets.length > 0 && (
                <div className="rounded-xl border bg-slate-50 p-4 text-xs text-slate-600">
                  {targets.map((target) => (
                    <p key={target.platform} className="mb-2 last:mb-0">
                      <span className="font-semibold text-slate-800">{target.label}:</span>{" "}
                      {target.note}
                    </p>
                  ))}
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="border-t px-5 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={prepareTargets}
            disabled={!canShare || selected.size === 0 || loading}
          >
            Prepare
          </Button>
          <Button
            type="button"
            onClick={openTargets}
            disabled={!canShare || selected.size === 0 || loading}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Share selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
