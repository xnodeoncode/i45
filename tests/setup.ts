/**
 * Jest Test Setup
 * Runs before all tests to configure the test environment
 */

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
