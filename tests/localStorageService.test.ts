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
    it("should save a single item", () => {
      service.save("testKey", "testValue");
      expect(localStorage.getItem("testKey")).toBe("testValue");
    });

    it("should save multiple items", () => {
      service.save("key1", "value1");
      service.save("key2", "value2");
      service.save("key3", "value3");

      expect(localStorage.getItem("key1")).toBe("value1");
      expect(localStorage.getItem("key2")).toBe("value2");
      expect(localStorage.getItem("key3")).toBe("value3");
    });

    it("should overwrite existing items", () => {
      service.save("key", "oldValue");
      service.save("key", "newValue");
      expect(localStorage.getItem("key")).toBe("newValue");
    });

    it("should handle empty string values", () => {
      service.save("emptyKey", "");
      expect(localStorage.getItem("emptyKey")).toBe("");
    });

    it("should handle unicode values", () => {
      service.save("unicode", "日本語🚀");
      expect(localStorage.getItem("unicode")).toBe("日本語🚀");
    });
  });

  describe("retrieve()", () => {
    it("should retrieve a saved item", () => {
      localStorage.setItem("testKey", "testValue");
      const item = service.retrieve("testKey");
      expect(item).toEqual({ name: "testKey", value: "testValue" });
    });

    it("should return null for non-existent key", () => {
      const item = service.retrieve("nonExistent");
      expect(item).toBeNull();
    });

    it("should return null for empty key", () => {
      const item = service.retrieve("");
      expect(item).toBeNull();
    });
  });

  describe("remove()", () => {
    it("should remove an item", () => {
      localStorage.setItem("testKey", "testValue");
      service.remove("testKey");
      expect(localStorage.getItem("testKey")).toBeNull();
    });

    it("should not throw error when removing non-existent key", () => {
      expect(() => service.remove("nonExistent")).not.toThrow();
    });
  });

  describe("clear()", () => {
    it("should clear all items", () => {
      localStorage.setItem("key1", "value1");
      localStorage.setItem("key2", "value2");
      service.clear();
      expect(localStorage.length).toBe(0);
    });
  });

  describe("Integration", () => {
    it("should handle complete lifecycle", () => {
      service.save("key", "value");
      const retrieved = service.retrieve("key");
      expect(retrieved?.value).toBe("value");

      service.remove("key");
      expect(service.retrieve("key")).toBeNull();
    });
  });
});
