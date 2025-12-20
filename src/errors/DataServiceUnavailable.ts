/**
 * Data Service Unavailable Error
 * Thrown when a required data service is not available
 */

export class DataServiceUnavailable extends Error {
  constructor(message: string = "Data service is unavailable") {
    super(message);
    this.name = "DataServiceUnavailable";
  }
}
