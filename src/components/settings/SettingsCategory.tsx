'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { Setting, SettingType, SETTING_CATEGORIES, getSettingsByType } from '@/services/settings.gql';
import { UpdateSettingInput } from '@/types/settings';
import { SettingCard } from './SettingCard';

interface SettingsCategoryProps {
  category: SettingType;
  settings: Setting[];
  onUpdateSetting: (input: UpdateSettingInput) => Promise<void>;
  onResetSetting: (key: string) => Promise<void>;
  loading?: boolean;
}

export function SettingsCategory({
  category,
  settings,
  onUpdateSetting,
  onResetSetting,
  loading = false
}: SettingsCategoryProps) {
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = React.useState<Record<string, boolean>>({});

  const categorySettings = React.useMemo(() => 
    getSettingsByType(settings, category), 
    [settings, category]
  );
  const categoryInfo = SETTING_CATEGORIES[category];

  // Initialize form data with current setting values
  React.useEffect(() => {
    const initialData: Record<string, any> = {};
    categorySettings.forEach(setting => {
      initialData[setting.key] = setting.value;
    });
    setFormData(initialData);
    setHasChanges({});
    setErrors({});
  }, [categorySettings]);

  const handleSettingChange = (key: string, value: any) => {
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
    try {
      setErrors(prev => ({ ...prev, [key]: '' }));
      
      await onUpdateSetting({
        key,
        value: formData[key]
      });
      
      // Update the original value and clear changes flag
      setHasChanges(prev => ({ ...prev, [key]: false }));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save setting';
      setErrors(prev => ({ ...prev, [key]: errorMessage }));
    }
  };

  const handleResetSetting = async (key: string) => {
    try {
      setErrors(prev => ({ ...prev, [key]: '' }));
      
      await onResetSetting(key);
      
      // The settings will be refetched, which will update formData via useEffect
      setHasChanges(prev => ({ ...prev, [key]: false }));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset setting';
      setErrors(prev => ({ ...prev, [key]: errorMessage }));
    }
  };

  const saveAllChanges = async () => {
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
    }
  };

  const resetAllChanges = () => {
    // Reset form data to original values
    const resetData: Record<string, any> = {};
    categorySettings.forEach(setting => {
      resetData[setting.key] = setting.value;
    });
    setFormData(resetData);
    setHasChanges({});
    setErrors({});
  };

  const totalChanges = Object.values(hasChanges).filter(Boolean).length;
  const hasAnyChanges = totalChanges > 0;

  if (categorySettings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No Settings Found
          </h3>
          <p className="text-slate-600">
            No settings are available for the {categoryInfo.label} category.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {hasAnyChanges && (
        <div className="sticky top-4 z-10 rounded-md border border-blue-200 bg-blue-50/95 p-3 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {totalChanges} unsaved change{totalChanges !== 1 ? 's' : ''}
              </Badge>
              <p className="text-sm text-blue-900">
                Save your changes before leaving this category.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllChanges}
                disabled={loading}
                className="bg-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Discard
              </Button>
              <Button size="sm" onClick={saveAllChanges} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                Save All
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {categorySettings.map((setting) => (
          <SettingCard
            key={setting.key}
            setting={setting}
            value={formData[setting.key]}
            onChange={(value) => handleSettingChange(setting.key, value)}
            onSave={() => handleSaveSetting(setting.key)}
            onReset={() => handleResetSetting(setting.key)}
            error={errors[setting.key]}
            loading={loading}
            hasChanges={hasChanges[setting.key] || false}
          />
        ))}
      </div>
    </div>
  );
}
