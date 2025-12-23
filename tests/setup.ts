/**
 * Jest Test Setup
 * Runs before all tests to configure the test environment
 */

import { beforeEach, expect } from "@jest/globals";

// Polyfill for structuredClone (required for fake-indexeddb in older Node versions)
if (typeof structuredClone === "undefined") {
  global.structuredClone = (obj: any) => {
    // Handle primitives and null
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    // Deep clone for objects
    if (Array.isArray(obj)) {
      return obj.map((item) => structuredClone(item));
    }
    // Deep clone for plain objects
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = structuredClone(obj[key]);
      }
    }
    return cloned;
  };
}

// Mock browser storage APIs
class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

// Setup global mocks
Object.defineProperty(global, "localStorage", {
  value: new MockStorage(),
  writable: true,
});

Object.defineProperty(global, "sessionStorage", {
  value: new MockStorage(),
  writable: true,
});

// Clear storage before each test
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Optional: Add custom matchers
expect.extend({
  toBeStoredIn(received: any, storage: Storage, key: string) {
    const stored = storage.getItem(key);
    const pass = stored !== null && JSON.parse(stored) === received;

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be stored in ${key}`
          : `Expected ${received} to be stored in ${key}`,
    };
  },
});
