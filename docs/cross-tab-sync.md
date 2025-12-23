# Cross-Tab Synchronization

**i45 v3.2.0+**

Cross-tab synchronization automatically keeps data in sync across multiple browser tabs or windows. When one tab updates data, all other tabs are automatically notified and can react to the changes.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Configuration](#configuration)
- [Examples](#examples)
- [Browser Support](#browser-support)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

Cross-tab sync provides real-time data synchronization between browser tabs using one of two mechanisms:

1. **BroadcastChannel API** (preferred) - Modern, fast, works with all storage types
2. **Storage Events** (fallback) - Older browsers, works with localStorage/sessionStorage only

i45 automatically selects the best available mechanism based on browser support and storage location.

### Use Cases

- **Collaborative Editing**: Multiple tabs editing the same document
- **Real-time Updates**: Shopping cart updates visible across tabs
- **User Sessions**: Logout in one tab logs out all tabs
- **Settings Sync**: Preferences changes applied everywhere
- **Notifications**: Events in one tab trigger updates in others

---

## Quick Start

Enable cross-tab sync by setting `enableCrossTabSync: true` in your configuration:

```typescript
import { DataContext, StorageLocations } from "i45";

const context = new DataContext<Order>({
  storageKey: "orders",
  storageLocation: StorageLocations.LocalStorage,
  enableCrossTabSync: true, // Enable cross-tab sync
  onCrossTabUpdate: (items) => {
    console.log("Another tab updated orders:", items);
    // Update your UI with the new data
    updateOrderList(items);
  },
});

// Store data - automatically broadcasts to other tabs
await context.store(orders);
```

That's it! Now all tabs with the same context will stay synchronized.

---

## How It Works

### BroadcastChannel (Preferred)

When available, i45 uses the BroadcastChannel API:

- **Fast**: Direct message passing between tabs
- **Reliable**: Purpose-built for cross-tab communication
- **Universal**: Works with all storage types (localStorage, sessionStorage, IndexedDB)

```typescript
// Internally uses BroadcastChannel
const channel = new BroadcastChannel('i45:storageKey');
channel.postMessage({ type: 'update', items: [...] });
```

### Storage Events (Fallback)

For older browsers, i45 falls back to storage events:

- **Compatible**: Works in all browsers
- **Limited**: Only works with localStorage and sessionStorage
- **Automatic**: No explicit broadcast needed

```typescript
// Automatically triggered by storage changes
window.addEventListener("storage", (event) => {
  if (event.key === "storageKey") {
    // Handle update
  }
});
```

### Message Flow

```
Tab A: store([...items])
   ↓
   1. Save to storage
   ↓
   2. Broadcast message
   ↓
Tab B: Receives message → onCrossTabUpdate([...items])
Tab C: Receives message → onCrossTabUpdate([...items])
```

---

## Configuration

### Basic Configuration

```typescript
const context = new DataContext<MyData>({
  storageKey: "my-data",
  enableCrossTabSync: true,
});
```

### With Callbacks

```typescript
const context = new DataContext<MyData>({
  storageKey: "my-data",
  enableCrossTabSync: true,

  // Called when another tab updates data
  onCrossTabUpdate: (items) => {
    console.log("Data updated:", items);
    refreshUI(items);
  },

  // Called when another tab removes data
  onCrossTabRemove: () => {
    console.log("Data removed");
    clearUI();
  },

  // Called when another tab clears all data
  onCrossTabClear: () => {
    console.log("All data cleared");
    resetUI();
  },
});
```

### Configuration Options

| Option               | Type                   | Default     | Description                      |
| -------------------- | ---------------------- | ----------- | -------------------------------- |
| `enableCrossTabSync` | `boolean`              | `false`     | Enable cross-tab synchronization |
| `onCrossTabUpdate`   | `(items: T[]) => void` | `undefined` | Callback for data updates        |
| `onCrossTabRemove`   | `() => void`           | `undefined` | Callback for data removal        |
| `onCrossTabClear`    | `() => void`           | `undefined` | Callback for data clearing       |

---

## Examples

### Example 1: Shopping Cart

```typescript
import { DataContext, StorageLocations } from "i45";

interface CartItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
}

const cartContext = new DataContext<CartItem>({
  storageKey: "shopping-cart",
  storageLocation: StorageLocations.LocalStorage,
  enableCrossTabSync: true,
  onCrossTabUpdate: (cart) => {
    // Update cart UI in all tabs
    updateCartBadge(cart.length);
    updateCartSidebar(cart);

    // Show notification
    showNotification("Cart updated in another tab");
  },
});

// Add item to cart
async function addToCart(item: CartItem) {
  const cart = await cartContext.retrieve();
  cart.push(item);
  await cartContext.store(cart);
  // Automatically synced to all tabs
}

// Remove item from cart
async function removeFromCart(productId: number) {
  const cart = await cartContext.retrieve();
  const filtered = cart.filter((item) => item.productId !== productId);
  await cartContext.store(filtered);
  // Automatically synced to all tabs
}
```

### Example 2: User Session Management

```typescript
interface UserSession {
  userId: string;
  username: string;
  token: string;
  expiresAt: string;
}

const sessionContext = new DataContext<UserSession>({
  storageKey: "user-session",
  storageLocation: StorageLocations.SessionStorage,
  enableCrossTabSync: true,
  onCrossTabUpdate: (sessions) => {
    if (sessions.length === 0) {
      // Logged out in another tab
      redirectToLogin();
    } else {
      // Session updated
      updateUserInfo(sessions[0]);
    }
  },
  onCrossTabRemove: () => {
    // Session removed in another tab
    redirectToLogin();
  },
});

// Login
async function login(username: string, password: string) {
  const session = await authenticate(username, password);
  await sessionContext.store([session]);
  // All tabs now know user is logged in
}

// Logout
async function logout() {
  await sessionContext.remove();
  // All tabs are immediately logged out
}
```

### Example 3: Settings Sync

```typescript
interface AppSettings {
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
  fontSize: number;
}

const settingsContext = new DataContext<AppSettings>({
  storageKey: "app-settings",
  storageLocation: StorageLocations.LocalStorage,
  enableCrossTabSync: true,
  onCrossTabUpdate: (settings) => {
    if (settings.length > 0) {
      applySettings(settings[0]);
    }
  },
});

// Update theme
async function setTheme(theme: "light" | "dark") {
  const settings = await settingsContext.retrieve();
  settings[0].theme = theme;
  await settingsContext.store(settings);

  // Theme change immediately applied in all tabs
}
```

### Example 4: Real-time Notifications

```typescript
interface Notification {
  id: string;
  message: string;
  type: "info" | "warning" | "error";
  timestamp: string;
  read: boolean;
}

const notificationContext = new DataContext<Notification>({
  storageKey: "notifications",
  storageLocation: StorageLocations.LocalStorage,
  enableCrossTabSync: true,
  onCrossTabUpdate: (notifications) => {
    // Update notification badge
    const unread = notifications.filter((n) => !n.read).length;
    updateNotificationBadge(unread);

    // Show new notifications
    const newNotifs = notifications.filter(
      (n) => new Date(n.timestamp) > lastCheck
    );
    newNotifs.forEach(showNotificationToast);
  },
});

// Mark notification as read
async function markAsRead(id: string) {
  const notifications = await notificationContext.retrieve();
  const notification = notifications.find((n) => n.id === id);
  if (notification) {
    notification.read = true;
    await notificationContext.store(notifications);
    // Badge updated in all tabs
  }
}
```

### Example 5: Collaborative Task List

```typescript
interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignee: string;
  dueDate: string;
}

const taskContext = new DataContext<Task>({
  storageKey: "tasks",
  storageLocation: StorageLocations.IndexedDB,
  enableCrossTabSync: true,
  trackTimestamps: true,
  onCrossTabUpdate: (tasks) => {
    // Refresh task list
    renderTaskList(tasks);

    // Show activity indicator
    showActivityIndicator("Tasks updated");
  },
});

// Complete task
async function completeTask(taskId: string) {
  const tasks = await taskContext.retrieve();
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.completed = true;
    await taskContext.store(tasks);
    // Other tabs see the task as completed
  }
}
```

---

## Browser Support

### BroadcastChannel

| Browser | Minimum Version |
| ------- | --------------- |
| Chrome  | 54+             |
| Firefox | 38+             |
| Safari  | 15.4+           |
| Edge    | 79+             |
| Opera   | 41+             |

### Storage Events

| Browser             | Support                               |
| ------------------- | ------------------------------------- |
| All modern browsers | ✅                                    |
| IE 11               | ✅ (localStorage/sessionStorage only) |

### Checking Support

```typescript
import { CrossTabManager } from "i45";

// Check if supported for a storage location
const isSupported = CrossTabManager.isSupported(StorageLocations.LocalStorage);

if (isSupported) {
  console.log("Cross-tab sync available");
}

// Get recommended method
const method = CrossTabManager.getRecommendedMethod(StorageLocations.IndexedDB);
console.log(`Recommended method: ${method}`);
// Output: "broadcast", "storage-events", or "none"
```

---

## Best Practices

### 1. Check Active Status

```typescript
const context = new DataContext({
  storageKey: "data",
  enableCrossTabSync: true,
});

if (context.isCrossTabSyncActive()) {
  console.log("Cross-tab sync is active");
  console.log(`Using: ${context.getCrossTabSyncMethod()}`);
}
```

### 2. Handle Async Callbacks

```typescript
const context = new DataContext({
  storageKey: "data",
  enableCrossTabSync: true,
  onCrossTabUpdate: async (items) => {
    // Async operations are fine
    await updateDatabase(items);
    await refreshUI();
  },
});
```

### 3. Debounce Rapid Updates

```typescript
import { debounce } from "lodash";

const debouncedUpdate = debounce(async (items) => {
  await heavyUIUpdate(items);
}, 300);

const context = new DataContext({
  storageKey: "data",
  enableCrossTabSync: true,
  onCrossTabUpdate: debouncedUpdate,
});
```

### 4. Clean Up on Unmount

```typescript
// React example
useEffect(() => {
  const context = new DataContext({
    storageKey: "data",
    enableCrossTabSync: true,
  });

  return () => {
    context.destroy(); // Cleans up cross-tab sync
  };
}, []);
```

### 5. Handle Conflicts

```typescript
const context = new DataContext({
  storageKey: "data",
  trackTimestamps: true,
  enableCrossTabSync: true,
  onCrossTabUpdate: async (remoteItems) => {
    const localItems = await context.retrieve();

    // Use timestamps to resolve conflicts
    const metadata = await context.getMetadata();
    const lastUpdate = new Date(metadata.updatedAt);

    // Implement your conflict resolution logic
    const merged = mergeItems(localItems, remoteItems, lastUpdate);
    await context.store(merged);
  },
});
```

### 6. Show User Feedback

```typescript
const context = new DataContext({
  storageKey: "data",
  enableCrossTabSync: true,
  onCrossTabUpdate: (items) => {
    // Visual feedback
    showToast("Data synchronized from another tab");

    // Update UI with animation
    animateUpdate(() => {
      renderItems(items);
    });
  },
});
```

---

## API Reference

### DataContext Methods

#### `isCrossTabSyncActive(): boolean`

Checks if cross-tab synchronization is active.

```typescript
if (context.isCrossTabSyncActive()) {
  console.log("Sync is working");
}
```

#### `getCrossTabSyncMethod(): "broadcast" | "storage-events" | "none"`

Gets the synchronization method being used.

```typescript
const method = context.getCrossTabSyncMethod();
console.log(`Using ${method}`);
```

#### `getTabId(): string | undefined`

Gets unique identifier for the current tab (BroadcastChannel only).

```typescript
const tabId = context.getTabId();
if (tabId) {
  console.log(`Tab ID: ${tabId}`);
}
```

#### `refreshFromCrossTab(): Promise<T[]>`

Manually refreshes data to get latest changes from other tabs.

```typescript
const latestData = await context.refreshFromCrossTab();
```

#### `destroy(): void`

Cleans up resources including cross-tab sync listeners.

```typescript
context.destroy();
```

### Static Methods

#### `CrossTabManager.isSupported(storageLocation: StorageLocation): boolean`

Checks if cross-tab sync is supported for a storage location.

```typescript
import { CrossTabManager, StorageLocations } from "i45";

if (CrossTabManager.isSupported(StorageLocations.IndexedDB)) {
  // Enable cross-tab sync
}
```

#### `CrossTabManager.getRecommendedMethod(storageLocation: StorageLocation)`

Gets recommended sync method for a storage location.

```typescript
const method = CrossTabManager.getRecommendedMethod(
  StorageLocations.LocalStorage
);
// Returns: "broadcast" | "storage-events" | "none"
```

---

## Troubleshooting

### Cross-Tab Sync Not Working

1. **Check if enabled**: Verify `enableCrossTabSync: true` is set
2. **Check browser support**: Use `CrossTabManager.isSupported()`
3. **Check storage location**: IndexedDB requires BroadcastChannel
4. **Check console**: Look for initialization messages

```typescript
const context = new DataContext({
  storageKey: "data",
  storageLocation: StorageLocations.IndexedDB,
  enableCrossTabSync: true,
  loggingEnabled: true, // Enable logging
});

console.log("Active:", context.isCrossTabSyncActive());
console.log("Method:", context.getCrossTabSyncMethod());
```

### Callbacks Not Firing

- Callbacks only fire in **other tabs**, not the tab that made the change
- Check callback function is correctly defined
- Verify no JavaScript errors in console

### Performance Issues

- Use debouncing for frequent updates
- Avoid heavy operations in callbacks
- Consider batching updates

---

## Related Documentation

- [API Documentation](./api.md)
- [Examples](./examples.md)
- [Offline Sync](./offline-sync.md)
- [Migration Guide](./migration.md)

---

**Version**: i45 v3.2.0+  
**Last Updated**: December 22, 2025
