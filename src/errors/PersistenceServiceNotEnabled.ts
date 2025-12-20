/**
 * Persistence Service Not Enabled Error
 * Thrown when attempting to use a storage service that is not available
 */

export class PersistenceServiceNotEnabled extends Error {
  constructor(message: string = "Persistence service is not enabled") {
    super(message);
    this.name = "PersistenceServiceNotEnabled";
  }
}
