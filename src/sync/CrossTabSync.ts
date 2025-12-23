/**
 * CrossTabSync - BroadcastChannel-based cross-tab synchronization
 * Provides real-time data synchronization between browser tabs using the BroadcastChannel API
 */

import type { CrossTabMessage } from "./CrossTabMessage.js";
import {
  createUpdateMessage,
  createRemoveMessage,
  createClearMessage,
} from "./CrossTabMessage.js";
import { getTabId, isFromCurrentTab } from "./TabIdGenerator.js";

/**
 * Callback function type for cross-tab updates
 * @template T - The type of items being synchronized
 */
export type CrossTabUpdateCallback<T> = (items: T[]) => void | Promise<void>;

/**
 * CrossTabSync - Manages cross-tab communication using BroadcastChannel
 *
 * @template T - The type of items being synchronized
 *
 * @example
 * const sync = new CrossTabSync<Order>(
 *   "orders",
 *   (items) => console.log("Another tab updated orders:", items)
 * );
 *
 * // Broadcast update to other tabs
 * await sync.broadcast(orders);
 *
 * // Clean up when done
 * sync.close();
 */
export class CrossTabSync<T> {
  private channel: BroadcastChannel;
  private storageKey: string;
  private onUpdate?: CrossTabUpdateCallback<T>;
  private onRemove?: () => void | Promise<void>;
  private onClear?: () => void | Promise<void>;
  private tabId: string;

  /**
   * Creates a new CrossTabSync instance
   *
   * @param storageKey - The storage key to synchronize
   * @param onUpdate - Callback when other tabs update data
   * @param onRemove - Callback when other tabs remove data
   * @param onClear - Callback when other tabs clear data
   *
   * @throws Error if BroadcastChannel is not supported
   */
  constructor(
    storageKey: string,
    onUpdate?: CrossTabUpdateCallback<T>,
    onRemove?: () => void | Promise<void>,
    onClear?: () => void | Promise<void>
  ) {
    if (typeof BroadcastChannel === "undefined") {
      throw new Error("BroadcastChannel is not supported in this environment");
    }

    this.storageKey = storageKey;
    this.onUpdate = onUpdate;
    this.onRemove = onRemove;
    this.onClear = onClear;
    this.tabId = getTabId();

    // Create channel with namespaced name
    this.channel = new BroadcastChannel(`i45:${storageKey}`);

    // Set up message handler
    this.channel.onmessage = (event: MessageEvent) => {
      this.handleMessage(event.data);
    };
  }

  /**
   * Broadcasts an update to all other tabs
   *
   * @param items - Items to broadcast
   * @returns Promise that resolves when broadcast is complete
   */
  async broadcast(items: T[]): Promise<void> {
    const message = createUpdateMessage(this.tabId, this.storageKey, items);
    this.channel.postMessage(message);
  }

  /**
   * Broadcasts a remove operation to all other tabs
   *
   * @returns Promise that resolves when broadcast is complete
   */
  async broadcastRemove(): Promise<void> {
    const message = createRemoveMessage<T>(this.tabId, this.storageKey);
    this.channel.postMessage(message);
  }

  /**
   * Broadcasts a clear operation to all other tabs
   *
   * @returns Promise that resolves when broadcast is complete
   */
  async broadcastClear(): Promise<void> {
    const message = createClearMessage<T>(this.tabId, this.storageKey);
    this.channel.postMessage(message);
  }

  /**
   * Handles incoming messages from other tabs
   *
   * @param message - Message received from another tab
   */
  private async handleMessage(message: CrossTabMessage<T>): Promise<void> {
    // Ignore messages from this tab
    if (isFromCurrentTab(message.tabId)) {
      return;
    }

    // Ignore messages for different storage keys
    if (message.storageKey !== this.storageKey) {
      return;
    }

    try {
      switch (message.type) {
        case "update":
          if (message.items && this.onUpdate) {
            await this.onUpdate(message.items);
          }
          break;

        case "remove":
          if (this.onRemove) {
            await this.onRemove();
          }
          break;

        case "clear":
          if (this.onClear) {
            await this.onClear();
          }
          break;

        default:
          console.warn(`Unknown message type: ${(message as any).type}`);
      }
    } catch (error) {
      console.error("Error handling cross-tab message:", error);
    }
  }

  /**
   * Closes the BroadcastChannel and cleans up resources
   */
  close(): void {
    this.channel.close();
  }

  /**
   * Gets the current tab ID
   */
  getTabId(): string {
    return this.tabId;
  }

  /**
   * Checks if BroadcastChannel is supported in the current environment
   * @returns true if BroadcastChannel is available
   */
  static isSupported(): boolean {
    return typeof BroadcastChannel !== "undefined";
  }
}
