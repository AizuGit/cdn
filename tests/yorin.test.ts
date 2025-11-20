import { Aizu } from "../src/aizu";
import { type AizuConfig, EVENT_TYPES } from "../src/types";

describe("Aizu SDK", () => {
  let aizu: Aizu;
  let mockConfig: AizuConfig;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = global.fetch as jest.Mock;
    mockConfig = {
      apiKey: "pk_test_123456789",
      apiUrl: "https://us.aizu.io",
      debug: false,
      enableBatching: false, // Disable batching for easier testing
    };
    aizu = new Aizu(mockConfig);
  });

  describe("Constructor", () => {
    it("should initialize with valid config", () => {
      expect(aizu).toBeInstanceOf(Aizu);
      expect(aizu.getSessionId()).toMatch(/^s_/);
      expect(aizu.getAnonymousId()).toMatch(/^a_/);
    });

    it("should throw error when API key is missing", () => {
      expect(() => new Aizu({ ...mockConfig, apiKey: "" })).toThrow(
        "Aizu API key is required."
      );
    });

    it("should throw error when API URL is missing", () => {
      expect(() => new Aizu({ ...mockConfig, apiUrl: "" })).toThrow(
        "Aizu API URL is required."
      );
    });

    it("should throw error when API key has invalid format", () => {
      expect(() => new Aizu({ ...mockConfig, apiKey: "invalid_key" })).toThrow(
        'Invalid API key format. Publishable keys should start with "pk_".'
      );
    });

    it("should throw error when API URL is invalid", () => {
      expect(() => new Aizu({ ...mockConfig, apiUrl: "not-a-url" })).toThrow(
        "Invalid API URL format."
      );
    });

    it("should use default values for optional config", () => {
      const minimalConfig = {
        apiKey: "pk_test_123",
        apiUrl: "https://us.aizu.io",
      };
      const minimalAizu = new Aizu(minimalConfig);
      expect(minimalAizu).toBeInstanceOf(Aizu);
    });
  });

  describe("init()", () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          settings: {
            autocapture_frontend_interactions: true,
            enable_heatmaps: false,
            enable_web_vitals_autocapture: false,
            cookieless_server_hash_mode: false,
            bounce_rate_duration: 10,
          },
        }),
      });
    });

    it("should initialize successfully", async () => {
      await aizu.init();
      expect(fetchMock).toHaveBeenCalledWith(
        "https://us.aizu.io/v1/settings",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer pk_test_123456789",
          }),
        })
      );
    });

    it("should not initialize twice", async () => {
      await aizu.init();
      const callCount = fetchMock.mock.calls.length;
      await aizu.init();
      expect(fetchMock).toHaveBeenCalledTimes(callCount);
    });

    it("should handle settings fetch failure gracefully", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));
      await expect(aizu.init()).resolves.not.toThrow();
    });
  });

  describe("pageview()", () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: "Event received" }),
      });
    });

    it("should send pageview event with default properties", async () => {
      await aizu.pageview();

      expect(fetchMock).toHaveBeenCalledWith(
        "https://us.aizu.io/v1/events",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining(`"type":"${EVENT_TYPES.PAGEVIEW}"`),
        })
      );
    });

    it("should send pageview with custom properties", async () => {
      await aizu.pageview({
        url: "https://example.com/page",
        title: "Test Page",
        custom_prop: "custom_value",
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.properties).toMatchObject({
        page_title: "Test Page",
        custom_prop: "custom_value",
      });
    });

    it("should prevent duplicate pageviews within 3 seconds", async () => {
      // Mock Date.now to control timing
      const originalNow = Date.now;
      let currentTime = 1000000;
      Date.now = jest.fn(() => currentTime);

      // First pageview
      await aizu.pageview({ url: "https://example.com/page" });
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Second pageview within 3 seconds - should be skipped
      currentTime += 2000; // 2 seconds later
      await aizu.pageview({ url: "https://example.com/page" });
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Third pageview after 3 seconds - should be sent
      currentTime += 2000; // 4 seconds total
      await aizu.pageview({ url: "https://example.com/page" });
      expect(fetchMock).toHaveBeenCalledTimes(2);

      Date.now = originalNow;
    });
  });

  describe("track()", () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: "Event received" }),
      });
    });

    it("should send custom event", async () => {
      await aizu.track("button_clicked", {
        button_id: "submit_btn",
        page: "/checkout",
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.type).toBe(EVENT_TYPES.CUSTOM);
      expect(callBody.properties).toMatchObject({
        event_name: "button_clicked",
        button_id: "submit_btn",
        page: "/checkout",
      });
    });
  });

  describe("identify()", () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: "Event received" }),
      });
    });

    it("should send identify event with user properties", async () => {
      await aizu.identify("user_123", {
        $email: "test@example.com",
        $first_name: "John",
        $last_name: "Doe",
        custom_field: "custom_value",
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.type).toBe(EVENT_TYPES.IDENTIFY);
      expect(callBody.properties).toMatchObject({
        $user_id: "user_123",
        $email: "test@example.com",
        $first_name: "John",
        $last_name: "Doe",
        custom_field: "custom_value",
      });
    });

    it("should handle legacy email and name properties", async () => {
      await aizu.identify("user_456", {
        email: "legacy@example.com",
        name: "Legacy User",
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.properties).toMatchObject({
        $user_id: "user_456",
        $email: "legacy@example.com",
        $full_name: "Legacy User",
      });
    });
  });

  describe("groupIdentify()", () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: "Event received" }),
      });
    });

    it("should send group identify event", async () => {
      await aizu.groupIdentify("company_123", {
        $name: "Acme Corp",
        $industry: "Technology",
        employee_count: 100,
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.type).toBe(EVENT_TYPES.GROUP_IDENTIFY);
      expect(callBody.properties).toMatchObject({
        group_id: "company_123",
        $name: "Acme Corp",
        $industry: "Technology",
        employee_count: 100,
      });
    });
  });

  describe("Session Management", () => {
    it("should reset session", () => {
      const originalSessionId = aizu.getSessionId();
      aizu.resetSession();
      const newSessionId = aizu.getSessionId();

      expect(newSessionId).not.toBe(originalSessionId);
      expect(newSessionId).toMatch(/^s_/);
    });

    it("should reset anonymous ID", () => {
      const originalAnonymousId = aizu.getAnonymousId();
      aizu.resetAnonymousId();
      const newAnonymousId = aizu.getAnonymousId();

      expect(newAnonymousId).not.toBe(originalAnonymousId);
      expect(newAnonymousId).toMatch(/^a_/);
    });
  });

  describe("Batching", () => {
    let batchingAizu: Aizu;

    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: "Events received" }),
      });

      batchingAizu = new Aizu({
        ...mockConfig,
        enableBatching: true,
        batchSize: 3,
        flushInterval: 10000, // High interval to control flushing manually
      });
    });

    it("should batch events until batch size is reached", async () => {
      // Send 2 events - should not trigger send
      await batchingAizu.track("event1");
      await batchingAizu.track("event2");
      expect(fetchMock).not.toHaveBeenCalled();
      expect(batchingAizu.getBatchSize()).toBe(2);

      // Send 3rd event - should trigger batch send
      await batchingAizu.track("event3");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(batchingAizu.getBatchSize()).toBe(0);
    });

    it("should manually flush batch", async () => {
      await batchingAizu.track("event1");
      await batchingAizu.track("event2");
      expect(fetchMock).not.toHaveBeenCalled();

      await batchingAizu.flush();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(batchingAizu.getBatchSize()).toBe(0);
    });

    it("should handle large batches by splitting them", async () => {
      const events = Array(1001)
        .fill(null)
        .map((_, i) => ({
          type: EVENT_TYPES.CUSTOM,
          apiKey: "pk_test_123456789",
          href: "https://example.com",
          anonymousId: "test_anon",
          sessionId: "test_session",
          properties: { event_name: `event_${i}` },
        }));

      await batchingAizu.trackBatch(events);
      expect(fetchMock).toHaveBeenCalledTimes(2); // Split into 2 batches
    });
  });

  describe("Error Handling and Retry", () => {
    it("should retry on 5xx errors", async () => {
      fetchMock
        .mockRejectedValueOnce(new Error("HTTP 500: Internal Server Error"))
        .mockRejectedValueOnce(new Error("HTTP 503: Service Unavailable"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: "Event received" }),
        });

      await aizu.track("test_event");
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("should not retry on 4xx errors", async () => {
      fetchMock.mockRejectedValueOnce(new Error("HTTP 400: Bad Request"));

      await aizu.track("test_event");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("should not retry on domain validation errors", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Invalid domain"));

      await aizu.track("test_event");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("should give up after max retries", async () => {
      fetchMock.mockRejectedValue(new Error("HTTP 500: Internal Server Error"));

      await aizu.track("test_event");
      expect(fetchMock).toHaveBeenCalledTimes(4); // Initial + 3 retries
    }, 10000); // Increase timeout for retry test
  });

  describe("Event Sanitization", () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: "Event received" }),
      });
    });

    it("should sanitize long URLs", async () => {
      const longUrl = "https://example.com/" + "a".repeat(3000);
      await aizu.pageview({ url: longUrl });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.href.length).toBe(2048);
    });

    it("should limit number of properties", async () => {
      const properties: Record<string, any> = {};
      for (let i = 0; i < 150; i++) {
        properties[`prop_${i}`] = `value_${i}`;
      }

      await aizu.track("test_event", properties);

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(Object.keys(callBody.properties).length).toBeLessThanOrEqual(101); // 100 custom + event_name
    });

    it("should truncate long string values", async () => {
      const longString = "x".repeat(1500);
      await aizu.track("test_event", { long_value: longString });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.properties.long_value.length).toBe(1000);
    });
  });
});
