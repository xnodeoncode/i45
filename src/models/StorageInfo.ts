/**
 * Storage quota information
 * Provides details about storage capacity and usage
 */

export interface StorageInfo {
  /**
   * Storage type (IndexedDB, localStorage, sessionStorage)
   */
  type: string;

  /**
   * Total quota in bytes
   */
  quota: number;

  /**
   * Current usage in bytes
   */
  usage: number;

  /**
   * Remaining space in bytes
   */
  remaining: number;

  /**
   * Percentage of quota used (0-100)
   */
  percentUsed: number;

  /**
   * Whether the quota is an estimate (true for localStorage/sessionStorage)
   */
  isEstimate?: boolean;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format storage info as human-readable string
 */
export function formatStorageInfo(info: StorageInfo): string {
  const quotaStr = formatBytes(info.quota);
  const usageStr = formatBytes(info.usage);
  const remainingStr = formatBytes(info.remaining);
  const percentStr = info.percentUsed.toFixed(1);

  return (
    `${info.type} Storage:\n` +
    `  Quota: ${quotaStr}\n` +
    `  Usage: ${usageStr} (${percentStr}%)\n` +
    `  Remaining: ${remainingStr}` +
    (info.isEstimate ? " (estimated)" : "")
  );
}
