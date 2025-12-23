/**
 * StorageEventSync - Storage event-based cross-tab synchronization fallback
 * Provides cross-tab synchronization using storage events for older browsers
 * Only works with localStorage and sessionStorage
 */

import type { CrossTabUpdateCallback } from "./CrossTabSync.js";

/**
 * StorageEventSync - Manages cross-tab communication using storage events
 *
 * @template T - The type of items being synchronized
 *
 * @remarks
 * - Only works with localStorage and sessionStorage (not IndexedDB)
 * - Storage events only fire in OTHER tabs, not the tab that made the change
 * - Less performant than BroadcastChannel but more widely supported
 *
 * @example
 * const sync = new StorageEventSync<Order>(
 *   "orders",
 *   (items) => console.log("Another tab updated orders:", items)
 * );
 *
 * // Storage events are triggered automatically when storage changes
 * // No explicit broadcast needed
 *
 * // Clean up when done
 * sync.close();
 */
export class StorageEventSync<T> {
  private storageKey: string;
  private onUpdate?: CrossTabUpdateCallback<T>;
  private onRemove?: () => void | Promise<void>;
  private boundHandler: (event: StorageEvent) => Promise<void>;

  /**
   * Creates a new StorageEventSync instance
   *
   * @param storageKey - The storage key to monitor for changes
   * @param onUpdate - Callback when other tabs update data
   * @param onRemove - Callback when other tabs remove data
   * @param _onClear - Callback when other tabs clear data (not used, storage events can't distinguish)
   *
   * @throws Error if window is not available (e.g., in Node.js)
   */
  constructor(
    storageKey: string,
    onUpdate?: CrossTabUpdateCallback<T>,
    onRemove?: () => void | Promise<void>,
    _onClear?: () => void | Promise<void> // Prefix with _ to indicate intentionally unused
  ) {
    if (typeof window === "undefined") {
      throw new Error("StorageEventSync requires a browser environment");
    }

    this.storageKey = storageKey;
    this.onUpdate = onUpdate;
    this.onRemove = onRemove;
    // Note: onClear parameter accepted for API consistency but not used
    // Storage events cannot distinguish between remove and clear operations

    // Bind handler to preserve context
    this.boundHandler = this.handleStorageEvent.bind(this);

    // Set up storage event listener
    window.addEventListener("storage", this.boundHandler);
  }

  /**
   * Handles storage events from other tabs
   *
   * @param event - Storage event from another tab
   */
  private async handleStorageEvent(event: StorageEvent): Promise<void> {
    // Only process events for our storage key
    if (event.key !== this.storageKey) {
      return;
    }

    try {
      // Handle different event scenarios
      if (event.newValue === null) {
        // Item was removed or cleared
        if (this.onRemove) {
          await this.onRemove();
        }
      } else if (event.newValue) {
        // Item was updated or added
        try {
          const items = JSON.parse(event.newValue) as T[];

          if (this.onUpdate) {
            await this.onUpdate(items);
          }
        } catch (parseError) {
          console.error(
            "Failed to parse storage event data:",
            parseError,
            "Raw value:",
            event.newValue
          );
        }
      }
    } catch (error) {
      console.error("Error handling storage event:", error);
    }
  }

  /**
   * Removes the storage event listener
   */
  close(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", this.boundHandler);
    }
  }

  /**
   * Gets the storage key being monitored
   */
  getStorageKey(): string {
    return this.storageKey;
  }

  /**
   * Checks if storage events are supported in the current environment
   * @returns true if storage events are available
   */
  static isSupported(): boolean {
    return typeof window !== "undefined" && "onstorage" in window;
  }
}
