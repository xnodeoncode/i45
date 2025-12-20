/**
 * IndexedDB Service - Browser IndexedDB storage implementation
 * NOTE: Not yet integrated into DataContext - planned for future release
 */

/**
 * Wrapper class for working with IndexedDB
 * Provides async storage for larger data sets beyond localStorage limits
 */
export class IndexedDBService {
  #dbName: string = "i45DB";
  #dbVersion: number = 1;
  #db: IDBDatabase | null = null;
  #objectStoreName: string = "Items";

  constructor(
    databaseName?: string,
    version?: number,
    objectStoreName?: string
  ) {
    this.#dbName = databaseName || this.#dbName;
    this.#dbVersion = version || this.#dbVersion;
    this.#objectStoreName = objectStoreName || this.#objectStoreName;

    // Check if IndexedDB is available before opening
    if (!this.#isStorageTypeAvailable("indexedDB")) {
      throw new Error("IndexedDB is not available in this environment");
    }

    this.#openDatabase();
  }

  /**
   * Opens the IndexedDB database
   */
  #openDatabase(): void {
    const request = indexedDB.open(this.#dbName, this.#dbVersion);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Create an object store if it doesn't exist
      if (!db.objectStoreNames.contains(this.#objectStoreName)) {
        db.createObjectStore(this.#objectStoreName, { keyPath: "id" });
      }
    };

    request.onsuccess = (event: Event) => {
      this.#db = (event.target as IDBOpenDBRequest).result;
    };

    request.onerror = (event: Event) => {
      console.error(
        "Error opening IndexedDB:",
        (event.target as IDBOpenDBRequest).error
      );
    };
  }

  /**
   * Checks if IndexedDB is available
   * Reference: MDN Web Docs - Web Storage API
   * https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
   * @param type - The type of storage to check
   * @returns True if IndexedDB is available
   */
  #isStorageTypeAvailable(type: string): boolean {
    try {
      const storage = (window as any)[type];
      if (!storage) {
        return false;
      }
      return true;
    } catch (e) {
      return (
        e instanceof DOMException &&
        // everything except Firefox
        (e.code === 22 ||
          // Firefox
          e.code === 1014 ||
          // test name field too, because code might not be present
          // everything except Firefox
          e.name === "QuotaExceededError" ||
          // Firefox
          e.name === "NS_ERROR_DOM_QUOTA_REACHED")
      );
    }
  }

  /**
   * Stores data in IndexedDB
   * @param key - The key to store the data under
   * @param value - The value to store
   */
  async save<T>(key: string, value: T): Promise<void> {
    if (!this.#db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.#db!.transaction(
        [this.#objectStoreName],
        "readwrite"
      );
      const store = transaction.objectStore(this.#objectStoreName);
      const request = store.put({ id: key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieves data from IndexedDB
   * @param key - The key to retrieve
   * @returns The stored value or null if not found
   */
  async retrieve<T>(key: string): Promise<T | null> {
    if (!this.#db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.#db!.transaction(
        [this.#objectStoreName],
        "readonly"
      );
      const store = transaction.objectStore(this.#objectStoreName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Removes data from IndexedDB
   * @param key - The key to remove
   */
  async remove(key: string): Promise<void> {
    if (!this.#db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.#db!.transaction(
        [this.#objectStoreName],
        "readwrite"
      );
      const store = transaction.objectStore(this.#objectStoreName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clears all data from the object store
   */
  async clear(): Promise<void> {
    if (!this.#db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.#db!.transaction(
        [this.#objectStoreName],
        "readwrite"
      );
      const store = transaction.objectStore(this.#objectStoreName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Gets all keys from the object store
   * @returns Array of all keys
   */
  async getAllKeys(): Promise<string[]> {
    if (!this.#db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.#db!.transaction(
        [this.#objectStoreName],
        "readonly"
      );
      const store = transaction.objectStore(this.#objectStoreName);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }
}
