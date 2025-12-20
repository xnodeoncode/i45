/**
 * Model Tests
 * Tests for StorageItem and StorageLocations models
 */

import { describe, it, expect } from "@jest/globals";
import { StorageLocations } from "../src/models/storageLocations";
import type { StorageLocation } from "../src/models/storageLocations";
import { createStorageItem } from "../src/models/storageItem";
import type { StorageItem } from "../src/models/storageItem";

describe("StorageLocations", () => {
  describe("Enum Values", () => {
    it("should have SessionStorage value", () => {
      expect(StorageLocations.SessionStorage).toBe("sessionStorage");
    });

    it("should have LocalStorage value", () => {
      expect(StorageLocations.LocalStorage).toBe("localStorage");
    });

    it("should only have two storage locations", () => {
      const values = Object.values(StorageLocations);
      expect(values).toHaveLength(2);
    });
  });

  describe("Type Safety", () => {
    it("should allow valid storage location assignments", () => {
      const location1: StorageLocation = StorageLocations.LocalStorage;
      const location2: StorageLocation = StorageLocations.SessionStorage;

      expect(location1).toBe("localStorage");
      expect(location2).toBe("sessionStorage");
    });

    it("should work with string literals", () => {
      const location1: StorageLocation = "localStorage";
      const location2: StorageLocation = "sessionStorage";

      expect(location1).toBe(StorageLocations.LocalStorage);
      expect(location2).toBe(StorageLocations.SessionStorage);
    });
  });

  describe("Enum Usage", () => {
    it("should be usable in switch statements", () => {
      const location: StorageLocation = StorageLocations.LocalStorage;
      let result = "";

      switch (location) {
        case StorageLocations.LocalStorage:
          result = "local";
          break;
        case StorageLocations.SessionStorage:
          result = "session";
          break;
      }

      expect(result).toBe("local");
    });

    it("should be usable in equality checks", () => {
      const location: StorageLocation = "localStorage";
      expect(location === StorageLocations.LocalStorage).toBe(true);
      expect(location === StorageLocations.SessionStorage).toBe(false);
    });

    it("should be iterable", () => {
      const locations = Object.values(StorageLocations);
      expect(locations).toContain("localStorage");
      expect(locations).toContain("sessionStorage");
    });
  });
});

