/**
 * Data Retrieval Error
 * Thrown when data cannot be retrieved from storage
 */

export class DataRetrievalError extends Error {
  constructor(public key: string, public cause: Error) {
    super(`Failed to retrieve data for key: ${key}`);
    this.name = "DataRetrievalError";
  }
}
