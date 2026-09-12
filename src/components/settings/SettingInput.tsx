'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Loader2, UploadCloud } from 'lucide-react';
import { Setting, getSettingInputType } from '@/services/settings.gql';
import { SettingInputProps } from '@/types/settings';
import { getAuthFetchHeaders } from '@/services/graphql-client';
import { resolveCmsMediaSrc } from '@/lib/cms-media';
import { useAdminLocale } from '@/hooks/useAdminLocale';

const BRAND_IMAGE_SETTING_KEYS = new Set([
  'site.logo_url',
  'site.og_image_url',
  'site.favicon_url',
  'site.dashboard_favicon_url',
  'site.management_favicon_url',
]);

export function SettingInput({ setting, value, onChange, error, disabled = false }: SettingInputProps) {
  const { locale } = useAdminLocale();
  const copy = locale === 'km'
    ? {
        enter: (label: string) => `បញ្ចូល ${label}`,
        uploadImageOnly: 'សូមផ្ទុកឯកសាររូបភាព។',
        uploadFailed: 'ផ្ទុកឡើងមិនបាន',
        enabled: 'បានបើក',
        disabled: 'បានបិទ',
        select: (label: string) => `ជ្រើស ${label}`,
        author: 'អ្នកនិពន្ធ',
        editor: 'អ្នកកែសម្រួល',
        admin: 'អ្នកគ្រប់គ្រង',
        everyHour: 'រៀងរាល់ម៉ោង',
        every6Hours: 'រៀងរាល់ 6 ម៉ោង',
        every12Hours: 'រៀងរាល់ 12 ម៉ោង',
        daily: 'ប្រចាំថ្ងៃ',
        weekly: 'ប្រចាំសប្តាហ៍',
        uploadFile: (type: string) => `ផ្ទុកឯកសារ ${type}`,
        logo: 'logo',
        ogImage: 'Open Graph',
        favicon: 'favicon',
        uploadHelp: 'ការផ្ទុកឡើងនឹងកំណត់ URL ខាងលើ។ ចុចរក្សាទុកដើម្បីផ្សព្វផ្សាយ។',
        uploading: 'កំពុងផ្ទុកឡើង',
        chooseFile: 'ជ្រើសឯកសារ',
        urlHelp: 'ប្រើ URL ពេញលេញដែលចាប់ផ្តើមដោយ https:// ឬ http://',
        showPassword: 'បង្ហាញពាក្យសម្ងាត់',
        hidePassword: 'លាក់ពាក្យសម្ងាត់',
      }
    : {
        enter: (label: string) => `Enter ${label}`,
        uploadImageOnly: 'Please upload an image file.',
        uploadFailed: 'Upload failed',
        enabled: 'Enabled',
        disabled: 'Disabled',
        select: (label: string) => `Select ${label}`,
        author: 'Author',
        editor: 'Editor',
        admin: 'Admin',
        everyHour: 'Every hour',
        every6Hours: 'Every 6 hours',
        every12Hours: 'Every 12 hours',
        daily: 'Daily',
        weekly: 'Weekly',
        uploadFile: (type: string) => `Upload ${type} file`,
        logo: 'logo',
        ogImage: 'Open Graph image',
        favicon: 'favicon',
        uploadHelp: 'Upload sets the URL above. Click Save to publish it.',
        uploading: 'Uploading',
        chooseFile: 'Choose File',
        urlHelp: 'Use a complete URL beginning with https:// or http://',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
      };
  const [showPassword, setShowPassword] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const inputType = getSettingInputType(setting.key, setting.value);
  const isPassword = setting.key.includes('password') || setting.key.includes('secret');
  const isBrandImageSetting = BRAND_IMAGE_SETTING_KEYS.has(setting.key);
  const isFaviconSetting = setting.key.includes('favicon_url');
  const isOgImageSetting = setting.key.includes('og_image');
  const brandImageLabel = isFaviconSetting
    ? copy.favicon
    : isOgImageSetting
      ? copy.ogImage
      : copy.logo;
  const validationType = setting.validation?.type;
  const validationOptions = setting.validation?.options || [];
  const inputPlaceholder =
    inputType === 'url'
      ? 'https://example.com'
      : copy.enter(setting.label.toLowerCase());

  const textValue =
    value === null || value === undefined || typeof value === 'object' ? '' : String(value);

  const handleInputChange = (newValue: string | boolean) => {
    if (inputType === 'number' || validationType === 'number') {
      const numValue = parseFloat(String(newValue));
      onChange(Number.isNaN(numValue) ? 0 : numValue);
    } else if (inputType === 'boolean' || validationType === 'boolean') {
      onChange(newValue === true || newValue === 'true');
    } else {
      onChange(String(newValue));
    }
  };

  const handleBrandImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.ico')) {
      setUploadError(copy.uploadImageOnly);
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
          maxWidth: isFaviconSetting ? 256 : isOgImageSetting ? 1200 : 800,
          maxHeight: isFaviconSetting ? 256 : isOgImageSetting ? 630 : 800,
          quality: 90,
          tags: ['branding', isFaviconSetting ? 'favicon' : isOgImageSetting ? 'og' : 'logo'],
        }),
      );

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: getAuthFetchHeaders(),
        body: payload,
      });
      const result = await response.json();

      if (!response.ok || !result.success || !result.file?.url) {
        throw new Error(result.message || copy.uploadFailed);
      }

      onChange(result.file.url);
    } catch (uploadFailure) {
      setUploadError(locale === 'en' && uploadFailure instanceof Error ? uploadFailure.message : copy.uploadFailed);
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
              <SelectItem value="true">{copy.enabled}</SelectItem>
              <SelectItem value="false">{copy.disabled}</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <textarea
            value={textValue}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={disabled}
            className="flex min-h-[96px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={copy.enter(setting.label.toLowerCase())}
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
              { value: 'AUTHOR', label: copy.author },
              { value: 'EDITOR', label: copy.editor },
              { value: 'ADMIN', label: copy.admin }
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
              { value: '1', label: copy.everyHour },
              { value: '6', label: copy.every6Hours },
              { value: '12', label: copy.every12Hours },
              { value: '24', label: copy.daily },
              { value: '168', label: copy.weekly }
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
              <SelectValue placeholder={copy.select(setting.label.toLowerCase())} />
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
              value={textValue || '#000000'}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={disabled}
              className="w-12 h-10 rounded border border-input cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Input
              type="text"
              value={textValue}
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
                type={
                  isBrandImageSetting
                    ? 'text'
                    : isPassword && !showPassword
                      ? 'password'
                      : inputType
                }
                value={textValue}
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
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
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
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-200 bg-transparent">
                        <img src={resolveCmsMediaSrc(String(value))} alt={setting.label} className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-slate-400">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {copy.uploadFile(brandImageLabel)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {copy.uploadHelp}
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
                      {isUploading ? copy.uploading : copy.chooseFile}
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
          {copy.urlHelp}
        </p>
      )}
    </div>
  );
}
