export type SessionId = string & { readonly brand: unique symbol };
export type AnonymousId = string & { readonly brand: unique symbol };
export type PublishableKey = string & { readonly brand: unique symbol };

export const EVENT_TYPES = {
  PAGEVIEW: "pageview",
  CUSTOM: "custom_events",
  IDENTIFY: "identify",
  GROUP_IDENTIFY: "groupIdentify",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export interface AizuConfig {
  apiKey: string;
  apiUrl: string;
  autoTrackPageviews?: boolean;
  autoTrackClicks?: boolean;
  debug?: boolean;
  sessionTimeout?: number;
  batchSize?: number;
  flushInterval?: number;
  enableBatching?: boolean;
}

export interface AizuEvent {
  type: EventType;
  apiKey: string;
  href?: string;
  referrer?: string;
  viewport?: {
    width?: number;
    height?: number;
  };
  anonymousId?: string;
  sessionId?: string;
  adClickIds?: Record<string, string>;
  extraData?: Record<string, any>;
  properties?: Record<string, any>;
}

export interface TrackEventProperties {
  [key: string]: any;
}

export interface IdentifyProperties {
  $user_id?: string;
  $email?: string;
  $first_name?: string;
  $last_name?: string;
  $full_name?: string;
  $phone?: string;
  $company?: string;
  $job_title?: string;
  $avatar_url?: string;
  email?: string;
  name?: string;

  [key: string]: any;
}

export interface GroupIdentifyProperties {
  $name?: string;
  $description?: string;
  $company?: string;
  $website?: string;
  $industry?: string;
  $size?: string;
  $email?: string;
  $phone?: string;

  name?: string;

  [key: string]: any;
}

export interface PageviewProperties {
  url?: string;
  title?: string;
  referrer?: string;
  [key: string]: any;
}

export interface AizuResponse {
  success: boolean;
  message: string;
}

export interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface AnalyticsSettings {
  readonly autocapture_frontend_interactions: boolean;
  readonly enable_heatmaps: boolean;
  readonly enable_web_vitals_autocapture: boolean;
  readonly cookieless_server_hash_mode: boolean;
  readonly bounce_rate_duration: number;
}

export interface SettingsResponse {
  readonly success: boolean;
  readonly settings?: AnalyticsSettings;
  readonly message?: string;
}
