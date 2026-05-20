'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Save } from 'lucide-react';
import { Setting } from '@/services/settings.gql';
import { SettingInput } from './SettingInput';

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
    <Card className={`transition-all duration-200 ${hasChanges ? 'border-blue-300 bg-blue-50/40 shadow-sm' : 'border-slate-200 shadow-none'}`}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-950">
                {setting.label}
              </h3>
              {setting.isRequired && (
                <Badge variant="secondary" className="text-xs">
                  Required
                </Badge>
              )}
              {setting.isPublic && (
                <Badge variant="outline" className="bg-white text-xs">
                  Public
                </Badge>
              )}
            </div>
            {setting.description && (
              <p className="mt-1 text-sm leading-5 text-slate-600">
                {setting.description}
              </p>
            )}
          </div>

          <div className={`mt-0.5 rounded-full px-2.5 py-1 text-xs font-medium ${hasChanges ? 'bg-blue-100 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {hasChanges ? 'Unsaved' : 'Saved'}
          </div>
        </div>

        <SettingInput
          setting={setting}
          value={value}
          onChange={onChange}
          error={error}
          disabled={loading || isSaving || isResetting}
        />

        <div className="flex justify-end border-t border-slate-100 pt-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={loading || isSaving || isResetting || !hasChanges}
              className="h-8 bg-white px-3"
            >
              <RotateCcw className="mr-1.5 h-3 w-3" />
              Undo
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading || isSaving || isResetting || !hasChanges}
              className="h-8 px-3"
            >
              {isSaving ? (
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Save className="h-3 w-3" />
                  <span>Save</span>
                </div>
              )}
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
