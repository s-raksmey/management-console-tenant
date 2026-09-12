import type { JsonValue } from '@/types/json';

// Re-export constants from the GraphQL service for consistency
export { SETTING_CATEGORIES } from '@/services/settings.gql';
export type { JsonValue } from '@/types/json';

// Define types directly to avoid import issues
export enum SettingType {
  SITE = 'SITE',
  EMAIL = 'EMAIL',
  SEO = 'SEO',
  CONTENT = 'CONTENT',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  API = 'API',
  THEME = 'THEME',
  MAINTENANCE = 'MAINTENANCE'
}

export interface Setting {
  id: string;
  key: string;
  value: JsonValue;
  type: SettingType;
  label: string;
  description?: string | null;
  isPublic: boolean;
  isRequired: boolean;
  validation?: SettingValidationRule | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingInput {
  key: string;
  value: JsonValue;
}

// Additional types for the UI components
export interface SettingFormData {
  [key: string]: JsonValue;
}

export interface SettingValidationError {
  field: string;
  message: string;
}

export interface SettingCategoryInfo {
  label: string;
  description: string;
  icon: string;
  color: string;
}

export interface SettingsPageState {
  loading: boolean;
  error: string | null;
  settings: Setting[];
  selectedCategory: SettingType | null;
  searchQuery: string;
  showOnlyRequired: boolean;
  showOnlyPublic: boolean;
}

export interface SettingInputProps {
  setting: Setting;
  value: JsonValue;
  onChange: (value: JsonValue) => void;
  error?: string;
  disabled?: boolean;
}

export interface SettingFormProps {
  settings: Setting[];
  onSave: (updates: UpdateSettingInput[]) => Promise<void>;
  onReset: (key: string) => Promise<void>;
  loading?: boolean;
  category?: SettingType;
}

// Validation schema types
export interface SettingValidationRule {
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'json' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string | RegExp;
  options?: string[];
  message?: string;
}

export interface SettingConfig {
  key: string;
  type: SettingType;
  label: string;
  description?: string;
  defaultValue: JsonValue;
  isPublic: boolean;
  isRequired: boolean;
  validation?: SettingValidationRule;
}
