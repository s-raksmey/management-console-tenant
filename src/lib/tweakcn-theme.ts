const THEME_SETTING_BY_ROLE: Record<string, string> = {
  SUPER_ADMIN: "theme.super_admin_tweakcn",
  ADMIN: "theme.admin_tweakcn",
  EDITOR: "theme.editor_tweakcn",
  AUTHOR: "theme.author_tweakcn",
};

export const PUBLIC_THEME_SETTING_KEY = "theme.public_tweakcn";
export const THEME_SETTINGS_CHANGED_EVENT = "pulse-news-theme-settings-changed";

export const getThemeSettingKeyForRole = (role?: string | null) =>
  THEME_SETTING_BY_ROLE[role?.toUpperCase() || ""] || "theme.admin_tweakcn";

const ALLOWED_THEME_VARIABLES = new Set([
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "radius",
]);

export type ParsedTheme = {
  light: Record<string, string>;
  dark: Record<string, string>;
};

function normalizeThemeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return JSON.stringify(value);
}

function stripCssVariableName(name: string) {
  return name.trim().replace(/^--/, "");
}

function isAllowedVariable(name: string) {
  return ALLOWED_THEME_VARIABLES.has(stripCssVariableName(name));
}

function readVariablePairs(text: string): Record<string, string> {
  const variables: Record<string, string> = {};
  const regex = /-{1,2}([a-zA-Z0-9-]+)\s*:\s*([^;}{]+);/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const key = stripCssVariableName(match[1]);
    const value = match[2]?.trim();
    if (value && isAllowedVariable(key)) {
      variables[key] = value;
    }
  }

  return variables;
}

function readBlock(text: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, "m"));
  return match?.[1] || "";
}

function readObjectVariables(value: any): ParsedTheme {
  const source = value?.light || value?.root || value?.theme || value || {};
  const darkSource = value?.dark || {};
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};

  Object.entries(source).forEach(([key, rawValue]) => {
    if (typeof rawValue === "string" && isAllowedVariable(key)) {
      light[stripCssVariableName(key)] = rawValue;
    }
  });

  Object.entries(darkSource).forEach(([key, rawValue]) => {
    if (typeof rawValue === "string" && isAllowedVariable(key)) {
      dark[stripCssVariableName(key)] = rawValue;
    }
  });

  return { light, dark };
}

export function parseTweakCnTheme(value: unknown): ParsedTheme {
  if (!value) return { light: {}, dark: {} };

  if (typeof value === "object") {
    return readObjectVariables(value);
  }

  const text = normalizeThemeText(value).trim();
  if (!text) return { light: {}, dark: {} };

  try {
    return readObjectVariables(JSON.parse(text));
  } catch {
    const rootBlock = readBlock(text, ":root") || text;
    const darkBlock = readBlock(text, ".dark");
    return {
      light: readVariablePairs(rootBlock),
      dark: readVariablePairs(darkBlock),
    };
  }
}

export function applyTweakCnTheme(value: unknown, mode: "light" | "dark" = "light") {
  if (typeof document === "undefined") return;

  const parsed = parseTweakCnTheme(value);
  const tokens = {
    ...parsed.light,
    ...(mode === "dark" ? parsed.dark : {}),
  };

  Object.entries(tokens).forEach(([key, tokenValue]) => {
    document.documentElement.style.setProperty(`--${key}`, tokenValue);
  });
}

export function notifyThemeSettingsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(THEME_SETTINGS_CHANGED_EVENT));
}
