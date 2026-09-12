import { gql } from "graphql-request";
import type { JsonValue } from '@/types/json';

// ============================================================================
// SETTINGS QUERIES
// ============================================================================

export const Q_SETTINGS = gql`
  query GetSettings($type: SettingType) {
    settings(type: $type) {
      id
      key
      value
      type
      label
      description
      isPublic
      isRequired
      validation
      createdAt
      updatedAt
    }
  }
`;

export const Q_SETTING = gql`
  query GetSetting($key: String!) {
    setting(key: $key) {
      id
      key
      value
      type
      label
      description
      isPublic
      isRequired
      validation
      createdAt
      updatedAt
    }
  }
`;

export const Q_PUBLIC_SETTINGS = gql`
  query GetPublicSettings {
    publicSettings {
      id
      key
      value
      type
      label
      description
      isPublic
      isRequired
      validation
      createdAt
      updatedAt
    }
  }
`;

// ============================================================================
// SETTINGS MUTATIONS
// ============================================================================

export const M_UPDATE_SETTING = gql`
  mutation UpdateSetting($input: UpdateSettingInput!) {
    updateSetting(input: $input) {
      id
      key
      value
      type
      label
      description
      isPublic
      isRequired
      validation
      createdAt
      updatedAt
    }
  }
`;

export const M_UPDATE_SETTINGS = gql`
  mutation UpdateSettings($input: [UpdateSettingInput!]!) {
    updateSettings(input: $input) {
      id
      key
      value
      type
      label
      description
      isPublic
      isRequired
      validation
      createdAt
      updatedAt
    }
  }
`;

export const M_RESET_SETTING = gql`
  mutation ResetSetting($key: String!) {
    resetSetting(key: $key) {
      id
      key
      value
      type
      label
      description
      isPublic
      isRequired
      validation
      createdAt
      updatedAt
    }
  }
`;

export const M_TEST_EMAIL_SETTINGS = gql`
  mutation TestEmailSettings($input: EmailTestInput!) {
    testEmailSettings(input: $input) {
      success
      message
      host
      port
      fromAddress
    }
  }
`;

export const Q_EMAIL_DELIVERY_LOGS = gql`
  query EmailDeliveryLogs($status: EmailDeliveryStatus, $take: Int) {
    emailDeliveryLogs(status: $status, take: $take) {
      id
      to
      subject
      purpose
      status
      errorMessage
      attemptCount
      lastAttemptAt
      createdAt
    }
  }
`;

export const M_RETRY_EMAIL_DELIVERY = gql`
  mutation RetryEmailDelivery($id: ID!) {
    retryEmailDelivery(id: $id) {
      id
      to
      subject
      purpose
      status
      errorMessage
      attemptCount
      lastAttemptAt
      createdAt
    }
  }
`;

export type EmailDeliveryStatus = "SENT" | "FAILED" | "SKIPPED";

export interface EmailDeliveryLog {
  id: string;
  to: string;
  subject: string;
  purpose: string;
  status: EmailDeliveryStatus;
  errorMessage?: string | null;
  attemptCount: number;
  lastAttemptAt: string;
  createdAt: string;
}

// ============================================================================
// TYPES
// ============================================================================

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
  validation?: {
    type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'json' | 'array';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingInput {
  key: string;
  value: JsonValue;
}

export interface EmailTestResult {
  success: boolean;
  message: string;
  host?: string | null;
  port?: number | null;
  fromAddress?: string | null;
}

// ============================================================================
// SETTING CATEGORIES CONFIGURATION
// ============================================================================

export const SETTING_CATEGORIES = {
  [SettingType.SITE]: {
    label: 'Site Configuration',
    description: 'Basic site information and branding',
    icon: '🌐',
    color: 'blue'
  },
  [SettingType.EMAIL]: {
    label: 'Email & SMTP',
    description: 'Email server configuration and notifications',
    icon: '📧',
    color: 'green'
  },
  [SettingType.SEO]: {
    label: 'SEO & Analytics',
    description: 'Search engine optimization and tracking',
    icon: '📈',
    color: 'purple'
  },
  [SettingType.CONTENT]: {
    label: 'Content Management',
    description: 'Article publishing and content policies',
    icon: '📝',
    color: 'orange'
  },
  [SettingType.USER_MANAGEMENT]: {
    label: 'User Management',
    description: 'User access and authentication settings',
    icon: '👥',
    color: 'indigo'
  },
  [SettingType.API]: {
    label: 'API Configuration',
    description: 'API rate limiting and access control',
    icon: '🔌',
    color: 'cyan'
  },
  [SettingType.THEME]: {
    label: 'Theme & Appearance',
    description: 'Visual customization and branding',
    icon: '🎨',
    color: 'pink'
  },
  [SettingType.MAINTENANCE]: {
    label: 'Maintenance & Backups',
    description: 'System maintenance and backup settings',
    icon: '🔧',
    color: 'gray'
  }
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getSettingsByType(settings: Setting[], type: SettingType): Setting[] {
  return settings.filter(setting => setting.type === type);
}

export function getSettingValue(settings: Setting[], key: string): JsonValue | undefined {
  const setting = settings.find(s => s.key === key);
  return setting?.value;
}

export function formatSettingValue(value: JsonValue | undefined, key: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Handle boolean values
  if (typeof value === 'boolean') {
    return value ? 'Enabled' : 'Disabled';
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  // Handle objects
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  // Handle special formatting for specific keys
  if (key.includes('password') || key.includes('secret') || key.includes('key')) {
    return '••••••••';
  }
  
  return String(value);
}

export function getSettingInputType(key: string, value: JsonValue | undefined): 'text' | 'number' | 'boolean' | 'email' | 'url' | 'textarea' | 'select' | 'color' {
  // Determine input type based on key patterns and value types
  if (typeof value === 'boolean') {
    return 'boolean';
  }

  if (key.includes('role') || key.includes('timezone') || key.includes('frequency')) {
    return 'select';
  }
  
  if (typeof value === 'number') {
    return 'number';
  }
  
  if (key.includes('email')) {
    return 'email';
  }
  
  if (key.includes('url') || key.includes('link')) {
    return 'url';
  }
  
  if (key.includes('color')) {
    return 'color';
  }
  
  if (
    key.includes('description') ||
    key.includes('message') ||
    key.includes('css') ||
    key.includes('tweakcn') ||
    key.includes('policy') ||
    key.includes('terms_of_service') ||
    key.includes('address') ||
    key.includes('hours')
  ) {
    return 'textarea';
  }
  
  return 'text';
}
