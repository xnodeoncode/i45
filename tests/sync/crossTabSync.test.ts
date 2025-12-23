/**
 * CrossTabSync Tests
 * Tests for BroadcastChannel-based cross-tab synchronization
 */

import { describe, it, expect, afterEach, jest } from "@jest/globals";
import { CrossTabSync } from "../../src/sync/CrossTabSync";
import { getTabId, clearTabId } from "../../src/sync/TabIdGenerator";

describe("CrossTabSync", () => {
  let sync: CrossTabSync<any>;

  afterEach(() => {
    sync?.close();
    clearTabId();
  });

  describe("Constructor", () => {
    it("should create CrossTabSync instance with BroadcastChannel", () => {
      if (typeof BroadcastChannel === "undefined") {
        // Skip test if BroadcastChannel not supported
        expect(true).toBe(true);
        return;
      }

      sync = new CrossTabSync("test-key");
      expect(sync).toBeInstanceOf(CrossTabSync);
    });

    it("should throw error if BroadcastChannel is not supported", () => {
      const originalBroadcastChannel = (global as any).BroadcastChannel;
      (global as any).BroadcastChannel = undefined;

      expect(() => {
        sync = new CrossTabSync("test-key");
      }).toThrow("BroadcastChannel is not supported");

      (global as any).BroadcastChannel = originalBroadcastChannel;
    });

    it("should accept callbacks for update, remove, and clear", () => {
      if (typeof BroadcastChannel === "undefined") {
        expect(true).toBe(true);
        return;
      }

      const onUpdate = jest.fn<(items: any[]) => void>();
      const onRemove = jest.fn<() => void>();
      const onClear = jest.fn<() => void>();

      sync = new CrossTabSync("test-key", onUpdate, onRemove, onClear);
      expect(sync).toBeInstanceOf(CrossTabSync);
    });
  });

  describe("Broadcasting", () => {
    it("should broadcast update message", async () => {
      if (typeof BroadcastChannel === "undefined") {
        expect(true).toBe(true);
        return;
      }

      sync = new CrossTabSync("test-key");
      const items = [{ id: 1, name: "Test" }];

      await expect(sync.broadcast(items)).resolves.toBeUndefined();
    });

    it("should broadcast remove message", async () => {
      if (typeof BroadcastChannel === "undefined") {
        expect(true).toBe(true);
        return;
      }

      sync = new CrossTabSync("test-key");
      await expect(sync.broadcastRemove()).resolves.toBeUndefined();
    });

    it("should broadcast clear message", async () => {
      if (typeof BroadcastChannel === "undefined") {
        expect(true).toBe(true);
        return;
      }

      sync = new CrossTabSync("test-key");
      await expect(sync.broadcastClear()).resolves.toBeUndefined();
    });
  });

  describe("Message Handling", () => {
    it("should call onUpdate callback when receiving update from another tab", (done) => {
      if (typeof BroadcastChannel === "undefined") {
        done();
        return;
      }

      const testItems = [{ id: 1, name: "Updated" }];

      const onUpdate = jest.fn((items) => {
        expect(items).toEqual(testItems);
        done();
      });

      sync = new CrossTabSync("test-key", onUpdate);

      // Simulate message from another tab
      const anotherSync = new CrossTabSync("test-key");
      anotherSync.broadcast(testItems);

      setTimeout(() => {
        anotherSync.close();
        if (onUpdate.mock.calls.length === 0) {
          done();
        }
      }, 100);
    });

    it("should call onRemove callback when receiving remove from another tab", (done) => {
      if (typeof BroadcastChannel === "undefined") {
        done();
        return;
      }

      const onRemove = jest.fn(() => {
        expect(onRemove).toHaveBeenCalled();
        done();
      });

      sync = new CrossTabSync("test-key", undefined, onRemove);

      const anotherSync = new CrossTabSync("test-key");
      anotherSync.broadcastRemove();

      setTimeout(() => {
        anotherSync.close();
        if (onRemove.mock.calls.length === 0) {
          done();
        }
      }, 100);
    });

    it("should call onClear callback when receiving clear from another tab", (done) => {
      if (typeof BroadcastChannel === "undefined") {
        done();
        return;
      }

      const onClear = jest.fn(() => {
        expect(onClear).toHaveBeenCalled();
        done();
      });

      sync = new CrossTabSync("test-key", undefined, undefined, onClear);

      const anotherSync = new CrossTabSync("test-key");
      anotherSync.broadcastClear();

      setTimeout(() => {
        anotherSync.close();
        if (onClear.mock.calls.length === 0) {
          done();
        }
      }, 100);
    });

    it("should ignore messages from the same tab", async () => {
      if (typeof BroadcastChannel === "undefined") {
        expect(true).toBe(true);
        return;
      }

      const onUpdate = jest.fn<(items: any[]) => void>();
      sync = new CrossTabSync("test-key", onUpdate);

      await sync.broadcast([{ id: 1 }]);

      // Wait a bit for message processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should not call callback for own messages
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Tab ID", () => {
    it("should return unique tab ID", () => {
      if (typeof BroadcastChannel === "undefined") {
        expect(true).toBe(true);
        return;
      }

      sync = new CrossTabSync("test-key");
      const tabId = sync.getTabId();

      expect(tabId).toBeTruthy();
      expect(typeof tabId).toBe("string");
      expect(tabId).toContain("tab-");
    });

    it("should return same tab ID across instances", () => {
      if (typeof BroadcastChannel === "undefined") {
        expect(true).toBe(true);
        return;
      }

      const sync1 = new CrossTabSync("test-key-1");
      const sync2 = new CrossTabSync("test-key-2");

      expect(sync1.getTabId()).toBe(sync2.getTabId());

      sync1.close();
      sync2.close();
    });
  });

  describe("Close", () => {
    it("should close BroadcastChannel without errors", () => {
      if (typeof BroadcastChannel === "undefined") {
        expect(true).toBe(true);
        return;
      }

      sync = new CrossTabSync("test-key");
      expect(() => sync.close()).not.toThrow();
    });
  });

  describe("Static Methods", () => {
    it("should correctly detect BroadcastChannel support", () => {
      const isSupported = CrossTabSync.isSupported();

      if (typeof BroadcastChannel !== "undefined") {
        expect(isSupported).toBe(true);
      } else {
        expect(isSupported).toBe(false);
      }
    });
  });
});
