/**
 * Test Utilities
 * Helper functions and utilities for testing
 */

import type { StorageItem } from "../src/models/storageItem";

/**
 * Creates mock storage items for testing
 */
export function createMockStorageItems(count: number = 3): StorageItem[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `item-${i + 1}`,
    value: `value-${i + 1}`,
  }));
}

/**
 * Creates typed test data
 */
export function createTestData<T>(
  count: number,
  factory: (index: number) => T
): T[] {
  return Array.from({ length: count }, (_, i) => factory(i));
}

/**
 * Waits for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 1000,
  interval: number = 50
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error("Timeout waiting for condition");
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Gets the size of an object in bytes (rough estimate)
 */
export function getObjectSize(obj: any): number {
  return new Blob([JSON.stringify(obj)]).size;
}

/**
 * Creates a large object for quota testing
 */
export function createLargeObject(sizeInKB: number): any {
  const str = "x".repeat(sizeInKB * 1024);
  return { data: str };
}

/**
 * Mock logger for testing
 */
export class MockLogger {
  public logs: string[] = [];
  public infos: string[] = [];
  public warns: string[] = [];
  public errors: string[] = [];

  log(message: string, ...args: any[]): void {
    this.logs.push(message);
  }

  info(message: string, ...args: any[]): void {
    this.infos.push(message);
  }

  warn(message: string, ...args: any[]): void {
    this.warns.push(message);
  }

  error(message: string, ...args: any[]): void {
    this.errors.push(message);
  }

  clear(): void {
    this.logs = [];
    this.infos = [];
    this.warns = [];
    this.errors = [];
  }

  get allMessages(): string[] {
    return [...this.logs, ...this.infos, ...this.warns, ...this.errors];
  }
}

/**
 * Asserts that a function throws with a specific error message
 */
export async function expectToThrow(
  fn: () => any | Promise<any>,
  errorType?: new (...args: any[]) => Error,
  messageContains?: string
): Promise<void> {
  let error: Error | null = null;

  try {
    const result = fn();
    if (result instanceof Promise) {
      await result;
    }
  } catch (e) {
    error = e as Error;
  }

  if (!error) {
    throw new Error("Expected function to throw an error, but it did not");
  }

  if (errorType && !(error instanceof errorType)) {
    throw new Error(
      `Expected error to be instance of ${errorType.name}, but got ${error.constructor.name}`
    );
  }

  if (messageContains && !error.message.includes(messageContains)) {
    throw new Error(
      `Expected error message to contain "${messageContains}", but got "${error.message}"`
    );
  }
}
