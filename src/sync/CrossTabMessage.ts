/**
 * CrossTabMessage - Message format for cross-tab communication
 */

/**
 * Message types for cross-tab communication
 */
export type CrossTabMessageType = "update" | "remove" | "clear";

/**
 * Message structure for cross-tab updates
 * @template T - The type of items being synchronized
 */
export interface CrossTabMessage<T> {
  /**
   * Type of operation performed
   */
  type: CrossTabMessageType;

  /**
   * Items affected by the operation (optional for clear)
   */
  items?: T[];

  /**
   * ISO timestamp when the operation occurred
   */
  timestamp: string;

  /**
   * Unique identifier for the tab that sent the message
   */
  tabId: string;

  /**
   * Storage key being synchronized
   */
  storageKey: string;
}

/**
 * Creates a cross-tab update message
 * @param tabId - Unique identifier for the sending tab
 * @param storageKey - Storage key being synchronized
 * @param items - Items to synchronize
 * @returns Cross-tab message ready to broadcast
 */
export function createUpdateMessage<T>(
  tabId: string,
  storageKey: string,
  items: T[]
): CrossTabMessage<T> {
  return {
    type: "update",
    items,
    timestamp: new Date().toISOString(),
    tabId,
    storageKey,
  };
}

/**
 * Creates a cross-tab remove message
 * @param tabId - Unique identifier for the sending tab
 * @param storageKey - Storage key being synchronized
 * @returns Cross-tab message ready to broadcast
 */
export function createRemoveMessage<T>(
  tabId: string,
  storageKey: string
): CrossTabMessage<T> {
  return {
    type: "remove",
    timestamp: new Date().toISOString(),
    tabId,
    storageKey,
  };
}

/**
 * Creates a cross-tab clear message
 * @param tabId - Unique identifier for the sending tab
 * @param storageKey - Storage key being synchronized
 * @returns Cross-tab message ready to broadcast
 */
export function createClearMessage<T>(
  tabId: string,
  storageKey: string
): CrossTabMessage<T> {
  return {
    type: "clear",
    timestamp: new Date().toISOString(),
    tabId,
    storageKey,
  };
}
