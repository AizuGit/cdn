import {
  debounce,
  generateUUID,
  getCurrentUrl,
  getEnhancedReferrer,
  getEnvVar,
  getPageTitle,
  getReferrer,
  getViewport,
  Logger,
  retryWithBackoff,
  SimpleStorage,
} from "../src/utils";

describe("Utils", () => {
  describe("generateUUID", () => {
    it("should generate valid UUID v4 format", () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it("should generate unique UUIDs", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe("getEnvVar", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should get Next.js public env var", () => {
      process.env.NEXT_PUBLIC_API_KEY = "next_key";
      expect(getEnvVar("API_KEY")).toBe("next_key");
    });

    it("should get Vite env var", () => {
      process.env.VITE_API_KEY = "vite_key";
      expect(getEnvVar("API_KEY")).toBe("vite_key");
    });

    it("should get React App env var", () => {
      process.env.REACT_APP_API_KEY = "react_key";
      expect(getEnvVar("API_KEY")).toBe("react_key");
    });

    it("should return undefined for non-existent var", () => {
      expect(getEnvVar("NON_EXISTENT_VAR")).toBeUndefined();
    });
  });

  describe("SimpleStorage", () => {
    let storage: SimpleStorage;

    beforeEach(() => {
      storage = new SimpleStorage();
    });

    it("should store and retrieve values", () => {
      storage.setItem("test_key", "test_value");
      expect(storage.getItem("test_key")).toBe("test_value");
    });

    it("should remove items", () => {
      storage.setItem("test_key", "test_value");
      storage.removeItem("test_key");
      expect(storage.getItem("test_key")).toBeNull();
    });

    it("should return null for non-existent items", () => {
      expect(storage.getItem("non_existent")).toBeNull();
    });

    it("should use fallback storage when localStorage is not available", () => {
      // Mock localStorage to throw error
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, "localStorage", {
        get: () => {
          throw new Error("localStorage not available");
        },
        configurable: true,
      });

      const fallbackStorage = new SimpleStorage();
      fallbackStorage.setItem("fallback_key", "fallback_value");
      expect(fallbackStorage.getItem("fallback_key")).toBe("fallback_value");

      // Restore localStorage
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
        configurable: true,
      });
    });
  });

  describe("getViewport", () => {
    it("should return viewport dimensions", () => {
      Object.defineProperty(window, "innerWidth", {
        value: 1920,
        writable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        value: 1080,
        writable: true,
      });

      const viewport = getViewport();
      expect(viewport).toEqual({ width: 1920, height: 1080 });
    });
  });

  describe("getCurrentUrl", () => {
    it.skip("should return current URL", () => {
      Object.defineProperty(window, "location", {
        value: { href: "https://example.com/page" },
        writable: true,
        configurable: true,
      });

      expect(getCurrentUrl()).toBe("https://example.com/page");
    });
  });

  describe("getReferrer", () => {
    it("should return document referrer", () => {
      Object.defineProperty(document, "referrer", {
        value: "https://google.com",
        writable: true,
        configurable: true,
      });

      expect(getReferrer()).toBe("https://google.com");
    });
  });

  describe("getPageTitle", () => {
    it("should return document title", () => {
      document.title = "Test Page Title";
      expect(getPageTitle()).toBe("Test Page Title");
    });

    it("should return empty string when title is not set", () => {
      document.title = "";
      expect(getPageTitle()).toBe("");
    });
  });

  describe.skip("getEnhancedReferrer", () => {
    beforeEach(() => {
      Object.defineProperty(window, "location", {
        value: { href: "https://example.com" },
        writable: true,
        configurable: true,
      });
    });

    it("should detect direct traffic", () => {
      Object.defineProperty(document, "referrer", {
        value: "",
        writable: true,
        configurable: true,
      });

      const result = getEnhancedReferrer();
      expect(result).toEqual({
        referrer: "",
        referrer_type: "direct",
      });
    });

    it("should detect internal traffic", () => {
      Object.defineProperty(document, "referrer", {
        value: "https://example.com/other-page",
        writable: true,
        configurable: true,
      });

      const result = getEnhancedReferrer();
      expect(result).toEqual({
        referrer: "https://example.com/other-page",
        referrer_type: "internal",
      });
    });

    it("should detect search engine traffic", () => {
      Object.defineProperty(document, "referrer", {
        value: "https://www.google.com/search?q=test",
        writable: true,
        configurable: true,
      });

      const result = getEnhancedReferrer();
      expect(result).toEqual({
        referrer: "https://www.google.com/search?q=test",
        referrer_type: "search",
        search_engine: "google",
      });
    });

    it("should detect social media traffic", () => {
      Object.defineProperty(document, "referrer", {
        value: "https://facebook.com/post/123",
        writable: true,
        configurable: true,
      });

      const result = getEnhancedReferrer();
      expect(result).toEqual({
        referrer: "https://facebook.com/post/123",
        referrer_type: "social",
      });
    });

    it("should detect external traffic", () => {
      Object.defineProperty(document, "referrer", {
        value: "https://external-site.com",
        writable: true,
        configurable: true,
      });

      const result = getEnhancedReferrer();
      expect(result).toEqual({
        referrer: "https://external-site.com",
        referrer_type: "external",
      });
    });
  });

  describe("debounce", () => {
    jest.useFakeTimers();

    it("should debounce function calls", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn("arg1");
      debouncedFn("arg2");
      debouncedFn("arg3");

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith("arg3");
    });

    it("should reset timer on each call", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      jest.advanceTimersByTime(50);
      debouncedFn();
      jest.advanceTimersByTime(50);
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("Logger", () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it("should log when debug is true", () => {
      const logger = new Logger(true);
      logger.log("test message", { data: "test" });

      expect(consoleLogSpy).toHaveBeenCalledWith("[Aizu]", "test message", {
        data: "test",
      });
    });

    it("should not log when debug is false", () => {
      const logger = new Logger(false);
      logger.log("test message");

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should always log errors", () => {
      const logger = new Logger(false);
      logger.error("error message");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Aizu Error]",
        "error message"
      );
    });

    it("should warn only when debug is true", () => {
      const debugLogger = new Logger(true);
      debugLogger.warn("warning message");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Aizu Warning]",
        "warning message"
      );

      consoleWarnSpy.mockClear();

      const prodLogger = new Logger(false);
      prodLogger.warn("warning message");
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe("retryWithBackoff", () => {
    it("should succeed on first attempt", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");
      const result = await retryWithBackoff(mockFn);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should not retry when shouldRetry returns false", async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error("Client error"));

      await expect(
        retryWithBackoff(mockFn, {
          shouldRetry: (error) => !error.message.includes("Client"),
        })
      ).rejects.toThrow("Client error");

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    // Note: More complex retry scenarios are tested through integration tests
    // in the Aizu class tests where the retry mechanism is used in real scenarios
  });
});
