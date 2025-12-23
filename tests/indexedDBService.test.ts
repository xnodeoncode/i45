/**
 * IndexedDBService Tests
 */

import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { IndexedDBService } from "../src/services/IndexedDBService";

describe("IndexedDBService", () => {
  let service: IndexedDBService;

  beforeEach(() => {
    service = new IndexedDBService();
  });

  afterEach(async () => {
    // Clean up - clear the database and close connection
    if (service.isAvailable()) {
      await service.clear().catch(() => {
        // Ignore errors during cleanup
      });
      service.close();
    }
  });

  describe("Availability", () => {
    it("should be available in test environment", () => {
      expect(service.isAvailable()).toBe(true);
    });
  });

  describe("save()", () => {
    it("should save a single item", async () => {
      await service.save("testKey", "testValue");

      const item = await service.retrieve("testKey");
      expect(item).toEqual({ name: "testKey", value: "testValue" });
    });

    it("should save multiple items", async () => {
      await service.save("key1", "value1");
      await service.save("key2", "value2");
      await service.save("key3", "value3");

      const item1 = await service.retrieve("key1");
      const item2 = await service.retrieve("key2");
      const item3 = await service.retrieve("key3");

      expect(item1?.value).toBe("value1");
      expect(item2?.value).toBe("value2");
      expect(item3?.value).toBe("value3");
    });

    it("should overwrite existing items", async () => {
      await service.save("key", "oldValue");
      await service.save("key", "newValue");

      const item = await service.retrieve("key");
      expect(item?.value).toBe("newValue");
    });

    it("should handle empty string values", async () => {
      await service.save("emptyKey", "");

      const item = await service.retrieve("emptyKey");
      expect(item?.value).toBe("");
    });

    it("should handle unicode values", async () => {
      await service.save("unicode", "日本語🚀");

      const item = await service.retrieve("unicode");
      expect(item?.value).toBe("日本語🚀");
    });

    it("should handle large values", async () => {
      const largeValue = "x".repeat(1000000); // 1MB string
      await service.save("largeKey", largeValue);

      const item = await service.retrieve("largeKey");
      expect(item?.value).toBe(largeValue);
    });
  });

  describe("retrieve()", () => {
    it("should retrieve a saved item", async () => {
      await service.save("testKey", "testValue");

      const item = await service.retrieve("testKey");
      expect(item).toEqual({ name: "testKey", value: "testValue" });
    });

    it("should return null for non-existent key", async () => {
      const item = await service.retrieve("nonExistent");
      expect(item).toBeNull();
    });

    it("should return null for empty key", async () => {
      const item = await service.retrieve("");
      expect(item).toBeNull();
    });

    it("should retrieve complex JSON strings", async () => {
      const jsonValue = JSON.stringify({ id: 1, data: [1, 2, 3] });
      await service.save("jsonKey", jsonValue);

      const item = await service.retrieve("jsonKey");
      expect(item?.value).toBe(jsonValue);
    });
  });

  describe("remove()", () => {
    it("should remove an item", async () => {
      await service.save("testKey", "testValue");
      await service.remove("testKey");

      const item = await service.retrieve("testKey");
      expect(item).toBeNull();
    });

    it("should not throw error when removing non-existent key", async () => {
      await expect(service.remove("nonExistent")).resolves.not.toThrow();
    });

    it("should not remove other items", async () => {
      await service.save("key1", "value1");
      await service.save("key2", "value2");

      await service.remove("key1");

      const item1 = await service.retrieve("key1");
      const item2 = await service.retrieve("key2");

      expect(item1).toBeNull();
      expect(item2?.value).toBe("value2");
    });

    it("should handle empty key gracefully", async () => {
      await expect(service.remove("")).resolves.not.toThrow();
    });
  });

  describe("clear()", () => {
    it("should clear all items", async () => {
      await service.save("key1", "value1");
      await service.save("key2", "value2");
      await service.save("key3", "value3");

      await service.clear();

      const item1 = await service.retrieve("key1");
      const item2 = await service.retrieve("key2");
      const item3 = await service.retrieve("key3");

      expect(item1).toBeNull();
      expect(item2).toBeNull();
      expect(item3).toBeNull();
    });

    it("should work on empty database", async () => {
      await expect(service.clear()).resolves.not.toThrow();
    });
  });

  describe("close()", () => {
    it("should close database connection", async () => {
      await service.save("key", "value");
      service.close();

      // After closing, should be able to open again
      await service.save("key2", "value2");
      const item = await service.retrieve("key2");
      expect(item?.value).toBe("value2");
    });

    it("should handle close without prior operations", () => {
      expect(() => service.close()).not.toThrow();
    });

    it("should handle multiple close calls", async () => {
      await service.save("key", "value");
      service.close();
      service.close();
      expect(() => service.close()).not.toThrow();
    });
  });

  describe("Integration", () => {
    it("should handle complete lifecycle", async () => {
      await service.save("key", "value");

      const retrieved = await service.retrieve("key");
      expect(retrieved?.value).toBe("value");

      await service.remove("key");
      const afterRemove = await service.retrieve("key");
      expect(afterRemove).toBeNull();
    });

    it("should handle multiple operations in sequence", async () => {
      await service.save("key1", "value1");
      await service.save("key2", "value2");

      const item1 = await service.retrieve("key1");
      expect(item1?.value).toBe("value1");

      await service.save("key1", "updated1");
      const updated = await service.retrieve("key1");
      expect(updated?.value).toBe("updated1");

      await service.remove("key2");
      const removed = await service.retrieve("key2");
      expect(removed).toBeNull();

      await service.clear();
      const afterClear = await service.retrieve("key1");
      expect(afterClear).toBeNull();
    });

    it("should persist data across service instances", async () => {
      await service.save("persistentKey", "persistentValue");
      service.close();

      const newService = new IndexedDBService();
      const item = await newService.retrieve("persistentKey");

      expect(item?.value).toBe("persistentValue");

      await newService.clear();
      newService.close();
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in keys", async () => {
      const specialKey = "key-with_special.chars@123";
      await service.save(specialKey, "value");

      const item = await service.retrieve(specialKey);
      expect(item?.value).toBe("value");
    });

    it("should handle special characters in values", async () => {
      const specialValue = '{"json": true, "array": [1, 2, 3]}';
      await service.save("key", specialValue);

      const item = await service.retrieve("key");
      expect(item?.value).toBe(specialValue);
    });

    it("should handle rapid consecutive operations", async () => {
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(service.save(`key${i}`, `value${i}`));
      }

      await Promise.all(operations);

      const item0 = await service.retrieve("key0");
      const item9 = await service.retrieve("key9");

      expect(item0?.value).toBe("value0");
      expect(item9?.value).toBe("value9");
    });

    it("should handle concurrent reads", async () => {
      await service.save("key1", "value1");
      await service.save("key2", "value2");

      const [item1, item2] = await Promise.all([
        service.retrieve("key1"),
        service.retrieve("key2"),
      ]);

      expect(item1?.value).toBe("value1");
      expect(item2?.value).toBe("value2");
    });
  });

  describe("Storage Isolation", () => {
    it("should not interfere with localStorage", async () => {
      localStorage.setItem("localKey", "localValue");
      await service.save("indexedKey", "indexedValue");

      const indexedItem = await service.retrieve("indexedKey");
      expect(indexedItem?.value).toBe("indexedValue");
      expect(localStorage.getItem("localKey")).toBe("localValue");
    });

    it("should not interfere with sessionStorage", async () => {
      sessionStorage.setItem("sessionKey", "sessionValue");
      await service.save("indexedKey", "indexedValue");

      const indexedItem = await service.retrieve("indexedKey");
      expect(indexedItem?.value).toBe("indexedValue");
      expect(sessionStorage.getItem("sessionKey")).toBe("sessionValue");
    });

    it("should maintain separate namespace", async () => {
      const sharedKey = "sharedKey";

      localStorage.setItem(sharedKey, "localValue");
      sessionStorage.setItem(sharedKey, "sessionValue");
      await service.save(sharedKey, "indexedValue");

      const indexedItem = await service.retrieve(sharedKey);
      expect(indexedItem?.value).toBe("indexedValue");
      expect(localStorage.getItem(sharedKey)).toBe("localValue");
      expect(sessionStorage.getItem(sharedKey)).toBe("sessionValue");
    });
  });

  describe("Error Handling", () => {
    it("should handle operations after clear", async () => {
      await service.save("key", "value");
      await service.clear();
      await service.save("newKey", "newValue");

      const item = await service.retrieve("newKey");
      expect(item?.value).toBe("newValue");
    });

    it("should handle save after remove", async () => {
      await service.save("key", "value1");
      await service.remove("key");
      await service.save("key", "value2");

      const item = await service.retrieve("key");
      expect(item?.value).toBe("value2");
    });
  });
});
