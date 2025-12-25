import en from "./en.json";
import es from "./es.json";

export type Locale = "en" | "es";

export const translations = {
  en,
  es,
} as const;

export type TranslationKeys = typeof en;

/**
 * Get a nested value from an object using a dot-notation path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return the path if key not found
    }
  }

  return typeof result === "string" ? result : path;
}

/**
 * Replace placeholders in a string with provided values
 * e.g., "Hello {name}" with { name: "World" } -> "Hello World"
 */
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;

  return text.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`;
  });
}

/**
 * Create a translation function for a specific locale
 */
export function createTranslator(locale: Locale = "en") {
  const t = translations[locale];

  return function translate(key: string, params?: Record<string, string | number>): string {
    const text = getNestedValue(t as unknown as Record<string, unknown>, key);
    return interpolate(text, params);
  };
}

/**
 * Default translator using English
 */
export const t = createTranslator("en");

/**
 * Get all available locales
 */
export const locales: Locale[] = ["en", "es"];

/**
 * Locale display names
 */
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

export { en, es };

