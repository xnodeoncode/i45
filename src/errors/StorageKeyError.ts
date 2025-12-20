/**
 * Storage Key Error
 * Thrown when an invalid storage key is provided
 */

export class StorageKeyError extends Error {
  constructor(public key: string, message: string) {
    super(message);
    this.name = "StorageKeyError";
  }
}