describe("StorageItem", () => {
  describe("Interface Structure", () => {
    it("should have name property", () => {
      const item: StorageItem = { name: "testName", value: "testValue" };
      expect(item.name).toBe("testName");
    });

    it("should have value property", () => {
      const item: StorageItem = { name: "testName", value: "testValue" };
      expect(item.value).toBe("testValue");
    });

    it("should only have two properties", () => {
      const item: StorageItem = { name: "test", value: "test" };
      const keys = Object.keys(item);
      expect(keys).toHaveLength(2);
      expect(keys).toContain("name");
      expect(keys).toContain("value");
    });
  });

  describe("createStorageItem()", () => {
    it("should create a storage item", () => {
      const item = createStorageItem("myKey", "myValue");

      expect(item).toEqual({ name: "myKey", value: "myValue" });
    });

    it("should create items with empty strings", () => {
      const item = createStorageItem("", "");

      expect(item).toEqual({ name: "", value: "" });
    });

    it("should create items with special characters", () => {
      const item = createStorageItem(
        "key-with_special.chars@123",
        "value!@#$%"
      );

      expect(item.name).toBe("key-with_special.chars@123");
      expect(item.value).toBe("value!@#$%");
    });

    it("should create items with unicode", () => {
      const item = createStorageItem("日本語", "🚀💻🎉");

      expect(item.name).toBe("日本語");
      expect(item.value).toBe("🚀💻🎉");
    });

    it("should create items with long values", () => {
      const longValue = "x".repeat(10000);
      const item = createStorageItem("longKey", longValue);

      expect(item.value.length).toBe(10000);
    });
  });

  describe("Type Safety", () => {
    it("should enforce string types for name", () => {
      const item: StorageItem = { name: "test", value: "test" };
      // This would cause a TypeScript error if uncommented:
      // const invalidItem: StorageItem = { name: 123, value: 'test' };

      expect(typeof item.name).toBe("string");
    });

    it("should enforce string types for value", () => {
      const item: StorageItem = { name: "test", value: "test" };
      // This would cause a TypeScript error if uncommented:
      // const invalidItem: StorageItem = { name: 'test', value: 123 };

      expect(typeof item.value).toBe("string");
    });
  });

  describe("Object Operations", () => {
    it("should support object spreading", () => {
      const item: StorageItem = { name: "original", value: "value" };
      const updated = { ...item, value: "updated" };

      expect(updated).toEqual({ name: "original", value: "updated" });
    });

    it("should support destructuring", () => {
      const item: StorageItem = { name: "myKey", value: "myValue" };
      const { name, value } = item;

      expect(name).toBe("myKey");
      expect(value).toBe("myValue");
    });

    it("should be serializable to JSON", () => {
      const item: StorageItem = { name: "key", value: "value" };
      const json = JSON.stringify(item);
      const parsed = JSON.parse(json) as StorageItem;

      expect(parsed).toEqual(item);
    });

    it("should work in arrays", () => {
      const items: StorageItem[] = [
        { name: "key1", value: "value1" },
        { name: "key2", value: "value2" },
        { name: "key3", value: "value3" },
      ];

      expect(items).toHaveLength(3);
      expect(items[0].name).toBe("key1");
      expect(items[2].value).toBe("value3");
    });

    it("should support array mapping", () => {
      const items: StorageItem[] = [
        { name: "key1", value: "1" },
        { name: "key2", value: "2" },
      ];

      const names = items.map((item) => item.name);
      const values = items.map((item) => item.value);

      expect(names).toEqual(["key1", "key2"]);
      expect(values).toEqual(["1", "2"]);
    });

    it("should support array filtering", () => {
      const items: StorageItem[] = [
        { name: "keep", value: "yes" },
        { name: "remove", value: "no" },
        { name: "keep2", value: "yes" },
      ];

      const filtered = items.filter((item) => item.value === "yes");

      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe("keep");
      expect(filtered[1].name).toBe("keep2");
    });
  });

  describe("Edge Cases", () => {
    it("should handle whitespace in name", () => {
      const item: StorageItem = { name: "  spaced  ", value: "value" };
      expect(item.name).toBe("  spaced  ");
    });

    it("should handle whitespace in value", () => {
      const item: StorageItem = { name: "key", value: "  spaced  " };
      expect(item.value).toBe("  spaced  ");
    });

    it("should handle newlines", () => {
      const item: StorageItem = { name: "key", value: "line1\nline2\nline3" };
      expect(item.value.split("\n")).toHaveLength(3);
    });

    it("should handle JSON strings as values", () => {
      const jsonValue = JSON.stringify({ nested: "object" });
      const item: StorageItem = { name: "jsonKey", value: jsonValue };

      const parsed = JSON.parse(item.value);
      expect(parsed).toEqual({ nested: "object" });
    });

    it("should handle extremely long names", () => {
      const longName = "k".repeat(1000);
      const item: StorageItem = { name: longName, value: "value" };

      expect(item.name.length).toBe(1000);
    });

    it("should maintain reference equality", () => {
      const item1: StorageItem = { name: "key", value: "value" };
      const item2 = item1;

      expect(item1 === item2).toBe(true);
      expect(item1).toBe(item2);
    });

    it("should not maintain reference equality for spread", () => {
      const item1: StorageItem = { name: "key", value: "value" };
      const item2 = { ...item1 };

      expect(item1 === item2).toBe(false);
      expect(item1).toEqual(item2);
    });
  });
});

describe("Model Integration", () => {
  it("should work together in typical usage", () => {
    const location: StorageLocation = StorageLocations.LocalStorage;
    const item: StorageItem = createStorageItem("testKey", "testValue");

    expect(location).toBe("localStorage");
    expect(item.name).toBe("testKey");
    expect(item.value).toBe("testValue");
  });

  it("should support creating items for different locations", () => {
    const localItem = createStorageItem("localKey", "localValue");
    const sessionItem = createStorageItem("sessionKey", "sessionValue");

    const items = {
      [StorageLocations.LocalStorage]: [localItem],
      [StorageLocations.SessionStorage]: [sessionItem],
    };

    expect(items.localStorage).toHaveLength(1);
    expect(items.sessionStorage).toHaveLength(1);
  });

  it("should support batch operations", () => {
    const items: StorageItem[] = Array.from({ length: 5 }, (_, i) =>
      createStorageItem(`key${i}`, `value${i}`)
    );

    const location: StorageLocation = StorageLocations.LocalStorage;

    expect(items).toHaveLength(5);
    expect(location).toBe("localStorage");
    expect(items[0]).toEqual({ name: "key0", value: "value0" });
    expect(items[4]).toEqual({ name: "key4", value: "value4" });
  });
});
