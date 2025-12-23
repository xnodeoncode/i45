/**
 * Storage location constants for browser storage types
 */
export enum StorageLocations {
  SessionStorage = "sessionStorage",
  LocalStorage = "localStorage",
  IndexedDB = "indexedDB",
}

export type StorageLocation = `${StorageLocations}`;
