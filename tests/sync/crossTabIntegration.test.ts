/**
 * Cross-Tab Integration Tests
 * Tests for DataContext with cross-tab synchronization enabled
 */

import { describe, it, expect, afterEach, jest } from "@jest/globals";
import { DataContext } from "../../src/core/DataContext";
import { StorageLocations } from "../../src/models/StorageLocations";

describe("DataContext Cross-Tab Integration", () => {
  let context: DataContext<any>;

  afterEach(async () => {
    context?.destroy();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("Initialization", () => {
    it("should create DataContext with cross-tab sync enabled", () => {
      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.LocalStorage,
        enableCrossTabSync: true,
      });

      expect(context).toBeInstanceOf(DataContext);
    });

    it("should accept onCrossTabUpdate callback", () => {
      const onUpdate = jest.fn<(items: any[]) => void>();

      context = new DataContext({
        storageKey: "test-items",
        enableCrossTabSync: true,
        onCrossTabUpdate: onUpdate,
      });

      expect(context).toBeInstanceOf(DataContext);
    });

    it("should work without cross-tab sync (backward compatibility)", () => {
      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.LocalStorage,
      });

      expect(context).toBeInstanceOf(DataContext);
      expect(context.isCrossTabSyncActive()).toBe(false);
    });
  });

  describe("Active Status", () => {
    it("should report active status correctly", () => {
      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.LocalStorage,
        enableCrossTabSync: true,
      });

      const expectedActive =
        typeof BroadcastChannel !== "undefined" ||
        (typeof window !== "undefined" && "onstorage" in window);

      expect(context.isCrossTabSyncActive()).toBe(expectedActive);
    });

    it("should return false when sync not enabled", () => {
      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.LocalStorage,
        enableCrossTabSync: false,
      });

      expect(context.isCrossTabSyncActive()).toBe(false);
    });
  });

  describe("Sync Method", () => {
    it("should return sync method being used", () => {
      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.LocalStorage,
        enableCrossTabSync: true,
      });

      const method = context.getCrossTabSyncMethod();

      if (typeof BroadcastChannel !== "undefined") {
        expect(method).toBe("broadcast");
      } else if (typeof window !== "undefined" && "onstorage" in window) {
        expect(method).toBe("storage-events");
      } else {
        expect(method).toBe("none");
      }
    });

    it("should return 'none' when sync not enabled", () => {
      context = new DataContext({
        storageKey: "test-items",
        enableCrossTabSync: false,
      });

      expect(context.getCrossTabSyncMethod()).toBe("none");
    });
  });

  describe("Store Operations", () => {
    it("should store and broadcast without errors", async () => {
      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.LocalStorage,
        enableCrossTabSync: true,
      });

      const items = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ];

      await expect(context.store(items)).resolves.toBe(context);

      const retrieved = await context.retrieve();
      expect(retrieved).toEqual(items);
    });

    it("should work without cross-tab sync", async () => {
      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.LocalStorage,
        enableCrossTabSync: false,
      });

      const items = [{ id: 1, name: "Item 1" }];

      await context.store(items);
      const retrieved = await context.retrieve();

      expect(retrieved).toEqual(items);
    });
  });

  describe("Remove Operations", () => {
    it("should remove and broadcast without errors", async () => {
      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.LocalStorage,
        enableCrossTabSync: true,
      });

      await context.store([{ id: 1 }]);
      await expect(context.remove()).resolves.toBe(context);

      const retrieved = await context.retrieve();
      expect(retrieved).toEqual([]);
    });
  });

  describe("Clear Operations", () => {
    it("should clear and broadcast without errors", async () => {
      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.LocalStorage,
        enableCrossTabSync: true,
      });

      await context.store([{ id: 1 }]);
      await expect(context.clear()).resolves.toBe(context);

      // Clear removes everything from storage location
      const retrieved = await context.retrieve();
      expect(retrieved).toEqual([]);
    });
  });

  describe("Refresh from Cross-Tab", () => {
    it("should refresh data from storage", async () => {
      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.LocalStorage,
        enableCrossTabSync: true,
      });

      const items = [{ id: 1, name: "Item" }];
      await context.store(items);

      const refreshed = await context.refreshFromCrossTab();
      expect(refreshed).toEqual(items);
    });
  });

  describe("Tab ID", () => {
    it("should return tab ID when using BroadcastChannel", () => {
      if (typeof BroadcastChannel === "undefined") {
        expect(true).toBe(true);
        return;
      }

      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.LocalStorage,
        enableCrossTabSync: true,
      });

      const tabId = context.getTabId();
      expect(tabId).toBeTruthy();
      expect(typeof tabId).toBe("string");
    });

    it("should return undefined when sync not enabled", () => {
      context = new DataContext({
        storageKey: "test-items",
        enableCrossTabSync: false,
      });

      expect(context.getTabId()).toBeUndefined();
    });
  });

  describe("Destroy", () => {
    it("should clean up cross-tab sync on destroy", () => {
      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.LocalStorage,
        enableCrossTabSync: true,
      });

      expect(() => context.destroy()).not.toThrow();
    });

    it("should work when cross-tab sync not enabled", () => {
      context = new DataContext({
        storageKey: "test-items",
        enableCrossTabSync: false,
      });

      expect(() => context.destroy()).not.toThrow();
    });
  });

  describe("IndexedDB Support", () => {
    it("should work with IndexedDB when BroadcastChannel available", async () => {
      if (typeof BroadcastChannel === "undefined") {
        expect(true).toBe(true);
        return;
      }

      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.IndexedDB,
        enableCrossTabSync: true,
      });

      expect(context.getCrossTabSyncMethod()).toBe("broadcast");

      const items = [{ id: 1, name: "Test" }];
      await context.store(items);

      const retrieved = await context.retrieve();
      expect(retrieved).toEqual(items);
    });
  });

  describe("Multiple Storage Locations", () => {
    it("should support localStorage", async () => {
      context = new DataContext({
        storageKey: "local-test",
        storageLocation: StorageLocations.LocalStorage,
        enableCrossTabSync: true,
      });

      const items = [{ id: 1 }];
      await context.store(items);

      const retrieved = await context.retrieve();
      expect(retrieved).toEqual(items);
    });

    it("should support sessionStorage", async () => {
      context = new DataContext({
        storageKey: "session-test",
        storageLocation: StorageLocations.SessionStorage,
        enableCrossTabSync: true,
      });

      const items = [{ id: 1 }];
      await context.store(items);

      const retrieved = await context.retrieve();
      expect(retrieved).toEqual(items);
    });
  });

  describe("Error Handling", () => {
    it("should handle callback errors gracefully", async () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const onUpdate = jest.fn(() => {
        throw new Error("Callback error");
      });

      context = new DataContext({
        storageKey: "test-items",
        storageLocation: StorageLocations.LocalStorage,
        enableCrossTabSync: true,
        onCrossTabUpdate: onUpdate,
      });

      // Should not throw even if callback fails
      await expect(context.store([{ id: 1 }])).resolves.toBe(context);

      consoleError.mockRestore();
    });
  });
});
