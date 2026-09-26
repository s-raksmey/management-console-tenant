'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { Setting, SettingType, SETTING_CATEGORIES, getSettingsByType } from '@/services/settings.gql';
import { presentSetting } from '@/lib/setting-display';
import { UpdateSettingInput } from '@/types/settings';
import type { JsonValue } from '@/types/json';
import { SettingCard } from './SettingCard';
import { useAdminLocale } from '@/hooks/useAdminLocale';

interface SettingsCategoryProps {
  category: SettingType;
  settings: Setting[];
  onUpdateSetting: (input: UpdateSettingInput) => Promise<void>;
  onResetSetting: (key: string) => Promise<void>;
  loading?: boolean;
  showPublicBadge?: boolean;
  readOnly?: boolean;
}

function getSaveErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { errors?: Array<{ message?: string }> } }).response;
    const message = response?.errors?.[0]?.message;

    if (message) return message;
  }

  return error instanceof Error ? error.message : fallback;
}

const settingsCategoryCopy = {
  en: {
    saveFailed: 'Failed to save setting',
    noSettingsFound: 'No Settings Found',
    noSettingsDescription: (category: string) => `No settings are available for the ${category} category.`,
    unsavedChanges: (count: number) => `${count} unsaved change${count !== 1 ? 's' : ''}`,
    errors: (count: number) => `${count} error${count !== 1 ? 's' : ''}`,
    reviewSection: 'Review this section before moving on.',
    discard: 'Discard',
    saveAll: 'Save All',
  },
  km: {
    saveFailed: 'មិនអាចរក្សាទុកការកំណត់បានទេ',
    noSettingsFound: 'រកមិនឃើញការកំណត់',
    noSettingsDescription: (category: string) => `មិនមានការកំណត់សម្រាប់ប្រភេទ ${category}។`,
    unsavedChanges: (count: number) => `${count} ការកែប្រែមិនទាន់រក្សាទុក`,
    errors: (count: number) => `${count} បញ្ហា`,
    reviewSection: 'ពិនិត្យផ្នែកនេះមុនបន្ត។',
    discard: 'បោះបង់ការកែ',
    saveAll: 'រក្សាទុកទាំងអស់',
  },
};

