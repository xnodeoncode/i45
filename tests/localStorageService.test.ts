/**
 * LocalStorageService Tests
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { LocalStorageService } from "../src/services/LocalStorageService";

describe("LocalStorageService", () => {
  let service: LocalStorageService;

  beforeEach(() => {
    service = new LocalStorageService();
    localStorage.clear();
  });

  describe("save()", () => {
    it("should save a single item", async () => {
      await service.save("testKey", "testValue");
      expect(localStorage.getItem("testKey")).toBe("testValue");
    });

    it("should save multiple items", async () => {
      await service.save("key1", "value1");
      await service.save("key2", "value2");
      await service.save("key3", "value3");

      expect(localStorage.getItem("key1")).toBe("value1");
      expect(localStorage.getItem("key2")).toBe("value2");
      expect(localStorage.getItem("key3")).toBe("value3");
    });

    it("should overwrite existing items", async () => {
      await service.save("key", "oldValue");
      await service.save("key", "newValue");
      expect(localStorage.getItem("key")).toBe("newValue");
    });

    it("should handle empty string values", async () => {
      await service.save("emptyKey", "");
      expect(localStorage.getItem("emptyKey")).toBe("");
    });

    it("should handle unicode values", async () => {
      await service.save("unicode", "日本語🚀");
      expect(localStorage.getItem("unicode")).toBe("日本語🚀");
    });
  });

  describe("retrieve()", () => {
    it("should retrieve a saved item", async () => {
      localStorage.setItem("testKey", "testValue");
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
  });

  describe("remove()", () => {
    it("should remove an item", async () => {
      localStorage.setItem("testKey", "testValue");
      await service.remove("testKey");
      expect(localStorage.getItem("testKey")).toBeNull();
    });

    it("should not throw error when removing non-existent key", async () => {
      await expect(service.remove("nonExistent")).resolves.not.toThrow();
    });
  });

  describe("clear()", () => {
    it("should clear all items", async () => {
      localStorage.setItem("key1", "value1");
      localStorage.setItem("key2", "value2");
      await service.clear();
      expect(localStorage.length).toBe(0);
    });
  });

  describe("Integration", () => {
    it("should handle complete lifecycle", async () => {
      await service.save("key", "value");
      const retrieved = await service.retrieve("key");
      expect(retrieved?.value).toBe("value");

      await service.remove("key");
      expect(await service.retrieve("key")).toBeNull();
    });
  });
});
