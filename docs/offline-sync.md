# Offline Sync Patterns Guide

Comprehensive guide to implementing sync strategies for offline-first applications using i45.

## Table of Contents

- [Introduction](#introduction)
- [Sync Architecture](#sync-architecture)
- [Core Sync Strategies](#core-sync-strategies)
- [Conflict Resolution](#conflict-resolution)
- [Network Detection](#network-detection)
- [Queue Management](#queue-management)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)
- [Testing Sync Logic](#testing-sync-logic)
- [Production Considerations](#production-considerations)
- [Complete Examples](#complete-examples)

---

## Introduction

Offline-first applications require robust synchronization strategies to ensure data consistency between local storage and remote servers. This guide covers patterns and best practices for implementing sync in applications using i45's storage capabilities.

### When to Use Sync

- **Offline-first applications** - Apps that work without connectivity
- **Progressive Web Apps (PWAs)** - Apps that cache data locally
- **Mobile applications** - Apps with unreliable network connections
- **Multi-device scenarios** - Apps that sync across devices
- **Real-time collaboration** - Apps requiring eventual consistency

### Key Considerations

1. **Data Consistency** - How to handle conflicts when data changes both locally and remotely
2. **Network Reliability** - Dealing with intermittent connections and retries
3. **User Experience** - Providing feedback during sync operations
4. **Storage Capacity** - Managing local storage limits
5. **Battery Life** - Minimizing impact on mobile devices

> 💡 **See Also:** [examples.md - Sync Patterns and Offline Strategies](./examples.md#sync-patterns-and-offline-strategies) for working code examples.

---

## Sync Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────┐
│         Application Layer           │
│  (UI, Business Logic, Components)   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│          Sync Layer (i45)           │
│  • Queue Management                 │
│  • Conflict Resolution              │
│  • Retry Logic                      │
│  • Network Detection                │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        Storage Layer (i45)          │
│  • localStorage                     │
│  • sessionStorage                   │
│  • IndexedDB                        │
└─────────────────────────────────────┘
```

### Data Flow Patterns

#### Pattern 1: Cache-First (Optimistic UI)

```
User Action → Save Locally → Update UI → Queue Sync → Background Sync
```

**Benefits:**

- Instant user feedback
- Works completely offline
- Resilient to network failures

**Drawbacks:**

- Potential conflicts with server
- Must handle sync failures

#### Pattern 2: Network-First (Server Authority)

```
User Action → Try Server → Update Local → Update UI
              ↓ (Fail)
              Save Locally → Queue for Retry
```

**Benefits:**

- Server is source of truth
- Fewer conflicts
- Simpler conflict resolution

**Drawbacks:**

- Requires network connection
- Slower user experience
- Doesn't work offline

#### Pattern 3: Hybrid (Smart Routing)

```
User Action → Check Network
              ├─ Online → Network-First
              └─ Offline → Cache-First
```

**Benefits:**

- Best of both worlds
- Adapts to conditions
- Optimal user experience

**Drawbacks:**

- More complex logic
- Requires careful testing

---

## Core Sync Strategies

### 1. Immediate Sync

Sync data immediately when network becomes available.

**When to Use:**

- Critical data (payments, orders)
- Small payloads
- Real-time requirements

**Implementation:**

```typescript
import { DataContext, StorageLocations } from "i45";

class ImmediateSync<T> {
  private context: DataContext<T[]>;
  private endpoint: string;

  constructor(key: string, endpoint: string) {
    this.context = new DataContext<T[]>({
      storageKey: key,
      storageLocation: StorageLocations.IndexedDB,
      trackTimestamps: true,
    });
    this.endpoint = endpoint;
  }

  async save(item: T): Promise<void> {
    // Save locally first
    const items = (await this.context.retrieve()) || [];
    items.push(item);
    await this.context.store(items);

    // Sync immediately if online
    if (navigator.onLine) {
      await this.syncToServer(item);
    }
  }

  private async syncToServer(item: T): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }
  }
}
```

### 2. Queued Sync

Queue operations and sync in batches.

**When to Use:**

- High-frequency updates
- Large payloads
- Non-critical data
- Battery conservation

**Key Features:**

- Batch multiple operations
- Retry failed operations
- Exponential backoff
- Priority queues

> 📝 **Example:** See [examples.md - Example 24: Queue-Based Sync](./examples.md#example-24-queue-based-sync-with-retry-logic) for complete implementation.

### 3. Scheduled Sync

Sync at predetermined intervals.

**When to Use:**

- Background updates
- Analytics data
- Non-urgent notifications
- Periodic refresh

**Implementation Strategy:**

```typescript
class ScheduledSync {
  private syncInterval: number;
  private timerId?: NodeJS.Timeout;

  constructor(intervalMinutes: number = 15) {
    this.syncInterval = intervalMinutes * 60 * 1000;
    this.startScheduler();
  }

  private startScheduler() {
    this.timerId = setInterval(() => {
      if (navigator.onLine) {
        this.performSync();
      }
    }, this.syncInterval);
  }

  private async performSync() {
    // Implement sync logic
  }

  stopScheduler() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }
}
```

### 4. Event-Driven Sync

Sync based on specific events or triggers.

**Common Triggers:**

- Network status change (online/offline)
- Application focus/blur
- User action (manual sync button)
- Storage threshold reached
- Time-based staleness

**Example:**

```typescript
class EventDrivenSync {
  constructor() {
    // Network status changes
    window.addEventListener("online", () => this.sync());
    window.addEventListener("offline", () => this.pauseSync());

    // Visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.sync();
      }
    });

    // Page lifecycle
    window.addEventListener("beforeunload", () => this.finalSync());
  }

  private async sync() {
    // Sync logic
  }

  private pauseSync() {
    // Stop ongoing sync operations
  }

  private async finalSync() {
    // Last chance sync before page unload
  }
}
```

---

## Conflict Resolution

### Conflict Detection

Conflicts occur when:

- Local data modified while offline
- Server data changed by another user/device
- Both versions have different timestamps

### Resolution Strategies

#### 1. Server Wins (Last-Write-Wins from Server)

**When to Use:**

- Server is authoritative
- Local changes are less important
- Simple conflict resolution needed

```typescript
async function resolveConflict(local: any, server: any): Promise<any> {
  console.log("Conflict detected, using server version");
  return server;
}
```

#### 2. Client Wins (Last-Write-Wins from Client)

**When to Use:**

- Local changes are authoritative
- Offline-first priority
- User edits take precedence

```typescript
async function resolveConflict(local: any, server: any): Promise<any> {
  console.log("Conflict detected, using client version");
  await pushToServer(local); // Push local changes
  return local;
}
```

#### 3. Latest Timestamp Wins

**When to Use:**

- Both client and server are equal
- Timestamp tracking enabled
- Simple automatic resolution

```typescript
import { StorageMetadata } from "i45";

async function resolveConflict(
  local: any & { updatedAt: string },
  server: any & { updatedAt: string }
): Promise<any> {
  const localTime = new Date(local.updatedAt).getTime();
  const serverTime = new Date(server.updatedAt).getTime();

  return localTime > serverTime ? local : server;
}
```

> 📝 **Example:** See [examples.md - Example 26: Conflict Resolution Pattern](./examples.md#example-26-conflict-resolution-pattern) for complete implementation.

#### 4. Manual Resolution (User Decides)

**When to Use:**

- Critical data
- User should choose
- Complex documents

```typescript
async function resolveConflict(local: any, server: any): Promise<any> {
  // Show UI for user to choose
  return await showConflictDialog(local, server);
}
```

#### 5. Merge Strategy

**When to Use:**

- Non-overlapping changes
- Structured data
- CRDT-compatible data

```typescript
async function resolveConflict(local: any[], server: any[]): Promise<any[]> {
  // Merge arrays by ID
  const merged = new Map();

  [...server, ...local].forEach((item) => {
    merged.set(item.id, item);
  });

  return Array.from(merged.values());
}
```

### Version-Based Conflict Resolution

Use version numbers to detect conflicts:

```typescript
interface Versioned {
  id: string;
  version: number;
  data: any;
}

async function syncWithVersioning(local: Versioned, server: Versioned) {
  if (local.version === server.version) {
    // No conflict
    return server;
  }

  if (local.version > server.version) {
    // Local is newer, push to server
    await pushToServer(local);
    return local;
  }

  if (server.version > local.version) {
    // Server is newer
    if (hasLocalChanges(local)) {
      // Conflict! Resolve...
      return resolveConflict(local, server);
    }
    return server;
  }
}
```

---

## Network Detection

### Basic Detection

```typescript
class NetworkDetector {
  isOnline(): boolean {
    return navigator.onLine;
  }

  onStatusChange(callback: (online: boolean) => void): () => void {
    const handler = () => callback(navigator.onLine);

    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);

    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }
}
```

### Enhanced Detection with Connectivity Check

`navigator.onLine` can give false positives. Verify with actual network request:

```typescript
class EnhancedNetworkDetector {
  private checkUrl: string = "/api/ping";

  async verifyConnectivity(): Promise<boolean> {
    if (!navigator.onLine) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.checkUrl, {
        method: "HEAD",
        cache: "no-cache",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getConnectionQuality(): Promise<"fast" | "slow" | "none"> {
    const start = Date.now();
    const isConnected = await this.verifyConnectivity();
    const duration = Date.now() - start;

    if (!isConnected) return "none";
    return duration < 1000 ? "fast" : "slow";
  }
}
```

> 📝 **Example:** See [examples.md - Offline Patterns](./examples.md#offline-patterns-and-storage-limits) for complete network detection patterns.

---

## Queue Management

### Sync Queue Structure

```typescript
interface SyncOperation {
  id: string;
  type: "create" | "update" | "delete";
  endpoint: string;
  data: any;
  priority: number;
  retries: number;
  maxRetries: number;
  createdAt: string;
  lastAttempt?: string;
}
```

### Priority Queues

```typescript
class PriorityQueue {
  private queue: SyncOperation[] = [];

  enqueue(operation: SyncOperation) {
    this.queue.push(operation);
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  dequeue(): SyncOperation | undefined {
    return this.queue.shift();
  }

  peek(): SyncOperation | undefined {
    return this.queue[0];
  }

  size(): number {
    return this.queue.length;
  }
}
```

### Retry Logic with Exponential Backoff

```typescript
class RetryManager {
  private baseDelay: number = 1000; // 1 second
  private maxDelay: number = 60000; // 1 minute

  calculateDelay(retries: number): number {
    const delay = this.baseDelay * Math.pow(2, retries);
    return Math.min(delay, this.maxDelay);
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          const delay = this.calculateDelay(attempt);
          console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### Dead Letter Queue

Operations that fail after max retries:

```typescript
class DeadLetterQueue {
  private context: DataContext<SyncOperation[]>;

  constructor() {
    this.context = new DataContext({
      storageKey: "failed-operations",
      storageLocation: StorageLocations.IndexedDB,
    });
  }

  async add(operation: SyncOperation) {
    const failed = (await this.context.retrieve()) || [];
    failed.push({
      ...operation,
      failedAt: new Date().toISOString(),
    });
    await this.context.store(failed);
  }

  async getAll(): Promise<SyncOperation[]> {
    return (await this.context.retrieve()) || [];
  }

  async retry(operationId: string) {
    const failed = (await this.context.retrieve()) || [];
    const operation = failed.find((op) => op.id === operationId);

    if (operation) {
      // Move back to main queue
      const remaining = failed.filter((op) => op.id !== operationId);
      await this.context.store(remaining);
      return operation;
    }
  }

  async clear() {
    await this.context.remove();
  }
}
```

---

## Performance Optimization

### Batch Operations

Instead of syncing items one at a time:

```typescript
class BatchSync {
  private batchSize: number = 50;
  private batchTimeout: number = 5000; // 5 seconds

  async syncInBatches(items: any[], endpoint: string) {
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);

      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: batch }),
      });

      // Small delay between batches
      await this.sleep(100);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### Incremental Sync with Timestamps

Only sync changes since last sync:

```typescript
import { isModifiedSince } from "i45";

class IncrementalSync {
  async syncChanges(lastSyncTime: string) {
    const metadata = await context.getMetadata();

    if (!metadata || isModifiedSince(metadata, lastSyncTime)) {
      // Fetch only items modified since lastSyncTime
      const url = `${endpoint}?since=${encodeURIComponent(lastSyncTime)}`;
      const response = await fetch(url);
      const changes = await response.json();

      // Merge with local data
      await this.mergeChanges(changes);
    }
  }

  private async mergeChanges(changes: any[]) {
    // Merge logic
  }
}
```

> 📝 **Example:** See [examples.md - Example 25: Timestamp-Based Incremental Sync](./examples.md#example-25-timestamp-based-incremental-sync) for complete implementation.

### Delta Sync

Only send changed fields:

```typescript
function calculateDelta(original: any, updated: any): any {
  const delta: any = {};

  for (const key in updated) {
    if (updated[key] !== original[key]) {
      delta[key] = updated[key];
    }
  }

  return delta;
}

async function syncDelta(id: string, original: any, updated: any) {
  const delta = calculateDelta(original, updated);

  await fetch(`/api/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(delta),
  });
}
```

### Compression for Large Payloads

```typescript
async function syncWithCompression(data: any) {
  const json = JSON.stringify(data);

  // Use CompressionStream API (modern browsers)
  const stream = new Blob([json])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));

  const compressedBlob = await new Response(stream).blob();

  await fetch("/api/data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Encoding": "gzip",
    },
    body: compressedBlob,
  });
}
```

---

## Error Handling

### Error Categories

1. **Network Errors** - Offline, timeout, DNS failure
2. **Server Errors** - 5xx status codes
3. **Client Errors** - 4xx status codes (validation, auth)
4. **Storage Errors** - QuotaExceededError
5. **Conflict Errors** - Version mismatches

### Error Handling Strategy

```typescript
class SyncErrorHandler {
  async handleError(
    error: Error,
    operation: SyncOperation
  ): Promise<"retry" | "discard" | "defer"> {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      // Network error - retry
      return "retry";
    }

    if ("status" in error) {
      const status = (error as any).status;

      if (status >= 500) {
        // Server error - retry
        return "retry";
      }

      if (status === 409) {
        // Conflict - needs resolution
        await this.resolveConflict(operation);
        return "retry";
      }

      if (status === 401 || status === 403) {
        // Auth error - defer until resolved
        return "defer";
      }

      if (status >= 400 && status < 500) {
        // Client error - discard
        return "discard";
      }
    }

    // Unknown error - retry
    return "retry";
  }

  private async resolveConflict(operation: SyncOperation) {
    // Conflict resolution logic
  }
}
```

### User Feedback

```typescript
interface SyncStatus {
  state: "idle" | "syncing" | "error" | "conflict";
  message?: string;
  progress?: number;
  pendingOperations?: number;
}

class SyncStatusManager {
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  notify(status: SyncStatus) {
    this.listeners.forEach((callback) => callback(status));
  }

  subscribe(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

// Usage in UI
const statusManager = new SyncStatusManager();

statusManager.subscribe((status) => {
  if (status.state === "syncing") {
    showSyncIndicator(status.message, status.progress);
  } else if (status.state === "error") {
    showErrorNotification(status.message);
  }
});
```

---

## Testing Sync Logic

### Unit Testing Sync Operations

```typescript
import { describe, it, expect, jest } from "@jest/globals";

describe("SyncManager", () => {
  it("should queue operations when offline", async () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    const syncManager = new SyncManager();
    await syncManager.save({ id: 1, data: "test" });

    const queue = await syncManager.getQueue();
    expect(queue).toHaveLength(1);
  });

  it("should sync immediately when online", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
    });

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    global.fetch = mockFetch as any;

    const syncManager = new SyncManager();
    await syncManager.save({ id: 1, data: "test" });

    expect(mockFetch).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
describe("Sync Integration", () => {
  it("should handle complete offline-to-online workflow", async () => {
    // 1. Start offline
    setOffline();

    // 2. Create data locally
    await dataLayer.save(testData);

    // 3. Verify queued
    const queued = await syncQueue.getAll();
    expect(queued).toHaveLength(1);

    // 4. Go online
    setOnline();

    // 5. Trigger sync
    await syncManager.sync();

    // 6. Verify synced
    const remaining = await syncQueue.getAll();
    expect(remaining).toHaveLength(0);
  });
});
```

### Testing with Network Throttling

Use Chrome DevTools or Playwright to simulate network conditions:

```typescript
// Playwright example
test("sync with slow 3G", async ({ page }) => {
  await page.route("**/*", (route) =>
    route.continue({
      headers: { "X-Network-Speed": "slow-3g" },
    })
  );

  // Test sync behavior with slow network
});
```

---

## Production Considerations

### Monitoring and Observability

```typescript
class SyncMonitor {
  private metrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageSyncTime: 0,
    queueSize: 0,
  };

  recordSuccess(duration: number) {
    this.metrics.totalOperations++;
    this.metrics.successfulOperations++;
    this.updateAverageSyncTime(duration);
  }

  recordFailure() {
    this.metrics.totalOperations++;
    this.metrics.failedOperations++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate:
        this.metrics.successfulOperations / this.metrics.totalOperations,
    };
  }

  private updateAverageSyncTime(duration: number) {
    const total =
      this.metrics.averageSyncTime * (this.metrics.successfulOperations - 1);
    this.metrics.averageSyncTime =
      (total + duration) / this.metrics.successfulOperations;
  }
}
```

### Security Considerations

1. **Authentication Tokens**

   - Store auth tokens securely
   - Refresh tokens before expiry
   - Handle 401 responses

2. **Data Encryption**

   - Encrypt sensitive data in local storage
   - Use HTTPS for all sync requests
   - Validate server certificates

3. **Data Validation**
   - Validate data before storing
   - Sanitize user input
   - Verify data integrity after sync

### Performance Budgets

```typescript
const SYNC_PERFORMANCE_BUDGET = {
  maxQueueSize: 1000,
  maxRetries: 3,
  maxBatchSize: 50,
  syncInterval: 5 * 60 * 1000, // 5 minutes
  maxSyncDuration: 30 * 1000, // 30 seconds
};
```

### Graceful Degradation

```typescript
class GracefulSync {
  async sync() {
    try {
      await this.fullSync();
    } catch (error) {
      // Fall back to partial sync
      await this.partialSync();
    }
  }

  private async fullSync() {
    // Sync everything
  }

  private async partialSync() {
    // Sync only critical data
  }
}
```

---

## Complete Examples

### Production-Ready Sync Manager

```typescript
import { DataContext, StorageLocations } from "i45";

interface SyncConfig {
  endpoint: string;
  batchSize?: number;
  retryAttempts?: number;
  syncInterval?: number;
}

class ProductionSyncManager<T extends { id: string }> {
  private context: DataContext<T[]>;
  private queueContext: DataContext<SyncOperation[]>;
  private config: Required<SyncConfig>;
  private syncTimer?: NodeJS.Timeout;

  constructor(storageKey: string, config: SyncConfig) {
    this.context = new DataContext<T[]>({
      storageKey,
      storageLocation: StorageLocations.IndexedDB,
      trackTimestamps: true,
    });

    this.queueContext = new DataContext<SyncOperation[]>({
      storageKey: `${storageKey}-sync-queue`,
      storageLocation: StorageLocations.IndexedDB,
    });

    this.config = {
      batchSize: config.batchSize || 50,
      retryAttempts: config.retryAttempts || 3,
      syncInterval: config.syncInterval || 5 * 60 * 1000,
      ...config,
    };

    this.initialize();
  }

  private initialize() {
    // Auto-sync when coming online
    window.addEventListener("online", () => this.sync());

    // Periodic sync
    this.syncTimer = setInterval(() => {
      if (navigator.onLine) this.sync();
    }, this.config.syncInterval);
  }

  async save(item: T): Promise<void> {
    // Save locally
    const items = (await this.context.retrieve()) || [];
    const index = items.findIndex((i) => i.id === item.id);

    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }

    await this.context.store(items);

    // Queue for sync
    await this.queueOperation("update", item);

    // Try immediate sync if online
    if (navigator.onLine) {
      await this.sync();
    }
  }

  private async queueOperation(type: "create" | "update" | "delete", data: T) {
    const queue = (await this.queueContext.retrieve()) || [];

    queue.push({
      id: crypto.randomUUID(),
      type,
      endpoint: this.config.endpoint,
      data,
      retries: 0,
      createdAt: new Date().toISOString(),
    });

    await this.queueContext.store(queue);
  }

  async sync(): Promise<void> {
    const queue = (await this.queueContext.retrieve()) || [];

    if (queue.length === 0) return;

    const remaining: SyncOperation[] = [];

    // Process in batches
    for (let i = 0; i < queue.length; i += this.config.batchSize) {
      const batch = queue.slice(i, i + this.config.batchSize);

      for (const operation of batch) {
        try {
          await this.executeOperation(operation);
        } catch (error) {
          operation.retries++;

          if (operation.retries < this.config.retryAttempts) {
            remaining.push(operation);
          } else {
            console.error("Max retries exceeded:", operation.id);
          }
        }
      }
    }

    await this.queueContext.store(remaining);
  }

  private async executeOperation(operation: SyncOperation): Promise<void> {
    const response = await fetch(`${operation.endpoint}/${operation.data.id}`, {
      method: operation.type === "delete" ? "DELETE" : "PUT",
      headers: { "Content-Type": "application/json" },
      body:
        operation.type !== "delete"
          ? JSON.stringify(operation.data)
          : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }
}

// Usage
const syncManager = new ProductionSyncManager<{ id: string; name: string }>(
  "my-data",
  {
    endpoint: "https://api.example.com/items",
    batchSize: 50,
    retryAttempts: 3,
    syncInterval: 5 * 60 * 1000, // 5 minutes
  }
);

await syncManager.save({ id: "1", name: "Item 1" });
```

---

## See Also

- **[examples.md](./examples.md)** - Working code examples for all patterns
  - [Sync Patterns and Offline Strategies](./examples.md#sync-patterns-and-offline-strategies)
  - [Offline Patterns and Storage Limits](./examples.md#offline-patterns-and-storage-limits)
  - [Storage Quota Checking](./examples.md#storage-quota-checking)
- **[api.md](./api.md)** - Complete API reference
- **[README.md](../README.md)** - Getting started guide
- **[testing.md](./testing.md)** - Testing strategies

---

**i45 v3.1.0+** | [GitHub](https://github.com/yourusername/i45) | [npm](https://www.npmjs.com/package/i45)
