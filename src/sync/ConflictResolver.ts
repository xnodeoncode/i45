/**
 * Conflict Resolver
 * Handles conflict resolution between local and remote data
 */

import type {
  ConflictResolverCallback,
  ConflictResolutionType,
} from "./SyncTypes";

/**
 * Resolves conflicts between local and remote data
 */
export class ConflictResolver {
  /**
   * Get the appropriate conflict resolver function
   */
  static getResolver<T>(
    resolution: ConflictResolutionType | ConflictResolverCallback<T>
  ): ConflictResolverCallback<T> {
    if (typeof resolution === "function") {
      return resolution;
    }

    switch (resolution) {
      case "last-write-wins":
        return ConflictResolver.lastWriteWins as ConflictResolverCallback<T>;
      case "first-write-wins":
        return ConflictResolver.firstWriteWins as ConflictResolverCallback<T>;
      case "server-wins":
        return ConflictResolver.serverWins as ConflictResolverCallback<T>;
      default:
        throw new Error(`Unknown conflict resolution strategy: ${resolution}`);
    }
  }

  /**
   * Last-write-wins: Choose the most recently updated version
   */
  private static lastWriteWins(local: any, remote: any): any {
    const localTime = local.metadata?.updatedAt
      ? new Date(local.metadata.updatedAt).getTime()
      : 0;
    const remoteTime = remote.metadata?.updatedAt
      ? new Date(remote.metadata.updatedAt).getTime()
      : 0;

    return remoteTime > localTime ? remote : local;
  }

  /**
   * First-write-wins: Preserve local changes
   */
  private static firstWriteWins(local: any): any {
    return local;
  }

  /**
   * Server-wins: Server is always the source of truth
   */
  private static serverWins(_local: any, remote: any): any {
    return remote;
  }
}
