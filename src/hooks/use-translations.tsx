"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  type Locale,
  translations,
  locales,
  localeNames,
  translateError as translateErrorFn,
} from "@/lib/translations";

interface TranslationContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translateError: (message: string) => string;
  locales: Locale[];
  localeNames: Record<Locale, string>;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

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
      console.warn(`Translation key not found: ${path}`);
      return path;
    }
  }

  return typeof result === "string" ? result : path;
}

/**
 * Replace placeholders in a string with provided values
 */
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;

  return text.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`;
  });
}

interface TranslationProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

export function TranslationProvider({
  children,
  defaultLocale = "en",
}: TranslationProviderProps) {
  const [locale, setLocale] = useState<Locale>(() => {
    // Try to get saved locale from localStorage (client-side only)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locale") as Locale | null;
      if (saved && locales.includes(saved)) {
        return saved;
      }
    }
    return defaultLocale;
  });

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const translationData = translations[locale];
      const text = getNestedValue(
        translationData as unknown as Record<string, unknown>,
        key
      );
      return interpolate(text, params);
    },
    [locale]
  );

  const translateError = useCallback(
    (message: string) => translateErrorFn(message, locale),
    [locale]
  );

  return (
    <TranslationContext.Provider
      value={{
        locale,
        setLocale: handleSetLocale,
        t,
        translateError,
        locales,
        localeNames,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

/**
 * Hook to access translation functions and locale settings
 */
export function useTranslations() {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error("useTranslations must be used within a TranslationProvider");
  }

  return context;
}

/**
 * Shorthand hook that returns just the translation function
 */
export function useT() {
  const { t } = useTranslations();
  return t;
}

