/**
 * Tests for StorageMetadata functionality
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { DataContext } from "../src/core/DataContext";
import { StorageLocations } from "../src/models/StorageLocations";
import {
  createMetadata,
  updateMetadata,
  hasMetadata,
  getMetadataInfo,
  isModifiedSince,
  isStale,
  getAge,
  type StorageMetadata,
} from "../src/models/StorageMetadata";

describe("StorageMetadata Model", () => {
  describe("createMetadata()", () => {
    it("should create metadata with current timestamp", () => {
      const items = [{ id: 1, name: "Item 1" }];
      const metadata = createMetadata(items);

      expect(metadata.items).toEqual(items);
      expect(metadata.createdAt).toBeDefined();
      expect(metadata.updatedAt).toBeDefined();
      expect(metadata.itemCount).toBe(1);
      expect(metadata.version).toBe(1);
    });

    it("should create metadata with custom version", () => {
      const items = [{ id: 1 }];
      const metadata = createMetadata(items, 5);

      expect(metadata.version).toBe(5);
    });

    it("should handle empty array", () => {
      const metadata = createMetadata([]);

      expect(metadata.items).toEqual([]);
      expect(metadata.itemCount).toBe(0);
    });

    it("should have ISO 8601 timestamps", () => {
      const metadata = createMetadata([{ id: 1 }]);

      expect(metadata.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(metadata.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should have same createdAt and updatedAt on creation", () => {
      const metadata = createMetadata([{ id: 1 }]);

      expect(metadata.createdAt).toBe(metadata.updatedAt);
    });
  });

  describe("updateMetadata()", () => {
    it("should update items and updatedAt", async () => {
      const original = createMetadata([{ id: 1 }]);

      // Wait a bit to ensure timestamp differs
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = updateMetadata(original, [{ id: 2 }]);

      expect(updated.items).toEqual([{ id: 2 }]);
      expect(updated.createdAt).toBe(original.createdAt);
      expect(updated.updatedAt).not.toBe(original.updatedAt);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
        new Date(original.updatedAt).getTime()
      );
    });

    it("should increment version", () => {
      const original = createMetadata([{ id: 1 }], 1);
      const updated = updateMetadata(original, [{ id: 2 }]);

      expect(updated.version).toBe(2);
    });

    it("should handle missing version", () => {
      const original: StorageMetadata = {
        items: [{ id: 1 }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        itemCount: 1,
      };

      const updated = updateMetadata(original, [{ id: 2 }]);

      expect(updated.version).toBe(2);
    });

    it("should update itemCount", () => {
      const original = createMetadata([{ id: 1 }]);
      const updated = updateMetadata(original, [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);

      expect(updated.itemCount).toBe(3);
    });
  });

  describe("hasMetadata()", () => {
    it("should return true for valid metadata", () => {
      const metadata = createMetadata([{ id: 1 }]);
      expect(hasMetadata(metadata)).toBe(true);
    });

    it("should return false for non-metadata objects", () => {
      expect(hasMetadata({ id: 1 })).toBe(false);
      expect(hasMetadata([{ id: 1 }])).toBe(false);
      expect(hasMetadata(null)).toBe(false);
      expect(hasMetadata(undefined)).toBe(false);
      expect(hasMetadata("string")).toBe(false);
      expect(hasMetadata(123)).toBe(false);
    });

    it("should return false for partial metadata", () => {
      const partial = {
        items: [{ id: 1 }],
        createdAt: new Date().toISOString(),
        // Missing updatedAt and itemCount
      };

      expect(hasMetadata(partial)).toBe(false);
    });

    it("should return false if items is not an array", () => {
      const invalid = {
        items: "not an array",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        itemCount: 1,
      };

      expect(hasMetadata(invalid)).toBe(false);
    });
  });

  describe("getMetadataInfo()", () => {
    it("should extract metadata without items", () => {
      const metadata = createMetadata([{ id: 1 }, { id: 2 }]);
      const info = getMetadataInfo(metadata);

      expect(info).toHaveProperty("createdAt");
      expect(info).toHaveProperty("updatedAt");
      expect(info).toHaveProperty("itemCount");
      expect(info).toHaveProperty("version");
      expect(info).not.toHaveProperty("items");
    });

    it("should preserve timestamp values", () => {
      const metadata = createMetadata([{ id: 1 }]);
      const info = getMetadataInfo(metadata);

      expect(info.createdAt).toBe(metadata.createdAt);
      expect(info.updatedAt).toBe(metadata.updatedAt);
    });
  });

  describe("isModifiedSince()", () => {
    it("should return true if modified after timestamp", () => {
      const metadata = createMetadata([{ id: 1 }]);
      const pastTimestamp = new Date(Date.now() - 1000).toISOString();

      expect(isModifiedSince(metadata, pastTimestamp)).toBe(true);
    });

    it("should return false if modified before timestamp", () => {
      const metadata = createMetadata([{ id: 1 }]);
      const futureTimestamp = new Date(Date.now() + 1000).toISOString();

      expect(isModifiedSince(metadata, futureTimestamp)).toBe(false);
    });

    it("should handle exact timestamp match", () => {
      const metadata = createMetadata([{ id: 1 }]);

      expect(isModifiedSince(metadata, metadata.updatedAt)).toBe(false);
    });
  });

  describe("isStale()", () => {
    it("should return false for fresh data", () => {
      const metadata = createMetadata([{ id: 1 }]);
      const maxAge = 60 * 1000; // 1 minute

      expect(isStale(metadata, maxAge)).toBe(false);
    });

    it("should return true for stale data", async () => {
      const metadata = createMetadata([{ id: 1 }]);

      // Wait longer than max age
      await new Promise((resolve) => setTimeout(resolve, 50));

      const maxAge = 10; // 10ms

      expect(isStale(metadata, maxAge)).toBe(true);
    });

    it("should handle zero max age", async () => {
      const metadata = createMetadata([{ id: 1 }]);
      // Wait 1ms to ensure age > 0
      await new Promise((resolve) => setTimeout(resolve, 1));

      expect(isStale(metadata, 0)).toBe(true);
    });
  });

  describe("getAge()", () => {
    it("should return age in milliseconds", async () => {
      const metadata = createMetadata([{ id: 1 }]);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const age = getAge(metadata);

      expect(age).toBeGreaterThanOrEqual(50);
      expect(age).toBeLessThan(1000);
    });

    it("should return approximately 0 for just-created metadata", () => {
      const metadata = createMetadata([{ id: 1 }]);
      const age = getAge(metadata);

      expect(age).toBeLessThan(100);
    });
  });
});

describe("DataContext with Metadata", () => {
  let context: DataContext<any>;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("Default behavior (trackTimestamps: true)", () => {
    beforeEach(() => {
      context = new DataContext({
        storageKey: "test-metadata",
        storageLocation: StorageLocations.LocalStorage,
        loggingEnabled: false,
        // trackTimestamps defaults to true
      });
    });

    it("should wrap data with metadata when storing", async () => {
      const items = [{ id: 1, name: "Item 1" }];
      await context.store(items);

      const metadata = await context.getMetadata();

      expect(metadata).not.toBeNull();
      expect(metadata?.itemCount).toBe(1);
      expect(metadata?.version).toBe(1);
      expect(metadata?.createdAt).toBeDefined();
      expect(metadata?.updatedAt).toBeDefined();
    });

    it("should retrieve unwrapped items", async () => {
      const items = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ];
      await context.store(items);

      const retrieved = await context.retrieve();

      expect(retrieved).toEqual(items);
      expect(retrieved).not.toHaveProperty("createdAt");
    });

    it("should update metadata on subsequent stores", async () => {
      await context.store([{ id: 1 }]);
      const firstMetadata = await context.getMetadata();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await context.store([{ id: 2 }]);
      const secondMetadata = await context.getMetadata();

      expect(secondMetadata?.version).toBe(2);
      expect(secondMetadata?.createdAt).toBe(firstMetadata?.createdAt);
      expect(new Date(secondMetadata!.updatedAt).getTime()).toBeGreaterThan(
        new Date(firstMetadata!.updatedAt).getTime()
      );
    });

    it("should track item count changes", async () => {
      await context.store([{ id: 1 }]);
      let metadata = await context.getMetadata();
      expect(metadata?.itemCount).toBe(1);

      await context.store([{ id: 1 }, { id: 2 }, { id: 3 }]);
      metadata = await context.getMetadata();
      expect(metadata?.itemCount).toBe(3);
    });
  });

  describe("With trackTimestamps: false", () => {
    beforeEach(() => {
      context = new DataContext({
        storageKey: "test-no-metadata",
        storageLocation: StorageLocations.LocalStorage,
        loggingEnabled: false,
        trackTimestamps: false,
      });
    });

    it("should not wrap data with metadata", async () => {
      const items = [{ id: 1, name: "Item 1" }];
      await context.store(items);

      const metadata = await context.getMetadata();

      expect(metadata).toBeNull();
    });

    it("should retrieve items without metadata", async () => {
      const items = [{ id: 1, name: "Item 1" }];
      await context.store(items);

      const retrieved = await context.retrieve();

      expect(retrieved).toEqual(items);
    });
  });

  describe("storeAs() with metadata", () => {
    beforeEach(() => {
      context = new DataContext({
        storageKey: "default",
        storageLocation: StorageLocations.LocalStorage,
        loggingEnabled: false,
      });
    });

    it("should wrap data stored with custom key", async () => {
      await context.storeAs("custom-key", [{ id: 1 }]);

      const metadata = await context.getMetadataFrom("custom-key");

      expect(metadata).not.toBeNull();
      expect(metadata?.itemCount).toBe(1);
    });

    it("should retrieve unwrapped items from custom key", async () => {
      const items = [{ id: 1 }, { id: 2 }];
      await context.storeAs("custom-key", items);

      const retrieved = await context.retrieveFrom("custom-key");

      expect(retrieved).toEqual(items);
    });
  });

  describe("storeAt() with metadata", () => {
    beforeEach(() => {
      context = new DataContext({
        storageKey: "test",
        storageLocation: StorageLocations.LocalStorage,
        loggingEnabled: false,
      });
    });

    it("should wrap data in sessionStorage", async () => {
      await context.storeAt("session-key", StorageLocations.SessionStorage, [
        { id: 1 },
      ]);

      const metadata = await context.getMetadataAt(
        "session-key",
        StorageLocations.SessionStorage
      );

      expect(metadata).not.toBeNull();
      expect(metadata?.itemCount).toBe(1);
    });

    it("should retrieve unwrapped items from sessionStorage", async () => {
      const items = [{ id: 1 }];
      await context.storeAt(
        "session-key",
        StorageLocations.SessionStorage,
        items
      );

      const retrieved = await context.retrieveAt(
        "session-key",
        StorageLocations.SessionStorage
      );

      expect(retrieved).toEqual(items);
    });
  });

  describe("Metadata helpers integration", () => {
    beforeEach(() => {
      context = new DataContext({
        storageKey: "test-helpers",
        storageLocation: StorageLocations.LocalStorage,
        loggingEnabled: false,
      });
    });

    it("should detect modifications since timestamp", async () => {
      const beforeTimestamp = new Date().toISOString();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await context.store([{ id: 1 }]);
      const metadata = await context.getMetadata();

      expect(isModifiedSince(metadata!, beforeTimestamp)).toBe(true);
    });

    it("should detect stale data", async () => {
      await context.store([{ id: 1 }]);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = await context.getMetadata();
      const maxAge = 10; // 10ms

      expect(isStale(metadata!, maxAge)).toBe(true);
    });

    it("should calculate age correctly", async () => {
      await context.store([{ id: 1 }]);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = await context.getMetadata();
      const age = getAge(metadata!);

      expect(age).toBeGreaterThanOrEqual(50);
    });
  });

  describe("Edge cases", () => {
    beforeEach(() => {
      context = new DataContext({
        storageKey: "test-edge",
        storageLocation: StorageLocations.LocalStorage,
        loggingEnabled: false,
      });
    });

    it("should return null metadata for non-existent key", async () => {
      const metadata = await context.getMetadata();

      expect(metadata).toBeNull();
    });

    it("should handle empty array with metadata", async () => {
      await context.store([]);
      const metadata = await context.getMetadata();

      expect(metadata).not.toBeNull();
      expect(metadata?.itemCount).toBe(0);
    });

    it("should handle switching trackTimestamps setting", async () => {
      // Store with timestamps
      await context.store([{ id: 1 }]);
      let metadata = await context.getMetadata();
      expect(metadata).not.toBeNull();

      // Create new context with timestamps disabled
      const newContext = new DataContext({
        storageKey: "test-edge",
        storageLocation: StorageLocations.LocalStorage,
        loggingEnabled: false,
        trackTimestamps: false,
      });

      // Should still retrieve the items (unwrapping happens in retrieve)
      const items = await newContext.retrieve();
      expect(items).toEqual([{ id: 1 }]);
    });

    it("should preserve version through multiple updates", async () => {
      await context.store([{ id: 1 }]);
      await context.store([{ id: 2 }]);
      await context.store([{ id: 3 }]);
      await context.store([{ id: 4 }]);

      const metadata = await context.getMetadata();

      expect(metadata?.version).toBe(4);
    });
  });

  describe("Real-world scenarios", () => {
    beforeEach(() => {
      context = new DataContext({
        storageKey: "sync-queue",
        storageLocation: StorageLocations.LocalStorage,
        loggingEnabled: false,
      });
    });

    it("should support sync-since-timestamp pattern", async () => {
      const lastSyncTime = new Date().toISOString();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await context.store([{ id: 1, action: "create" }]);

      const metadata = await context.getMetadata();
      const needsSync = isModifiedSince(metadata!, lastSyncTime);

      expect(needsSync).toBe(true);
    });

    it("should support cache freshness checking", async () => {
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

      await context.store([{ id: 1, data: "cached" }]);
      const metadata = await context.getMetadata();

      const isCacheStale = isStale(metadata!, CACHE_TTL);

      expect(isCacheStale).toBe(false); // Just cached
    });

    it("should support version-based conflict resolution", async () => {
      await context.store([{ id: 1, value: "v1" }]);
      const v1 = await context.getMetadata();

      await context.store([{ id: 1, value: "v2" }]);
      const v2 = await context.getMetadata();

      // In a conflict, use higher version
      const shouldUseV2 = v2!.version! > v1!.version!;

      expect(shouldUseV2).toBe(true);
    });
  });
});
