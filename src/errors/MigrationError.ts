/**
 * Error thrown when data migration fails
 */
export class MigrationError extends Error {
  /**
   * Creates a new MigrationError
   * @param message - Error description
   */
  constructor(message: string) {
    super(message);
    this.name = "MigrationError";

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MigrationError);
    }
  }
}
