/**
 * Storage Quota Error
 * Thrown when storage quota is exceeded
 */

export class StorageQuotaError extends Error {
  constructor(
    public key: string,
    public storageType: string,
    message: string = "Storage quota exceeded"
  ) {
    super(`${message} for key "${key}" in ${storageType}`);
    this.name = "StorageQuotaError";
  }
}