export function SettingsCategory({
  category,
  settings,
  onUpdateSetting,
  onResetSetting,
  loading = false,
  showPublicBadge = true,
  readOnly = false,
}: SettingsCategoryProps) {
  const { locale } = useAdminLocale();
  const copy = settingsCategoryCopy[locale];
  const [formData, setFormData] = React.useState<Record<string, JsonValue>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = React.useState<Record<string, boolean>>({});

  const categorySettings = React.useMemo(() => {
    const brandingOrder = [
      "site.management_logo_url",
      "site.management_og_image_url",
      "site.management_favicon_url",
      "site.logo_url",
      "site.og_image_url",
      "site.favicon_url",
      "site.dashboard_favicon_url",
    ];

    return getSettingsByType(settings, category)
      .map(presentSetting)
      .sort((left, right) => {
        const leftRank = brandingOrder.indexOf(left.key);
        const rightRank = brandingOrder.indexOf(right.key);
        if (leftRank === -1 && rightRank === -1) return 0;
        if (leftRank === -1) return 1;
        if (rightRank === -1) return -1;
        return leftRank - rightRank;
      });
  }, [settings, category]);
  const categoryInfo = SETTING_CATEGORIES[category];

  // Initialize form data with current setting values
  React.useEffect(() => {
    const initialData: Record<string, JsonValue> = {};
    categorySettings.forEach(setting => {
      initialData[setting.key] = setting.value;
    });
    setFormData(initialData);
    setHasChanges({});
    setErrors({});
  }, [categorySettings]);

  const handleSettingChange = (key: string, value: JsonValue) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Check if value has changed from original
    const originalSetting = categorySettings.find(s => s.key === key);
    const hasChanged = JSON.stringify(value) !== JSON.stringify(originalSetting?.value);
    
    setHasChanges(prev => ({ ...prev, [key]: hasChanged }));
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleSaveSetting = async (key: string) => {
    if (readOnly) return;
    try {
      setErrors(prev => ({ ...prev, [key]: '' }));
      
      await onUpdateSetting({
        key,
        value: formData[key]
      });
      
      // Update the original value and clear changes flag
      setHasChanges(prev => ({ ...prev, [key]: false }));
      
    } catch (error) {
      const errorMessage = locale === 'en' ? getSaveErrorMessage(error, copy.saveFailed) : copy.saveFailed;
      setErrors(prev => ({ ...prev, [key]: errorMessage }));
    }
  };

  const handleResetSetting = async (key: string) => {
    if (readOnly) return;
    try {
      setErrors(prev => ({ ...prev, [key]: '' }));
      
      await onResetSetting(key);
      
      // The settings will be refetched, which will update formData via useEffect
      setHasChanges(prev => ({ ...prev, [key]: false }));
      
    } catch (error) {
      const errorMessage = locale === 'en' ? getSaveErrorMessage(error, copy.saveFailed) : copy.saveFailed;
      setErrors(prev => ({ ...prev, [key]: errorMessage }));
    }
  };

  const saveAllChanges = async () => {
    if (readOnly) return;
    const changedSettings = Object.entries(hasChanges)
      .filter(([_, changed]) => changed)
      .map(([key]) => ({ key, value: formData[key] }));

    if (changedSettings.length === 0) return;

    try {
      // Save all changed settings
      await Promise.all(
        changedSettings.map(setting => onUpdateSetting(setting))
      );
      
      // Clear all changes flags
      setHasChanges({});
      setErrors({});
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      setErrors({ _all: copy.saveFailed });
    }
  };

  const resetAllChanges = () => {
    // Reset form data to original values
    const resetData: Record<string, JsonValue> = {};
    categorySettings.forEach(setting => {
      resetData[setting.key] = setting.value;
    });
    setFormData(resetData);
    setHasChanges({});
    setErrors({});
  };

  const totalChanges = Object.values(hasChanges).filter(Boolean).length;
  const errorCount = Object.values(errors).filter(Boolean).length;
  const hasAnyChanges = totalChanges > 0;

  if (categorySettings.length === 0) {
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {copy.noSettingsFound}
          </h3>
          <p className="text-slate-600">
            {copy.noSettingsDescription(categoryInfo.label)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!readOnly && (hasAnyChanges || errorCount > 0) && (
        <div className="sticky top-3 z-10 rounded-md border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {hasAnyChanges ? (
                <Badge variant="secondary">
                  {copy.unsavedChanges(totalChanges)}
                </Badge>
              ) : null}
              {errorCount > 0 ? (
                <Badge variant="destructive">
                  {copy.errors(errorCount)}
                </Badge>
              ) : null}
              <p className="text-sm text-slate-700">
                {copy.reviewSection}
              </p>
            </div>
            <div className="flex gap-2 sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllChanges}
                disabled={loading || !hasAnyChanges}
                className="bg-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {copy.discard}
              </Button>
              <Button size="sm" onClick={saveAllChanges} disabled={loading || !hasAnyChanges}>
                <Save className="mr-2 h-4 w-4" />
                {copy.saveAll}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {categorySettings.map((setting) => (
          <SettingCard
            key={setting.key}
            setting={setting}
            value={formData[setting.key]}
            onChange={(value) => {
              if (readOnly) return;
              handleSettingChange(setting.key, value);
            }}
            onSave={() => handleSaveSetting(setting.key)}
            onReset={() => handleResetSetting(setting.key)}
            error={errors[setting.key]}
            loading={loading}
            hasChanges={hasChanges[setting.key] || false}
            showPublicBadge={showPublicBadge}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}
