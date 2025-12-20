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
    it("should save a single item", () => {
      service.save("testKey", "testValue");
      expect(sessionStorage.getItem("testKey")).toBe("testValue");
    });

    it("should save multiple items", () => {
      service.save("key1", "value1");
      service.save("key2", "value2");
      service.save("key3", "value3");

      expect(sessionStorage.getItem("key1")).toBe("value1");
      expect(sessionStorage.getItem("key2")).toBe("value2");
      expect(sessionStorage.getItem("key3")).toBe("value3");
    });

    it("should be isolated from localStorage", () => {
      service.save("key", "sessionValue");
      expect(sessionStorage.getItem("key")).toBe("sessionValue");
      expect(localStorage.getItem("key")).toBeNull();
    });
  });

  describe("retrieve()", () => {
    it("should retrieve a saved item", () => {
      sessionStorage.setItem("testKey", "testValue");
      const item = service.retrieve("testKey");
      expect(item).toEqual({ name: "testKey", value: "testValue" });
    });

    it("should return null for non-existent key", () => {
      const item = service.retrieve("nonExistent");
      expect(item).toBeNull();
    });

    it("should not retrieve from localStorage", () => {
      localStorage.setItem("localKey", "localValue");
      const item = service.retrieve("localKey");
      expect(item).toBeNull();
    });
  });

  describe("remove()", () => {
    it("should remove an item", () => {
      sessionStorage.setItem("testKey", "testValue");
      service.remove("testKey");
      expect(sessionStorage.getItem("testKey")).toBeNull();
    });

    it("should not affect localStorage", () => {
      const key = "sharedKey";
      sessionStorage.setItem(key, "sessionValue");
      localStorage.setItem(key, "localValue");

      service.remove(key);

      expect(sessionStorage.getItem(key)).toBeNull();
      expect(localStorage.getItem(key)).toBe("localValue");
    });
  });

  describe("clear()", () => {
    it("should clear all session storage items", () => {
      sessionStorage.setItem("key1", "value1");
      sessionStorage.setItem("key2", "value2");
      service.clear();
      expect(sessionStorage.length).toBe(0);
    });

    it("should not affect localStorage", () => {
      sessionStorage.setItem("sessionKey", "sessionValue");
      localStorage.setItem("localKey", "localValue");

      service.clear();

      expect(sessionStorage.length).toBe(0);
      expect(localStorage.length).toBe(1);
    });
  });

  describe("Storage Isolation", () => {
    it("should maintain separate storage from localStorage", () => {
      const key = "sharedKey";
      sessionStorage.setItem(key, "sessionValue");
      localStorage.setItem(key, "localValue");

      const item = service.retrieve(key);

      expect(item?.value).toBe("sessionValue");
      expect(localStorage.getItem(key)).toBe("localValue");
    });
  });
});
