/**
 * Tests for MigrationManager
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { MigrationManager } from "../../src/migration/MigrationManager";
import { MigrationError } from "../../src/errors/MigrationError";
import type { MigrationConfig } from "../../src/models/MigrationTypes";
import {
  createVersionedData,
  isVersionedData,
} from "../../src/models/VersionMetadata";

describe("MigrationManager", () => {
  describe("Constructor and Configuration", () => {
    it("should create manager with valid configuration", () => {
      const config: MigrationConfig = {
        version: 2,
        migrations: {
          2: (items) => items.map((item: any) => ({ ...item, status: "new" })),
        },
      };

      const manager = new MigrationManager(config);

      expect(manager.getCurrentVersion()).toBe(2);
    });

    it("should default to version 1 if not specified", () => {
      const manager = new MigrationManager({});

      expect(manager.getCurrentVersion()).toBe(1);
    });

    it("should throw error for invalid version", () => {
      expect(() => {
        new MigrationManager({ version: 0 });
      }).toThrow(MigrationError);

      expect(() => {
        new MigrationManager({ version: -1 });
      }).toThrow(MigrationError);
    });

    it("should throw error for non-function migration", () => {
      expect(() => {
        new MigrationManager({
          version: 2,
          migrations: {
            2: "not a function" as any,
          },
        });
      }).toThrow(MigrationError);
    });

    it("should allow missing migrations at construction (validated during migration)", () => {
      // This should not throw - validation happens during migration
      expect(() => {
        new MigrationManager({
          version: 3,
          migrations: {
            3: (items) => items,
            // Missing migration 2 - this is OK if we never migrate from v1
          },
        });
      }).not.toThrow();
    });
  });

  describe("needsMigration", () => {
    it("should return false for empty data", () => {
      const manager = new MigrationManager({ version: 2 });

      expect(manager.needsMigration([])).toBe(false);
      expect(manager.needsMigration(null)).toBe(false);
      expect(manager.needsMigration(undefined)).toBe(false);
    });

    it("should return false when versions match", () => {
      const manager = new MigrationManager({ version: 2 });
      const data = createVersionedData([{ id: 1 }], 2);

      expect(manager.needsMigration(data)).toBe(false);
    });

    it("should return true when data version is lower", () => {
      const manager = new MigrationManager({ version: 3 });
      const data = createVersionedData([{ id: 1 }], 2);

      expect(manager.needsMigration(data)).toBe(true);
    });

    it("should return true for unversioned data when version > 1", () => {
      const manager = new MigrationManager({ version: 2 });
      const data = [{ id: 1 }];

      expect(manager.needsMigration(data)).toBe(true);
    });
  });

  describe("getDataVersion", () => {
    it("should return 1 for unversioned data", () => {
      const manager = new MigrationManager({ version: 2 });

      expect(manager.getDataVersion([{ id: 1 }])).toBe(1);
      expect(manager.getDataVersion(null)).toBe(1);
      expect(manager.getDataVersion([])).toBe(1);
    });

    it("should return correct version for versioned data", () => {
      const manager = new MigrationManager({ version: 3 });
      const data = createVersionedData([{ id: 1 }], 2);

      expect(manager.getDataVersion(data)).toBe(2);
    });
  });

  describe("migrate - Basic Scenarios", () => {
    it("should return empty versioned data for empty input", async () => {
      const manager = new MigrationManager({ version: 2 });

      const result = await manager.migrate([]);

      expect(isVersionedData(result)).toBe(true);
      expect(result.version).toBe(2);
      expect(result.items).toEqual([]);
    });

    it("should return data unchanged when versions match", async () => {
      const manager = new MigrationManager({ version: 2 });
      const data = createVersionedData([{ id: 1, name: "Item 1" }], 2);

      const result = await manager.migrate(data);

      expect(result.version).toBe(2);
      expect(result.items).toEqual([{ id: 1, name: "Item 1" }]);
    });

    it("should throw error when attempting to downgrade", async () => {
      const manager = new MigrationManager({ version: 1 });
      const data = createVersionedData([{ id: 1 }], 2);

      await expect(manager.migrate(data)).rejects.toThrow(MigrationError);
      await expect(manager.migrate(data)).rejects.toThrow(/downgrade/i);
    });

    it("should throw error for missing migration function", async () => {
      const manager = new MigrationManager({
        version: 3,
        migrations: {
          3: (items) => items.map((item: any) => ({ ...item, v3: true })),
          // Missing migration 2!
        },
      });
      const data = createVersionedData([{ id: 1 }], 1);

      // Missing migration from v1 to v2 (migration 2 is undefined)
      await expect(manager.migrate(data)).rejects.toThrow(MigrationError);
      await expect(manager.migrate(data)).rejects.toThrow(/missing migration/i);
    });
  });

  describe("migrate - Single Step", () => {
    it("should migrate unversioned data to v2", async () => {
      const manager = new MigrationManager({
        version: 2,
        migrations: {
          2: (items) =>
            items.map((item: any) => ({ ...item, status: "active" })),
        },
      });

      const data = [{ id: 1, name: "Item 1" }];
      const result = await manager.migrate(data);

      expect(result.version).toBe(2);
      expect(result.items).toEqual([
        { id: 1, name: "Item 1", status: "active" },
      ]);
      expect(result.migrationHistory).toHaveLength(1);
      expect(result.migrationHistory?.[0].fromVersion).toBe(1);
      expect(result.migrationHistory?.[0].toVersion).toBe(2);
    });

    it("should migrate from v1 to v2", async () => {
      const manager = new MigrationManager({
        version: 2,
        migrations: {
          2: (items) =>
            items.map((item: any) => ({ ...item, priority: "normal" })),
        },
      });

      const data = createVersionedData([{ id: 1, title: "Task" }], 1);
      const result = await manager.migrate(data);

      expect(result.version).toBe(2);
      expect(result.items).toEqual([
        { id: 1, title: "Task", priority: "normal" },
      ]);
    });
  });

  describe("migrate - Multi-step", () => {
    it("should run sequential migrations v1 -> v2 -> v3", async () => {
      const manager = new MigrationManager({
        version: 3,
        migrations: {
          2: (items) => items.map((item: any) => ({ ...item, v2field: true })),
          3: (items) => items.map((item: any) => ({ ...item, v3field: true })),
        },
      });

      const data = [{ id: 1 }];
      const result = await manager.migrate(data);

      expect(result.version).toBe(3);
      expect(result.items).toEqual([{ id: 1, v2field: true, v3field: true }]);
      expect(result.migrationHistory).toHaveLength(1);
      expect(result.migrationHistory?.[0].fromVersion).toBe(1);
      expect(result.migrationHistory?.[0].toVersion).toBe(3);
    });

    it("should handle migration from v2 to v4", async () => {
      const manager = new MigrationManager({
        version: 4,
        migrations: {
          2: (items) => items.map((item: any) => ({ ...item, step2: true })),
          3: (items) => items.map((item: any) => ({ ...item, step3: true })),
          4: (items) => items.map((item: any) => ({ ...item, step4: true })),
        },
      });

      const data = createVersionedData([{ id: 1 }], 2);
      const result = await manager.migrate(data);

      expect(result.version).toBe(4);
      expect(result.items).toEqual([{ id: 1, step3: true, step4: true }]);
    });
  });

  describe("migrate - Async Migrations", () => {
    it("should support async migration functions", async () => {
      const manager = new MigrationManager({
        version: 2,
        migrations: {
          2: async (items) => {
            // Simulate async operation
            await new Promise((resolve) => setTimeout(resolve, 10));
            return items.map((item: any) => ({ ...item, async: true }));
          },
        },
      });

      const data = [{ id: 1 }];
      const result = await manager.migrate(data);

      expect(result.version).toBe(2);
      expect(result.items).toEqual([{ id: 1, async: true }]);
    });

    it("should handle mixed sync and async migrations", async () => {
      const manager = new MigrationManager({
        version: 3,
        migrations: {
          2: (items) => items.map((item: any) => ({ ...item, sync: true })),
          3: async (items) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return items.map((item: any) => ({ ...item, async: true }));
          },
        },
      });

      const data = [{ id: 1 }];
      const result = await manager.migrate(data);

      expect(result.version).toBe(3);
      expect(result.items).toEqual([{ id: 1, sync: true, async: true }]);
    });
  });

  describe("migrate - Error Handling", () => {
    it("should throw error if migration returns non-array", async () => {
      const manager = new MigrationManager({
        version: 2,
        migrations: {
          2: () => "not an array" as any,
        },
      });

      const data = [{ id: 1 }];

      await expect(manager.migrate(data)).rejects.toThrow(MigrationError);
      await expect(manager.migrate(data)).rejects.toThrow(
        /did not return an array/i
      );
    });

    it("should throw error if migration throws", async () => {
      const manager = new MigrationManager({
        version: 2,
        migrations: {
          2: () => {
            throw new Error("Migration failed");
          },
        },
      });

      const data = [{ id: 1 }];

      await expect(manager.migrate(data)).rejects.toThrow(MigrationError);
      await expect(manager.migrate(data)).rejects.toThrow(/Migration failed/i);
    });
  });

  describe("migrate - Callbacks", () => {
    it("should call onMigrationStart callback", async () => {
      let startCalled = false;
      let fromVer: number | undefined;
      let toVer: number | undefined;

      const manager = new MigrationManager({
        version: 2,
        migrations: {
          2: (items) => items,
        },
        onMigrationStart: (from, to) => {
          startCalled = true;
          fromVer = from;
          toVer = to;
        },
      });

      await manager.migrate([{ id: 1 }]);

      expect(startCalled).toBe(true);
      expect(fromVer).toBe(1);
      expect(toVer).toBe(2);
    });

    it("should call onMigrationComplete callback", async () => {
      let completeCalled = false;
      let count: number | undefined;

      const manager = new MigrationManager({
        version: 2,
        migrations: {
          2: (items) => items,
        },
        onMigrationComplete: (from, to, itemCount) => {
          completeCalled = true;
          count = itemCount;
        },
      });

      await manager.migrate([{ id: 1 }, { id: 2 }]);

      expect(completeCalled).toBe(true);
      expect(count).toBe(2);
    });

    it("should call onMigrationError callback on failure", async () => {
      let errorCalled = false;
      let errorMsg: string | undefined;

      const manager = new MigrationManager({
        version: 2,
        migrations: {
          2: () => {
            throw new Error("Test error");
          },
        },
        onMigrationError: (from, to, error) => {
          errorCalled = true;
          errorMsg = error.message;
        },
      });

      await expect(manager.migrate([{ id: 1 }])).rejects.toThrow();

      expect(errorCalled).toBe(true);
      expect(errorMsg).toContain("Test error");
    });
  });

  describe("migrate - Migration History", () => {
    it("should track migration history", async () => {
      const manager = new MigrationManager({
        version: 2,
        migrations: {
          2: (items) => items,
        },
      });

      const data = [{ id: 1 }];
      const result = await manager.migrate(data);

      expect(result.migrationHistory).toBeDefined();
      expect(result.migrationHistory).toHaveLength(1);

      const record = result.migrationHistory?.[0];
      expect(record?.fromVersion).toBe(1);
      expect(record?.toVersion).toBe(2);
      expect(record?.itemCount).toBe(1);
      expect(record?.duration).toBeGreaterThanOrEqual(0);
      expect(record?.timestamp).toBeDefined();
    });

    it("should preserve existing migration history", async () => {
      const manager = new MigrationManager({
        version: 3,
        migrations: {
          2: (items) => items,
          3: (items) => items,
        },
      });

      // Simulate data that was previously migrated
      const data = createVersionedData([{ id: 1 }], 2);
      data.migrationHistory = [
        {
          fromVersion: 1,
          toVersion: 2,
          timestamp: "2025-01-01T00:00:00Z",
          itemCount: 1,
          duration: 10,
        },
      ];

      const result = await manager.migrate(data);

      expect(result.migrationHistory).toHaveLength(2);
      expect(result.migrationHistory?.[0].toVersion).toBe(2);
      expect(result.migrationHistory?.[1].toVersion).toBe(3);
    });
  });
});
