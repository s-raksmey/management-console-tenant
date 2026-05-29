'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Loader2, UploadCloud } from 'lucide-react';
import { Setting, getSettingInputType } from '@/services/settings.gql';
import { SettingInputProps } from '@/types/settings';
import { getAuthFetchHeaders } from '@/services/graphql-client';

const BRAND_IMAGE_SETTING_KEYS = new Set([
  'site.logo_url',
  'site.favicon_url',
  'site.dashboard_favicon_url',
  'site.management_favicon_url',
]);

export function SettingInput({ setting, value, onChange, error, disabled = false }: SettingInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const inputType = getSettingInputType(setting.key, setting.value);
  const isPassword = setting.key.includes('password') || setting.key.includes('secret');
  const isBrandImageSetting = BRAND_IMAGE_SETTING_KEYS.has(setting.key);
  const isFaviconSetting = setting.key.includes('favicon_url');
  const validationType = setting.validation?.type;
  const validationOptions = setting.validation?.options || [];
  const inputPlaceholder =
    inputType === 'url'
      ? 'https://example.com'
      : `Enter ${setting.label.toLowerCase()}`;

  const handleInputChange = (newValue: any) => {
    // Convert string values to appropriate types
    if (inputType === 'number' || validationType === 'number') {
      const numValue = parseFloat(newValue);
      onChange(isNaN(numValue) ? 0 : numValue);
    } else if (inputType === 'boolean' || validationType === 'boolean') {
      onChange(newValue === 'true' || newValue === true);
    } else {
      onChange(newValue);
    }
  };

  const handleBrandImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.ico')) {
      setUploadError('Please upload an image file.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append(
        'options',
        JSON.stringify({
          folder: 'branding',
          maxWidth: isFaviconSetting ? 256 : 1200,
          maxHeight: isFaviconSetting ? 256 : 600,
          quality: 90,
          tags: ['branding', isFaviconSetting ? 'favicon' : 'logo'],
        }),
      );

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: getAuthFetchHeaders(),
        body: payload,
      });
      const result = await response.json();

      if (!response.ok || !result.success || !result.file?.url) {
        throw new Error(result.message || 'Upload failed');
      }

      const absoluteUrl = new URL(result.file.url, window.location.origin).toString();
      onChange(absoluteUrl);
    } catch (uploadFailure) {
      setUploadError(uploadFailure instanceof Error ? uploadFailure.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const renderInput = () => {
    switch (inputType) {
      case 'boolean':
        return (
          <Select
            value={value?.toString() || 'false'}
            onValueChange={(val) => handleInputChange(val === 'true')}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Enabled</SelectItem>
              <SelectItem value="false">Disabled</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={disabled}
            className="flex min-h-[96px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={`Enter ${setting.label.toLowerCase()}`}
          />
        );

      case 'select':
        const getSelectOptions = () => {
          if (validationOptions.length > 0) {
            return validationOptions.map((option: string) => ({
              value: option,
              label: option
                .split('_')
                .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                .join(' '),
            }));
          }

          if (setting.key.includes('role')) {
            return [
              { value: 'AUTHOR', label: 'Author' },
              { value: 'EDITOR', label: 'Editor' },
              { value: 'ADMIN', label: 'Admin' }
            ];
          }
          if (setting.key.includes('timezone')) {
            return [
              { value: 'UTC', label: 'UTC' },
              { value: 'America/New_York', label: 'Eastern Time' },
              { value: 'America/Los_Angeles', label: 'Pacific Time' },
              { value: 'Europe/London', label: 'London' },
              { value: 'Asia/Tokyo', label: 'Tokyo' },
              { value: 'Australia/Sydney', label: 'Sydney' },
            ];
          }
          if (setting.key.includes('frequency')) {
            return [
              { value: '1', label: 'Every hour' },
              { value: '6', label: 'Every 6 hours' },
              { value: '12', label: 'Every 12 hours' },
              { value: '24', label: 'Daily' },
              { value: '168', label: 'Weekly' }
            ];
          }
          return [];
        };

        const options = getSelectOptions();
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={handleInputChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${setting.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: { value: string; label: string }) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={disabled}
              className="w-12 h-10 rounded border border-input cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={disabled}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            <div className="relative">
              <Input
                type={isPassword && !showPassword ? 'password' : inputType}
                value={value || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={disabled || isUploading}
                placeholder={inputPlaceholder}
                className={error || uploadError ? 'border-red-500' : ''}
              />
            {isPassword && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={disabled}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
            </div>
            {isBrandImageSetting && (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    {value ? (
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                        <img src={String(value)} alt={setting.label} className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-slate-400">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Upload {isFaviconSetting ? 'favicon' : 'logo'} file
                      </p>
                      <p className="text-xs text-slate-500">
                        Upload sets the URL above. Click Save to publish it.
                      </p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" disabled={disabled || isUploading} asChild>
                    <label className="cursor-pointer">
                      {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="mr-2 h-4 w-4" />
                      )}
                      {isUploading ? 'Uploading' : 'Choose File'}
                      <input
                        type="file"
                        accept="image/*,.ico"
                        className="sr-only"
                        disabled={disabled || isUploading}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          if (file) void handleBrandImageUpload(file);
                        }}
                      />
                    </label>
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="sr-only">{setting.label}</label>
      {renderInput()}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {uploadError && (
        <p className="text-sm text-red-600">{uploadError}</p>
      )}
      {!error && inputType === 'url' && (
        <p className="text-xs text-slate-500">
          Use a complete URL beginning with https:// or http://
        </p>
      )}
    </div>
  );
}
