'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { Setting, getSettingInputType } from '@/services/settings.gql';
import { SettingInputProps } from '@/types/settings';

export function SettingInput({ setting, value, onChange, error, disabled = false }: SettingInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputType = getSettingInputType(setting.key, setting.value);
  const isPassword = setting.key.includes('password') || setting.key.includes('secret');

  const handleInputChange = (newValue: any) => {
    // Convert string values to appropriate types
    if (inputType === 'number') {
      const numValue = parseFloat(newValue);
      onChange(isNaN(numValue) ? 0 : numValue);
    } else if (inputType === 'boolean') {
      onChange(newValue === 'true' || newValue === true);
    } else {
      onChange(newValue);
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
        // Handle specific select options based on setting key
        const getSelectOptions = () => {
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
              { value: 'America/Chicago', label: 'Central Time' },
              { value: 'America/Denver', label: 'Mountain Time' },
              { value: 'America/Los_Angeles', label: 'Pacific Time' },
              { value: 'Europe/London', label: 'London' },
              { value: 'Europe/Paris', label: 'Paris' },
              { value: 'Asia/Tokyo', label: 'Tokyo' },
              { value: 'Asia/Shanghai', label: 'Shanghai' }
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
              {options.map((option) => (
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
          <div className="relative">
            <Input
              type={isPassword && !showPassword ? 'password' : inputType}
              value={value || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={disabled}
              placeholder={`Enter ${setting.label.toLowerCase()}`}
              className={error ? 'border-red-500' : ''}
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
    </div>
  );
}
