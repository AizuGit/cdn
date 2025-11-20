import type {
  AizuConfig,
  AizuEvent,
  AizuResponse,
  AnalyticsSettings,
  AnonymousId,
  GroupIdentifyProperties,
  IdentifyProperties,
  PageviewProperties,
  SessionId,
  SettingsResponse,
  StorageInterface,
  TrackEventProperties,
} from "./types";
import { EVENT_TYPES } from "./types";
import {
  debounce,
  generateUUID,
  getCurrentUrl,
  getEnhancedReferrer,
  getPageTitle,
  getReferrer,
  getViewport,
  Logger,
  retryWithBackoff,
  SimpleStorage,
} from "./utils";

/**
 * Aizu Analytics SDK - Track user interactions and events in your web application
 */
export class Aizu {
  private config: Required<AizuConfig>;
  private storage: StorageInterface;
  private logger: Logger;
  private sessionId: SessionId;
  private anonymousId: AnonymousId;
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;
  private isInitialized: boolean = false;
  private settings: AnalyticsSettings | null = null;
  private eventBatch: AizuEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: AizuConfig) {
    // Validate required config
    if (!config.apiKey) {
      throw new Error("Aizu API key is required.");
    }

    if (!config.apiUrl) {
      throw new Error("Aizu API URL is required.");
    }

    // Validate publishable key format (should start with pk_)
    if (!config.apiKey.startsWith("pk_")) {
      throw new Error(
        'Invalid API key format. Publishable keys should start with "pk_".'
      );
    }

    // Validate API URL format
    try {
      new URL(config.apiUrl);
    } catch {
      throw new Error("Invalid API URL format.");
    }

    this.config = {
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      autoTrackPageviews: config.autoTrackPageviews ?? true,
      autoTrackClicks: config.autoTrackClicks ?? false,
      debug: config.debug ?? false,
      sessionTimeout: config.sessionTimeout ?? 30 * 60 * 1000, // 30 minutes
      batchSize: config.batchSize ?? 20, // Batch 20 events before sending
      flushInterval: config.flushInterval ?? 1000, // Flush every 1 second when events are queued
      enableBatching: config.enableBatching ?? true, // Enable batching by default
    };

    this.storage = new SimpleStorage();
    this.logger = new Logger(this.config.debug);

    // Initialize session and anonymous IDs
    this.sessionId = this.getOrCreateSessionId();
    this.anonymousId = this.getOrCreateAnonymousId();

    this.logger.log("Aizu initialized with config:", {
      apiKey: this.config.apiKey.substring(0, 8) + "...",
      apiUrl: this.config.apiUrl,
      autoTrackPageviews: this.config.autoTrackPageviews,
      autoTrackClicks: this.config.autoTrackClicks,
    });
  }

  /**
   * Initialize the SDK and start auto-tracking
   * @returns Promise that resolves when initialization is complete
   * @example
   * const aizu = new Aizu(config);
   * await aizu.init();
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn("Aizu already initialized");
      return;
    }

    this.isInitialized = true;
    this.startSessionTimer();

    // Start batching timer if enabled
    if (this.config.enableBatching) {
      this.startFlushTimer();
    }

    // Setup page unload handler to flush events
    this.setupUnloadHandler();

    // Fetch analytics settings from server
    await this.fetchSettings();

    // Auto-track pageview on initialization
    if (this.shouldAutoTrackPageviews()) {
      this.pageview();
    }

    // Auto-track clicks if enabled
    if (this.shouldAutoTrackClicks()) {
      this.setupClickTracking();
    }

    // Track pageviews on navigation (for SPAs)
    this.setupNavigationTracking();

    this.logger.log("Aizu auto-tracking started");
  }

  /**
   * Track a pageview event
   * @param properties - Optional custom properties for the pageview
   * @returns Promise that resolves when the event is sent
   * @example
   * await aizu.pageview({ title: 'Homepage', category: 'marketing' });
   */
  public async pageview(properties?: PageviewProperties): Promise<void> {
    const currentUrl = properties?.url ?? getCurrentUrl();

    // Prevent duplicate pageviews for the same URL within a short time
    // Use persistent storage to track across page refreshes
    const now = Date.now();
    const storageKey = "aizu_last_pageview";
    const lastPageviewData = this.storage.getItem(storageKey);

    if (lastPageviewData) {
      const [lastUrl, lastTimeStr] = lastPageviewData.split("_");
      const lastTime = parseInt(lastTimeStr ?? "0") || 0;
      const timeSinceLastPageview = now - lastTime;

      if (lastUrl === currentUrl && timeSinceLastPageview < 3000) {
        // 3 seconds to handle refresh delays
        this.logger.log(
          "Skipping duplicate pageview within 3 seconds for:",
          currentUrl,
          "time since last:",
          timeSinceLastPageview + "ms"
        );
        return;
      }
    }

    // Store the current pageview info for future deduplication
    this.storage.setItem(storageKey, `${currentUrl}_${now}`);

    // Get enhanced referrer information
    const enhancedReferrer = getEnhancedReferrer();

    this.logger.log("Enhanced referrer data:", enhancedReferrer);

    const event: AizuEvent = {
      type: EVENT_TYPES.PAGEVIEW,
      apiKey: this.config.apiKey,
      href: currentUrl,
      referrer: properties?.referrer ?? enhancedReferrer.referrer,
      viewport: getViewport(),
      anonymousId: this.anonymousId,
      sessionId: this.sessionId,
      properties: {
        page_title: properties?.title ?? getPageTitle(),
        referrer_type: enhancedReferrer.referrer_type,
        ...(enhancedReferrer.search_engine && {
          search_engine: enhancedReferrer.search_engine,
        }),
        ...properties,
      },
    };

    this.logger.log("Sending pageview event:", event);

    await this.queueOrSendEvent(event);
  }

  /**
   * Track a custom event
   * @param eventName - The name of the event to track
   * @param properties - Optional properties to include with the event
   * @returns Promise that resolves when the event is sent
   * @example
   * await aizu.track('button_clicked', { button_id: 'cta-signup' });
   */
  public async track(
    eventName: string,
    properties?: TrackEventProperties
  ): Promise<void> {
    const event: AizuEvent = {
      type: EVENT_TYPES.CUSTOM,
      apiKey: this.config.apiKey,
      href: getCurrentUrl(),
      referrer: getReferrer(),
      viewport: getViewport(),
      anonymousId: this.anonymousId,
      sessionId: this.sessionId,
      properties: {
        event_name: eventName,
        ...properties,
      },
    };

    await this.queueOrSendEvent(event);
  }

  /**
   * Send a custom event with properties (alias for track)
   * @param eventName - The name of the event
   * @param properties - Optional properties to include
   * @returns Promise that resolves when the event is sent
   * @example
   * await aizu.event('purchase_completed', { amount: 99.99 });
   */
  public async event(
    eventName: string,
    properties?: Record<string, any>
  ): Promise<void> {
    const event: AizuEvent = {
      type: EVENT_TYPES.CUSTOM,
      apiKey: this.config.apiKey,
      href: getCurrentUrl(),
      referrer: getReferrer(),
      viewport: getViewport(),
      anonymousId: this.anonymousId,
      sessionId: this.sessionId,
      properties: {
        event_name: eventName,
        ...properties,
      },
    };

    await this.queueOrSendEvent(event);
  }

  /**
   * Identify a user and associate properties with them
   * Creates or updates a contact record for authenticated users only
   * @param userId - Required unique identifier for the user
   * @param properties - User properties to store (email is optional)
   * @returns Promise that resolves when the identification is sent
   * @example
   * await aizu.identify('user_123', {
   *   $email: 'user@example.com',
   *   $first_name: 'John',
   *   subscription_tier: 'pro'
   * });
   */
  public async identify(
    userId: string,
    properties?: IdentifyProperties
  ): Promise<void> {
    // Process properties to handle legacy support and ensure proper $-prefixed format
    const processedProperties: Record<string, any> = {};

    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle legacy properties by converting to $-prefixed format
          if (key === "email" && !("$email" in properties)) {
            processedProperties["$email"] = value;
          } else if (key === "name" && !("$full_name" in properties)) {
            processedProperties["$full_name"] = value;
          } else {
            // Keep original property as-is
            processedProperties[key] = value;
          }
        }
      });
    }

    // Add user_id as $user_id (required for contact creation)
    processedProperties["$user_id"] = userId;

    const event: AizuEvent = {
      type: EVENT_TYPES.IDENTIFY,
      apiKey: this.config.apiKey,
      href: getCurrentUrl(),
      anonymousId: this.anonymousId,
      sessionId: this.sessionId,
      properties: processedProperties,
    };

    this.logger.log("Sending identify event:", event);
    await this.queueOrSendEvent(event);
  }

  /**
   * Associate a user with a group (e.g., company, organization)
   * @param groupId - Unique identifier for the group
   * @param properties - Group properties to store
   * @returns Promise that resolves when the group identification is sent
   * @example
   * await aizu.groupIdentify('company_456', {
   *   $name: 'Acme Corp',
   *   $industry: 'Technology',
   *   employee_count: 500
   * });
   */
  public async groupIdentify(
    groupId: string,
    properties?: GroupIdentifyProperties
  ): Promise<void> {
    // Process properties to handle legacy support and ensure proper $-prefixed format
    const processedProperties: Record<string, any> = {
      group_id: groupId,
    };

    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle legacy properties by converting to $-prefixed format
          if (key === "name" && !("$name" in properties)) {
            processedProperties["$name"] = value;
          } else {
            // Keep original property as-is
            processedProperties[key] = value;
          }
        }
      });
    }

    const event: AizuEvent = {
      type: EVENT_TYPES.GROUP_IDENTIFY,
      apiKey: this.config.apiKey,
      href: getCurrentUrl(),
      anonymousId: this.anonymousId,
      sessionId: this.sessionId,
      properties: processedProperties,
    };

    this.logger.log("Sending groupIdentify event:", event);
    await this.queueOrSendEvent(event);
  }

  /**
   * Send multiple events in a single batch request
   * @param events - Array of events to send
   * @returns Promise that resolves when all events are sent
   * @example
   * await aizu.trackBatch([
   *   { type: 'pageview', apiKey: 'pk_...', properties: {...} },
   *   { type: 'custom_events', apiKey: 'pk_...', properties: {...} }
   * ]);
   */
  public async trackBatch(events: AizuEvent[]): Promise<void> {
    if (events.length === 0) {
      this.logger.warn("Cannot send empty batch");
      return;
    }

    if (events.length > 1000) {
      this.logger.warn("Batch size too large, splitting into smaller batches");
      const chunks = this.chunkArray(events, 1000);
      for (const chunk of chunks) {
        await this.sendBatch(chunk);
      }
      return;
    }

    await this.sendBatch(events);
  }

  /**
   * Get the current session ID
   * @returns The current session identifier
   */
  public getSessionId(): SessionId {
    return this.sessionId;
  }

  /**
   * Get the current anonymous user ID
   * @returns The anonymous user identifier
   */
  public getAnonymousId(): AnonymousId {
    return this.anonymousId;
  }

  /**
   * Reset the current session and generate a new session ID
   * Useful for handling user logout or session expiry
   */
  public resetSession(): void {
    this.sessionId = this.createSessionId();
    this.storage.setItem("aizu_session_id", this.sessionId);
    this.storage.setItem("aizu_session_timestamp", Date.now().toString());
    this.logger.log("Session reset:", this.sessionId);
  }

  /**
   * Reset the anonymous ID and generate a new one
   * Useful for handling user logout or privacy requirements
   */
  public resetAnonymousId(): void {
    this.anonymousId = this.createAnonymousId();
    this.storage.setItem("aizu_anonymous_id", this.anonymousId);
    this.logger.log("Anonymous ID reset:", this.anonymousId);
  }

  /**
   * Get the current analytics settings from the server
   * @returns The analytics settings or null if not loaded
   */
  public getSettings(): AnalyticsSettings | null {
    return this.settings;
  }

  /**
   * Manually flush all queued events immediately
   * @returns Promise that resolves when all events are sent
   * @example
   * // Send all queued events before page navigation
   * await aizu.flush();
   */
  public async flush(): Promise<void> {
    if (this.eventBatch.length > 0) {
      await this.sendBatch([...this.eventBatch]);
      this.eventBatch = [];
      this.logger.log("Manual flush completed, batch cleared");
    }
  }

  /**
   * Get the current number of events in the batch queue
   * @returns Number of events currently queued
   */
  public getBatchSize(): number {
    return this.eventBatch.length;
  }

  // Private methods

  private async queueOrSendEvent(event: AizuEvent): Promise<void> {
    // Skip events during SSR or when we don't have proper browser context
    if (typeof window === "undefined" || !event.href || event.href === "") {
      this.logger.log(
        "Skipping event during SSR or invalid context:",
        event.type
      );
      return;
    }

    if (!this.config.enableBatching) {
      // Send immediately if batching is disabled
      await this.sendEvent(event);
      return;
    }

    // Add to batch
    this.eventBatch.push(event);
    this.logger.log(
      `Event queued, batch size: ${this.eventBatch.length}/${this.config.batchSize}`
    );

    // Flush if batch is full
    if (this.eventBatch.length >= this.config.batchSize) {
      await this.flushBatch();
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.eventBatch.length === 0) {
      return;
    }

    const batch = [...this.eventBatch];
    this.eventBatch = [];

    this.logger.log(`Flushing batch of ${batch.length} events`);
    await this.sendBatch(batch);
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(async () => {
      if (this.eventBatch.length > 0) {
        this.logger.log(`Timer flush: ${this.eventBatch.length} events`);
        await this.flushBatch();
      }
    }, this.config.flushInterval);
  }

  private setupUnloadHandler(): void {
    if (typeof window === "undefined") {
      return;
    }

    const flushOnUnload = async () => {
      if (this.eventBatch.length > 0) {
        this.logger.log("Page unload - flushing remaining events");

        // Use sendBeacon for better reliability on page unload
        if (navigator.sendBeacon) {
          const events = [...this.eventBatch];
          this.eventBatch = [];

          try {
            const sanitizedEvents = events.map((event) =>
              this.sanitizeEvent(event)
            );
            const blob = new Blob([JSON.stringify(sanitizedEvents)], {
              type: "application/json",
            });

            navigator.sendBeacon(`${this.config.apiUrl}/v1/events`, blob);
            this.logger.log("Events sent via sendBeacon on page unload");
          } catch (error) {
            this.logger.error("Failed to send events via sendBeacon:", error);
          }
        } else {
          // Fallback to regular flush
          await this.flushBatch();
        }
      }
    };

    // Multiple unload events for better coverage
    window.addEventListener("beforeunload", flushOnUnload);
    window.addEventListener("pagehide", flushOnUnload);

    // Also flush on visibility change (when user switches tabs)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && this.eventBatch.length > 0) {
        this.logger.log("Page hidden - flushing events");
        this.flushBatch();
      }
    });
  }

  private async fetchSettings(): Promise<void> {
    // Try to load from cache first
    const cachedSettings = this.getCachedSettings();
    if (cachedSettings) {
      this.settings = cachedSettings;
      this.logger.log("Analytics settings loaded from cache:", this.settings);
      return;
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/v1/settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: SettingsResponse = await response.json();

      if (result.success && result.settings) {
        this.settings = result.settings;
        this.cacheSettings(result.settings);
        this.logger.log(
          "Analytics settings loaded from server:",
          this.settings
        );
      } else {
        this.logger.warn("Failed to load analytics settings:", result.message);
        // Use defaults if server settings fail
        this.settings = this.getDefaultSettings();
      }
    } catch (error) {
      this.logger.error("Failed to fetch analytics settings:", error);
      // Use defaults if settings fetch fails
      this.settings = this.getDefaultSettings();
    }
  }

  private getDefaultSettings(): AnalyticsSettings {
    return {
      autocapture_frontend_interactions: true,
      enable_heatmaps: false,
      enable_web_vitals_autocapture: false,
      cookieless_server_hash_mode: false,
      bounce_rate_duration: 10,
    };
  }

  private shouldAutoTrackPageviews(): boolean {
    return (
      this.config.autoTrackPageviews &&
      (this.settings?.autocapture_frontend_interactions ?? true)
    );
  }

  private shouldAutoTrackClicks(): boolean {
    return (
      this.config.autoTrackClicks &&
      (this.settings?.autocapture_frontend_interactions ?? true)
    );
  }

  private getCachedSettings(): AnalyticsSettings | null {
    try {
      const cacheKey = `aizu_settings_${this.config.apiKey}`;
      const cached = this.storage.getItem(cacheKey);
      if (!cached) {
        return null;
      }

      const parsedCache = JSON.parse(cached);
      const now = Date.now();

      // Cache for 5 minutes (300,000ms)
      if (now - parsedCache.timestamp > 300000) {
        this.storage.removeItem(cacheKey);
        return null;
      }

      return parsedCache.settings;
    } catch (error) {
      this.logger.warn("Failed to parse cached settings:", error);
      return null;
    }
  }

  private cacheSettings(settings: AnalyticsSettings): void {
    try {
      const cacheKey = `aizu_settings_${this.config.apiKey}`;
      const cacheData = {
        settings,
        timestamp: Date.now(),
      };
      this.storage.setItem(cacheKey, JSON.stringify(cacheData));
      this.logger.log("Analytics settings cached for 5 minutes");
    } catch (error) {
      this.logger.warn("Failed to cache settings:", error);
    }
  }

  private async sendEvent(event: AizuEvent): Promise<void> {
    try {
      // Sanitize event data before sending
      const sanitizedEvent = this.sanitizeEvent(event);

      await retryWithBackoff(
        async () => {
          const response = await fetch(`${this.config.apiUrl}/v1/events`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(typeof window !== "undefined" && {
                Origin: window.location.origin,
                Referer: window.location.href,
              }),
            },
            body: JSON.stringify(sanitizedEvent),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result: AizuResponse = await response.json();

          if (!result.success) {
            throw new Error(result.message);
          }

          this.logger.log("Event sent successfully:", event.type);
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          shouldRetry: (error) => {
            // Don't retry on client errors (4xx)
            if (error instanceof Error && error.message.includes("HTTP 4")) {
              return false;
            }
            // Don't retry on domain validation errors
            if (
              error instanceof Error &&
              error.message.includes("Invalid domain")
            ) {
              return false;
            }
            return true;
          },
        }
      );
    } catch (error) {
      // Handle domain validation errors silently for better UX
      if (error instanceof Error && error.message.includes("Invalid domain")) {
        this.logger.warn(
          "Domain validation failed - this is normal during development or SSR:",
          error.message
        );
      } else {
        this.logger.error("Failed to send event after retries:", error);
      }
      // Don't throw error to avoid breaking the application
    }
  }

  private async sendBatch(events: AizuEvent[]): Promise<void> {
    try {
      // Sanitize all events in the batch
      const sanitizedEvents = events.map((event) => this.sanitizeEvent(event));

      await retryWithBackoff(
        async () => {
          const response = await fetch(`${this.config.apiUrl}/v1/events`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(typeof window !== "undefined" && {
                Origin: window.location.origin,
                Referer: window.location.href,
              }),
            },
            body: JSON.stringify(sanitizedEvents),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result: AizuResponse = await response.json();

          if (!result.success) {
            throw new Error(result.message);
          }

          this.logger.log("Batch sent successfully:", events.length, "events");
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          shouldRetry: (error) => {
            // Don't retry on client errors (4xx)
            if (error instanceof Error && error.message.includes("HTTP 4")) {
              return false;
            }
            // Don't retry on domain validation errors
            if (
              error instanceof Error &&
              error.message.includes("Invalid domain")
            ) {
              return false;
            }
            return true;
          },
        }
      );
    } catch (error) {
      // Handle domain validation errors silently for better UX
      if (error instanceof Error && error.message.includes("Invalid domain")) {
        this.logger.warn(
          "Domain validation failed - this is normal during development or SSR:",
          error.message
        );
      } else {
        this.logger.error("Failed to send batch after retries:", error);
      }
    }
  }

  private getOrCreateSessionId(): SessionId {
    const existing = this.storage.getItem("aizu_session_id");
    const timestamp = this.storage.getItem("aizu_session_timestamp");

    if (existing && timestamp) {
      const sessionAge = Date.now() - parseInt(timestamp);
      if (sessionAge < this.config.sessionTimeout) {
        // Update timestamp
        this.storage.setItem("aizu_session_timestamp", Date.now().toString());
        return existing as SessionId;
      }
    }

    // Create new session
    const sessionId = this.createSessionId();
    this.storage.setItem("aizu_session_id", sessionId);
    this.storage.setItem("aizu_session_timestamp", Date.now().toString());
    return sessionId;
  }

  private getOrCreateAnonymousId(): AnonymousId {
    const existing = this.storage.getItem("aizu_anonymous_id");
    if (existing) {
      return existing as AnonymousId;
    }

    const anonymousId = this.createAnonymousId();
    this.storage.setItem("aizu_anonymous_id", anonymousId);
    return anonymousId;
  }

  private createSessionId(): SessionId {
    return `s_${generateUUID()}` as SessionId;
  }

  private createAnonymousId(): AnonymousId {
    return `a_${generateUUID()}` as AnonymousId;
  }

  private startSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(() => {
      this.resetSession();
      this.startSessionTimer();
    }, this.config.sessionTimeout);
  }

  private setupNavigationTracking(): void {
    if (typeof window === "undefined") {
      return;
    }

    // Track history changes for SPAs
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const trackNavigation = debounce(() => {
      if (this.shouldAutoTrackPageviews()) {
        this.pageview();
      }
    }, 100);

    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      trackNavigation();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(window.history, args);
      trackNavigation();
    };

    // Also track popstate events
    window.addEventListener("popstate", trackNavigation);
  }

  private setupClickTracking(): void {
    if (typeof document === "undefined") {
      return;
    }

    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (!target) {
        return;
      }

      // Track clicks on elements with data-aizu-track attribute
      const trackAttribute = target.getAttribute("data-aizu-track");
      if (trackAttribute) {
        this.track("element_clicked", {
          element_type: target.tagName.toLowerCase(),
          element_text: target.textContent?.slice(0, 100) || "",
          element_id: target.id || undefined,
          element_classes: target.className || undefined,
          track_name: trackAttribute,
        });
      }
    });
  }

  private sanitizeEvent(event: AizuEvent): AizuEvent {
    const sanitized = { ...event };

    // Limit string lengths for security
    if (sanitized.href && sanitized.href.length > 2048) {
      sanitized.href = sanitized.href.substring(0, 2048);
    }

    if (sanitized.referrer && sanitized.referrer.length > 2048) {
      sanitized.referrer = sanitized.referrer.substring(0, 2048);
    }

    // Sanitize properties
    if (sanitized.properties) {
      const sanitizedProps: Record<string, any> = {};
      let propCount = 0;

      for (const [key, value] of Object.entries(sanitized.properties)) {
        if (propCount >= 100) {
          break;
        } // Limit to 100 properties

        // Sanitize key and value
        const sanitizedKey = key.substring(0, 100);
        let sanitizedValue = value;

        if (typeof value === "string" && value.length > 1000) {
          sanitizedValue = value.substring(0, 1000);
        }

        sanitizedProps[sanitizedKey] = sanitizedValue;
        propCount++;
      }

      sanitized.properties = sanitizedProps;
    }

    return sanitized;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
