/**
 * Storage item model with standardized property names (camelCase)
 */
export interface StorageItem {
  name: string;
  value: string;
}

/**
 * Create a storage item
 */
export function createStorageItem(name: string, value: string): StorageItem {
  return { name, value };
}
