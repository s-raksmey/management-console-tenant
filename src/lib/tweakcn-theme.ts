const THEME_SETTING_BY_ROLE: Record<string, string> = {
  SUPER_ADMIN: "theme.super_admin_tweakcn",
  ADMIN: "theme.admin_tweakcn",
  EDITOR: "theme.editor_tweakcn",
  AUTHOR: "theme.author_tweakcn",
};

export const PUBLIC_THEME_SETTING_KEY = "theme.public_tweakcn";
export const THEME_SETTINGS_CHANGED_EVENT = "tenant-console-theme-settings-changed";
export const COLOR_SCHEME_CHANGED_EVENT = "tenant-console-color-scheme-changed";
export const COLOR_SCHEME_STORAGE_KEY = "tenant-console-color-scheme";
export const THEME_CACHE_STORAGE_KEY = "tenant-console-theme-cache";
const THEME_CUSTOM_STYLE_ID = "tenant-console-runtime-theme";

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
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
  "font-sans",
  "font-serif",
  "font-mono",
  "radius",
  "shadow-x",
  "shadow-y",
  "shadow-blur",
  "shadow-spread",
  "shadow-opacity",
  "shadow-color",
  "shadow-2xs",
  "shadow-xs",
  "shadow-sm",
  "shadow",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
  "shadow-2xl",
  "tracking-normal",
  "spacing",
]);

export type ParsedTheme = {
  light: Record<string, string>;
  dark: Record<string, string>;
};

type ThemeSetting = {
  key: string;
  value: unknown;
};

