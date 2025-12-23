/**
 * CrossTabManager - Hybrid cross-tab synchronization manager
 * Intelligently selects between BroadcastChannel and Storage Events
 * based on browser support and storage location
 */

import { CrossTabSync, type CrossTabUpdateCallback } from "./CrossTabSync.js";
import { StorageEventSync } from "./StorageEventSync.js";
import type { StorageLocation } from "../models/StorageLocations.js";
import { StorageLocations } from "../models/StorageLocations.js";

/**
 * Cross-tab manager configuration options
 */
export interface CrossTabManagerConfig<T> {
  /**
   * Storage key to synchronize
   */
  storageKey: string;

  /**
   * Storage location being used
   */
  storageLocation: StorageLocation;

  /**
   * Callback when other tabs update data
   */
  onUpdate?: CrossTabUpdateCallback<T>;

  /**
   * Callback when other tabs remove data
   */
  onRemove?: () => void | Promise<void>;

  /**
   * Callback when other tabs clear data
   */
  onClear?: () => void | Promise<void>;

  /**
   * Force use of storage events even if BroadcastChannel is available
   * @default false
   */
  forceStorageEvents?: boolean;
}

/**
 * CrossTabManager - Hybrid approach to cross-tab synchronization
 *
 * @template T - The type of items being synchronized
 *
 * @remarks
 * Strategy selection:
 * - Prefers BroadcastChannel (modern, fast, works with all storage types)
 * - Falls back to Storage Events (older browsers, localStorage/sessionStorage only)
 * - Gracefully disables if no options available (e.g., IndexedDB in old browsers)
 *
 * @example
 * const manager = new CrossTabManager({
 *   storageKey: "orders",
 *   storageLocation: StorageLocations.IndexedDB,
 *   onUpdate: (items) => console.log("Updated from another tab:", items)
 * });
 *
 * // Broadcast changes to other tabs
 * await manager.broadcast(orders);
 *
 * // Clean up
 * manager.close();
 */
export class CrossTabManager<T> {
  private broadcastSync?: CrossTabSync<T>;
  private storageEventSync?: StorageEventSync<T>;
  private config: CrossTabManagerConfig<T>;
  private isEnabled: boolean = false;

  /**
   * Creates a new CrossTabManager instance
   *
   * @param config - Configuration options
   */
  constructor(config: CrossTabManagerConfig<T>) {
    this.config = config;
    this.initialize();
  }

  /**
   * Initializes the appropriate synchronization mechanism
   */
  private initialize(): void {
    const {
      storageKey,
      storageLocation,
      onUpdate,
      onRemove,
      onClear,
      forceStorageEvents,
    } = this.config;

    // Option 1: BroadcastChannel (preferred if available and not forced to use storage events)
    if (CrossTabSync.isSupported() && !forceStorageEvents) {
      try {
        this.broadcastSync = new CrossTabSync<T>(
          storageKey,
          onUpdate,
          onRemove,
          onClear
        );
        this.isEnabled = true;
        return;
      } catch (error) {
        console.warn(
          "Failed to initialize BroadcastChannel, falling back to storage events:",
          error
        );
      }
    }

    // Option 2: Storage Events (fallback for localStorage/sessionStorage)
    if (
      StorageEventSync.isSupported() &&
      this.isWebStorageLocation(storageLocation)
    ) {
      try {
        this.storageEventSync = new StorageEventSync<T>(
          storageKey,
          onUpdate,
          onRemove,
          onClear
        );
        this.isEnabled = true;
        return;
      } catch (error) {
        console.warn("Failed to initialize storage events:", error);
      }
    }

    // No suitable mechanism available
    console.warn(
      `Cross-tab sync not available for storage location: ${storageLocation}. ` +
        `BroadcastChannel supported: ${CrossTabSync.isSupported()}, ` +
        `Storage events supported: ${StorageEventSync.isSupported()}`
    );
    this.isEnabled = false;
  }

  /**
   * Checks if the storage location is Web Storage (localStorage/sessionStorage)
   * @param location - Storage location to check
   * @returns true if location is localStorage or sessionStorage
   */
  private isWebStorageLocation(location: StorageLocation): boolean {
    return (
      location === StorageLocations.LocalStorage ||
      location === StorageLocations.SessionStorage
    );
  }

  /**
   * Broadcasts an update to all other tabs
   *
   * @param items - Items to broadcast
   * @returns Promise that resolves when broadcast is complete
   */
  async broadcast(items: T[]): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      if (this.broadcastSync) {
        await this.broadcastSync.broadcast(items);
      }
      // Storage events are triggered automatically by the storage mechanism
      // No explicit broadcast needed for StorageEventSync
    } catch (error) {
      console.error("Error broadcasting cross-tab update:", error);
    }
  }

  /**
   * Broadcasts a remove operation to all other tabs
   *
   * @returns Promise that resolves when broadcast is complete
   */
  async broadcastRemove(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      if (this.broadcastSync) {
        await this.broadcastSync.broadcastRemove();
      }
      // Storage events handle remove automatically
    } catch (error) {
      console.error("Error broadcasting cross-tab remove:", error);
    }
  }

  /**
   * Broadcasts a clear operation to all other tabs
   *
   * @returns Promise that resolves when broadcast is complete
   */
  async broadcastClear(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      if (this.broadcastSync) {
        await this.broadcastSync.broadcastClear();
      }
      // Storage events handle clear automatically
    } catch (error) {
      console.error("Error broadcasting cross-tab clear:", error);
    }
  }

  /**
   * Closes the synchronization mechanism and cleans up resources
   */
  close(): void {
    this.broadcastSync?.close();
    this.storageEventSync?.close();
    this.isEnabled = false;
  }

  /**
   * Checks if cross-tab sync is enabled and functioning
   * @returns true if cross-tab sync is available
   */
  isActive(): boolean {
    return this.isEnabled;
  }

  /**
   * Gets the synchronization method being used
   * @returns "broadcast" | "storage-events" | "none"
   */
  getSyncMethod(): "broadcast" | "storage-events" | "none" {
    if (this.broadcastSync) {
      return "broadcast";
    }
    if (this.storageEventSync) {
      return "storage-events";
    }
    return "none";
  }

  /**
   * Gets information about the current tab
   * @returns Tab ID if BroadcastChannel is active, undefined otherwise
   */
  getTabId(): string | undefined {
    return this.broadcastSync?.getTabId();
  }

  /**
   * Checks if cross-tab sync is supported for the given configuration
   *
   * @param storageLocation - Storage location to check
   * @returns true if cross-tab sync can be enabled
   */
  static isSupported(storageLocation: StorageLocation): boolean {
    // BroadcastChannel works with all storage types
    if (CrossTabSync.isSupported()) {
      return true;
    }

    // Storage events only work with localStorage/sessionStorage
    if (StorageEventSync.isSupported()) {
      return (
        storageLocation === StorageLocations.LocalStorage ||
        storageLocation === StorageLocations.SessionStorage
      );
    }

    return false;
  }

  /**
   * Gets recommended sync method for a storage location
   *
   * @param storageLocation - Storage location
   * @returns Recommended sync method
   */
  static getRecommendedMethod(
    storageLocation: StorageLocation
  ): "broadcast" | "storage-events" | "none" {
    if (CrossTabSync.isSupported()) {
      return "broadcast";
    }

    if (
      StorageEventSync.isSupported() &&
      (storageLocation === StorageLocations.LocalStorage ||
        storageLocation === StorageLocations.SessionStorage)
    ) {
      return "storage-events";
    }

    return "none";
  }
}
