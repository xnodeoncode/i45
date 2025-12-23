/**
 * SessionStorageService Tests
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { SessionStorageService } from "../src/services/SessionStorageService";

describe("SessionStorageService", () => {
  let service: SessionStorageService;

  beforeEach(() => {
    service = new SessionStorageService();
    sessionStorage.clear();
  });

  describe("save()", () => {
    it("should save a single item", async () => {
      await service.save("testKey", "testValue");
      expect(sessionStorage.getItem("testKey")).toBe("testValue");
    });

    it("should save multiple items", async () => {
      await service.save("key1", "value1");
      await service.save("key2", "value2");
      await service.save("key3", "value3");

      expect(sessionStorage.getItem("key1")).toBe("value1");
      expect(sessionStorage.getItem("key2")).toBe("value2");
      expect(sessionStorage.getItem("key3")).toBe("value3");
    });

    it("should be isolated from localStorage", async () => {
      await service.save("key", "sessionValue");
      expect(sessionStorage.getItem("key")).toBe("sessionValue");
      expect(localStorage.getItem("key")).toBeNull();
    });
  });

  describe("retrieve()", () => {
    it("should retrieve a saved item", async () => {
      sessionStorage.setItem("testKey", "testValue");
      const item = await service.retrieve("testKey");
      expect(item).toEqual({ name: "testKey", value: "testValue" });
    });

    it("should return null for non-existent key", async () => {
      const item = await service.retrieve("nonExistent");
      expect(item).toBeNull();
    });

    it("should not retrieve from localStorage", async () => {
      localStorage.setItem("localKey", "localValue");
      const item = await service.retrieve("localKey");
      expect(item).toBeNull();
    });
  });

  describe("remove()", () => {
    it("should remove an item", async () => {
      sessionStorage.setItem("testKey", "testValue");
      await service.remove("testKey");
      expect(sessionStorage.getItem("testKey")).toBeNull();
    });

    it("should not affect localStorage", async () => {
      const key = "sharedKey";
      sessionStorage.setItem(key, "sessionValue");
      localStorage.setItem(key, "localValue");

      await service.remove(key);

      expect(sessionStorage.getItem(key)).toBeNull();
      expect(localStorage.getItem(key)).toBe("localValue");
    });
  });

  describe("clear()", () => {
    it("should clear all session storage items", async () => {
      sessionStorage.setItem("key1", "value1");
      sessionStorage.setItem("key2", "value2");
      await service.clear();
      expect(sessionStorage.length).toBe(0);
    });

    it("should not affect localStorage", async () => {
      sessionStorage.setItem("sessionKey", "sessionValue");
      localStorage.setItem("localKey", "localValue");

      await service.clear();

      expect(sessionStorage.length).toBe(0);
      expect(localStorage.length).toBe(1);
    });
  });

  describe("Storage Isolation", () => {
    it("should maintain separate storage from localStorage", async () => {
      const key = "sharedKey";
      sessionStorage.setItem(key, "sessionValue");
      localStorage.setItem(key, "localValue");

      const item = await service.retrieve(key);

      expect(item?.value).toBe("sessionValue");
      expect(localStorage.getItem(key)).toBe("localValue");
    });
  });
});
