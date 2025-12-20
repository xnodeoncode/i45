/**
 * Error Handler
 * Centralized error handling and logging
 */

import type { Logger } from "i45-jslogger";

/**
 * Error handler class for managing errors and warnings
 */
export class ErrorHandler {
  public logger: Logger | null;
  public loggingEnabled: boolean;

  constructor(logger: Logger | null = null, loggingEnabled: boolean = false) {
    this.logger = logger;
    this.loggingEnabled = loggingEnabled;
  }

  /**
   * Handle an error
   * @param message - Error message
   * @param throwError - Whether to throw the error
   * @param context - Additional context for logging
   */
  error(message: string, throwError: boolean = false, ...context: any[]): void {
    if (this.loggingEnabled && this.logger) {
      this.logger.error(message, ...context);
    }

    if (throwError) {
      throw new Error(message);
    }
  }

  /**
   * Log a warning
   * @param message - Warning message
   * @param context - Additional context for logging
   */
  warn(message: string, ...context: any[]): void {
    if (this.loggingEnabled && this.logger) {
      this.logger.warn(message, ...context);
    }
  }

  /**
   * Log an info message
   * @param message - Info message
   * @param context - Additional context for logging
   */
  info(message: string, ...context: any[]): void {
    if (this.loggingEnabled && this.logger) {
      this.logger.info(message, ...context);
    }
  }

  /**
   * Log a debug message
   * @param message - Debug message
   * @param context - Additional context for logging
   */
  log(message: string, ...context: any[]): void {
    if (this.loggingEnabled && this.logger) {
      this.logger.log(message, ...context);
    }
  }

  /**
   * Handle a data retrieval error
   * @param key - Storage key
   * @param error - The error that occurred
   * @param storageType - Type of storage
   */
  handleRetrievalError(key: string, error: Error, storageType: string): void {
    const message = `${storageType} Error`;
    const details = [
      {
        message: `Unable to retrieve data from ${storageType.toLowerCase()} service.`,
        "Details:": error,
        "Key:": key,
      },
    ];
    this.error(message, false, ...details);
  }
}
