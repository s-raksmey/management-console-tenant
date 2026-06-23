'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, RotateCcw, Save } from 'lucide-react';
import { Setting } from '@/services/settings.gql';
import { SettingInput } from './SettingInput';
import { useAdminLocale } from '@/hooks/useAdminLocale';

interface SettingCardProps {
  setting: Setting;
  value: any;
  onChange: (value: any) => void;
  onSave: () => Promise<void>;
  onReset: () => Promise<void>;
  error?: string;
  loading?: boolean;
  hasChanges?: boolean;
}

export function SettingCard({
  setting,
  value,
  onChange,
  onSave,
  onReset,
  error,
  loading = false,
  hasChanges = false
}: SettingCardProps) {
  const { locale } = useAdminLocale();
  const copy = locale === 'km'
    ? {
        required: 'Required',
        public: 'Public',
        needsAttention: 'ត្រូវពិនិត្យ',
        unsavedChanges: 'មិនទាន់រក្សាទុក',
        saved: 'បានរក្សាទុក',
        undo: 'Undo',
        saving: 'កំពុងរក្សាទុក',
        save: 'រក្សាទុក',
      }
    : {
        required: 'Required',
        public: 'Public',
        needsAttention: 'Needs attention',
        unsavedChanges: 'Unsaved changes',
        saved: 'Saved',
        undo: 'Undo',
        saving: 'Saving',
        save: 'Save',
      };
  const [isSaving, setIsSaving] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onReset();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <section
      className={`rounded-md border bg-white p-4 transition-colors sm:p-5 ${
        error
          ? 'border-red-200 bg-red-50/30'
          : hasChanges
            ? 'border-sky-300 bg-sky-50/40'
            : 'border-slate-200'
      }`}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(220px,330px)_minmax(0,1fr)] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-950">
              {setting.label}
            </h3>
            {setting.isRequired && (
              <Badge variant="secondary" className="text-[11px]">
                {copy.required}
              </Badge>
            )}
            {setting.isPublic && (
              <Badge variant="outline" className="bg-white text-[11px]">
                {copy.public}
              </Badge>
            )}
          </div>
          {setting.description && (
            <p className="mt-1 text-sm leading-5 text-slate-600">
              {setting.description}
            </p>
          )}
          <p className="mt-2 break-all font-mono text-[11px] text-slate-400">{setting.key}</p>
        </div>

        <div className="min-w-0 space-y-3">
          <SettingInput
            setting={setting}
            value={value}
            onChange={onChange}
            error={error}
            disabled={loading || isSaving || isResetting}
          />

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className={`flex items-center gap-2 text-xs font-medium ${
                error ? 'text-red-700' : hasChanges ? 'text-sky-700' : 'text-emerald-700'
              }`}
            >
              {error ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : hasChanges ? (
                <span className="h-2 w-2 rounded-full bg-sky-500" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {error ? copy.needsAttention : hasChanges ? copy.unsavedChanges : copy.saved}
            </div>

            <div className="flex items-center gap-2 sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={loading || isSaving || isResetting || !hasChanges}
                className="h-8 bg-white px-3"
              >
                <RotateCcw className="mr-1.5 h-3 w-3" />
                {copy.undo}
              </Button>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={loading || isSaving || isResetting || !hasChanges}
                className="h-8 px-3"
              >
                {isSaving ? (
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{copy.saving}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Save className="h-3 w-3" />
                    <span>{copy.save}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
