import { describe, it, expect } from "@jest/globals";
import { ConflictResolver } from "../../src/sync/ConflictResolver";
import type { ItemMetadata } from "../../src/sync/SyncTypes";

interface TestItem {
  id: string;
  name: string;
  value: number;
}

type TestItemWithMetadata = TestItem & {
  metadata?: ItemMetadata;
};

const mockContext = { storageKey: "test", itemId: "1" };

describe("ConflictResolver", () => {
  describe("lastWriteWins", () => {
    it("should return remote when remote is newer", async () => {
      const local: TestItemWithMetadata = {
        id: "1",
        name: "local",
        value: 42,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:02.000Z",
        },
      };

      const remote: TestItemWithMetadata = {
        id: "1",
        name: "remote",
        value: 99,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:03.000Z",
        },
      };

      const resolver =
        ConflictResolver.getResolver<TestItem>("last-write-wins");
      const result = await resolver(local, remote, mockContext);

      expect(result.name).toBe("remote");
      expect(result.value).toBe(99);
      expect(result.metadata?.updatedAt).toBe("2025-01-01T00:00:03.000Z");
    });

    it("should return local when local is newer", async () => {
      const local: TestItemWithMetadata = {
        id: "1",
        name: "local",
        value: 42,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:03.000Z",
        },
      };

      const remote: TestItemWithMetadata = {
        id: "1",
        name: "remote",
        value: 99,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:02.000Z",
        },
      };

      const resolver =
        ConflictResolver.getResolver<TestItem>("last-write-wins");
      const result = await resolver(local, remote, mockContext);

      expect(result.name).toBe("local");
      expect(result.value).toBe(42);
      expect(result.metadata?.updatedAt).toBe("2025-01-01T00:00:03.000Z");
    });

    it("should return local when timestamps are equal", async () => {
      const local: TestItemWithMetadata = {
        id: "1",
        name: "local",
        value: 42,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:02.000Z",
        },
      };

      const remote: TestItemWithMetadata = {
        id: "1",
        name: "remote",
        value: 99,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:02.000Z",
        },
      };

      const resolver =
        ConflictResolver.getResolver<TestItem>("last-write-wins");
      const result = await resolver(local, remote, mockContext);

      expect(result.name).toBe("local");
      expect(result.value).toBe(42);
    });

    it("should return local when remote has no updatedAt", async () => {
      const local: TestItemWithMetadata = {
        id: "1",
        name: "local",
        value: 42,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:02.000Z",
        },
      };

      const remote: TestItemWithMetadata = {
        id: "1",
        name: "remote",
        value: 99,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
        },
      };

      const resolver =
        ConflictResolver.getResolver<TestItem>("last-write-wins");
      const result = await resolver(local, remote, mockContext);

      expect(result.name).toBe("local");
    });

    it("should return remote when local has no updatedAt", async () => {
      const local: TestItemWithMetadata = {
        id: "1",
        name: "local",
        value: 42,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
        },
      };

      const remote: TestItemWithMetadata = {
        id: "1",
        name: "remote",
        value: 99,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:02.000Z",
        },
      };

      const resolver =
        ConflictResolver.getResolver<TestItem>("last-write-wins");
      const result = await resolver(local, remote, mockContext);

      expect(result.name).toBe("remote");
      expect(result.value).toBe(99);
    });

    it("should return local when neither has updatedAt", async () => {
      const local: TestItemWithMetadata = {
        id: "1",
        name: "local",
        value: 42,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
        },
      };

      const remote: TestItemWithMetadata = {
        id: "1",
        name: "remote",
        value: 99,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
        },
      };

      const resolver =
        ConflictResolver.getResolver<TestItem>("last-write-wins");
      const result = await resolver(local, remote, mockContext);

      expect(result.name).toBe("local");
    });
  });

  describe("firstWriteWins", () => {
    it("should always return local item", async () => {
      const local: TestItemWithMetadata = {
        id: "1",
        name: "local",
        value: 42,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:02.000Z",
        },
      };

      const remote: TestItemWithMetadata = {
        id: "1",
        name: "remote",
        value: 99,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:03.000Z",
        },
      };

      const resolver =
        ConflictResolver.getResolver<TestItem>("first-write-wins");
      const result = await resolver(local, remote, mockContext);

      expect(result.name).toBe("local");
      expect(result.value).toBe(42);
    });

    it("should preserve local even when remote is newer", async () => {
      const local: TestItemWithMetadata = {
        id: "1",
        name: "local",
        value: 42,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:01.000Z",
        },
      };

      const remote: TestItemWithMetadata = {
        id: "1",
        name: "remote",
        value: 99,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:05.000Z",
        },
      };

      const resolver =
        ConflictResolver.getResolver<TestItem>("first-write-wins");
      const result = await resolver(local, remote, mockContext);

      expect(result.name).toBe("local");
      expect(result.value).toBe(42);
      expect(result.metadata?.updatedAt).toBe("2025-01-01T00:00:01.000Z");
    });
  });

  describe("serverWins", () => {
    it("should always return remote item", async () => {
      const local: TestItemWithMetadata = {
        id: "1",
        name: "local",
        value: 42,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:03.000Z",
        },
      };

      const remote: TestItemWithMetadata = {
        id: "1",
        name: "remote",
        value: 99,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:02.000Z",
        },
      };

      const resolver = ConflictResolver.getResolver<TestItem>("server-wins");
      const result = await resolver(local, remote, mockContext);

      expect(result.name).toBe("remote");
      expect(result.value).toBe(99);
    });

    it("should use remote even when local is newer", async () => {
      const local: TestItemWithMetadata = {
        id: "1",
        name: "local",
        value: 42,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:05.000Z",
        },
      };

      const remote: TestItemWithMetadata = {
        id: "1",
        name: "remote",
        value: 99,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:01.000Z",
        },
      };

      const resolver = ConflictResolver.getResolver<TestItem>("server-wins");
      const result = await resolver(local, remote, mockContext);

      expect(result.name).toBe("remote");
      expect(result.value).toBe(99);
      expect(result.metadata?.updatedAt).toBe("2025-01-01T00:00:01.000Z");
    });
  });

  describe("custom resolver", () => {
    it("should use custom callback function", async () => {
      const local: TestItemWithMetadata = {
        id: "1",
        name: "local",
        value: 42,
      };

      const remote: TestItemWithMetadata = {
        id: "1",
        name: "remote",
        value: 99,
      };

      const customResolver = (l: TestItem, r: TestItem): TestItem => {
        return l.value > r.value ? l : r;
      };

      const resolver = ConflictResolver.getResolver<TestItem>(customResolver);
      const result = await resolver(local, remote, mockContext);

      expect(result.name).toBe("remote");
      expect(result.value).toBe(99);
    });

    it("should support complex custom resolution logic", async () => {
      interface ComplexItem {
        id: string;
        priority: number;
        status: string;
        data: string;
      }

      const local: ComplexItem = {
        id: "1",
        priority: 5,
        status: "active",
        data: "local-data",
      };

      const remote: ComplexItem = {
        id: "1",
        priority: 3,
        status: "pending",
        data: "remote-data",
      };

      const customResolver = (l: ComplexItem, r: ComplexItem): ComplexItem => {
        if (l.priority > r.priority) {
          return {
            ...l,
            status: r.status === "active" ? r.status : l.status,
          };
        } else {
          return {
            ...r,
            data: l.data + "+" + r.data,
          };
        }
      };

      const resolver =
        ConflictResolver.getResolver<ComplexItem>(customResolver);
      const result = await resolver(local, remote, mockContext);

      expect(result.priority).toBe(5);
      expect(result.status).toBe("active");
      expect(result.data).toBe("local-data");
    });

    it("should handle custom resolver that merges properties", async () => {
      const local: TestItemWithMetadata = {
        id: "1",
        name: "local",
        value: 42,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:02.000Z",
        },
      };

      const remote: TestItemWithMetadata = {
        id: "1",
        name: "remote",
        value: 99,
        metadata: {
          createdAt: "2025-01-01T00:00:01.000Z",
          updatedAt: "2025-01-01T00:00:03.000Z",
        },
      };

      const mergeResolver = (
        l: TestItemWithMetadata,
        r: TestItemWithMetadata
      ): TestItemWithMetadata => {
        const localTime = l.metadata?.updatedAt
          ? new Date(l.metadata.updatedAt).getTime()
          : 0;
        const remoteTime = r.metadata?.updatedAt
          ? new Date(r.metadata.updatedAt).getTime()
          : 0;
        const newerTimestamp =
          localTime > remoteTime
            ? l.metadata?.updatedAt
            : r.metadata?.updatedAt;

        return {
          id: l.id,
          name: l.name,
          value: r.value,
          metadata: {
            createdAt:
              l.metadata?.createdAt ||
              r.metadata?.createdAt ||
              new Date().toISOString(),
            updatedAt: newerTimestamp || new Date().toISOString(),
          },
        };
      };

      const resolver = ConflictResolver.getResolver<TestItem>(mergeResolver);
      const result = await resolver(local, remote, mockContext);

      expect(result.name).toBe("local");
      expect(result.value).toBe(99);
      expect(result.metadata?.updatedAt).toBe("2025-01-01T00:00:03.000Z");
    });
  });

  describe("getResolver", () => {
    it("should return lastWriteWins for 'last-write-wins'", () => {
      const resolver =
        ConflictResolver.getResolver<TestItem>("last-write-wins");
      expect(resolver).toBeDefined();
      expect(typeof resolver).toBe("function");
    });

    it("should return firstWriteWins for 'first-write-wins'", () => {
      const resolver =
        ConflictResolver.getResolver<TestItem>("first-write-wins");
      expect(resolver).toBeDefined();
      expect(typeof resolver).toBe("function");
    });

    it("should return serverWins for 'server-wins'", () => {
      const resolver = ConflictResolver.getResolver<TestItem>("server-wins");
      expect(resolver).toBeDefined();
      expect(typeof resolver).toBe("function");
    });

    it("should return custom function directly", () => {
      const customFn = (l: TestItem, r: TestItem) => l;
      const resolver = ConflictResolver.getResolver<TestItem>(customFn);
      expect(resolver).toBe(customFn);
    });
  });
});
