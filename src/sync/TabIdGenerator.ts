/**
 * TabIdGenerator - Generates and manages unique tab identifiers
 */

const TAB_ID_KEY = "i45-tab-id";

/**
 * Generates a unique tab identifier and stores it in sessionStorage
 * Each browser tab/window gets a unique ID that persists for the session
 *
 * @returns Unique tab identifier
 */
export function getTabId(): string {
  if (typeof sessionStorage === "undefined") {
    // Fallback for environments without sessionStorage
    return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  let tabId = sessionStorage.getItem(TAB_ID_KEY);

  if (!tabId) {
    tabId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }

  return tabId;
}

/**
 * Clears the stored tab ID (useful for testing)
 */
export function clearTabId(): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(TAB_ID_KEY);
  }
}

/**
 * Checks if a message is from the current tab
 * @param messageTabId - Tab ID from the message
 * @returns true if the message is from this tab
 */
export function isFromCurrentTab(messageTabId: string): boolean {
  return messageTabId === getTabId();
}