let appliedVariables = new Set<string>();

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

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readObjectVariables(value: unknown): ParsedTheme {
  const objectValue = asRecord(value);
  const source = asRecord(
    objectValue.light ?? objectValue.root ?? objectValue.theme ?? objectValue,
  );
  const darkSource = asRecord(objectValue.dark);
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

function hexToHslColor(value: unknown) {
  if (typeof value !== "string") return null;
  const hex = value.trim();
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return null;

  const raw = match[1];
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
        break;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%)`;
}

function getSettingValue(settings: ThemeSetting[], key: string) {
  return settings.find((setting) => setting.key === key)?.value;
}

function valueToString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function injectCustomCss(css: string) {
  if (typeof document === "undefined") return;

  let style = document.getElementById(THEME_CUSTOM_STYLE_ID);
  if (!css) {
    style?.remove();
    return;
  }

  if (!style) {
    style = document.createElement("style");
    style.id = THEME_CUSTOM_STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = css;
}

function isSafeThemeToken(key: string, value: unknown): value is string {
  return /^[a-z0-9-]+$/i.test(key) && typeof value === "string" && !/[;{}<>]/.test(value);
}

function readThemeTokenMap(value: unknown) {
  const tokens: Record<string, string> = {};
  if (!value || typeof value !== "object") return tokens;

  Object.entries(value as Record<string, unknown>).forEach(([key, tokenValue]) => {
    if (isSafeThemeToken(key, tokenValue)) tokens[key] = tokenValue;
  });

  return tokens;
}

function persistThemeCache(
  theme: ParsedTheme,
  overrides: Record<string, string>,
  customCss: string,
) {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(
      THEME_CACHE_STORAGE_KEY,
      JSON.stringify({
        light: { ...theme.light, ...overrides },
        dark: theme.dark,
        customCss,
      }),
    );
  } catch {
    // A full or blocked store still leaves the live theme applied.
  }
}

export function reapplyCachedTheme() {
  if (typeof document === "undefined" || typeof localStorage === "undefined") return;

  try {
    const raw = localStorage.getItem(THEME_CACHE_STORAGE_KEY);
    if (!raw) return;

    const cache = JSON.parse(raw) as {
      light?: unknown;
      dark?: unknown;
      customCss?: unknown;
    };
    const isDark = document.documentElement.classList.contains("dark");
    const light = readThemeTokenMap(cache.light);
    const dark = readThemeTokenMap(cache.dark);
    const tokens = { ...light, ...(isDark ? dark : {}) };

    Object.entries(tokens).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });

    if (Object.keys(tokens).length > 0) {
      document.documentElement.dataset.themeActive = "true";
    }
    if (isDark && Object.keys(dark).length > 0) {
      document.documentElement.dataset.themeDark = "true";
    } else {
      delete document.documentElement.dataset.themeDark;
    }

    if (typeof cache.customCss === "string") {
      injectCustomCss(cache.customCss);
    }
  } catch {
    // Ignore a damaged cache and wait for the settings request.
  }
}

export function themeBootScript() {
  const schemeKey = JSON.stringify(COLOR_SCHEME_STORAGE_KEY);
  const cacheKey = JSON.stringify(THEME_CACHE_STORAGE_KEY);
  const styleId = JSON.stringify(THEME_CUSTOM_STYLE_ID);

  return `
    try {
      var scheme = localStorage.getItem(${schemeKey}) || 'system';
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = scheme === 'dark' || (scheme === 'system' && prefersDark);
      var root = document.documentElement;
      root.classList.toggle('dark', isDark);
      document.cookie = ${schemeKey} + '=' + (isDark ? 'dark' : 'light') + '; Path=/; Max-Age=31536000; SameSite=Lax';
      var raw = localStorage.getItem(${cacheKey});
      if (raw) {
      var cache = JSON.parse(raw);
      var light = cache && cache.light && typeof cache.light === 'object' ? cache.light : {};
      var dark = cache && cache.dark && typeof cache.dark === 'object' ? cache.dark : {};
      var tokens = {};
      function keep(key, value) {
        return /^[a-z0-9-]+$/i.test(key) && typeof value === 'string' && !/[;{}<>]/.test(value);
      }
      Object.keys(light).forEach(function (key) {
        if (keep(key, light[key])) tokens[key] = light[key];
      });
      if (isDark) {
        Object.keys(dark).forEach(function (key) {
          if (keep(key, dark[key])) tokens[key] = dark[key];
        });
      }
      Object.keys(tokens).forEach(function (key) {
        root.style.setProperty('--' + key, tokens[key]);
      });
      if (Object.keys(tokens).length) root.dataset.themeActive = 'true';
      if (isDark && Object.keys(dark).length) root.dataset.themeDark = 'true';
      if (typeof cache.customCss === 'string' && cache.customCss && !/<\\/?script/i.test(cache.customCss)) {
        var style = document.getElementById(${styleId});
        if (!style) {
          style = document.createElement('style');
          style.id = ${styleId};
          document.head.appendChild(style);
        }
        style.textContent = cache.customCss;
      }
      }
    } catch (e) {}
  `;
}

export function applyTweakCnTheme(
  value: unknown,
  mode?: "light" | "dark",
  overrides: Record<string, string> = {},
) {
  if (typeof document === "undefined") return;

  const parsed = parseTweakCnTheme(value);
  const resolvedMode =
    mode || (document.documentElement.classList.contains("dark") ? "dark" : "light");
  const tokens = {
    ...parsed.light,
    ...(resolvedMode === "dark" ? parsed.dark : {}),
    ...overrides,
  };

  appliedVariables.forEach((key) => {
    if (!(key in tokens)) {
      document.documentElement.style.removeProperty(`--${key}`);
    }
  });
  appliedVariables = new Set(Object.keys(tokens));

  Object.entries(tokens).forEach(([key, tokenValue]) => {
    document.documentElement.style.setProperty(`--${key}`, tokenValue);
  });

  if (Object.keys(tokens).length > 0) {
    document.documentElement.dataset.themeActive = "true";
  } else {
    delete document.documentElement.dataset.themeActive;
  }

  if (resolvedMode === "dark" && Object.keys(parsed.dark).length > 0) {
    document.documentElement.dataset.themeDark = "true";
  } else {
    delete document.documentElement.dataset.themeDark;
  }
}

export function applyThemeSettings(
  settings: ThemeSetting[],
  role?: string | null,
  mode?: "light" | "dark",
) {
  const themeKey = getThemeSettingKeyForRole(role);
  const themeValue =
    getSettingValue(settings, themeKey) ||
    getSettingValue(settings, "theme.admin_tweakcn");
  const parsedTheme = parseTweakCnTheme(themeValue);
  const primary = hexToHslColor(getSettingValue(settings, "theme.primary_color"));
  const secondary = hexToHslColor(getSettingValue(settings, "theme.secondary_color"));
  const overrides: Record<string, string> = {};

  if (primary && !parsedTheme.light.primary) {
    overrides.primary = primary;
  }
  if (secondary && !parsedTheme.light.secondary) {
    overrides.secondary = secondary;
  }

  applyTweakCnTheme(themeValue, mode, overrides);
  const customCss = valueToString(getSettingValue(settings, "theme.custom_css"));
  injectCustomCss(customCss);
  persistThemeCache(parsedTheme, overrides, customCss);
}

export function notifyThemeSettingsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(THEME_SETTINGS_CHANGED_EVENT));
}
