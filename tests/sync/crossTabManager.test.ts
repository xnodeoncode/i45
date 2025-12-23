/**
 * CrossTabManager Tests
 * Tests for hybrid cross-tab synchronization manager
 */

import { describe, it, expect, afterEach, jest } from "@jest/globals";
import { CrossTabManager } from "../../src/sync/CrossTabManager";
import { StorageLocations } from "../../src/models/StorageLocations";

describe("CrossTabManager", () => {
  let manager: CrossTabManager<any>;

  afterEach(() => {
    manager?.close();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("Constructor", () => {
    it("should create CrossTabManager instance", () => {
      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.LocalStorage,
      });

      expect(manager).toBeInstanceOf(CrossTabManager);
    });

    it("should accept callbacks in config", () => {
      const onUpdate = jest.fn<(items: any[]) => void>();
      const onRemove = jest.fn<() => void>();
      const onClear = jest.fn<() => void>();

      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.LocalStorage,
        onUpdate,
        onRemove,
        onClear,
      });

      expect(manager).toBeInstanceOf(CrossTabManager);
    });
  });

  describe("Initialization Strategy", () => {
    it("should prefer BroadcastChannel if available", () => {
      if (typeof BroadcastChannel === "undefined") {
        expect(true).toBe(true);
        return;
      }

      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.IndexedDB,
      });

      expect(manager.getSyncMethod()).toBe("broadcast");
    });

    it("should use storage events for localStorage when BroadcastChannel unavailable", () => {
      const originalBroadcastChannel = (global as any).BroadcastChannel;
      (global as any).BroadcastChannel = undefined;

      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.LocalStorage,
      });

      if (typeof window !== "undefined" && "onstorage" in window) {
        expect(manager.getSyncMethod()).toBe("storage-events");
      } else {
        expect(manager.getSyncMethod()).toBe("none");
      }

      (global as any).BroadcastChannel = originalBroadcastChannel;
    });

    it("should force storage events when configured", () => {
      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.LocalStorage,
        forceStorageEvents: true,
      });

      if (typeof window !== "undefined" && "onstorage" in window) {
        expect(manager.getSyncMethod()).toBe("storage-events");
      } else {
        expect(manager.getSyncMethod()).toBe("none");
      }
    });

    it("should return 'none' for IndexedDB when BroadcastChannel unavailable", () => {
      const originalBroadcastChannel = (global as any).BroadcastChannel;
      (global as any).BroadcastChannel = undefined;

      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.IndexedDB,
      });

      expect(manager.getSyncMethod()).toBe("none");

      (global as any).BroadcastChannel = originalBroadcastChannel;
    });
  });

  describe("Broadcasting", () => {
    it("should broadcast update without errors", async () => {
      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.LocalStorage,
      });

      const items = [{ id: 1, name: "Test" }];
      await expect(manager.broadcast(items)).resolves.toBeUndefined();
    });

    it("should broadcast remove without errors", async () => {
      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.LocalStorage,
      });

      await expect(manager.broadcastRemove()).resolves.toBeUndefined();
    });

    it("should broadcast clear without errors", async () => {
      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.LocalStorage,
      });

      await expect(manager.broadcastClear()).resolves.toBeUndefined();
    });

    it("should not throw when broadcasting with sync disabled", async () => {
      const originalBroadcastChannel = (global as any).BroadcastChannel;
      (global as any).BroadcastChannel = undefined;

      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.IndexedDB,
      });

      await expect(manager.broadcast([{ id: 1 }])).resolves.toBeUndefined();
      await expect(manager.broadcastRemove()).resolves.toBeUndefined();
      await expect(manager.broadcastClear()).resolves.toBeUndefined();

      (global as any).BroadcastChannel = originalBroadcastChannel;
    });
  });

  describe("Active Status", () => {
    it("should return true when sync is active", () => {
      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.LocalStorage,
      });

      // Active if either BroadcastChannel or storage events available
      const expectedActive =
        typeof BroadcastChannel !== "undefined" ||
        (typeof window !== "undefined" && "onstorage" in window);

      expect(manager.isActive()).toBe(expectedActive);
    });

    it("should return false when no sync mechanism available", () => {
      const originalBroadcastChannel = (global as any).BroadcastChannel;
      (global as any).BroadcastChannel = undefined;

      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.IndexedDB,
      });

      expect(manager.isActive()).toBe(false);

      (global as any).BroadcastChannel = originalBroadcastChannel;
    });
  });

  describe("Tab ID", () => {
    it("should return tab ID when using BroadcastChannel", () => {
      if (typeof BroadcastChannel === "undefined") {
        expect(true).toBe(true);
        return;
      }

      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.LocalStorage,
      });

      const tabId = manager.getTabId();
      expect(tabId).toBeTruthy();
      expect(typeof tabId).toBe("string");
    });

    it("should return undefined when using storage events", () => {
      const originalBroadcastChannel = (global as any).BroadcastChannel;
      (global as any).BroadcastChannel = undefined;

      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.LocalStorage,
      });

      expect(manager.getTabId()).toBeUndefined();

      (global as any).BroadcastChannel = originalBroadcastChannel;
    });
  });

  describe("Close", () => {
    it("should close without errors", () => {
      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.LocalStorage,
      });

      expect(() => manager.close()).not.toThrow();
    });

    it("should set active to false after close", () => {
      manager = new CrossTabManager({
        storageKey: "test-key",
        storageLocation: StorageLocations.LocalStorage,
      });

      manager.close();
      expect(manager.isActive()).toBe(false);
    });
  });

  describe("Static Methods", () => {
    it("should correctly check support for different storage locations", () => {
      const localStorageSupported = CrossTabManager.isSupported(
        StorageLocations.LocalStorage
      );
      const sessionStorageSupported = CrossTabManager.isSupported(
        StorageLocations.SessionStorage
      );
      const indexedDBSupported = CrossTabManager.isSupported(
        StorageLocations.IndexedDB
      );

      if (typeof BroadcastChannel !== "undefined") {
        // BroadcastChannel supports all storage types
        expect(localStorageSupported).toBe(true);
        expect(sessionStorageSupported).toBe(true);
        expect(indexedDBSupported).toBe(true);
      } else if (typeof window !== "undefined" && "onstorage" in window) {
        // Storage events only support web storage
        expect(localStorageSupported).toBe(true);
        expect(sessionStorageSupported).toBe(true);
        expect(indexedDBSupported).toBe(false);
      } else {
        // No support
        expect(localStorageSupported).toBe(false);
        expect(sessionStorageSupported).toBe(false);
        expect(indexedDBSupported).toBe(false);
      }
    });

    it("should recommend correct sync method", () => {
      const method = CrossTabManager.getRecommendedMethod(
        StorageLocations.LocalStorage
      );

      if (typeof BroadcastChannel !== "undefined") {
        expect(method).toBe("broadcast");
      } else if (typeof window !== "undefined" && "onstorage" in window) {
        expect(method).toBe("storage-events");
      } else {
        expect(method).toBe("none");
      }
    });
  });
});
