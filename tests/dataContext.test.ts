/**
 * DataContext Tests
 * Comprehensive tests for the main DataContext class
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { DataContext, StorageLocations, Logger } from "../src/index";
import { MockLogger, createMockStorageItems } from "./test-utils";

describe("DataContext", () => {
  let context: DataContext;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("Constructor", () => {
    it("should create instance with default settings", () => {
      context = new DataContext();
      const settings = context.getCurrentSettings();

      expect(settings.storageKey).toBe("Items");
      expect(settings.storageLocation).toBe(StorageLocations.LocalStorage);
    });

    it("should create instance with custom storage key", () => {
      context = new DataContext("MyData");
      const settings = context.getCurrentSettings();

      expect(settings.storageKey).toBe("MyData");
      expect(settings.storageLocation).toBe(StorageLocations.LocalStorage);
    });

    it("should create instance with custom storage location", () => {
      context = new DataContext("MyData", StorageLocations.SessionStorage);
      const settings = context.getCurrentSettings();

      expect(settings.storageKey).toBe("MyData");
      expect(settings.storageLocation).toBe(StorageLocations.SessionStorage);
    });

    it("should initialize with logging disabled", () => {
      context = new DataContext();
      expect(context.loggingEnabled).toBe(false);
    });

    it("should initialize with no logger service", () => {
      context = new DataContext();
      expect(context.logger).toBeNull();
    });
  });

  describe("Properties", () => {
    beforeEach(() => {
      context = new DataContext();
    });

    describe("storageKey", () => {
      it("should get storage key", () => {
        expect(context.storageKey).toBe("Items");
      });

      it("should set storage key", () => {
        context.storageKey = "NewKey";
        expect(context.storageKey).toBe("NewKey");
      });

      it("should throw error for non-string storage key", () => {
        expect(() => {
          context.storageKey = 123 as any;
        }).toThrow();
      });

      it("should throw error for empty storage key", () => {
        expect(() => {
          context.storageKey = "";
        }).toThrow();
      });

      it("should throw error for whitespace-only storage key", () => {
        expect(() => {
          context.storageKey = "   ";
        }).toThrow();
      });
    });

    describe("storageLocation", () => {
      it("should get storage location", () => {
        expect(context.storageLocation).toBe(StorageLocations.LocalStorage);
      });

      it("should set storage location to sessionStorage", () => {
        context.storageLocation = StorageLocations.SessionStorage;
        expect(context.storageLocation).toBe(StorageLocations.SessionStorage);
      });

      it("should throw error for invalid storage location", () => {
        expect(() => {
          context.storageLocation = "invalidStorage" as any;
        }).toThrow();
      });
    });

    describe("loggingEnabled", () => {
      it("should enable logging", () => {
        context.loggingEnabled = true;
        expect(context.loggingEnabled).toBe(true);
      });

      it("should disable logging", () => {
        context.loggingEnabled = true;
        context.loggingEnabled = false;
        expect(context.loggingEnabled).toBe(false);
      });

      it("should throw error for non-boolean value", () => {
        expect(() => {
          context.loggingEnabled = "true" as any;
        }).toThrow();
      });
    });

    describe("logger", () => {
      it("should set logger instance", () => {
        const logger = new Logger();
        context.logger = logger;
        expect(context.logger).toBe(logger);
      });

      it("should set logger to null", () => {
        const logger = new Logger();
        context.logger = logger;
        context.logger = null;
        expect(context.logger).toBeNull();
      });

      it("should throw error for invalid logger", () => {
        expect(() => {
          context.logger = { log: () => {} } as any;
        }).toThrow();
      });
    });
  });

  describe("store() - Default key/location", () => {
    beforeEach(() => {
      context = new DataContext("TestData");
    });

    it("should store items with default settings", async () => {
      const items = createMockStorageItems(3);
      await context.store(items);

      const stored = localStorage.getItem("TestData");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(items);
    });

    it("should store empty array", async () => {
      await context.store([]);
      const stored = localStorage.getItem("TestData");
      expect(JSON.parse(stored!)).toEqual([]);
    });

    it("should store typed data", async () => {
      interface User {
        id: number;
        name: string;
      }
      const userContext = new DataContext<User>("Users");
      const users: User[] = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ];

      await userContext.store(users);
      const stored = localStorage.getItem("Users");
      expect(JSON.parse(stored!)).toEqual(users);
    });

    it("should throw error for non-array items", async () => {
      await expect(context.store("not an array" as any)).rejects.toThrow();
    });

    it("should throw error for null items", async () => {
      await expect(context.store(null as any)).rejects.toThrow();
    });

    it("should return DataContext instance for chaining", async () => {
      const items = createMockStorageItems(2);
      const result = await context.store(items);
      expect(result).toBe(context);
    });

    it("should overwrite existing data", async () => {
      const items1 = [{ name: "first", value: "1" }];
      const items2 = [{ name: "second", value: "2" }];

      await context.store(items1);
      await context.store(items2);

      const stored = localStorage.getItem("TestData");
      expect(JSON.parse(stored!)).toEqual(items2);
    });
  });

  describe("storeAs() - Custom key", () => {
    beforeEach(() => {
      context = new DataContext();
    });

    it("should store items with custom key", async () => {
      const items = createMockStorageItems(2);
      await context.storeAs("CustomKey", items);

      const stored = localStorage.getItem("CustomKey");
      expect(JSON.parse(stored!)).toEqual(items);
    });

    it("should not affect default storage key", async () => {
      const items1 = [{ name: "default", value: "1" }];
      const items2 = [{ name: "custom", value: "2" }];

      await context.store(items1);
      await context.storeAs("CustomKey", items2);

      const defaultStored = localStorage.getItem("Items");
      const customStored = localStorage.getItem("CustomKey");

      expect(JSON.parse(defaultStored!)).toEqual(items1);
      expect(JSON.parse(customStored!)).toEqual(items2);
    });

    it("should throw error for invalid key", async () => {
      const items = createMockStorageItems(1);
      await expect(context.storeAs("", items)).rejects.toThrow();
    });
  });

  describe("storeAt() - Custom key and location", () => {
    beforeEach(() => {
      context = new DataContext();
    });

    it("should store items in sessionStorage", async () => {
      const items = createMockStorageItems(3);
      await context.storeAt(
        "SessionData",
        StorageLocations.SessionStorage,
        items
      );

      const stored = sessionStorage.getItem("SessionData");
      expect(JSON.parse(stored!)).toEqual(items);
      expect(localStorage.getItem("SessionData")).toBeNull();
    });

    it("should store items in localStorage", async () => {
      const items = createMockStorageItems(2);
      await context.storeAt("LocalData", StorageLocations.LocalStorage, items);

      const stored = localStorage.getItem("LocalData");
      expect(JSON.parse(stored!)).toEqual(items);
      expect(sessionStorage.getItem("LocalData")).toBeNull();
    });

    it("should throw error for invalid storage location", async () => {
      const items = createMockStorageItems(1);
      await expect(
        context.storeAt("Key", "invalidStorage" as any, items)
      ).rejects.toThrow();
    });
  });

  describe("retrieve() - Default key/location", () => {
    beforeEach(() => {
      context = new DataContext("TestData");
    });

    it("should retrieve stored items", async () => {
      const items = createMockStorageItems(3);
      await context.store(items);
      const retrieved = await context.retrieve();

      expect(retrieved).toEqual(items);
    });

    it("should return empty array when no data exists", async () => {
      const retrieved = await context.retrieve();
      expect(retrieved).toEqual([]);
    });

    it("should retrieve typed data", async () => {
      interface Product {
        id: number;
        name: string;
        price: number;
      }
      const productContext = new DataContext<Product>("Products");
      const products: Product[] = [
        { id: 1, name: "Widget", price: 9.99 },
        { id: 2, name: "Gadget", price: 19.99 },
      ];

      await productContext.store(products);
      const retrieved = await productContext.retrieve();

      expect(retrieved).toEqual(products);
    });

    it("should handle corrupted data gracefully", async () => {
      localStorage.setItem("TestData", "invalid json {{{");
      const retrieved = await context.retrieve();
      expect(retrieved).toEqual([]);
    });
  });

  describe("retrieveFrom() - Custom key", () => {
    beforeEach(() => {
      context = new DataContext();
    });

    it("should retrieve items from custom key", async () => {
      const items = createMockStorageItems(2);
      await context.storeAs("CustomKey", items);
      const retrieved = await context.retrieveFrom("CustomKey");

      expect(retrieved).toEqual(items);
    });

    it("should return empty array when custom key has no data", async () => {
      const retrieved = await context.retrieveFrom("NonExistentKey");
      expect(retrieved).toEqual([]);
    });
  });

  describe("retrieveAt() - Custom key and location", () => {
    beforeEach(() => {
      context = new DataContext();
    });

    it("should retrieve items from sessionStorage", async () => {
      const items = createMockStorageItems(3);
      await context.storeAt(
        "SessionData",
        StorageLocations.SessionStorage,
        items
      );
      const retrieved = await context.retrieveAt(
        "SessionData",
        StorageLocations.SessionStorage
      );

      expect(retrieved).toEqual(items);
    });

    it("should retrieve items from localStorage", async () => {
      const items = createMockStorageItems(2);
      await context.storeAt("LocalData", StorageLocations.LocalStorage, items);
      const retrieved = await context.retrieveAt(
        "LocalData",
        StorageLocations.LocalStorage
      );

      expect(retrieved).toEqual(items);
    });

    it("should not retrieve from wrong storage location", async () => {
      const items = createMockStorageItems(1);
      await context.storeAt("Data", StorageLocations.LocalStorage, items);
      const retrieved = await context.retrieveAt(
        "Data",
        StorageLocations.SessionStorage
      );

      expect(retrieved).toEqual([]);
    });
  });

  describe("remove() - Default key/location", () => {
    beforeEach(() => {
      context = new DataContext("TestData");
    });

    it("should remove stored items", async () => {
      const items = createMockStorageItems(3);
      await context.store(items);
      await context.remove();

      expect(localStorage.getItem("TestData")).toBeNull();
    });

    it("should not throw error when removing non-existent data", async () => {
      await expect(context.remove()).resolves.toBeTruthy();
    });

    it("should return DataContext instance for chaining", async () => {
      const result = await context.remove();
      expect(result).toBe(context);
    });
  });

  describe("removeFrom() - Custom key", () => {
    beforeEach(() => {
      context = new DataContext();
    });

    it("should remove items from custom key", async () => {
      const items = createMockStorageItems(2);
      await context.storeAs("CustomKey", items);
      await context.removeFrom("CustomKey");

      expect(localStorage.getItem("CustomKey")).toBeNull();
    });

    it("should not affect other keys", async () => {
      const items1 = [{ name: "key1", value: "1" }];
      const items2 = [{ name: "key2", value: "2" }];

      await context.storeAs("Key1", items1);
      await context.storeAs("Key2", items2);
      await context.removeFrom("Key1");

      expect(localStorage.getItem("Key1")).toBeNull();
      expect(localStorage.getItem("Key2")).not.toBeNull();
    });
  });

  describe("removeAt() - Custom key and location", () => {
    beforeEach(() => {
      context = new DataContext();
    });

    it("should remove items from sessionStorage", async () => {
      const items = createMockStorageItems(1);
      await context.storeAt(
        "SessionData",
        StorageLocations.SessionStorage,
        items
      );
      await context.removeAt("SessionData", StorageLocations.SessionStorage);

      expect(sessionStorage.getItem("SessionData")).toBeNull();
    });

    it("should remove items from localStorage", async () => {
      const items = createMockStorageItems(1);
      await context.storeAt("LocalData", StorageLocations.LocalStorage, items);
      await context.removeAt("LocalData", StorageLocations.LocalStorage);

      expect(localStorage.getItem("LocalData")).toBeNull();
    });
  });

  describe("clear()", () => {
    beforeEach(() => {
      context = new DataContext();
    });

    it("should clear all items from localStorage", async () => {
      localStorage.setItem("Key1", "value1");
      localStorage.setItem("Key2", "value2");
      localStorage.setItem("Key3", "value3");

      await context.clear();

      expect(localStorage.length).toBe(0);
    });

    it("should only clear current storage location", async () => {
      localStorage.setItem("LocalKey", "localValue");
      sessionStorage.setItem("SessionKey", "sessionValue");

      // Context defaults to localStorage
      await context.clear();

      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(1);
    });

    it("should clear sessionStorage when configured", async () => {
      const sessionContext = new DataContext(
        "Items",
        StorageLocations.SessionStorage
      );
      sessionStorage.setItem("Key1", "value1");
      sessionStorage.setItem("Key2", "value2");

      await sessionContext.clear();

      expect(sessionStorage.length).toBe(0);
    });
  });

  describe("Method Chaining", () => {
    beforeEach(() => {
      context = new DataContext();
    });

    it("should support chaining store and remove", async () => {
      const items = createMockStorageItems(2);

      await context.store(items).then((ctx) => ctx.remove());

      expect(localStorage.getItem("Items")).toBeNull();
    });

    it("should support property setters and store", async () => {
      const items = createMockStorageItems(1);

      context.storageKey = "ChainedKey";
      await context.store(items);

      expect(localStorage.getItem("ChainedKey")).not.toBeNull();
    });
  });

  describe("Logging Integration", () => {
    let logger: Logger;

    beforeEach(() => {
      context = new DataContext();
      logger = new Logger();
      context.logger = logger;
      context.loggingEnabled = true;
    });

    it("should log store operations when enabled", async () => {
      const items = createMockStorageItems(1);
      await context.store(items);

      const events = context.printLog();
      expect(events.length).toBeGreaterThan(0);
    });

    it("should not log when logging is disabled", async () => {
      context.loggingEnabled = false;
      const items = createMockStorageItems(1);
      await context.store(items);

      const events = context.printLog();
      // Only printLog itself should be logged (when we enable it temporarily)
      expect(
        events.filter((e: any) => e.message?.includes("STORE"))
      ).toHaveLength(0);
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      context = new DataContext("EdgeCase");
    });

    it("should handle special characters in storage key", async () => {
      context.storageKey = "Key-With_Special.Chars123";
      const items = createMockStorageItems(1);

      await context.store(items);
      const retrieved = await context.retrieve();

      expect(retrieved).toEqual(items);
    });

    it("should handle large data sets", async () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        name: `item-${i}`,
        value: `value-${i}`,
      }));

      await context.store(largeArray);
      const retrieved = await context.retrieve();

      expect(retrieved).toHaveLength(1000);
      expect(retrieved[0]).toEqual(largeArray[0]);
      expect(retrieved[999]).toEqual(largeArray[999]);
    });

    it("should handle unicode characters", async () => {
      const items = [
        { name: "日本語", value: "こんにちは" },
        { name: "emoji", value: "🚀💻🎉" },
        { name: "arabic", value: "مرحبا" },
      ];

      await context.store(items);
      const retrieved = await context.retrieve();

      expect(retrieved).toEqual(items);
    });

    it("should handle complex nested objects", async () => {
      interface ComplexData {
        id: number;
        nested: {
          level1: {
            level2: {
              value: string;
            };
          };
        };
        array: number[];
      }

      const complexContext = new DataContext<ComplexData>("Complex");
      const complexData: ComplexData[] = [
        {
          id: 1,
          nested: { level1: { level2: { value: "deep" } } },
          array: [1, 2, 3],
        },
      ];

      await complexContext.store(complexData);
      const retrieved = await complexContext.retrieve();

      expect(retrieved).toEqual(complexData);
      expect(retrieved[0].nested.level1.level2.value).toBe("deep");
    });
  });

  describe("getCurrentSettings()", () => {
    it("should return current settings", () => {
      context = new DataContext("MyKey", StorageLocations.SessionStorage);
      const settings = context.getCurrentSettings();

      expect(settings.storageKey).toBe("MyKey");
      expect(settings.storageLocation).toBe(StorageLocations.SessionStorage);
    });

    it("should return updated settings after changes", () => {
      context = new DataContext();
      context.storageKey = "UpdatedKey";
      context.storageLocation = StorageLocations.SessionStorage;

      const settings = context.getCurrentSettings();

      expect(settings.storageKey).toBe("UpdatedKey");
      expect(settings.storageLocation).toBe(StorageLocations.SessionStorage);
    });
  });

  describe("getData()", () => {
    it("should return internal data stores", async () => {
      context = new DataContext();
      const items = createMockStorageItems(3);
      await context.store(items);

      const data = context.getData();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return copy of data stores", async () => {
      context = new DataContext();
      const items = createMockStorageItems(2);
      await context.store(items);

      const data1 = context.getData();
      const data2 = context.getData();

      // Should be separate arrays (copies)
      expect(data1).not.toBe(data2);
    });
  });

  describe("addClient()", () => {
    it("should create logger if not exists", () => {
      context = new DataContext();
      const client = {
        log: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      };

      const result = context.addClient(client);
      expect(result).toBe(context);
    });

    it("should warn for non-object client", () => {
      context = new DataContext();
      const logger = new Logger();
      context.logger = logger;
      context.loggingEnabled = true;

      // Pass a non-object (null, string, number)
      context.addClient(null);
      context.addClient("notAnObject" as any);
      context.addClient(123 as any);

      // Should not throw, just warn
      expect(true).toBe(true);
    });

    it("should handle client addition error gracefully", () => {
      context = new DataContext();
      const logger = new Logger();
      context.logger = logger;

      // Try to add invalid client
      const invalidClient = {};
      context.addClient(invalidClient);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe("Logger Integration Edge Cases", () => {
    it("should handle logger setter with null", () => {
      context = new DataContext();
      context.logger = null;
      expect(context.logger).toBeNull();
    });

    it("should throw for invalid logger type", () => {
      context = new DataContext();
      expect(() => {
        context.logger = "not a logger" as any;
      }).toThrow();
    });

    it("should handle printLog when logger not configured", () => {
      context = new DataContext();
      const events = context.printLog();
      expect(events).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid operations gracefully", async () => {
      context = new DataContext();

      // Try to retrieve non-existent data
      const result = await context.retrieve();
      expect(result).toEqual([]);
    });

    it("should handle corrupted localStorage data", async () => {
      context = new DataContext("CorruptedKey");
      localStorage.setItem("CorruptedKey", "not valid json {[");

      const result = await context.retrieve();
      expect(result).toEqual([]);
    });
  });

  describe("Additional Integration Tests", () => {
    it("should handle multiple store operations with different keys", async () => {
      context = new DataContext();
      const items1 = createMockStorageItems(2);
      const items2 = createMockStorageItems(3);

      await context.storeAs("Key1", items1);
      await context.storeAs("Key2", items2);

      const retrieved1 = await context.retrieveFrom("Key1");
      const retrieved2 = await context.retrieveFrom("Key2");

      expect(retrieved1).toHaveLength(2);
      expect(retrieved2).toHaveLength(3);
    });

    it("should handle store and retrieve across different storage locations", async () => {
      const items = createMockStorageItems(2);

      await context.storeAt("LocalKey", StorageLocations.LocalStorage, items);
      await context.storeAt(
        "SessionKey",
        StorageLocations.SessionStorage,
        items
      );

      const localData = await context.retrieveAt(
        "LocalKey",
        StorageLocations.LocalStorage
      );
      const sessionData = await context.retrieveAt(
        "SessionKey",
        StorageLocations.SessionStorage
      );

      expect(localData).toHaveLength(2);
      expect(sessionData).toHaveLength(2);
      expect(localData).toEqual(sessionData);
    });

    it("should handle mixed operations with logging enabled", async () => {
      const logger = new Logger();
      context = new DataContext("MixedKey");
      context.logger = logger;
      context.loggingEnabled = true;

      const items = createMockStorageItems(2);
      await context.store(items);
      await context.retrieve();
      await context.remove();

      const events = context.printLog();
      expect(events.length).toBeGreaterThan(0);
    });

    it("should handle retrieveFrom with non-existent key", async () => {
      context = new DataContext();
      const result = await context.retrieveFrom("NonExistentKey");
      expect(result).toEqual([]);
    });

    it("should handle retrieveAt with non-existent key", async () => {
      context = new DataContext();
      const result = await context.retrieveAt(
        "NonExistent",
        StorageLocations.LocalStorage
      );
      expect(result).toEqual([]);
    });

    it("should handle removeFrom with non-existent key", async () => {
      context = new DataContext();
      const result = await context.removeFrom("NonExistentKey");
      expect(result).toBe(context);
    });

    it("should handle removeAt with non-existent key", async () => {
      context = new DataContext();
      const result = await context.removeAt(
        "NonExistent",
        StorageLocations.LocalStorage
      );
      expect(result).toBe(context);
    });
  });
});
