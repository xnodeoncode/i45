/**
 * Storage Location Error
 * Thrown when an invalid storage location is specified
 */

export class StorageLocationError extends Error {
  constructor(public location: string, public validLocations: string[]) {
    super(
      `Invalid storage location: ${location}. Must be one of: ${validLocations.join(
        ", "
      )}`
    );
    this.name = "StorageLocationError";
  }
}
