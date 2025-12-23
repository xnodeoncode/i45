/**
 * StorageEventSync Tests
 * Tests for Storage Event-based cross-tab synchronization
 */

import { describe, it, expect, afterEach, jest } from "@jest/globals";
import { StorageEventSync } from "../../src/sync/StorageEventSync";

/**
 * Helper to create StorageEvent that works in jsdom
 * jsdom has issues with storageArea property in StorageEvent constructor
 */
function createStorageEvent(
  key: string | null,
  newValue: string | null,
  oldValue: string | null,
  storageArea: Storage
): StorageEvent {
  const event = new StorageEvent("storage", {
    key,
    newValue,
    oldValue,
  });
  // Manually set storageArea after construction to work around jsdom limitation
  Object.defineProperty(event, "storageArea", {
    value: storageArea,
    writable: false,
  });
  return event;
}

describe("StorageEventSync", () => {
  let sync: StorageEventSync<any>;

  afterEach(() => {
    sync?.close();
    localStorage.clear();
  });

  describe("Constructor", () => {
    it("should create StorageEventSync instance", () => {
      sync = new StorageEventSync("test-key");
      expect(sync).toBeInstanceOf(StorageEventSync);
    });

    it("should accept callbacks for update, remove, and clear", () => {
      const onUpdate = jest.fn<(items: any[]) => void>();
      const onRemove = jest.fn<() => void>();
      const onClear = jest.fn<() => void>();

      sync = new StorageEventSync("test-key", onUpdate, onRemove, onClear);
      expect(sync).toBeInstanceOf(StorageEventSync);
    });
  });

  describe("Storage Event Handling", () => {
    it("should call onUpdate when storage event occurs with new value", async () => {
      const testItems = [{ id: 1, name: "Test" }];
      const onUpdate = jest.fn<(items: any[]) => void>();

      sync = new StorageEventSync("test-key", onUpdate);

      // Simulate storage event (as if from another tab)
      const event = createStorageEvent(
        "test-key",
        JSON.stringify(testItems),
        null,
        localStorage
      );

      window.dispatchEvent(event);

      // Wait for async handler
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onUpdate).toHaveBeenCalledWith(testItems);
    });

    it("should call onRemove when storage event occurs with null value", async () => {
      const onRemove = jest.fn<() => void>();

      sync = new StorageEventSync("test-key", undefined, onRemove);

      const event = createStorageEvent(
        "test-key",
        null,
        JSON.stringify([{ id: 1 }]),
        localStorage
      );

      window.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onRemove).toHaveBeenCalled();
    });

    it("should ignore events for different storage keys", async () => {
      const onUpdate = jest.fn<(items: any[]) => void>();

      sync = new StorageEventSync("test-key", onUpdate);

      const event = createStorageEvent(
        "different-key",
        JSON.stringify([{ id: 1 }]),
        null,
        localStorage
      );

      window.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should handle invalid JSON gracefully", async () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const onUpdate = jest.fn<(items: any[]) => void>();

      sync = new StorageEventSync("test-key", onUpdate);

      const event = createStorageEvent(
        "test-key",
        "invalid-json",
        null,
        localStorage
      );

      window.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onUpdate).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe("Get Storage Key", () => {
    it("should return the storage key", () => {
      sync = new StorageEventSync("test-key");
      expect(sync.getStorageKey()).toBe("test-key");
    });
  });

  describe("Close", () => {
    it("should remove event listener without errors", () => {
      sync = new StorageEventSync("test-key");
      expect(() => sync.close()).not.toThrow();
    });

    it("should not call callbacks after close", async () => {
      const onUpdate = jest.fn<(items: any[]) => void>();
      sync = new StorageEventSync("test-key", onUpdate);

      sync.close();

      const event = createStorageEvent(
        "test-key",
        JSON.stringify([{ id: 1 }]),
        null,
        localStorage
      );

      window.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Static Methods", () => {
    it("should correctly detect storage event support", () => {
      const isSupported = StorageEventSync.isSupported();

      if (typeof window !== "undefined" && "onstorage" in window) {
        expect(isSupported).toBe(true);
      } else {
        expect(isSupported).toBe(false);
      }
    });
  });
});
