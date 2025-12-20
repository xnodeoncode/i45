/**
 * Exception Classes Tests
 * Comprehensive tests for custom exception classes
 */

import { describe, it, expect } from "@jest/globals";
import {
  PersistenceServiceNotEnabled,
  DataServiceUnavailable,
  StorageKeyError,
  StorageLocationError,
  DataRetrievalError,
  StorageQuotaError,
} from "../src/errors/index";

describe("Exception Classes", () => {
  describe("PersistenceServiceNotEnabled", () => {
    it("should create instance with default message", () => {
      const error = new PersistenceServiceNotEnabled();
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PersistenceServiceNotEnabled);
      expect(error.name).toBe("PersistenceServiceNotEnabled");
      expect(error.message).toBe("Persistence service is not enabled");
    });

    it("should create instance with custom message", () => {
      const customMessage = "Custom persistence error message";
      const error = new PersistenceServiceNotEnabled(customMessage);
      expect(error.message).toBe(customMessage);
      expect(error.name).toBe("PersistenceServiceNotEnabled");
    });

    it("should have stack trace", () => {
      const error = new PersistenceServiceNotEnabled();
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("PersistenceServiceNotEnabled");
    });

    it("should be throwable and catchable", () => {
      expect(() => {
        throw new PersistenceServiceNotEnabled("Test error");
      }).toThrow(PersistenceServiceNotEnabled);

      expect(() => {
        throw new PersistenceServiceNotEnabled("Test error");
      }).toThrow("Test error");
    });

    it("should work with try-catch", () => {
      try {
        throw new PersistenceServiceNotEnabled("Test error");
      } catch (error) {
        expect(error).toBeInstanceOf(PersistenceServiceNotEnabled);
        expect((error as Error).message).toBe("Test error");
      }
    });
  });

  describe("DataServiceUnavailable", () => {
    it("should create instance with default message", () => {
      const error = new DataServiceUnavailable();
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DataServiceUnavailable);
      expect(error.name).toBe("DataServiceUnavailable");
      expect(error.message).toBe("Data service is unavailable");
    });

    it("should create instance with custom message", () => {
      const customMessage = "Service temporarily down";
      const error = new DataServiceUnavailable(customMessage);
      expect(error.message).toBe(customMessage);
      expect(error.name).toBe("DataServiceUnavailable");
    });

    it("should have stack trace", () => {
      const error = new DataServiceUnavailable();
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("DataServiceUnavailable");
    });

    it("should be throwable and catchable", () => {
      expect(() => {
        throw new DataServiceUnavailable("Database is down");
      }).toThrow(DataServiceUnavailable);

      expect(() => {
        throw new DataServiceUnavailable("Database is down");
      }).toThrow("Database is down");
    });
  });

  describe("StorageKeyError", () => {
    it("should create instance with key and message", () => {
      const key = "testKey";
      const message = "Invalid storage key";
      const error = new StorageKeyError(key, message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(StorageKeyError);
      expect(error.name).toBe("StorageKeyError");
      expect(error.message).toBe(message);
      expect(error.key).toBe(key);
    });

    it("should have stack trace", () => {
      const error = new StorageKeyError("testKey", "Invalid key");
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("StorageKeyError");
    });

    it("should store key as public property", () => {
      const key = "myStorageKey";
      const error = new StorageKeyError(key, "Key error");
      expect(error.key).toBe(key);
    });

    it("should be throwable and catchable", () => {
      expect(() => {
        throw new StorageKeyError("badKey", "Key is invalid");
      }).toThrow(StorageKeyError);

      expect(() => {
        throw new StorageKeyError("badKey", "Key is invalid");
      }).toThrow("Key is invalid");
    });

    it("should allow access to key property in catch block", () => {
      try {
        throw new StorageKeyError("problematicKey", "Bad key");
      } catch (error) {
        expect(error).toBeInstanceOf(StorageKeyError);
        const storageError = error as StorageKeyError;
        expect(storageError.key).toBe("problematicKey");
        expect(storageError.message).toBe("Bad key");
      }
    });
  });

  describe("StorageLocationError", () => {
    it("should create instance with location and valid locations", () => {
      const location = "invalidStorage";
      const validLocations = ["localStorage", "sessionStorage"];
      const error = new StorageLocationError(location, validLocations);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(StorageLocationError);
      expect(error.name).toBe("StorageLocationError");
      expect(error.location).toBe(location);
      expect(error.validLocations).toEqual(validLocations);
    });

    it("should generate descriptive message", () => {
      const error = new StorageLocationError("badLocation", [
        "localStorage",
        "sessionStorage",
      ]);
      expect(error.message).toBe(
        "Invalid storage location: badLocation. Must be one of: localStorage, sessionStorage"
      );
    });

    it("should handle single valid location", () => {
      const error = new StorageLocationError("bad", ["localStorage"]);
      expect(error.message).toContain("Must be one of: localStorage");
    });

    it("should handle multiple valid locations", () => {
      const error = new StorageLocationError("bad", ["a", "b", "c"]);
      expect(error.message).toContain("Must be one of: a, b, c");
    });

    it("should have stack trace", () => {
      const error = new StorageLocationError("invalid", ["valid1", "valid2"]);
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("StorageLocationError");
    });

    it("should be throwable and catchable", () => {
      expect(() => {
        throw new StorageLocationError("bad", ["good"]);
      }).toThrow(StorageLocationError);
    });

    it("should allow access to properties in catch block", () => {
      try {
        throw new StorageLocationError("invalidLoc", [
          "localStorage",
          "sessionStorage",
        ]);
      } catch (error) {
        expect(error).toBeInstanceOf(StorageLocationError);
        const locError = error as StorageLocationError;
        expect(locError.location).toBe("invalidLoc");
        expect(locError.validLocations).toEqual([
          "localStorage",
          "sessionStorage",
        ]);
      }
    });
  });

  describe("DataRetrievalError", () => {
    it("should create instance with key and cause", () => {
      const key = "testKey";
      const cause = new Error("Original error");
      const error = new DataRetrievalError(key, cause);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DataRetrievalError);
      expect(error.name).toBe("DataRetrievalError");
      expect(error.key).toBe(key);
      expect(error.cause).toBe(cause);
    });

    it("should generate descriptive message", () => {
      const key = "myKey";
      const cause = new Error("Network failure");
      const error = new DataRetrievalError(key, cause);
      expect(error.message).toBe(`Failed to retrieve data for key: ${key}`);
    });

    it("should have stack trace", () => {
      const error = new DataRetrievalError("key", new Error("cause"));
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("DataRetrievalError");
    });

    it("should preserve cause error", () => {
      const cause = new Error("Database connection failed");
      const error = new DataRetrievalError("userData", cause);
      expect(error.cause).toBe(cause);
      expect(error.cause.message).toBe("Database connection failed");
    });

    it("should be throwable and catchable", () => {
      const cause = new Error("Timeout");
      expect(() => {
        throw new DataRetrievalError("data", cause);
      }).toThrow(DataRetrievalError);
    });

    it("should allow access to properties in catch block", () => {
      const cause = new Error("Parse error");
      try {
        throw new DataRetrievalError("jsonData", cause);
      } catch (error) {
        expect(error).toBeInstanceOf(DataRetrievalError);
        const dataError = error as DataRetrievalError;
        expect(dataError.key).toBe("jsonData");
        expect(dataError.cause).toBe(cause);
        expect(dataError.cause.message).toBe("Parse error");
      }
    });

    it("should work with different cause types", () => {
      const typeError = new TypeError("Type mismatch");
      const error1 = new DataRetrievalError("key1", typeError);
      expect(error1.cause).toBeInstanceOf(TypeError);

      const syntaxError = new SyntaxError("JSON syntax error");
      const error2 = new DataRetrievalError("key2", syntaxError);
      expect(error2.cause).toBeInstanceOf(SyntaxError);
    });
  });

  describe("StorageQuotaError", () => {
    it("should create instance with key and storage type", () => {
      const key = "testKey";
      const storageType = "localStorage";
      const error = new StorageQuotaError(key, storageType);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(StorageQuotaError);
      expect(error.name).toBe("StorageQuotaError");
      expect(error.key).toBe(key);
      expect(error.storageType).toBe(storageType);
    });

    it("should generate descriptive message with default", () => {
      const error = new StorageQuotaError("myKey", "localStorage");
      expect(error.message).toBe(
        'Storage quota exceeded for key "myKey" in localStorage'
      );
    });

    it("should create instance with custom message", () => {
      const customMessage = "Quota limit reached";
      const error = new StorageQuotaError(
        "testKey",
        "sessionStorage",
        customMessage
      );
      expect(error.message).toBe(
        'Quota limit reached for key "testKey" in sessionStorage'
      );
      expect(error.name).toBe("StorageQuotaError");
    });

    it("should have stack trace", () => {
      const error = new StorageQuotaError("key", "localStorage");
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("StorageQuotaError");
    });

    it("should be throwable and catchable", () => {
      expect(() => {
        throw new StorageQuotaError("key", "localStorage");
      }).toThrow(StorageQuotaError);

      expect(() => {
        throw new StorageQuotaError("key", "localStorage");
      }).toThrow(/Storage quota exceeded/);
    });

    it("should store properties as public fields", () => {
      const error = new StorageQuotaError("dataKey", "sessionStorage");
      expect(error.key).toBe("dataKey");
      expect(error.storageType).toBe("sessionStorage");
    });
  });

  describe("Exception Inheritance", () => {
    it("all custom exceptions should inherit from Error", () => {
      expect(new PersistenceServiceNotEnabled()).toBeInstanceOf(Error);
      expect(new DataServiceUnavailable()).toBeInstanceOf(Error);
      expect(new StorageKeyError("k", "m")).toBeInstanceOf(Error);
      expect(new StorageLocationError("l", ["v"])).toBeInstanceOf(Error);
      expect(new DataRetrievalError("k", new Error())).toBeInstanceOf(Error);
      expect(new StorageQuotaError("k", "localStorage")).toBeInstanceOf(Error);
    });

    it("should be distinguishable using instanceof", () => {
      const errors = [
        new PersistenceServiceNotEnabled(),
        new DataServiceUnavailable(),
        new StorageKeyError("k", "m"),
        new StorageLocationError("l", ["v"]),
        new DataRetrievalError("k", new Error()),
        new StorageQuotaError("k", "localStorage"),
      ];

      // Each should only match its own type
      expect(errors[0]).toBeInstanceOf(PersistenceServiceNotEnabled);
      expect(errors[0]).not.toBeInstanceOf(DataServiceUnavailable);

      expect(errors[1]).toBeInstanceOf(DataServiceUnavailable);
      expect(errors[1]).not.toBeInstanceOf(StorageKeyError);

      expect(errors[2]).toBeInstanceOf(StorageKeyError);
      expect(errors[2]).not.toBeInstanceOf(StorageLocationError);

      expect(errors[3]).toBeInstanceOf(StorageLocationError);
      expect(errors[3]).not.toBeInstanceOf(DataRetrievalError);

      expect(errors[4]).toBeInstanceOf(DataRetrievalError);
      expect(errors[4]).not.toBeInstanceOf(PersistenceServiceNotEnabled);

      expect(errors[5]).toBeInstanceOf(StorageQuotaError);
      expect(errors[5]).not.toBeInstanceOf(PersistenceServiceNotEnabled);
    });

    it("should work with Error.name property", () => {
      const errors = {
        persistence: new PersistenceServiceNotEnabled(),
        dataService: new DataServiceUnavailable(),
        storageKey: new StorageKeyError("k", "m"),
        storageLocation: new StorageLocationError("l", ["v"]),
        dataRetrieval: new DataRetrievalError("k", new Error()),
        storageQuota: new StorageQuotaError("k", "localStorage"),
      };

      expect(errors.persistence.name).toBe("PersistenceServiceNotEnabled");
      expect(errors.dataService.name).toBe("DataServiceUnavailable");
      expect(errors.storageKey.name).toBe("StorageKeyError");
      expect(errors.storageLocation.name).toBe("StorageLocationError");
      expect(errors.dataRetrieval.name).toBe("DataRetrievalError");
      expect(errors.storageQuota.name).toBe("StorageQuotaError");
    });
  });
});
