import { localVideoStorage } from "../media-local";

// Mock localforage
jest.mock("localforage", () => ({
  config: jest.fn(),
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  keys: jest.fn(),
}));

// Mock navigator.storage
Object.defineProperty(navigator, "storage", {
  value: {
    estimate: jest.fn().mockResolvedValue({
      usage: 1024 * 1024 * 100, // 100MB
      quota: 1024 * 1024 * 1024, // 1GB
    }),
  },
  writable: true,
});

describe("LocalVideoStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("storeVideoLocally", () => {
    it("should store video successfully", async () => {
      const mockFile = new File(["video content"], "test.mp4", {
        type: "video/mp4",
      });
      const propertyId = "test-property";

      const result = await localVideoStorage.storeVideoLocally(
        mockFile,
        propertyId
      );

      expect(result.success).toBe(true);
      expect(result.localKey).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.fileName).toBe("test.mp4");
      expect(result.metadata?.fileType).toBe("video/mp4");
    });

    it("should handle storage errors gracefully", async () => {
      const mockFile = new File(["video content"], "test.mp4", {
        type: "video/mp4",
      });
      const propertyId = "test-property";

      // Mock localforage to throw an error
      const localforage = require("localforage");
      localforage.setItem.mockRejectedValueOnce(
        new Error("QuotaExceededError")
      );

      const result = await localVideoStorage.storeVideoLocally(
        mockFile,
        propertyId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Local storage full");
    });

    it("should warn about iOS limitations", async () => {
      // Mock iOS user agent
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        writable: true,
      });

      const mockFile = new File(["video content"], "test.mp4", {
        type: "video/mp4",
      });
      const propertyId = "test-property";

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      await localVideoStorage.storeVideoLocally(mockFile, propertyId);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "iOS detected: Local video storage may be unreliable"
        )
      );

      consoleSpy.mockRestore();
    });
  });

  describe("getLocalVideoBlob", () => {
    it("should retrieve video blob successfully", async () => {
      const mockBlob = new Blob(["video content"], { type: "video/mp4" });
      const localKey = "test-key";

      const localforage = require("localforage");
      localforage.getItem.mockResolvedValueOnce(mockBlob);

      const result = await localVideoStorage.getLocalVideoBlob(localKey);

      expect(result).toBe(mockBlob);
      expect(localforage.getItem).toHaveBeenCalledWith(localKey);
    });

    it("should return null on error", async () => {
      const localKey = "test-key";

      const localforage = require("localforage");
      localforage.getItem.mockRejectedValueOnce(new Error("Storage error"));

      const result = await localVideoStorage.getLocalVideoBlob(localKey);

      expect(result).toBeNull();
    });
  });

  describe("removeLocalVideo", () => {
    it("should remove video and metadata successfully", async () => {
      const localKey = "test-key";

      const localforage = require("localforage");
      localforage.removeItem.mockResolvedValueOnce(undefined);

      const result = await localVideoStorage.removeLocalVideo(localKey);

      expect(result).toBe(true);
      expect(localforage.removeItem).toHaveBeenCalledWith(localKey);
      expect(localforage.removeItem).toHaveBeenCalledWith(
        `${localKey}_metadata`
      );
    });

    it("should handle removal errors gracefully", async () => {
      const localKey = "test-key";

      const localforage = require("localforage");
      localforage.removeItem.mockRejectedValueOnce(new Error("Removal error"));

      const result = await localVideoStorage.removeLocalVideo(localKey);

      expect(result).toBe(false);
    });
  });

  describe("getStorageInfo", () => {
    it("should return storage information", async () => {
      const info = await localVideoStorage.getStorageInfo();

      expect(info.used).toBe(1024 * 1024 * 100);
      expect(info.quota).toBe(1024 * 1024 * 1024);
      expect(info.percentage).toBe(10);
      expect(typeof info.isIOS).toBe("boolean");
    });

    it("should handle storage estimate errors", async () => {
      // Mock storage estimate to throw error
      Object.defineProperty(navigator, "storage", {
        value: {
          estimate: jest.fn().mockRejectedValue(new Error("Storage error")),
        },
        writable: true,
      });

      const info = await localVideoStorage.getStorageInfo();

      expect(info.used).toBe(0);
      expect(info.quota).toBe(0);
      expect(info.percentage).toBe(0);
    });
  });

  describe("checkStorageAvailability", () => {
    it("should return available for normal usage", async () => {
      const result = await localVideoStorage.checkStorageAvailability();

      expect(result.available).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it("should warn about iOS limitations", async () => {
      // Mock iOS user agent
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        writable: true,
      });

      const result = await localVideoStorage.checkStorageAvailability();

      expect(result.available).toBe(true);
      expect(result.warning).toContain("iOS detected");
    });

    it("should warn about high storage usage", async () => {
      // Mock high storage usage
      Object.defineProperty(navigator, "storage", {
        value: {
          estimate: jest.fn().mockResolvedValue({
            usage: 1024 * 1024 * 1024 * 0.9, // 90% of 1GB
            quota: 1024 * 1024 * 1024,
          }),
        },
        writable: true,
      });

      const result = await localVideoStorage.checkStorageAvailability();

      expect(result.available).toBe(true);
      expect(result.warning).toContain("nearly full");
    });
  });
});
