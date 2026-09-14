"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthFetchHeaders } from "@/services/graphql-client";
import { resolveCmsMediaSrc } from "@/lib/cms-media";
import { useAdminLocale } from "@/hooks/useAdminLocale";

export type DeviceImageUploadProps = {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  accept?: string;
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  tags?: string[];
  extraHeaders?: Record<string, string>;
  label?: string;
  helpText?: string;
  previewAlt?: string;
  onBusyChange?: (busy: boolean) => void;
  includeSelectedTenant?: boolean;
};

export function DeviceImageUpload({
  value,
  onChange,
  disabled = false,
  accept = "image/*",
  folder = "images",
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 90,
  tags,
  extraHeaders,
  label,
  helpText,
  previewAlt,
  onBusyChange,
  includeSelectedTenant = true,
}: DeviceImageUploadProps) {
  const { locale } = useAdminLocale();
  const copy =
    locale === "km"
      ? {
          uploadImageOnly: "សូមផ្ទុកឯកសាររូបភាពពីឧបករណ៍។",
          uploadFailed: "ផ្ទុកឡើងមិនបាន",
          chooseFile: "ជ្រើសឯកសារ",
          replaceFile: "ជំនួស",
          remove: "លុប",
          uploading: "កំពុងផ្ទុកឡើង",
          defaultHelp: "ផ្ទុករូបភាពពីឧបករណ៍របស់អ្នក។ មិនអាចបិទភ្ជាប់តំណ http ឬ https។",
          defaultLabel: "រូបភាព",
        }
      : {
          uploadImageOnly: "Please choose an image file from this device.",
          uploadFailed: "Upload failed",
          chooseFile: "Choose file",
          replaceFile: "Replace",
          remove: "Remove",
          uploading: "Uploading",
          defaultHelp:
            "Upload an image from this device. HTTP and HTTPS links are not accepted.",
          defaultLabel: "Image",
        };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewSrc = value ? resolveCmsMediaSrc(value) : "";

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".ico")) {
      setUploadError(copy.uploadImageOnly);
      return;
    }

    setIsUploading(true);
    onBusyChange?.(true);
    setUploadError(null);

    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append(
        "options",
        JSON.stringify({
          folder,
          maxWidth,
          maxHeight,
          quality,
          tags: tags ?? [folder],
        }),
      );

      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: {
          ...getAuthFetchHeaders({ includeSelectedTenant }),
          ...extraHeaders,
        },
        body: payload,
      });
      const result = await response.json();

      if (!response.ok || !result.success || !result.file?.url) {
        throw new Error(result.message || copy.uploadFailed);
      }

      onChange(result.file.url);
    } catch (error) {
      setUploadError(
        locale === "en" && error instanceof Error ? error.message : copy.uploadFailed,
      );
    } finally {
      setIsUploading(false);
      onBusyChange?.(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex items-center gap-3">
          {previewSrc ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900">
              <img
                src={previewSrc}
                alt={previewAlt || label || copy.defaultLabel}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-900">
              <UploadCloud className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {label || copy.defaultLabel}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
              {helpText || copy.defaultHelp}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="sr-only"
              disabled={disabled || isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void handleFile(file);
              }}
            />
            {previewSrc ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || isUploading}
                className="bg-white dark:bg-slate-900"
                onClick={() => {
                  setUploadError(null);
                  onChange("");
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1">{copy.remove}</span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              className="shrink-0 bg-white whitespace-nowrap dark:bg-slate-900"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              <span className="ml-1.5">
                {isUploading
                  ? copy.uploading
                  : previewSrc
                    ? copy.replaceFile
                    : copy.chooseFile}
              </span>
            </Button>
          </div>
        </div>
      </div>
      {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}
    </div>
  );
}
