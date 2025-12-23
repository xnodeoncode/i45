/**
 * Tests for Storage Quota functionality in DataContext
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { DataContext } from "../src/core/DataContext";
import { StorageLocations } from "../src/models/StorageLocations";
import type { StorageInfo } from "../src/models/StorageInfo";

describe("Storage Quota Methods", () => {
  let context: DataContext<any>;

  beforeEach(() => {
    context = new DataContext({
      storageKey: "test-quota",
      storageLocation: StorageLocations.LocalStorage,
      loggingEnabled: false,
    });
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  // ============================================================================
  // getRemainingStorage() Tests
  // ============================================================================

  describe("getRemainingStorage()", () => {
    it("should return storage info when Storage API is supported", async () => {
      // Mock Storage API
      const mockEstimate = jest
        .fn<() => Promise<{ quota?: number; usage?: number }>>()
        .mockResolvedValue({
          quota: 100_000_000, // 100MB
          usage: 10_000_000, // 10MB
        });

      Object.defineProperty(navigator, "storage", {
        value: { estimate: mockEstimate },
        writable: true,
        configurable: true,
      });

      const info = await context.getRemainingStorage();

      expect(info).toBeDefined();
      expect(info.type).toBe("overall");
      expect(info.quota).toBe(100_000_000);
      expect(info.usage).toBe(10_000_000);
      expect(info.remaining).toBe(90_000_000);
      expect(info.percentUsed).toBe(10);
      expect(info.isEstimate).toBe(true);
    });

    it("should throw error when Storage API is not supported", async () => {
      // Remove Storage API
      Object.defineProperty(navigator, "storage", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(context.getRemainingStorage()).rejects.toThrow(
        "Storage API is not supported in this browser"
      );
    });

    it("should handle zero quota gracefully", async () => {
      const mockEstimate = jest
        .fn<() => Promise<{ quota?: number; usage?: number }>>()
        .mockResolvedValue({
          quota: 0,
          usage: 0,
        });

      Object.defineProperty(navigator, "storage", {
        value: { estimate: mockEstimate },
        writable: true,
        configurable: true,
      });

      const info = await context.getRemainingStorage();

      expect(info.quota).toBe(0);
      expect(info.usage).toBe(0);
      expect(info.remaining).toBe(0);
      expect(info.percentUsed).toBe(0);
    });

    it("should handle undefined quota/usage values", async () => {
      const mockEstimate = jest
        .fn<() => Promise<{ quota?: number; usage?: number }>>()
        .mockResolvedValue({});

      Object.defineProperty(navigator, "storage", {
        value: { estimate: mockEstimate },
        writable: true,
        configurable: true,
      });

      const info = await context.getRemainingStorage();

      expect(info.quota).toBe(0);
      expect(info.usage).toBe(0);
      expect(info.remaining).toBe(0);
      expect(info.percentUsed).toBe(0);
    });

    it("should calculate percentUsed correctly for various usage levels", async () => {
      const testCases: Array<{
        quota: number;
        usage: number;
        expected: number;
      }> = [
        { quota: 100, usage: 0, expected: 0 },
        { quota: 100, usage: 25, expected: 25 },
        { quota: 100, usage: 50, expected: 50 },
        { quota: 100, usage: 75, expected: 75 },
        { quota: 100, usage: 100, expected: 100 },
        { quota: 100, usage: 33, expected: 33 },
      ];

      for (const testCase of testCases) {
        const mockEstimate = jest
          .fn<() => Promise<{ quota?: number; usage?: number }>>()
          .mockResolvedValue({
            quota: testCase.quota,
            usage: testCase.usage,
          });

        Object.defineProperty(navigator, "storage", {
          value: { estimate: mockEstimate },
          writable: true,
          configurable: true,
        });

        const info = await context.getRemainingStorage();
        expect(info.percentUsed).toBe(testCase.expected);
      }
    });
  });

  // ============================================================================
  // getStorageInfo() Tests - Default Location
  // ============================================================================

  describe("getStorageInfo() - default location", () => {
    it("should use configured storage location when no parameter provided", async () => {
      const context = new DataContext({
        storageKey: "test",
        storageLocation: StorageLocations.LocalStorage,
        loggingEnabled: false,
      });

      const info = await context.getStorageInfo();
      expect(info.type).toBe("localStorage");
    });

    it("should handle sessionStorage as default location", async () => {
      const context = new DataContext({
        storageKey: "test",
        storageLocation: StorageLocations.SessionStorage,
        loggingEnabled: false,
      });

      const info = await context.getStorageInfo();
      expect(info.type).toBe("sessionStorage");
    });
  });

  // ============================================================================
  // getStorageInfo() Tests - IndexedDB
  // ============================================================================

  describe("getStorageInfo() - IndexedDB", () => {
    it("should return IndexedDB quota info when Storage API is supported", async () => {
      const mockEstimate = jest
        .fn<() => Promise<{ quota?: number; usage?: number }>>()
        .mockResolvedValue({
          quota: 50_000_000, // 50MB
          usage: 5_000_000, // 5MB
        });

      Object.defineProperty(navigator, "storage", {
        value: { estimate: mockEstimate },
        writable: true,
        configurable: true,
      });

      const info = await context.getStorageInfo(StorageLocations.IndexedDB);

      expect(info.type).toBe("IndexedDB");
      expect(info.quota).toBe(50_000_000);
      expect(info.usage).toBe(5_000_000);
      expect(info.remaining).toBe(45_000_000);
      expect(info.percentUsed).toBe(10);
      expect(info.isEstimate).toBe(true);
    });

    it("should throw error for IndexedDB when Storage API not supported", async () => {
      Object.defineProperty(navigator, "storage", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(
        context.getStorageInfo(StorageLocations.IndexedDB)
      ).rejects.toThrow("Storage API is not supported in this browser");
    });
  });

  // ============================================================================
  // getStorageInfo() Tests - localStorage
  // ============================================================================

  describe("getStorageInfo() - localStorage", () => {
    it("should return estimated quota for empty localStorage", async () => {
      const info = await context.getStorageInfo(StorageLocations.LocalStorage);

      expect(info.type).toBe("localStorage");
      expect(info.quota).toBe(10 * 1024 * 1024); // 10MB
      expect(info.usage).toBe(0);
      expect(info.remaining).toBe(10 * 1024 * 1024);
      expect(info.percentUsed).toBe(0);
      expect(info.isEstimate).toBe(true);
    });

    it("should calculate usage for localStorage with data", async () => {
      // Store some test data
      localStorage.setItem("key1", "value1");
      localStorage.setItem("key2", "value2");

      const info = await context.getStorageInfo(StorageLocations.LocalStorage);

      expect(info.type).toBe("localStorage");
      expect(info.usage).toBeGreaterThan(0);
      // Each character is 2 bytes in UTF-16
      // "key1" (4) + "value1" (6) = 10 chars = 20 bytes
      // "key2" (4) + "value2" (6) = 10 chars = 20 bytes
      // Total = 40 bytes
      expect(info.usage).toBe(40);
      expect(info.remaining).toBe(10 * 1024 * 1024 - 40);
    });

    it("should handle large localStorage data correctly", async () => {
      // Store a large string (1MB)
      const largeData = "x".repeat(500_000); // 500k chars = 1MB
      localStorage.setItem("large", largeData);

      const info = await context.getStorageInfo(StorageLocations.LocalStorage);

      expect(info.type).toBe("localStorage");
      // "large" (5 chars) + 500,000 chars = 500,005 chars = 1,000,010 bytes
      expect(info.usage).toBe(1_000_010);
      expect(info.percentUsed).toBe(10); // ~10% of 10MB
    });

    it("should handle multiple keys correctly", async () => {
      const keys = ["a", "bb", "ccc", "dddd"];
      keys.forEach((key) => localStorage.setItem(key, key));

      const info = await context.getStorageInfo(StorageLocations.LocalStorage);

      // "a" + "a" = 2 chars = 4 bytes
      // "bb" + "bb" = 4 chars = 8 bytes
      // "ccc" + "ccc" = 6 chars = 12 bytes
      // "dddd" + "dddd" = 8 chars = 16 bytes
      // Total = 40 bytes
      expect(info.usage).toBe(40);
    });
  });

  // ============================================================================
  // getStorageInfo() Tests - sessionStorage
  // ============================================================================

  describe("getStorageInfo() - sessionStorage", () => {
    it("should return estimated quota for empty sessionStorage", async () => {
      const info = await context.getStorageInfo(
        StorageLocations.SessionStorage
      );

      expect(info.type).toBe("sessionStorage");
      expect(info.quota).toBe(10 * 1024 * 1024); // 10MB
      expect(info.usage).toBe(0);
      expect(info.remaining).toBe(10 * 1024 * 1024);
      expect(info.percentUsed).toBe(0);
      expect(info.isEstimate).toBe(true);
    });

    it("should calculate usage for sessionStorage with data", async () => {
      sessionStorage.setItem("session1", "data1");
      sessionStorage.setItem("session2", "data2");

      const info = await context.getStorageInfo(
        StorageLocations.SessionStorage
      );

      expect(info.type).toBe("sessionStorage");
      expect(info.usage).toBeGreaterThan(0);
      // "session1" (8) + "data1" (5) = 13 chars = 26 bytes
      // "session2" (8) + "data2" (5) = 13 chars = 26 bytes
      // Total = 52 bytes
      expect(info.usage).toBe(52);
    });
  });

  // ============================================================================
  // Edge Cases and Error Handling
  // ============================================================================

  describe("Edge cases and error handling", () => {
    it("should handle null storage values gracefully", async () => {
      localStorage.setItem("key", "");

      const info = await context.getStorageInfo(StorageLocations.LocalStorage);

      // "key" (3 chars) + "" (0 chars) = 3 chars = 6 bytes
      expect(info.usage).toBe(6);
    });

    it("should handle storage with special characters", async () => {
      localStorage.setItem("🚀", "🎉");

      const info = await context.getStorageInfo(StorageLocations.LocalStorage);

      expect(info.usage).toBeGreaterThan(0);
      // Emojis are typically 2-4 bytes in UTF-16
      // But we count them as 2 bytes per character unit
    });

    it("should return consistent results when called multiple times", async () => {
      localStorage.setItem("test", "data");

      const info1 = await context.getStorageInfo(StorageLocations.LocalStorage);
      const info2 = await context.getStorageInfo(StorageLocations.LocalStorage);

      expect(info1.usage).toBe(info2.usage);
      expect(info1.percentUsed).toBe(info2.percentUsed);
    });

    it("should update usage when storage changes", async () => {
      const info1 = await context.getStorageInfo(StorageLocations.LocalStorage);
      expect(info1.usage).toBe(0);

      localStorage.setItem("newKey", "newValue");

      const info2 = await context.getStorageInfo(StorageLocations.LocalStorage);
      expect(info2.usage).toBeGreaterThan(info1.usage);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe("Integration with DataContext operations", () => {
    it("should show increased usage after storing data", async () => {
      const context = new DataContext({
        storageKey: "books",
        storageLocation: StorageLocations.LocalStorage,
        loggingEnabled: false,
      });

      const infoBefore = await context.getStorageInfo();
      const usageBefore = infoBefore.usage;

      // Store some data
      const books = [
        { id: 1, title: "Book 1" },
        { id: 2, title: "Book 2" },
      ];
      await context.store(books);

      const infoAfter = await context.getStorageInfo();
      const usageAfter = infoAfter.usage;

      expect(usageAfter).toBeGreaterThan(usageBefore);
    });

    it("should show decreased usage after removing data", async () => {
      const context = new DataContext({
        storageKey: "items",
        storageLocation: StorageLocations.LocalStorage,
        loggingEnabled: false,
      });

      // Store data first
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      await context.store(items);

      const infoBefore = await context.getStorageInfo();
      const usageBefore = infoBefore.usage;

      // Remove the data
      await context.remove();

      const infoAfter = await context.getStorageInfo();
      const usageAfter = infoAfter.usage;

      expect(usageAfter).toBeLessThan(usageBefore);
    });
  });

  // ============================================================================
  // Real-world Scenarios
  // ============================================================================

  describe("Real-world scenarios", () => {
    it("should help detect when storage is nearly full", async () => {
      // Simulate a scenario where storage is 90% full
      const mockEstimate = jest
        .fn<() => Promise<{ quota?: number; usage?: number }>>()
        .mockResolvedValue({
          quota: 100_000,
          usage: 90_000,
        });

      Object.defineProperty(navigator, "storage", {
        value: { estimate: mockEstimate },
        writable: true,
        configurable: true,
      });

      const info = await context.getRemainingStorage();

      expect(info.percentUsed).toBe(90);
      expect(info.remaining).toBeLessThan(info.quota * 0.2); // Less than 20% remaining

      // Application logic could use this to warn users
      const shouldWarn = info.percentUsed > 80;
      expect(shouldWarn).toBe(true);
    });

    it("should allow comparing usage across storage types", async () => {
      // Store same data in different locations
      localStorage.setItem("test-data", "shared value");
      sessionStorage.setItem("test-data", "shared value");

      const localInfo = await context.getStorageInfo(
        StorageLocations.LocalStorage
      );
      const sessionInfo = await context.getStorageInfo(
        StorageLocations.SessionStorage
      );

      // Both should have similar usage for same data
      expect(localInfo.usage).toBe(sessionInfo.usage);
    });

    it("should provide useful info for capacity planning", async () => {
      const info = await context.getStorageInfo(StorageLocations.LocalStorage);

      // Check if we have enough space for a planned operation
      const plannedDataSize = 5 * 1024 * 1024; // 5MB
      const hasEnoughSpace = info.remaining >= plannedDataSize;

      expect(typeof hasEnoughSpace).toBe("boolean");
      // In our test environment, we should have plenty of space
      expect(hasEnoughSpace).toBe(true);
    });
  });
});
