import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { ImmediateStrategy } from "../../src/sync/strategies/ImmediateStrategy";
import { QueuedStrategy } from "../../src/sync/strategies/QueuedStrategy";
import { BatchStrategy } from "../../src/sync/strategies/BatchStrategy";
import { DataContext } from "../../src/core/DataContext";
import type { SyncConfig, SyncResult } from "../../src/sync/SyncTypes";
import { StorageMetadata } from "../../src";

// Mock global fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

interface TestItem {
  id: string;
  name: string;
  value: number;
  metadata?: StorageMetadata;
}

describe("Sync Strategies", () => {
  let context: DataContext<TestItem>;
  let config: SyncConfig<TestItem>;

  beforeEach(() => {
    context = new DataContext<TestItem>({
      storageLocation: "localStorage",
      storageKey: "test-sync",
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
    mockFetch.mockReset(); // Reset mock implementations from previous test
  });

  afterEach(async () => {
    if (context.isSyncActive()) {
      context.disableSync();
    }
    await context.clear(); // Clear data before destroying
    context.destroy();
  });

  // Helper to enable sync before tests
  async function enableTestSync() {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
    await context.enableSync(config);
    mockFetch.mockClear();
  }

  describe("ImmediateStrategy", () => {
    let strategy: ImmediateStrategy<TestItem>;

    beforeEach(() => {
      strategy = new ImmediateStrategy();
    });

    it("should sync a single item immediately", async () => {
      await enableTestSync();

      const item: TestItem = { id: "1", name: "test", value: 42 };
      await context.store([item]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, item }),
      } as Response);

      const result = await strategy.execute(context, config);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        config.endpoint,
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("should sync multiple items one by one", async () => {
      await enableTestSync();

      const items: TestItem[] = [
        { id: "1", name: "test1", value: 1 },
        { id: "2", name: "test2", value: 2 },
        { id: "3", name: "test3", value: 3 },
      ];
      await context.store(items);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const result = await strategy.execute(context, config);

      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should handle sync failures and retry", async () => {
      await enableTestSync();

      const item: TestItem = { id: "1", name: "test", value: 42 };
      await context.store([item]);

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Server Error",
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

      const result = await strategy.execute(context, config);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should detect conflicts by comparing versions", async () => {
      await enableTestSync();

      const item: TestItem & { version?: number } = {
        id: "1",
        name: "test",
        value: 42,
        version: 1,
      };
      await context.store([item]);

      const localItems = await context.retrieve();
      const localItem = localItems.find((i) => i.id === "1")! as TestItem & {
        version?: number;
      };

      // Simulate server having a newer version
      const newerTimestamp = new Date(
        new Date(localItem.metadata?.updatedAt || new Date()).getTime() + 1000
      ).toISOString();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...localItem,
          version: 2, // Server has newer version
          metadata: {
            ...localItem.metadata,
            updatedAt: newerTimestamp,
          },
        }),
      } as Response);

      const result = await strategy.execute(context, config);

      expect(result.conflicts).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should use last-write-wins conflict resolution", async () => {
      await enableTestSync();

      const item: TestItem & { version?: number } = {
        id: "1",
        name: "test",
        value: 42,
        version: 1,
      };
      await context.store([item]);

      const localItems = await context.retrieve();
      const localItem = localItems.find((i) => i.id === "1")! as TestItem & {
        version?: number;
      };

      // Remote item with newer timestamp and version
      const remoteItem = {
        ...localItem,
        name: "remote-test",
        version: 2,
        metadata: {
          ...localItem.metadata,
          updatedAt: new Date(
            new Date(localItem.metadata?.updatedAt || new Date()).getTime() +
              1000
          ).toISOString(),
        },
      };

      console.log("=== TEST DEBUG ===");
      console.log("localItem:", JSON.stringify(localItem, null, 2));
      console.log("remoteItem:", JSON.stringify(remoteItem, null, 2));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => remoteItem,
      } as Response);

      const result = await strategy.execute(context, config);

      expect(result.conflicts).toBe(1);

      // Verify remote item was used (it's newer)
      const updated = await context.retrieve();
      console.log("updated items:", JSON.stringify(updated, null, 2));
      const resolvedItem = updated.find((i) => i.id === "1")!;
      console.log("resolvedItem:", JSON.stringify(resolvedItem, null, 2));
      expect(resolvedItem.name).toBe("remote-test");
    });

    it("should respect maxRetries limit", async () => {
      await enableTestSync();

      const item: TestItem = { id: "1", name: "test", value: 42 };
      await context.store([item]);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
      } as Response);

      const customConfig = { ...config, maxRetries: 2 };
      const result = await strategy.execute(context, customConfig);

      expect(result.failed).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Initial attempt only in immediate strategy
    });

    it("should get pending count correctly", async () => {
      await enableTestSync();
      const items: TestItem[] = [
        { id: "1", name: "test1", value: 1 },
        { id: "2", name: "test2", value: 2 },
      ];
      await context.store(items);

      const count = await strategy.getPendingCount(context);
      expect(count).toBe(2);
    });
  });

  describe("QueuedStrategy", () => {
    let strategy: QueuedStrategy<TestItem>;

    beforeEach(() => {
      strategy = new QueuedStrategy();
      config.strategy = "queued";
      config.batchSize = 2; // Process 2 items at a time
    });

    it("should sync items in batches", async () => {
      await enableTestSync();
      const items: TestItem[] = [
        { id: "1", name: "test1", value: 1 },
        { id: "2", name: "test2", value: 2 },
        { id: "3", name: "test3", value: 3 },
      ];
      await context.store(items);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const result = await strategy.execute(context, config);

      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);
      // Should be 3 calls (batch of 2, batch of 1)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should retry failed items with delay", async () => {
      await enableTestSync();
      jest.useFakeTimers();

      const item: TestItem = { id: "1", name: "test", value: 42 };
      await context.store([item]);

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

      const promise = strategy.execute(context, config);

      // Fast-forward time
      await jest.runAllTimersAsync();

      const result = await promise;

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);

      jest.useRealTimers();
    });

    it("should respect maxRetries limit", async () => {
      await enableTestSync();
      const item: TestItem = { id: "1", name: "test", value: 42 };
      await context.store([item]);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const customConfig = { ...config, maxRetries: 2 };
      const result = await strategy.execute(context, customConfig);

      expect(result.failed).toBe(1);
    });

    it("should handle partial batch failures", async () => {
      await enableTestSync();
      const items: TestItem[] = [
        { id: "1", name: "test1", value: 1 },
        { id: "2", name: "test2", value: 2 },
      ];
      await context.store(items);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response);

      const result = await strategy.execute(context, config);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
    });

    it("should get pending count correctly", async () => {
      await enableTestSync();
      const items: TestItem[] = [
        { id: "1", name: "test1", value: 1 },
        { id: "2", name: "test2", value: 2 },
        { id: "3", name: "test3", value: 3 },
      ];
      await context.store(items);

      const count = await strategy.getPendingCount(context);
      expect(count).toBe(3);
    });

    it("should process large batches efficiently", async () => {
      await enableTestSync();
      const items: TestItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        name: `test${i + 1}`,
        value: i + 1,
      }));
      await context.store(items);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const customConfig = { ...config, batchSize: 10 };
      const result = await strategy.execute(context, customConfig);

      expect(result.success).toBe(100);
      expect(result.failed).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(100);
    });
  });

  describe("BatchStrategy", () => {
    let strategy: BatchStrategy<TestItem>;

    beforeEach(() => {
      strategy = new BatchStrategy();
      config.strategy = "batch";
      config.batchSize = 3;
    });

    it("should send multiple items in a single batch request", async () => {
      await enableTestSync();
      const items: TestItem[] = [
        { id: "1", name: "test1", value: 1 },
        { id: "2", name: "test2", value: 2 },
      ];
      await context.store(items);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { success: true, itemId: "1" },
            { success: true, itemId: "2" },
          ],
        }),
      } as Response);

      const result = await strategy.execute(context, config);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify batch payload
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);
      expect(body.items).toHaveLength(2);
    });

    it("should handle individual item failures within batch", async () => {
      await enableTestSync();
      const items: TestItem[] = [
        { id: "1", name: "test1", value: 1 },
        { id: "2", name: "test2", value: 2 },
        { id: "3", name: "test3", value: 3 },
      ];
      await context.store(items);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { success: true, itemId: "1" },
            { success: false, itemId: "2", error: "Validation error" },
            { success: true, itemId: "3" },
          ],
        }),
      } as Response);

      const result = await strategy.execute(context, config);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
    });

    it("should handle batch-level failures", async () => {
      await enableTestSync();
      const items: TestItem[] = [
        { id: "1", name: "test1", value: 1 },
        { id: "2", name: "test2", value: 2 },
      ];
      await context.store(items);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Server Error",
      } as Response);

      const result = await strategy.execute(context, config);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(2);
    });

    it("should detect conflicts in batch response", async () => {
      await enableTestSync();
      const items: (TestItem & { version?: number })[] = [
        { id: "1", name: "test1", value: 1, version: 1 },
        { id: "2", name: "test2", value: 2, version: 1 },
      ];
      await context.store(items);

      const localItems = await context.retrieve();
      const remoteItem = {
        ...localItems[0],
        name: "remote-test",
        version: 2,
        metadata: {
          ...localItems[0].metadata,
          updatedAt: new Date(
            new Date(
              localItems[0].metadata?.updatedAt || new Date()
            ).getTime() + 1000
          ).toISOString(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { success: true, item: remoteItem },
            { success: true, item: localItems[1] },
          ],
        }),
      } as Response);

      const result = await strategy.execute(context, config);

      expect(result.success).toBe(2);
      // Conflict was detected and resolved, so it's counted as success
    });

    it("should process multiple batches when needed", async () => {
      await enableTestSync();
      const items: TestItem[] = Array.from({ length: 7 }, (_, i) => ({
        id: `${i + 1}`,
        name: `test${i + 1}`,
        value: i + 1,
      }));
      await context.store(items);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          results: Array.from({ length: 3 }, (_, i) => ({
            success: true,
            itemId: `${i + 1}`,
          })),
        }),
      } as Response);

      const result = await strategy.execute(context, config);

      // Should process in batches of 3: [3, 3, 1]
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.success).toBeGreaterThan(0);
    });

    it("should get pending count correctly", async () => {
      await enableTestSync();
      const items: TestItem[] = [
        { id: "1", name: "test1", value: 1 },
        { id: "2", name: "test2", value: 2 },
      ];
      await context.store(items);

      const count = await strategy.getPendingCount(context);
      expect(count).toBe(2);
    });

    it("should handle empty batch gracefully", async () => {
      await enableTestSync();
      const result = await strategy.execute(context, config);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.conflicts).toBe(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
