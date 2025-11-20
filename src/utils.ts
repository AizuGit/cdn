import type { StorageInterface } from "./types";

// Generate a random UUID v4
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Get environment variables based on the framework
export function getEnvVar(key: string): string | undefined {
  // Check different framework patterns
  if (typeof process !== "undefined" && process.env) {
    // Next.js
    if (process.env[`NEXT_PUBLIC_${key}`]) {
      return process.env[`NEXT_PUBLIC_${key}`];
    }
    // Vite
    if (process.env[`VITE_${key}`]) {
      return process.env[`VITE_${key}`];
    }
    // Create React App
    if (process.env[`REACT_APP_${key}`]) {
      return process.env[`REACT_APP_${key}`];
    }
    // Node.js/general
    if (process.env[key]) {
      return process.env[key];
    }
  }

  // Vite runtime env (import.meta.env)
  if (typeof window !== "undefined" && (window as any).import?.meta?.env) {
    const env = (window as any).import.meta.env;
    if (env[`VITE_${key}`]) {
      return env[`VITE_${key}`];
    }
  }

  return undefined;
}

// Simple localStorage wrapper with fallback
export class SimpleStorage implements StorageInterface {
  private fallbackStorage: Map<string, string> = new Map();
  private useLocalStorage: boolean;

  constructor() {
    this.useLocalStorage = this.isLocalStorageAvailable();
  }

  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return false;
      }
      const test = "__aizu_test__";
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (this.useLocalStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        // Fall through to fallback
      }
    }
    return this.fallbackStorage.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.useLocalStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // Fall through to fallback
      }
    }
    this.fallbackStorage.set(key, value);
  }

  removeItem(key: string): void {
    if (this.useLocalStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        // Fall through to fallback
      }
    }
    this.fallbackStorage.delete(key);
  }
}

// Get current viewport dimensions
export function getViewport(): { width?: number; height?: number } {
  if (typeof window === "undefined") {
    return {};
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

// Get current URL
export function getCurrentUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.href;
}

// Get current page title
export function getCurrentTitle(): string {
  if (typeof document === "undefined") {
    return "";
  }
  return document.title;
}

// Get referrer
export function getReferrer(): string {
  if (typeof document === "undefined") {
    return "";
  }
  return document.referrer;
}

// Get page title
export function getPageTitle(): string {
  if (typeof document === "undefined") {
    return "";
  }
  return document.title || "";
}

// Enhanced referrer detection with source classification
export function getEnhancedReferrer(): {
  referrer: string;
  referrer_type: string;
  search_engine?: string;
} {
  if (typeof document === "undefined") {
    return { referrer: "", referrer_type: "direct" };
  }

  const referrer = document.referrer || "";

  // No referrer = direct visit
  if (!referrer) {
    return { referrer: "", referrer_type: "direct" };
  }

  try {
    const referrerUrl = new URL(referrer);
    const currentUrl = new URL(window.location.href);

    // Same domain = internal
    if (referrerUrl.hostname === currentUrl.hostname) {
      return { referrer, referrer_type: "internal" };
    }

    // Check for search engines
    const searchEngines = {
      google: [
        "google.com",
        "google.co.uk",
        "google.ca",
        "google.de",
        "google.fr",
        "google.it",
        "google.es",
        "google.com.br",
        "google.co.jp",
        "google.co.in",
      ],
      bing: ["bing.com"],
      yahoo: ["yahoo.com", "search.yahoo.com"],
      duckduckgo: ["duckduckgo.com"],
      yandex: ["yandex.com", "yandex.ru"],
      baidu: ["baidu.com"],
      ask: ["ask.com"],
      aol: ["search.aol.com"],
    };

    for (const [engine, domains] of Object.entries(searchEngines)) {
      if (domains.some((domain) => referrerUrl.hostname.includes(domain))) {
        return { referrer, referrer_type: "search", search_engine: engine };
      }
    }

    // Check for social media
    const socialMedia = [
      "facebook.com",
      "twitter.com",
      "x.com",
      "linkedin.com",
      "instagram.com",
      "pinterest.com",
      "reddit.com",
      "tiktok.com",
      "youtube.com",
    ];
    if (socialMedia.some((domain) => referrerUrl.hostname.includes(domain))) {
      return { referrer, referrer_type: "social" };
    }

    // Everything else is external
    return { referrer, referrer_type: "external" };
  } catch {
    // Invalid URL, treat as direct
    return { referrer: "", referrer_type: "direct" };
  }
}

// Debounce function for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Simple logger
export class Logger {
  private debug: boolean;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  log(...args: any[]): void {
    if (this.debug && typeof console !== "undefined") {
      console.log("[Aizu]", ...args);
    }
  }

  error(...args: any[]): void {
    if (typeof console !== "undefined") {
      console.error("[Aizu Error]", ...args);
    }
  }

  warn(...args: any[]): void {
    if (this.debug && typeof console !== "undefined") {
      console.warn("[Aizu Warning]", ...args);
    }
  }
}

// Retry with exponential backoff
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't delay after the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Calculate next delay with backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}
