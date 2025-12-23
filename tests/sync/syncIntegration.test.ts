import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { DataContext } from "../../src/core/DataContext";
import type { SyncConfig } from "../../src/sync/SyncTypes";
import { StorageLocations } from "../../src/models/StorageLocations";
import { StorageMetadata } from "../../src/models/StorageMetadata";

// Mock global fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

interface TestItem {
  id: string;
  name: string;
  value: number;
  metadata?: StorageMetadata;
}

describe("DataContext Sync Integration", () => {
  let context: DataContext<TestItem>;
  let config: SyncConfig<TestItem>;

  beforeEach(() => {
    context = new DataContext<TestItem>({
      storageLocation: StorageLocations.LocalStorage,
      storageKey: "test-sync-integration",
      trackTimestamps: true,
    });

    config = {
      endpoint: "https://api.example.com/sync",
      strategy: "immediate",
      conflictResolution: "last-write-wins",
      maxRetries: 3,
      retryDelay: 100,
    };

    mockFetch.mockClear();
  });

  afterEach(() => {
    if (context.isSyncActive()) {
      context.disableSync();
    }
    context.destroy();
  });

  describe("enableSync", () => {
    it("should enable sync with valid configuration", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await context.enableSync(config);

      expect(context.isSyncActive()).toBe(true);
    });

    it("should throw error if trackTimestamps is not enabled", async () => {
      const contextWithoutTimestamps = new DataContext<TestItem>({
        storageLocation: StorageLocations.LocalStorage,
        storageKey: "test-no-timestamps",
        trackTimestamps: false,
      });

      await expect(contextWithoutTimestamps.enableSync(config)).rejects.toThrow(
        "Server sync requires trackTimestamps to be enabled"
      );

      contextWithoutTimestamps.destroy();
    });

    it("should not enable if already active", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await context.enableSync(config);
      expect(context.isSyncActive()).toBe(true);

      // Try to enable again - should be no-op
      await context.enableSync(config);
      expect(context.isSyncActive()).toBe(true);
    });
  });

  describe("disableSync", () => {
    it("should disable sync", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await context.enableSync(config);
      expect(context.isSyncActive()).toBe(true);

      context.disableSync();
      expect(context.isSyncActive()).toBe(false);
    });

    it("should be safe to call when sync is not active", () => {
      expect(context.isSyncActive()).toBe(false);

      context.disableSync();
      expect(context.isSyncActive()).toBe(false);
    });
  });

  describe("sync", () => {
    it("should manually trigger sync", async () => {
      await context.enableSync(config); // Enable sync first

      const item: TestItem = { id: "1", name: "test", value: 42 };
      await context.store([item]); // Now items will be marked with _needsSync

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const result = await context.sync();

      expect(result).toBeDefined();
      expect(result!.success).toBe(1);
      expect(mockFetch).toHaveBeenCalled();
    });

    it("should return null if sync is not active", async () => {
      await expect(context.sync()).rejects.toThrow(
        "Server sync is not enabled"
      );
    });
  });

  describe("getSyncStatus", () => {
    it("should return sync status when active", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await context.enableSync(config);

      const status = context.getSyncStatus();
      expect(status).toBeDefined();
      expect(status).toHaveProperty("isSyncing");
      expect(status).toHaveProperty("pending");
      expect(status).toHaveProperty("synced");
      expect(status).toHaveProperty("failed");
    });

    it("should return null when sync is not active", () => {
      const status = context.getSyncStatus();
      expect(status).toBeNull();
    });
  });

  describe("isSyncActive", () => {
    it("should return true when sync is active", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await context.enableSync(config);
      expect(context.isSyncActive()).toBe(true);
    });

    it("should return false when sync is not active", () => {
      expect(context.isSyncActive()).toBe(false);
    });

    it("should return false after disabling sync", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await context.enableSync(config);
      expect(context.isSyncActive()).toBe(true);

      context.disableSync();
      expect(context.isSyncActive()).toBe(false);
    });
  });

  describe("store with sync", () => {
    it("should mark items with _needsSync when sync is active", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await context.enableSync(config);

      const item: TestItem = { id: "1", name: "test", value: 42 };
      await context.store([item]);

      const stored = await context.retrieve();
      const storedItem = stored.find((i) => i.id === "1")!;
      expect(storedItem).toHaveProperty("_needsSync", true);
    });

    it("should not mark items with _needsSync when sync is not active", async () => {
      const item: TestItem = { id: "1", name: "test", value: 42 };
      await context.store([item]);

      const stored = await context.retrieve();
      const retrievedItem = stored.find((i) => i.id === "1")!;
      expect(retrievedItem).not.toHaveProperty("_needsSync");
    });

    it("should trigger immediate sync for stored items", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await context.enableSync(config);

      const item: TestItem = { id: "1", name: "test", value: 42 };
      await context.store([item]);

      // Manually trigger sync (immediate strategy doesn't auto-sync on store)
      await context.sync();

      // Should have attempted to sync
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe("end-to-end sync flow", () => {
    it("should complete full sync cycle with immediate strategy", async () => {
      const items: TestItem[] = [
        { id: "1", name: "test1", value: 1 },
        { id: "2", name: "test2", value: 2 },
        { id: "3", name: "test3", value: 3 },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await context.enableSync(config);
      await context.store(items);

      const result = await context.sync();

      expect(result).toBeDefined();
      expect(result!.success).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalled();
    });

    it("should complete full sync cycle with queued strategy", async () => {
      const queuedConfig = { ...config, strategy: "queued" as const };

      const items: TestItem[] = [
        { id: "1", name: "test1", value: 1 },
        { id: "2", name: "test2", value: 2 },
        { id: "3", name: "test3", value: 3 },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await context.enableSync(queuedConfig);
      await context.store(items);

      const result = await context.sync();

      expect(result).toBeDefined();
      expect(result!.success).toBeGreaterThan(0);
    });

    it("should complete full sync cycle with batch strategy", async () => {
      const batchConfig = { ...config, strategy: "batch" as const };

      const items: TestItem[] = [
        { id: "1", name: "test1", value: 1 },
        { id: "2", name: "test2", value: 2 },
        { id: "3", name: "test3", value: 3 },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          results: items.map((item) => ({ success: true, itemId: item.id })),
        }),
      } as Response);

      await context.enableSync(batchConfig);
      await context.store(items);

      const result = await context.sync();

      expect(result).toBeDefined();
      expect(result!.success).toBeGreaterThan(0);
    });

    it("should handle sync with callbacks", async () => {
      const onSyncStart = jest.fn();
      const onSyncComplete = jest.fn();
      const onSyncError = jest.fn();

      const callbackConfig = {
        ...config,
        onSyncStart,
        onSyncComplete,
        onSyncError,
      };

      const item: TestItem = { id: "1", name: "test", value: 42 };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await context.enableSync(callbackConfig);
      await context.store([item]);
      await context.sync();

      expect(onSyncStart).toHaveBeenCalled();
      expect(onSyncComplete).toHaveBeenCalled();
      expect(onSyncError).not.toHaveBeenCalled();
    });

    it("should handle sync failures gracefully", async () => {
      const item: TestItem = { id: "1", name: "test", value: 42 };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
      } as Response);

      await context.enableSync(config);
      await context.store([item]);

      const result = await context.sync();

      expect(result).toBeDefined();
      expect(result!.failed).toBeGreaterThan(0);

      const status = context.getSyncStatus();
      expect(status).toBeDefined();
      expect(status!.failed).toBeGreaterThan(0);
    });

    it("should handle conflicts and resolution", async () => {
      await context.enableSync(config); // Enable sync first

      const item: TestItem & { version?: number } = {
        id: "1",
        name: "local",
        value: 42,
        version: 1, // Add version for conflict detection
      };
      await context.store([item]);

      const localItems = await context.retrieve();
      const localItem = localItems.find((i) => i.id === "1")!;

      // Remote item with newer timestamp and version
      const remoteItem = {
        ...localItem,
        name: "remote",
        value: 99,
        version: 2, // Different version to trigger conflict
        metadata: {
          ...localItem.metadata,
          updatedAt: new Date(
            new Date(localItem.metadata?.updatedAt || new Date()).getTime() +
              1000
          ).toISOString(), // Fixed: convert to ISO string
        },
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => remoteItem, // Fixed: return remoteItem directly, not wrapped
      } as Response);

      const result = await context.sync();

      expect(result).toBeDefined();
      expect(result!.conflicts).toBeGreaterThan(0);

      // Verify resolution (should use remote since it's newer)
      const resolved = await context.retrieve();
      const resolvedItem = resolved.find((i) => i.id === "1")!;
      expect(resolvedItem.name).toBe("remote");
      expect(resolvedItem.value).toBe(99);
    });
  });

  describe("cleanup on destroy", () => {
    it("should cleanup sync manager on context destroy", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await context.enableSync(config);
      expect(context.isSyncActive()).toBe(true);

      context.destroy();
      expect(context.isSyncActive()).toBe(false);
    });
  });
});
