'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { Setting, getSettingInputType } from '@/services/settings.gql';
import { SettingInputProps } from '@/types/settings';
import { DeviceImageUpload } from '@/components/media/device-image-upload';
import { useAdminLocale } from '@/hooks/useAdminLocale';

function isBrandImageSettingKey(key: string) {
  const normalized = key.trim().toLowerCase();
  return (
    normalized.endsWith('logo_url') ||
    normalized.endsWith('favicon_url') ||
    normalized.includes('og_image')
  );
}

export function SettingInput({ setting, value, onChange, error, disabled = false }: SettingInputProps) {
  const { locale } = useAdminLocale();
  const copy = locale === 'km'
    ? {
        enter: (label: string) => `បញ្ចូល ${label}`,
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
        uploadFile: (type: string) => `ផ្ទុក ${type} ពីឧបករណ៍`,
        logo: 'logo',
        ogImage: 'Open Graph',
        favicon: 'favicon',
        uploadHelp: 'ផ្ទុកឯកសារពីឧបករណ៍។ មិនអាចប្រើតំណ http ឬ https។ ចុចរក្សាទុកដើម្បីផ្សព្វផ្សាយ។',
        urlHelp: 'ប្រើ URL ពេញលេញដែលចាប់ផ្តើមដោយ https:// ឬ http://',
        showPassword: 'បង្ហាញពាក្យសម្ងាត់',
        hidePassword: 'លាក់ពាក្យសម្ងាត់',
      }
    : {
        enter: (label: string) => `Enter ${label}`,
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
        uploadFile: (type: string) => `Upload ${type} from this device`,
        logo: 'logo',
        ogImage: 'Open Graph image',
        favicon: 'favicon',
        uploadHelp:
          'Choose a file from this device. HTTP and HTTPS links are not accepted. Click Save to publish it.',
        urlHelp: 'Use a complete URL beginning with https:// or http://',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
      };
  const [showPassword, setShowPassword] = React.useState(false);
  const inputType = getSettingInputType(setting.key, setting.value);
  const isPassword = setting.key.includes('password') || setting.key.includes('secret');
  const isBrandImageSetting = isBrandImageSettingKey(setting.key);
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

  const renderInput = () => {
    if (isBrandImageSetting) {
      return (
        <DeviceImageUpload
          value={textValue}
          onChange={(url) => handleInputChange(url)}
          disabled={disabled}
          accept={isFaviconSetting ? 'image/*,.ico' : 'image/*'}
          folder="branding"
          maxWidth={isFaviconSetting ? 256 : isOgImageSetting ? 1200 : 800}
          maxHeight={isFaviconSetting ? 256 : isOgImageSetting ? 630 : 800}
          tags={['branding', isFaviconSetting ? 'favicon' : isOgImageSetting ? 'og' : 'logo']}
          label={copy.uploadFile(brandImageLabel)}
          helpText={copy.uploadHelp}
          previewAlt={setting.label}
          includeSelectedTenant={!setting.key.includes('management_')}
        />
      );
    }

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
                type={isPassword && !showPassword ? 'password' : inputType}
                value={textValue}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={disabled}
                placeholder={inputPlaceholder}
                className={error ? 'border-red-500' : ''}
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
      {!error && inputType === 'url' && !isBrandImageSetting && (
        <p className="text-xs text-slate-500">
          {copy.urlHelp}
        </p>
      )}
    </div>
  );
}
