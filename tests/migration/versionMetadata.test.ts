/**
 * Tests for VersionMetadata utilities
 */

import { describe, it, expect } from "@jest/globals";
import {
  createVersionedData,
  isVersionedData,
  extractItems,
  getDataVersion,
  type VersionMetadata,
} from "../../src/models/VersionMetadata";

describe("VersionMetadata", () => {
  describe("createVersionedData", () => {
    it("should create versioned data structure", () => {
      const items = [{ id: 1, name: "Item 1" }];
      const result = createVersionedData(items, 2);

      expect(result.version).toBe(2);
      expect(result.items).toEqual(items);
      expect(result.migrationHistory).toEqual([]);
    });

    it("should handle empty items array", () => {
      const result = createVersionedData([], 1);

      expect(result.version).toBe(1);
      expect(result.items).toEqual([]);
      expect(result.migrationHistory).toEqual([]);
    });

    it("should preserve item references", () => {
      const item = { id: 1, name: "Item" };
      const items = [item];
      const result = createVersionedData(items, 1);

      expect(result.items[0]).toBe(item);
    });
  });

  describe("isVersionedData", () => {
    it("should return true for valid versioned data", () => {
      const data: VersionMetadata<any> = {
        version: 2,
        items: [{ id: 1 }],
        migrationHistory: [],
      };

      expect(isVersionedData(data)).toBe(true);
    });

    it("should return true for versioned data without optional fields", () => {
      const data = {
        version: 1,
        items: [],
      };

      expect(isVersionedData(data)).toBe(true);
    });

    it("should return false for non-object data", () => {
      expect(isVersionedData(null)).toBe(false);
      expect(isVersionedData(undefined)).toBe(false);
      expect(isVersionedData("string")).toBe(false);
      expect(isVersionedData(123)).toBe(false);
      expect(isVersionedData(true)).toBe(false);
    });

    it("should return false for objects missing version", () => {
      const data = {
        items: [{ id: 1 }],
      };

      expect(isVersionedData(data)).toBe(false);
    });

    it("should return false for objects missing items", () => {
      const data = {
        version: 2,
      };

      expect(isVersionedData(data)).toBe(false);
    });

    it("should return false if version is not a number", () => {
      const data = {
        version: "2",
        items: [],
      };

      expect(isVersionedData(data)).toBe(false);
    });

    it("should return false if items is not an array", () => {
      const data = {
        version: 2,
        items: "not an array",
      };

      expect(isVersionedData(data)).toBe(false);
    });

    it("should return false for plain arrays", () => {
      expect(isVersionedData([{ id: 1 }])).toBe(false);
      expect(isVersionedData([])).toBe(false);
    });
  });

  describe("extractItems", () => {
    it("should extract items from versioned data", () => {
      const items = [{ id: 1 }, { id: 2 }];
      const data = createVersionedData(items, 2);

      const result = extractItems(data);

      expect(result).toEqual(items);
    });

    it("should return plain array as-is", () => {
      const items = [{ id: 1 }, { id: 2 }];

      const result = extractItems(items);

      expect(result).toEqual(items);
    });

    it("should return empty array for null", () => {
      expect(extractItems(null)).toEqual([]);
    });

    it("should return empty array for undefined", () => {
      expect(extractItems(undefined)).toEqual([]);
    });

    it("should return empty array for non-array, non-versioned data", () => {
      expect(extractItems("string")).toEqual([]);
      expect(extractItems(123)).toEqual([]);
      expect(extractItems({ random: "object" })).toEqual([]);
    });

    it("should return empty array from empty versioned data", () => {
      const data = createVersionedData([], 1);

      expect(extractItems(data)).toEqual([]);
    });
  });

  describe("getDataVersion", () => {
    it("should return version from versioned data", () => {
      const data = createVersionedData([{ id: 1 }], 3);

      expect(getDataVersion(data)).toBe(3);
    });

    it("should return 1 for unversioned array", () => {
      expect(getDataVersion([{ id: 1 }])).toBe(1);
    });

    it("should return 1 for null", () => {
      expect(getDataVersion(null)).toBe(1);
    });

    it("should return 1 for undefined", () => {
      expect(getDataVersion(undefined)).toBe(1);
    });

    it("should return 1 for empty array", () => {
      expect(getDataVersion([])).toBe(1);
    });

    it("should return 1 for non-versioned objects", () => {
      expect(getDataVersion({ random: "object" })).toBe(1);
    });

    it("should handle version 1 explicitly", () => {
      const data = createVersionedData([{ id: 1 }], 1);

      expect(getDataVersion(data)).toBe(1);
    });

    it("should handle high version numbers", () => {
      const data = createVersionedData([{ id: 1 }], 999);

      expect(getDataVersion(data)).toBe(999);
    });
  });

  describe("Migration History Structure", () => {
    it("should have proper migration record structure", () => {
      const data = createVersionedData([{ id: 1 }], 2);

      // Simulate a migration record
      data.migrationHistory = [
        {
          fromVersion: 1,
          toVersion: 2,
          timestamp: "2025-12-23T00:00:00Z",
          itemCount: 1,
          duration: 15,
        },
      ];

      expect(data.migrationHistory[0].fromVersion).toBe(1);
      expect(data.migrationHistory[0].toVersion).toBe(2);
      expect(data.migrationHistory[0].timestamp).toBe("2025-12-23T00:00:00Z");
      expect(data.migrationHistory[0].itemCount).toBe(1);
      expect(data.migrationHistory[0].duration).toBe(15);
    });

    it("should handle multiple migration records", () => {
      const data = createVersionedData([{ id: 1 }], 3);

      data.migrationHistory = [
        {
          fromVersion: 1,
          toVersion: 2,
          timestamp: "2025-12-23T00:00:00Z",
          itemCount: 1,
          duration: 10,
        },
        {
          fromVersion: 2,
          toVersion: 3,
          timestamp: "2025-12-23T00:01:00Z",
          itemCount: 1,
          duration: 15,
        },
      ];

      expect(data.migrationHistory).toHaveLength(2);
      expect(data.migrationHistory[0].toVersion).toBe(2);
      expect(data.migrationHistory[1].toVersion).toBe(3);
    });
  });
});
