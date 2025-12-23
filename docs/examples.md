# i45 Examples

Comprehensive examples for using i45 in real-world scenarios.

## Table of Contents

- [Basic Usage](#basic-usage)
- [TypeScript Integration](#typescript-integration)
- [Error Handling](#error-handling)
- [Custom Logger](#custom-logger)
- [React Integration](#react-integration)
- [Vue Integration](#vue-integration)
- [Real-World Use Cases](#real-world-use-cases)
- [Storage Quota Checking](#storage-quota-checking)
- [Offline Patterns and Storage Limits](#offline-patterns-and-storage-limits)
- [Sync Patterns and Offline Strategies](#sync-patterns-and-offline-strategies)
- [Cross-Tab Synchronization](#cross-tab-synchronization)
- [Testing Examples](#testing-examples)

---

## Basic Usage

### Example 1: Simple localStorage

```javascript
import { DataContext } from "i45";

const context = new DataContext();

// Store data
await context.store([
  { id: 1, name: "Item 1" },
  { id: 2, name: "Item 2" },
]);

// Retrieve data
const items = await context.retrieve();
console.log(items); // [{ id: 1, name: "Item 1" }, { id: 2, name: "Item 2" }]

// Remove data
await context.remove();
```

### Example 2: Using sessionStorage

```javascript
import { DataContext, StorageLocations } from "i45";

const context = new DataContext({
  storageKey: "TempData",
  storageLocation: StorageLocations.SessionStorage,
});

await context.store([{ temp: true }]);
const data = await context.retrieve();
console.log(data); // Data persists only for the session
```

### Example 3: Custom Storage Key

```javascript
import { DataContext } from "i45";

const context = new DataContext({ storageKey: "MyAppData" });

await context.store([{ value: 123 }]);

// Later...
const retrieved = await context.retrieve();
console.log(retrieved); // [{ value: 123 }]
```

### Example 4: Using Sample Data

```javascript
import { DataContext, SampleData } from "i45";

const context = new DataContext({ storageKey: "Books" });

// Store sample books
await context.store(SampleData.JsonData.Books);

// Retrieve and use
const books = await context.retrieve();
console.log(`Found ${books.length} books`);
```

### Example 4a: Using IndexedDB for Large Datasets

```javascript
import { DataContext, StorageLocations } from "i45";

// Use IndexedDB for larger datasets (~50MB+ capacity)
const context = new DataContext({
  storageKey: "LargeDataset",
  storageLocation: StorageLocations.IndexedDB,
});

// Generate large dataset
const largeData = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  data: `Item ${i}`,
  timestamp: new Date().toISOString(),
  payload: { value: Math.random() },
}));

// Store large dataset (IndexedDB handles this efficiently)
await context.store(largeData);
console.log("Stored 10,000 items in IndexedDB");

// Retrieve all items
const retrieved = await context.retrieve();
console.log(`Retrieved ${retrieved.length} items`);

// Important: Close IndexedDB connection when done (optional but recommended)
const { IndexedDBService } = await import("i45");
const idbService = new IndexedDBService();
idbService.close();
```

### Example 4b: Choosing Storage Based on Data Size

```typescript
import { DataContext, StorageLocations } from "i45";

interface DataItem {
  id: number;
  data: string;
}

function createContext<T>(data: T[]): DataContext<T> {
  // Estimate size (rough approximation)
  const estimatedSize = JSON.stringify(data).length;
  const sizeInMB = estimatedSize / (1024 * 1024);

  // Use IndexedDB for datasets > 3MB
  const storageLocation =
    sizeInMB > 3 ? StorageLocations.IndexedDB : StorageLocations.LocalStorage;

  console.log(`Data size: ${sizeInMB.toFixed(2)}MB, using ${storageLocation}`);

  return new DataContext<T>({
    storageKey: "AutoSizedData",
    storageLocation,
  });
}

// Usage
const smallData = [{ id: 1, data: "small" }];
const smallContext = createContext(smallData); // Uses localStorage

const largeData = Array.from({ length: 50000 }, (_, i) => ({
  id: i,
  data: `Large item ${i}`,
}));
const largeContext = createContext(largeData); // Uses IndexedDB
```

---

## TypeScript Integration

### Example 5: Type-Safe User Management

```typescript
import { DataContext, StorageLocations } from "i45";

// Define user interface
interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user" | "guest";
  createdAt: Date;
}

// Create type-safe context
const userContext = new DataContext<User>({
  storageKey: "Users",
  storageLocation: StorageLocations.LocalStorage,
});

// Store users (fully typed)
await userContext.store([
  {
    id: 1,
    username: "alice",
    email: "alice@example.com",
    role: "admin",
    createdAt: new Date(),
  },
  {
    id: 2,
    username: "bob",
    email: "bob@example.com",
    role: "user",
    createdAt: new Date(),
  },
]);

// Retrieve users (returns User[])
const users = await userContext.retrieve();

// TypeScript knows the structure
users.forEach((user) => {
  console.log(`${user.username} (${user.role})`);
});

// Find admin users
const admins = users.filter((u) => u.role === "admin");
console.log("Admin users:", admins);
```

### Example 6: Product Catalog

```typescript
import { DataContext } from "i45";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  inStock: boolean;
  category: string;
}

const productContext = new DataContext<Product>({
  storageKey: "Products",
});

await productContext.store([
  {
    id: "P001",
    name: "Laptop",
    description: "High-performance laptop",
    price: 999.99,
    inStock: true,
    category: "Electronics",
  },
  {
    id: "P002",
    name: "Mouse",
    description: "Wireless mouse",
    price: 29.99,
    inStock: true,
    category: "Accessories",
  },
]);

const products = await productContext.retrieve();

// Calculate total inventory value
const totalValue = products.reduce((sum, p) => sum + p.price, 0);
console.log(`Total inventory value: $${totalValue.toFixed(2)}`);

// Filter by category
const electronics = products.filter((p) => p.category === "Electronics");
console.log("Electronics:", electronics);
```

### Example 7: Nested Objects

```typescript
import { DataContext } from "i45";

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  address: Address;
  orders: number[];
}

const customerContext = new DataContext<Customer>({
  storageKey: "Customers",
});

await customerContext.store([
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    address: {
      street: "123 Main St",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
    },
    orders: [1001, 1002, 1003],
  },
]);

const customers = await customerContext.retrieve();
console.log(customers[0].address.city); // "Springfield"
console.log(`Orders: ${customers[0].orders.length}`); // "Orders: 3"
```

---

## Error Handling

### Example 8: Comprehensive Error Handling

```typescript
import {
  DataContext,
  StorageKeyError,
  StorageLocationError,
  DataRetrievalError,
  StorageQuotaError,
  DataServiceUnavailable,
} from "i45";

const context = new DataContext<any>();

try {
  await context.store(largeDataSet);
} catch (error) {
  if (error instanceof StorageKeyError) {
    console.error("Invalid storage key:", error.key);
    console.error("Please provide a non-empty key");
  } else if (error instanceof StorageQuotaError) {
    console.error("Storage quota exceeded!");
    console.error("Storage type:", error.storageType);
    console.error("Failed key:", error.key);

    // Handle quota error - clear old data
    console.log("Clearing storage to make room...");
    await context.clear();

    // Retry with smaller dataset
    const smallerDataSet = largeDataSet.slice(0, 100);
    await context.store(smallerDataSet);
  } else if (error instanceof StorageLocationError) {
    console.error("Invalid storage location:", error.location);
    console.error("Valid locations:", error.validLocations.join(", "));
  } else if (error instanceof DataRetrievalError) {
    console.error("Failed to retrieve data from:", error.key);
    if (error.cause) {
      console.error("Underlying error:", error.cause);
    }

    // Provide default data
    await context.store([]);
  } else if (error instanceof DataServiceUnavailable) {
    console.error("Storage service unavailable:", error.serviceName);
    console.error("Browser storage may be disabled");

    // Fallback to in-memory storage
    const memoryStorage = new Map();
    memoryStorage.set("data", largeDataSet);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Example 9: Graceful Degradation

```typescript
import { DataContext, DataServiceUnavailable, StorageQuotaError } from "i45";

class RobustStorage<T> {
  private context: DataContext<T>;
  private memoryFallback: T[] = [];
  private useMemory = false;

  constructor(storageKey: string) {
    this.context = new DataContext<T>({ storageKey });
  }

  async save(items: T[]): Promise<void> {
    if (this.useMemory) {
      this.memoryFallback = items;
      console.log("Saved to memory (storage unavailable)");
      return;
    }

    try {
      await this.context.store(items);
    } catch (error) {
      if (
        error instanceof DataServiceUnavailable ||
        error instanceof StorageQuotaError
      ) {
        console.warn("Storage failed, falling back to memory");
        this.useMemory = true;
        this.memoryFallback = items;
      } else {
        throw error;
      }
    }
  }

  async load(): Promise<T[]> {
    if (this.useMemory) {
      return this.memoryFallback;
    }

    try {
      return await this.context.retrieve();
    } catch (error) {
      console.warn("Retrieval failed, using memory fallback");
      this.useMemory = true;
      return this.memoryFallback;
    }
  }
}

// Usage
const storage = new RobustStorage<User>("Users");
await storage.save(users); // Automatically handles storage failures
const loaded = await storage.load();
```

---

## Custom Logger

### Example 10: Using Built-in Logger

```typescript
import { DataContext, Logger, StorageLocations } from "i45";

const logger = new Logger();
const context = new DataContext({
  storageKey: "Data",
  loggingEnabled: true,
  logger: logger,
});

// Operations are logged automatically
await context.store([{ id: 1 }]);
await context.retrieve();
await context.remove();

// View logs
const logs = context.printLog();
console.log("Operation logs:", logs);
```

### Example 11: Custom Logger Implementation

```typescript
import { DataContext } from "i45";

// Custom logger that sends logs to a server
class ServerLogger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
    this.sendToServer({ level: "log", message });
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
    this.sendToServer({ level: "error", message });
  }

  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
    this.sendToServer({ level: "warn", message });
  }

  info(message: string): void {
    console.info(`[INFO] ${message}`);
    this.sendToServer({ level: "info", message });
  }

  private async sendToServer(logEntry: any): Promise<void> {
    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error("Failed to send log to server:", error);
    }
  }
}

// Use custom logger
const logger = new ServerLogger();
const context = new DataContext({
  storageKey: "Data",
  loggingEnabled: true,
  logger: logger as any,
});

await context.store([{ id: 1 }]); // Logs sent to server
```

---

## React Integration

### Example 12: React Hook for i45

```typescript
import { useState, useEffect } from "react";
import { DataContext } from "i45";

interface User {
  id: number;
  name: string;
  email: string;
}

function useLocalStorage<T>(storageKey: string, initialValue: T[]) {
  const [data, setData] = useState<T[]>(initialValue);
  const [context] = useState(() => new DataContext<T>({ storageKey }));

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const loaded = await context.retrieve();
        if (loaded.length > 0) {
          setData(loaded);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, [context]);

  // Save data whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await context.store(data);
      } catch (error) {
        console.error("Failed to save data:", error);
      }
    };
    saveData();
  }, [data, context]);

  return [data, setData] as const;
}

// Usage in component
function UserManager() {
  const [users, setUsers] = useLocalStorage<User>("Users", []);

  const addUser = (user: User) => {
    setUsers([...users, user]);
  };

  const removeUser = (id: number) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  return (
    <div>
      <h1>User Manager</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
            <button onClick={() => removeUser(user.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <button
        onClick={() =>
          addUser({
            id: Date.now(),
            name: "New User",
            email: "new@example.com",
          })
        }
      >
        Add User
      </button>
    </div>
  );
}
```

### Example 13: React Context Provider

```typescript
import React, { createContext, useContext, useState, useEffect } from "react";
import { DataContext } from "i45";

interface AppData {
  users: User[];
  settings: Settings[];
}

const StorageContext = createContext<{
  data: AppData;
  updateUsers: (users: User[]) => void;
  updateSettings: (settings: Settings[]) => void;
} | null>(null);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({
    users: [],
    settings: [],
  });

  const userContext = new DataContext<User>({ storageKey: "Users" });
  const settingsContext = new DataContext<Settings>({
    storageKey: "Settings",
  });

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const [users, settings] = await Promise.all([
        userContext.retrieve(),
        settingsContext.retrieve(),
      ]);
      setData({ users, settings });
    };
    loadData();
  }, []);

  const updateUsers = async (users: User[]) => {
    await userContext.store(users);
    setData((prev) => ({ ...prev, users }));
  };

  const updateSettings = async (settings: Settings[]) => {
    await settingsContext.store(settings);
    setData((prev) => ({ ...prev, settings }));
  };

  return (
    <StorageContext.Provider value={{ data, updateUsers, updateSettings }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useStorage must be used within StorageProvider");
  }
  return context;
}

// Usage
function App() {
  return (
    <StorageProvider>
      <UserList />
      <SettingsPanel />
    </StorageProvider>
  );
}

function UserList() {
  const { data, updateUsers } = useStorage();
  // Use data.users and updateUsers
}
```

---

## Vue Integration

### Example 14: Vue Composition API

```typescript
import { ref, onMounted, watch } from "vue";
import { DataContext } from "i45";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export function useTodos() {
  const todos = ref<Todo[]>([]);
  const context = new DataContext<Todo>({ storageKey: "Todos" });

  // Load todos on mount
  onMounted(async () => {
    try {
      const loaded = await context.retrieve();
      if (loaded.length > 0) {
        todos.value = loaded;
      }
    } catch (error) {
      console.error("Failed to load todos:", error);
    }
  });

  // Save todos whenever they change
  watch(
    todos,
    async (newTodos) => {
      try {
        await context.store(newTodos);
      } catch (error) {
        console.error("Failed to save todos:", error);
      }
    },
    { deep: true }
  );

  const addTodo = (text: string) => {
    todos.value.push({
      id: Date.now(),
      text,
      completed: false,
    });
  };

  const toggleTodo = (id: number) => {
    const todo = todos.value.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  };

  const removeTodo = (id: number) => {
    todos.value = todos.value.filter((t) => t.id !== id);
  };

  return {
    todos,
    addTodo,
    toggleTodo,
    removeTodo,
  };
}

// Usage in component
// <script setup lang="ts">
// const { todos, addTodo, toggleTodo, removeTodo } = useTodos();
// </script>
```

### Example 15: Vue Store Plugin

```typescript
import { DataContext } from "i45";

export function createPersistencePlugin(storageKey: string) {
  return (store: any) => {
    const context = new DataContext({ storageKey });

    // Load state on initialization
    context.retrieve().then((data) => {
      if (data.length > 0) {
        store.replaceState(data[0]);
      }
    });

    // Save state on every mutation
    store.subscribe((mutation: any, state: any) => {
      context.store([state]).catch((error) => {
        console.error("Failed to persist state:", error);
      });
    });
  };
}

// Usage with Pinia
import { createPinia } from "pinia";

const pinia = createPinia();
pinia.use(createPersistencePlugin("AppState"));
```

---

## Real-World Use Cases

### Example 16: User Preferences

```typescript
import { DataContext } from "i45";

interface UserPreferences {
  theme: "light" | "dark";
  language: "en" | "es" | "fr";
  notifications: boolean;
  fontSize: number;
}

class PreferencesManager {
  private context: DataContext<UserPreferences>;
  private currentPrefs: UserPreferences;

  constructor() {
    this.context = new DataContext<UserPreferences>({
      storageKey: "UserPreferences",
    });
    this.currentPrefs = this.getDefaults();
  }

  private getDefaults(): UserPreferences {
    return {
      theme: "light",
      language: "en",
      notifications: true,
      fontSize: 16,
    };
  }

  async load(): Promise<UserPreferences> {
    try {
      const prefs = await this.context.retrieve();
      if (prefs.length > 0) {
        this.currentPrefs = prefs[0];
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
    return this.currentPrefs;
  }

  async save(prefs: Partial<UserPreferences>): Promise<void> {
    this.currentPrefs = { ...this.currentPrefs, ...prefs };
    await this.context.store([this.currentPrefs]);
  }

  async reset(): Promise<void> {
    this.currentPrefs = this.getDefaults();
    await this.context.store([this.currentPrefs]);
  }

  get(): UserPreferences {
    return { ...this.currentPrefs };
  }
}

// Usage
const prefs = new PreferencesManager();
await prefs.load();

// Update theme
await prefs.save({ theme: "dark" });

// Get current preferences
const current = prefs.get();
console.log("Current theme:", current.theme);

// Reset to defaults
await prefs.reset();
```

### Example 17: Shopping Cart

```typescript
import { DataContext } from "i45";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

class ShoppingCart {
  private context: DataContext<CartItem>;

  constructor() {
    this.context = new DataContext<CartItem>({
      storageKey: "ShoppingCart",
    });
  }

  async getItems(): Promise<CartItem[]> {
    try {
      return await this.context.retrieve();
    } catch (error) {
      console.error("Failed to load cart:", error);
      return [];
    }
  }

  async addItem(item: CartItem): Promise<void> {
    const items = await this.getItems();
    const existing = items.find((i) => i.productId === item.productId);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.push(item);
    }

    await this.context.store(items);
  }

  async updateQuantity(productId: string, quantity: number): Promise<void> {
    const items = await this.getItems();
    const item = items.find((i) => i.productId === productId);

    if (item) {
      item.quantity = quantity;
      await this.context.store(items);
    }
  }

  async removeItem(productId: string): Promise<void> {
    const items = await this.getItems();
    const filtered = items.filter((i) => i.productId !== productId);
    await this.context.store(filtered);
  }

  async clear(): Promise<void> {
    await this.context.store([]);
  }

  async getTotal(): Promise<number> {
    const items = await this.getItems();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  async getItemCount(): Promise<number> {
    const items = await this.getItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

// Usage
const cart = new ShoppingCart();

// Add items
await cart.addItem({
  productId: "P001",
  name: "Laptop",
  price: 999.99,
  quantity: 1,
});

await cart.addItem({
  productId: "P002",
  name: "Mouse",
  price: 29.99,
  quantity: 2,
});

// Get total
const total = await cart.getTotal();
console.log(`Cart total: $${total.toFixed(2)}`);

// Get item count
const count = await cart.getItemCount();
console.log(`Items in cart: ${count}`);

// Clear cart
await cart.clear();
```

### Example 18: Form Data Persistence

```typescript
import { DataContext, StorageLocations } from "i45";

interface FormData {
  formId: string;
  data: Record<string, any>;
  lastSaved: Date;
}

class FormPersistence {
  private context: DataContext<FormData>;

  constructor() {
    this.context = new DataContext<FormData>({
      storageKey: "FormDrafts",
      storageLocation: StorageLocations.SessionStorage, // Session-only
    });
  }

  async saveFormData(formId: string, data: Record<string, any>): Promise<void> {
    const forms = await this.context.retrieve();
    const existing = forms.findIndex((f) => f.formId === formId);

    const formData: FormData = {
      formId,
      data,
      lastSaved: new Date(),
    };

    if (existing >= 0) {
      forms[existing] = formData;
    } else {
      forms.push(formData);
    }

    await this.context.store(forms);
  }

  async loadFormData(formId: string): Promise<Record<string, any> | null> {
    try {
      const forms = await this.context.retrieve();
      const form = forms.find((f) => f.formId === formId);
      return form ? form.data : null;
    } catch (error) {
      console.error("Failed to load form data:", error);
      return null;
    }
  }

  async clearFormData(formId: string): Promise<void> {
    const forms = await this.context.retrieve();
    const filtered = forms.filter((f) => f.formId !== formId);
    await this.context.store(filtered);
  }

  async clearOldDrafts(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const forms = await this.context.retrieve();
    const now = new Date().getTime();

    const filtered = forms.filter((form) => {
      const age = now - new Date(form.lastSaved).getTime();
      return age < maxAge;
    });

    await this.context.store(filtered);
  }
}

// Usage
const formPersistence = new FormPersistence();

// Auto-save form data
const form = document.getElementById("myForm");
form?.addEventListener("input", async (e) => {
  const formData = new FormData(form as HTMLFormElement);
  const data = Object.fromEntries(formData);
  await formPersistence.saveFormData("contactForm", data);
  console.log("Form auto-saved");
});

// Load form data on page load
window.addEventListener("load", async () => {
  const savedData = await formPersistence.loadFormData("contactForm");
  if (savedData) {
    // Populate form with saved data
    Object.entries(savedData).forEach(([key, value]) => {
      const input = form?.querySelector(`[name="${key}"]`) as HTMLInputElement;
      if (input) {
        input.value = value as string;
      }
    });
    console.log("Form data restored");
  }
});

// Clear draft after submission
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  // Submit form...
  await formPersistence.clearFormData("contactForm");
  console.log("Draft cleared");
});
```

---

## Storage Quota Checking

> **New in v3.1.0** - Monitor storage capacity and usage across different storage types.

### Example 17: Check Overall Storage Quota

```typescript
import { DataContext, formatStorageInfo } from "i45";

async function checkOverallQuota() {
  const context = new DataContext({
    storageKey: "my-app",
    loggingEnabled: false,
  });

  try {
    // Get overall storage quota using Storage API
    const info = await context.getRemainingStorage();

    console.log("Overall Storage Quota:");
    console.log(formatStorageInfo(info));
    console.log(`Available: ${Math.round(info.remaining / 1024 / 1024)} MB`);

    // Check if we're running low on storage
    if (info.percentUsed > 80) {
      console.warn("⚠️ Storage is over 80% full!");
    } else if (info.percentUsed > 50) {
      console.log("ℹ️ Storage is over 50% full");
    } else {
      console.log("✅ Plenty of storage available");
    }
  } catch (error) {
    console.error("Storage API not supported:", error);
  }
}
```

### Example 18: Check Quota for Specific Storage Locations

```typescript
import { DataContext, StorageLocations, formatStorageInfo } from "i45";

async function checkLocationQuota() {
  const context = new DataContext({
    storageKey: "my-app",
    loggingEnabled: false,
  });

  // Check localStorage
  const localInfo = await context.getStorageInfo(StorageLocations.LocalStorage);
  console.log("LocalStorage Quota:");
  console.log(formatStorageInfo(localInfo));

  // Check sessionStorage
  const sessionInfo = await context.getStorageInfo(
    StorageLocations.SessionStorage
  );
  console.log("\nSessionStorage Quota:");
  console.log(formatStorageInfo(sessionInfo));

  // Check IndexedDB (if Storage API is supported)
  try {
    const idbInfo = await context.getStorageInfo(StorageLocations.IndexedDB);
    console.log("\nIndexedDB Quota:");
    console.log(formatStorageInfo(idbInfo));
  } catch (error) {
    console.log("❌ Storage API not supported for IndexedDB quota");
  }
}
```

### Example 19: Check Before Storing Large Dataset

```typescript
import { DataContext, StorageLocations } from "i45";

async function checkBeforeStore() {
  const context = new DataContext({
    storageKey: "large-dataset",
    storageLocation: StorageLocations.LocalStorage,
    loggingEnabled: false,
  });

  // Generate a large dataset
  const largeData = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: `Description for item ${i}`,
    timestamp: new Date().toISOString(),
  }));

  // Calculate approximate size (rough estimate)
  const dataSize = JSON.stringify(largeData).length * 2; // UTF-16 = 2 bytes per char
  console.log(`Data to store: ${Math.round(dataSize / 1024)} KB`);

  // Check if we have enough space
  const info = await context.getStorageInfo();
  console.log(`Available space: ${Math.round(info.remaining / 1024)} KB`);

  if (info.remaining >= dataSize) {
    console.log("✅ Sufficient space available, storing data...");
    await context.store(largeData);

    // Check usage after storing
    const afterInfo = await context.getStorageInfo();
    console.log(`After storing: ${afterInfo.percentUsed}% used`);
  } else {
    console.warn("⚠️ Not enough space! Trying IndexedDB...");

    // Try IndexedDB instead
    context.storageLocation = StorageLocations.IndexedDB;
    const idbInfo = await context.getStorageInfo();

    if (idbInfo.remaining >= dataSize) {
      console.log("✅ IndexedDB has enough space");
      await context.store(largeData);
    }
  }
}
```

### Example 20: Monitor Storage Usage Over Time

```typescript
import { DataContext, StorageLocations } from "i45";

async function monitorStorageUsage() {
  const context = new DataContext({
    storageKey: "monitoring",
    storageLocation: StorageLocations.LocalStorage,
    loggingEnabled: false,
  });

  console.log("=== Storage Monitoring ===");

  // Initial state
  let info = await context.getStorageInfo();
  console.log(
    `Initial: ${info.percentUsed}% used (${Math.round(info.usage / 1024)} KB)`
  );

  // Store some data
  const batch1 = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    value: `Data ${i}`,
  }));
  await context.store(batch1);

  info = await context.getStorageInfo();
  console.log(
    `After batch 1: ${info.percentUsed}% used (${Math.round(
      info.usage / 1024
    )} KB)`
  );

  // Store more data with different key
  const batch2 = Array.from({ length: 100 }, (_, i) => ({
    id: i + 100,
    value: `More data ${i}`,
  }));
  await context.storeAs("batch2", batch2);

  info = await context.getStorageInfo();
  console.log(
    `After batch 2: ${info.percentUsed}% used (${Math.round(
      info.usage / 1024
    )} KB)`
  );

  // Clean up
  await context.remove();
  await context.removeFrom("batch2");

  info = await context.getStorageInfo();
  console.log(
    `After cleanup: ${info.percentUsed}% used (${Math.round(
      info.usage / 1024
    )} KB)`
  );
}
```

### Example 21: Smart Storage Selection Based on Data Size

```typescript
import { DataContext, StorageLocations } from "i45";

async function smartStorageSelection(data: any[]) {
  const context = new DataContext({
    storageKey: "smart-data",
    loggingEnabled: false,
  });

  // Calculate data size
  const dataSize = JSON.stringify(data).length * 2; // bytes
  const sizeInMB = dataSize / (1024 * 1024);

  // Choose storage based on size
  if (sizeInMB < 1) {
    console.log(`Small dataset (${sizeInMB.toFixed(2)}MB): Using localStorage`);
    context.storageLocation = StorageLocations.LocalStorage;
  } else if (sizeInMB < 5) {
    console.log(
      `Medium dataset (${sizeInMB.toFixed(2)}MB): Using sessionStorage`
    );
    context.storageLocation = StorageLocations.SessionStorage;
  } else {
    console.log(`Large dataset (${sizeInMB.toFixed(2)}MB): Using IndexedDB`);
    context.storageLocation = StorageLocations.IndexedDB;
  }

  // Verify space is available
  const info = await context.getStorageInfo();
  if (info.remaining < dataSize) {
    throw new Error(
      `Insufficient storage: need ${sizeInMB.toFixed(2)}MB, only ${(
        info.remaining /
        1024 /
        1024
      ).toFixed(2)}MB available`
    );
  }

  // Store the data
  await context.store(data);
  console.log(`✅ Stored successfully in ${info.type}`);

  return context;
}

// Usage
const smallData = Array.from({ length: 100 }, (_, i) => ({ id: i }));
await smartStorageSelection(smallData);

const largeData = Array.from({ length: 100000 }, (_, i) => ({
  id: i,
  data: `Item ${i}`,
}));
await smartStorageSelection(largeData);
```

### Example 22: Storage Capacity Warning System

```typescript
import { DataContext, StorageLocations, formatBytes } from "i45";

class StorageManager {
  private context: DataContext<any>;
  private warningThreshold = 80; // 80%
  private criticalThreshold = 95; // 95%

  constructor(storageKey: string) {
    this.context = new DataContext({
      storageKey,
      storageLocation: StorageLocations.LocalStorage,
      loggingEnabled: false,
    });
  }

  async checkAndStore(data: any[]): Promise<boolean> {
    // Check current usage
    const info = await this.context.getStorageInfo();

    // Calculate size of new data
    const dataSize = JSON.stringify(data).length * 2;
    const projectedUsage = info.usage + dataSize;
    const projectedPercent = (projectedUsage / info.quota) * 100;

    console.log(`Current usage: ${info.percentUsed}%`);
    console.log(`Projected usage: ${projectedPercent.toFixed(1)}%`);

    // Critical: don't store if would exceed 95%
    if (projectedPercent > this.criticalThreshold) {
      console.error(
        `🚨 CRITICAL: Storage nearly full! Cannot store ${formatBytes(
          dataSize
        )}`
      );
      return false;
    }

    // Warning: notify but still store
    if (projectedPercent > this.warningThreshold) {
      console.warn(
        `⚠️ WARNING: Storage is ${info.percentUsed}% full. Consider cleanup.`
      );
    }

    // Store the data
    await this.context.store(data);
    console.log(`✅ Stored ${formatBytes(dataSize)} successfully`);

    return true;
  }

  async cleanup(): Promise<void> {
    await this.context.clear();
    console.log("✅ Storage cleared");
  }
}

// Usage
const manager = new StorageManager("app-data");
const success = await manager.checkAndStore(myData);

if (!success) {
  console.log("Cleaning up old data...");
  await manager.cleanup();
  await manager.checkAndStore(myData);
}
```

> **📝 Note:** See `examples/storage-quota-example.ts` for runnable code with all these examples.

---

## Offline Patterns and Storage Limits

> **New in v3.1.0** - Essential guidance for building offline-first applications.
>
> 📚 **For comprehensive offline sync strategies**, see **[offline-sync.md](./offline-sync.md)** for architecture patterns, conflict resolution, queue management, and production considerations.

### Browser Storage Capacity Limits

Understanding storage limits is crucial for offline-first applications. Here's what you can expect across different browsers and storage types:

| Storage Type       | Chrome/Edge        | Firefox            | Safari      | Notes                          |
| ------------------ | ------------------ | ------------------ | ----------- | ------------------------------ |
| **localStorage**   | ~10 MB             | ~10 MB             | ~5 MB       | Synchronous, per-origin        |
| **sessionStorage** | ~10 MB             | ~10 MB             | ~5 MB       | Cleared on tab close           |
| **IndexedDB**      | ~60% of disk space | ~50% of disk space | ~1 GB       | Asynchronous, can request more |
| **Total Quota**    | Dynamic (60% disk) | Dynamic (50% disk) | ~1 GB total | Shared across all storage APIs |

#### Storage Quota Details:

- **Chrome/Edge**: Uses a dynamic quota based on available disk space (typically 60% of free space)
- **Firefox**: Uses "best-effort" storage with ~50% of disk space, can request "persistent" storage
- **Safari**: More conservative limits, typically ~1 GB total for all storage combined
- **Mobile Browsers**: Generally more restrictive, especially iOS Safari (~50 MB practical limit)

> ⚠️ **Important**: These limits can vary based on:
>
> - Device storage capacity
> - Browser version and settings
> - User permissions
> - Whether storage is "persistent" or "best-effort"

### Offline Detection Patterns

#### Pattern 1: Network Status Monitoring

```typescript
import { DataContext } from "i45";

class OfflineDetector {
  private isOnline: boolean;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    this.isOnline = navigator.onLine;

    // Listen for online/offline events
    window.addEventListener("online", () => this.handleStatusChange(true));
    window.addEventListener("offline", () => this.handleStatusChange(false));
  }

  private handleStatusChange(online: boolean) {
    this.isOnline = online;
    console.log(`📡 Network status: ${online ? "ONLINE" : "OFFLINE"}`);

    // Notify all listeners
    this.listeners.forEach((callback) => callback(online));
  }

  onStatusChange(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => this.listeners.delete(callback);
  }

  getStatus(): boolean {
    return this.isOnline;
  }

  async checkConnectivity(): Promise<boolean> {
    // navigator.onLine can give false positives
    // Verify with actual network request
    if (!navigator.onLine) {
      return false;
    }

    try {
      const response = await fetch("/ping", {
        method: "HEAD",
        cache: "no-cache",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Usage
const detector = new OfflineDetector();

// Subscribe to status changes
const unsubscribe = detector.onStatusChange((online) => {
  if (online) {
    console.log("✅ Back online! Syncing data...");
    // Trigger sync operations
  } else {
    console.log("⚠️ Offline mode activated");
    // Switch to offline-only operations
  }
});

// Check actual connectivity (not just navigator.onLine)
const isConnected = await detector.checkConnectivity();
console.log(`Real connectivity: ${isConnected}`);
```

#### Pattern 2: Offline-First Data Layer

```typescript
import { DataContext, StorageLocations } from "i45";

interface DataItem {
  id: string;
  data: any;
}

class OfflineFirstDataLayer<T extends DataItem> {
  private context: DataContext<T[]>;
  private apiEndpoint: string;

  constructor(storageKey: string, apiEndpoint: string) {
    this.context = new DataContext<T[]>({
      storageKey,
      storageLocation: StorageLocations.IndexedDB,
      trackTimestamps: true,
      loggingEnabled: true,
    });
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Always read from cache first, then optionally refresh from network
   */
  async getAll(options: { refreshIfOnline?: boolean } = {}): Promise<T[]> {
    // 1. Always return cached data first (instant)
    const cached = (await this.context.retrieve()) || [];

    // 2. If online and refresh requested, fetch in background
    if (options.refreshIfOnline && navigator.onLine) {
      this.refreshFromNetwork().catch((error) => {
        console.warn("Background refresh failed:", error);
      });
    }

    return cached;
  }

  async getById(id: string): Promise<T | null> {
    const items = await this.getAll();
    return items.find((item) => item.id === id) || null;
  }

  /**
   * Save locally immediately, sync to server in background
   */
  async save(item: T): Promise<void> {
    // 1. Save to local storage first (instant)
    const items = (await this.context.retrieve()) || [];
    const index = items.findIndex((i) => i.id === item.id);

    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }

    await this.context.store(items);
    console.log("✅ Saved locally");

    // 2. Sync to server if online (background)
    if (navigator.onLine) {
      this.syncToServer(item).catch((error) => {
        console.warn("Server sync failed (queued for retry):", error);
        // In production, add to sync queue here
      });
    }
  }

  async delete(id: string): Promise<void> {
    const items = (await this.context.retrieve()) || [];
    const filtered = items.filter((item) => item.id !== id);
    await this.context.store(filtered);

    // Sync deletion to server if online
    if (navigator.onLine) {
      fetch(`${this.apiEndpoint}/${id}`, { method: "DELETE" }).catch(
        (error) => {
          console.warn("Delete sync failed:", error);
        }
      );
    }
  }

  private async refreshFromNetwork(): Promise<void> {
    try {
      const response = await fetch(this.apiEndpoint);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: T[] = await response.json();
      await this.context.store(data);
      console.log("🔄 Refreshed from network");
    } catch (error) {
      console.error("Network refresh failed:", error);
      throw error;
    }
  }

  private async syncToServer(item: T): Promise<void> {
    const response = await fetch(`${this.apiEndpoint}/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log("📤 Synced to server");
  }
}

// Usage
const dataLayer = new OfflineFirstDataLayer<DataItem>(
  "app-data",
  "https://api.example.com/items"
);

// Reads from cache instantly, refreshes in background if online
const items = await dataLayer.getAll({ refreshIfOnline: true });

// Saves locally first, syncs to server in background
await dataLayer.save({ id: "1", data: { name: "New Item" } });
```

#### Pattern 3: Storage Quota Monitoring for Offline Apps

```typescript
import { DataContext, StorageLocations, formatStorageInfo } from "i45";

class OfflineStorageManager {
  private context: DataContext<any>;
  private quotaWarningThreshold = 80; // 80%
  private quotaCriticalThreshold = 95; // 95%

  constructor(storageKey: string) {
    this.context = new DataContext({
      storageKey,
      storageLocation: StorageLocations.IndexedDB,
      loggingEnabled: true,
    });

    // Monitor storage on startup
    this.checkStorageHealth();
  }

  async checkStorageHealth(): Promise<void> {
    try {
      const info = await this.context.getStorageInfo();
      console.log(formatStorageInfo(info));

      if (info.percentUsed >= this.quotaCriticalThreshold) {
        console.error(
          `🚨 CRITICAL: Storage ${info.percentUsed}% full! Please clear old data.`
        );
        // In production: show user notification
      } else if (info.percentUsed >= this.quotaWarningThreshold) {
        console.warn(
          `⚠️ WARNING: Storage ${info.percentUsed}% full. Consider cleanup.`
        );
      } else {
        console.log(`✅ Storage health: ${info.percentUsed}% used`);
      }
    } catch (error) {
      console.warn("Could not check storage quota:", error);
    }
  }

  async canStoreData(estimatedSize: number): Promise<boolean> {
    const info = await this.context.getStorageInfo();
    return info.remaining >= estimatedSize;
  }

  async autoCleanup(keepRecentDays: number = 30): Promise<void> {
    console.log(
      `🧹 Running auto-cleanup (keeping last ${keepRecentDays} days)...`
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepRecentDays);

    // Implement your cleanup logic here
    // For example: remove items older than cutoffDate

    await this.checkStorageHealth();
  }
}

// Usage
const manager = new OfflineStorageManager("offline-app-data");

// Check before storing large data
const canStore = await manager.canStoreData(1024 * 1024 * 10); // 10 MB
if (!canStore) {
  console.log("Not enough space, running cleanup...");
  await manager.autoCleanup(7); // Keep only last 7 days
}
```

### Best Practices for Offline Applications

#### 1. **Graceful Degradation**

```typescript
import { DataContext } from "i45";

class GracefulOfflineApp {
  async loadData() {
    try {
      if (navigator.onLine) {
        // Try network first when online
        return await this.fetchFromNetwork();
      }
    } catch (error) {
      console.warn("Network fetch failed, using cache");
    }

    // Fallback to cached data
    return await this.getFromCache();
  }

  private async fetchFromNetwork() {
    const response = await fetch("/api/data");
    const data = await response.json();

    // Cache for offline use
    await this.saveToCache(data);

    return data;
  }

  private async getFromCache() {
    const context = new DataContext({ storageKey: "app-cache" });
    return await context.retrieve();
  }

  private async saveToCache(data: any) {
    const context = new DataContext({ storageKey: "app-cache" });
    await context.store(data);
  }
}
```

#### 2. **Data Prioritization**

```typescript
// Store critical data in localStorage (always available)
const criticalContext = new DataContext({
  storageKey: "critical-data",
  storageLocation: StorageLocations.LocalStorage,
});

// Store large datasets in IndexedDB (more capacity)
const bulkContext = new DataContext({
  storageKey: "bulk-data",
  storageLocation: StorageLocations.IndexedDB,
});

// Store temporary data in sessionStorage (auto-cleanup)
const tempContext = new DataContext({
  storageKey: "temp-data",
  storageLocation: StorageLocations.SessionStorage,
});
```

#### 3. **Progressive Enhancement**

```typescript
class ProgressiveOfflineFeatures {
  private hasIndexedDB: boolean;
  private hasStorageAPI: boolean;

  constructor() {
    this.hasIndexedDB = "indexedDB" in window;
    this.hasStorageAPI =
      "storage" in navigator && "estimate" in navigator.storage;
  }

  getStorageLocation() {
    if (this.hasIndexedDB) {
      // Best: Use IndexedDB for large capacity
      return StorageLocations.IndexedDB;
    } else {
      // Fallback: Use localStorage
      return StorageLocations.LocalStorage;
    }
  }

  async canUseQuotaAPI(): Promise<boolean> {
    return this.hasStorageAPI;
  }
}

const features = new ProgressiveOfflineFeatures();
const storageLocation = features.getStorageLocation();

const context = new DataContext({
  storageKey: "my-app",
  storageLocation,
});
```

### Offline App Checklist

✅ **Storage Strategy**

- [ ] Determine storage requirements (size, duration)
- [ ] Choose appropriate storage type (localStorage/sessionStorage/IndexedDB)
- [ ] Implement quota monitoring
- [ ] Plan data cleanup strategy

✅ **Network Handling**

- [ ] Detect online/offline status
- [ ] Implement graceful degradation
- [ ] Cache critical resources
- [ ] Handle failed network requests

✅ **Sync Strategy**

- [ ] Define when to sync (immediate, queued, manual)
- [ ] Implement conflict resolution
- [ ] Queue failed sync operations
- [ ] Track last sync timestamp

✅ **User Experience**

- [ ] Show offline indicator
- [ ] Notify user of sync status
- [ ] Warn when storage is full
- [ ] Provide manual sync option

✅ **Error Handling**

- [ ] Handle QuotaExceededError
- [ ] Handle network failures
- [ ] Provide meaningful error messages
- [ ] Log errors for debugging

> **💡 Tip**: Start with localStorage for prototypes, migrate to IndexedDB as your storage needs grow beyond ~5 MB.

---

## Sync Patterns and Offline Strategies

> **New in v3.1.0** - Leverage timestamp tracking for powerful sync patterns.
>
> 📚 **For comprehensive sync documentation**, architecture patterns, and production considerations, see **[offline-sync.md](./offline-sync.md)**.
>
> This section provides working code examples. For theory, strategies, and best practices, refer to the full sync guide.

### Example 23: Fetch on Reconnect Pattern

```typescript
import { DataContext, StorageLocations } from "i45";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

class TodoSync {
  private context: DataContext<Todo[]>;
  private apiEndpoint = "https://api.example.com/todos";

  constructor() {
    this.context = new DataContext<Todo[]>({
      storageKey: "todos",
      storageLocation: StorageLocations.IndexedDB,
      trackTimestamps: true,
      loggingEnabled: false,
    });

    // Listen for online/offline events
    window.addEventListener("online", () => this.handleReconnect());
  }

  async handleReconnect() {
    console.log("🌐 Connection restored, syncing...");

    try {
      // Get locally stored data
      const localData = await this.context.retrieve();

      if (!localData || localData.length === 0) {
        console.log("No local data to sync");
        return;
      }

      // Fetch latest from server
      const response = await fetch(this.apiEndpoint);
      const serverData: Todo[] = await response.json();

      // Merge: prefer server data but keep local additions
      const merged = this.mergeData(localData, serverData);

      // Store merged data
      await this.context.store(merged);
      console.log("✅ Sync complete");
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }

  private mergeData(local: Todo[], server: Todo[]): Todo[] {
    const serverIds = new Set(server.map((t) => t.id));
    const localOnly = local.filter((t) => !serverIds.has(t.id));
    return [...server, ...localOnly];
  }

  async getTodos(): Promise<Todo[]> {
    if (navigator.onLine) {
      try {
        // Online: fetch from server
        const response = await fetch(this.apiEndpoint);
        const todos = await response.json();
        await this.context.store(todos);
        return todos;
      } catch (error) {
        console.warn("Failed to fetch, using cached data");
      }
    }

    // Offline: use cached data
    return (await this.context.retrieve()) || [];
  }
}

// Usage
const todoSync = new TodoSync();
const todos = await todoSync.getTodos();
```

### Example 24: Queue-Based Sync with Retry Logic

```typescript
import { DataContext, StorageLocations } from "i45";

interface SyncQueue {
  id: string;
  operation: "create" | "update" | "delete";
  endpoint: string;
  data: any;
  retries: number;
  createdAt: string;
}

class SyncManager {
  private queueContext: DataContext<SyncQueue[]>;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.queueContext = new DataContext<SyncQueue[]>({
      storageKey: "sync-queue",
      storageLocation: StorageLocations.IndexedDB,
      trackTimestamps: true,
      loggingEnabled: true,
    });

    // Start sync worker when online
    window.addEventListener("online", () => this.processSyncQueue());
  }

  async queueOperation(
    operation: SyncQueue["operation"],
    endpoint: string,
    data: any
  ): Promise<void> {
    const queue = (await this.queueContext.retrieve()) || [];

    const queueItem: SyncQueue = {
      id: crypto.randomUUID(),
      operation,
      endpoint,
      data,
      retries: 0,
      createdAt: new Date().toISOString(),
    };

    queue.push(queueItem);
    await this.queueContext.store(queue);

    console.log(`📋 Queued ${operation} operation`);

    // Try to process immediately if online
    if (navigator.onLine) {
      await this.processSyncQueue();
    }
  }

  async processSyncQueue(): Promise<void> {
    const queue = (await this.queueContext.retrieve()) || [];

    if (queue.length === 0) {
      console.log("✅ Sync queue is empty");
      return;
    }

    console.log(`🔄 Processing ${queue.length} queued operations...`);

    const remaining: SyncQueue[] = [];

    for (const item of queue) {
      try {
        await this.executeOperation(item);
        console.log(`✅ Synced ${item.operation} to ${item.endpoint}`);
      } catch (error) {
        console.error(`Failed to sync ${item.id}:`, error);

        // Retry logic
        if (item.retries < this.maxRetries) {
          item.retries++;
          remaining.push(item);
          console.log(`⏳ Will retry (${item.retries}/${this.maxRetries})`);
        } else {
          console.error(`❌ Max retries reached for ${item.id}, discarding`);
        }
      }

      // Small delay between operations
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Update queue with remaining items
    await this.queueContext.store(remaining);
    console.log(`📋 ${remaining.length} operations remaining in queue`);
  }

  private async executeOperation(item: SyncQueue): Promise<void> {
    const options: RequestInit = {
      method:
        item.operation === "create"
          ? "POST"
          : item.operation === "update"
          ? "PUT"
          : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: item.operation !== "delete" ? JSON.stringify(item.data) : undefined,
    };

    const response = await fetch(item.endpoint, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  async getQueueStatus(): Promise<{
    total: number;
    oldestItem: string | null;
  }> {
    const queue = (await this.queueContext.retrieve()) || [];
    const oldest = queue.length > 0 ? queue[0].createdAt : null;
    return { total: queue.length, oldestItem: oldest };
  }
}

// Usage
const syncManager = new SyncManager();

// Queue operations while offline
await syncManager.queueOperation("create", "/api/todos", {
  title: "New todo",
  completed: false,
});

// Check queue status
const status = await syncManager.getQueueStatus();
console.log(`Queue: ${status.total} pending operations`);
```

### Example 25: Timestamp-Based Incremental Sync

```typescript
import { DataContext, StorageLocations, isModifiedSince } from "i45";

interface Article {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

class ArticleSync {
  private context: DataContext<Article[]>;
  private apiEndpoint = "https://api.example.com/articles";

  constructor() {
    this.context = new DataContext<Article[]>({
      storageKey: "articles",
      storageLocation: StorageLocations.IndexedDB,
      trackTimestamps: true,
      loggingEnabled: true,
    });
  }

  async syncArticles(): Promise<void> {
    try {
      // Get metadata to check last sync time
      const metadata = await this.context.getMetadata();
      const lastSyncTime = metadata?.updatedAt || "1970-01-01T00:00:00.000Z";

      console.log(`Last sync: ${lastSyncTime}`);

      // Fetch only articles modified since last sync
      const url = `${this.apiEndpoint}?since=${encodeURIComponent(
        lastSyncTime
      )}`;
      const response = await fetch(url);
      const newArticles: Article[] = await response.json();

      if (newArticles.length === 0) {
        console.log("✅ Already up to date");
        return;
      }

      console.log(`📥 Fetched ${newArticles.length} updated articles`);

      // Get existing articles
      const existingArticles = (await this.context.retrieve()) || [];

      // Merge: update existing, add new
      const merged = this.mergeArticles(existingArticles, newArticles);

      // Store merged data (updates timestamp)
      await this.context.store(merged);

      console.log(`✅ Synced ${newArticles.length} articles`);
    } catch (error) {
      console.error("Sync failed:", error);
      throw error;
    }
  }

  private mergeArticles(existing: Article[], updates: Article[]): Article[] {
    const articleMap = new Map(existing.map((a) => [a.id, a]));

    // Update or add articles
    for (const article of updates) {
      articleMap.set(article.id, article);
    }

    return Array.from(articleMap.values());
  }

  async getArticle(id: string): Promise<Article | null> {
    const articles = (await this.context.retrieve()) || [];
    return articles.find((a) => a.id === id) || null;
  }

  async shouldSync(maxAgeMinutes: number = 5): Promise<boolean> {
    const metadata = await this.context.getMetadata();

    if (!metadata) {
      return true; // No data, should sync
    }

    // Check if data is stale
    const now = new Date();
    const lastUpdate = new Date(metadata.updatedAt);
    const ageMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

    return ageMinutes > maxAgeMinutes;
  }
}

// Usage
const articleSync = new ArticleSync();

// Sync only if data is older than 5 minutes
if (await articleSync.shouldSync(5)) {
  console.log("Data is stale, syncing...");
  await articleSync.syncArticles();
} else {
  console.log("Using cached data");
}
```

### Example 26: Conflict Resolution Pattern

```typescript
import { DataContext, StorageLocations, getAge } from "i45";

interface Document {
  id: string;
  content: string;
  version: number;
  updatedAt: string;
}

type ConflictStrategy = "server-wins" | "client-wins" | "manual" | "latest";

class DocumentSync {
  private context: DataContext<Document>;
  private apiEndpoint: string;

  constructor(documentId: string) {
    this.context = new DataContext<Document>({
      storageKey: `document-${documentId}`,
      storageLocation: StorageLocations.IndexedDB,
      trackTimestamps: true,
      loggingEnabled: true,
    });
    this.apiEndpoint = `https://api.example.com/documents/${documentId}`;
  }

  async sync(strategy: ConflictStrategy = "latest"): Promise<Document> {
    // Get local document
    const localDoc = await this.context.retrieve();

    // Fetch server document
    const response = await fetch(this.apiEndpoint);
    const serverDoc: Document = await response.json();

    // No local document, use server version
    if (!localDoc) {
      await this.context.store(serverDoc);
      return serverDoc;
    }

    // Check for conflicts
    if (localDoc.version !== serverDoc.version) {
      console.warn("⚠️ Conflict detected!");
      console.log(`Local version: ${localDoc.version}`);
      console.log(`Server version: ${serverDoc.version}`);

      const resolved = await this.resolveConflict(
        localDoc,
        serverDoc,
        strategy
      );

      // Store resolved document
      await this.context.store(resolved);

      // If client version was chosen, push to server
      if (resolved === localDoc) {
        await this.pushToServer(resolved);
      }

      return resolved;
    }

    // No conflict, use server version
    await this.context.store(serverDoc);
    return serverDoc;
  }

  private async resolveConflict(
    local: Document,
    server: Document,
    strategy: ConflictStrategy
  ): Promise<Document> {
    switch (strategy) {
      case "server-wins":
        console.log("✅ Using server version");
        return server;

      case "client-wins":
        console.log("✅ Using client version");
        return local;

      case "latest":
        // Compare timestamps
        const localTime = new Date(local.updatedAt).getTime();
        const serverTime = new Date(server.updatedAt).getTime();

        if (localTime > serverTime) {
          console.log("✅ Client has newer version");
          return local;
        } else {
          console.log("✅ Server has newer version");
          return server;
        }

      case "manual":
        // In a real app, show UI for user to choose
        console.log("⚠️ Manual resolution required");
        return await this.promptUserForResolution(local, server);

      default:
        return server;
    }
  }

  private async promptUserForResolution(
    local: Document,
    server: Document
  ): Promise<Document> {
    // Simplified example - in real app, show UI
    console.log("\nLocal document:", local.content.substring(0, 50));
    console.log("Server document:", server.content.substring(0, 50));

    // For this example, prefer latest
    const localTime = new Date(local.updatedAt).getTime();
    const serverTime = new Date(server.updatedAt).getTime();
    return localTime > serverTime ? local : server;
  }

  private async pushToServer(doc: Document): Promise<void> {
    await fetch(this.apiEndpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });
    console.log("📤 Pushed local changes to server");
  }

  async saveLocally(content: string): Promise<void> {
    const current = await this.context.retrieve();
    const updated: Document = {
      ...current!,
      content,
      version: (current?.version || 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    await this.context.store(updated);
  }
}

// Usage
const docSync = new DocumentSync("doc-123");

// Save locally while offline
await docSync.saveLocally("Updated content...");

// When online, sync with conflict resolution
try {
  const resolved = await docSync.sync("latest");
  console.log("Document synced:", resolved);
} catch (error) {
  console.error("Sync failed:", error);
}
```

### Example 27: Auto-Refresh Cache Pattern

```typescript
import { DataContext, StorageLocations, isStale } from "i45";

interface CacheConfig {
  key: string;
  endpoint: string;
  maxAgeMinutes: number;
}

class AutoRefreshCache<T> {
  private context: DataContext<T>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.context = new DataContext<T>({
      storageKey: config.key,
      storageLocation: StorageLocations.IndexedDB,
      trackTimestamps: true,
      loggingEnabled: false,
    });
  }

  async getData(forceRefresh: boolean = false): Promise<T | null> {
    // Check if we need to refresh
    const shouldRefresh = forceRefresh || (await this.shouldRefresh());

    if (shouldRefresh && navigator.onLine) {
      try {
        console.log("🔄 Refreshing cache from server...");
        const data = await this.fetchFromServer();
        await this.context.store(data);
        return data;
      } catch (error) {
        console.warn("Failed to refresh, using cached data:", error);
      }
    }

    // Return cached data
    console.log("📦 Using cached data");
    return await this.context.retrieve();
  }

  private async shouldRefresh(): Promise<boolean> {
    const metadata = await this.context.getMetadata();

    if (!metadata) {
      return true; // No cached data
    }

    // Check if cache is stale
    const maxAgeMs = this.config.maxAgeMinutes * 60 * 1000;
    return isStale(metadata, maxAgeMs);
  }

  private async fetchFromServer(): Promise<T> {
    const response = await fetch(this.config.endpoint);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  }

  async getCacheAge(): Promise<number | null> {
    const metadata = await this.context.getMetadata();
    return metadata ? getAge(metadata) : null;
  }

  async clearCache(): Promise<void> {
    await this.context.remove();
    console.log("🗑️ Cache cleared");
  }
}

// Usage
const userCache = new AutoRefreshCache<{ id: string; name: string }>({
  key: "current-user",
  endpoint: "https://api.example.com/user",
  maxAgeMinutes: 15,
});

// Get data (auto-refreshes if stale)
const user = await userCache.getData();

// Force refresh
const freshUser = await userCache.getData(true);

// Check cache age
const ageMs = await userCache.getCacheAge();
if (ageMs) {
  console.log(`Cache age: ${Math.round(ageMs / 1000 / 60)} minutes`);
}
```

> **💡 Best Practices:**
>
> - Always check `navigator.onLine` before attempting network requests
> - Use timestamp tracking (`trackTimestamps: true`) for sync patterns
> - Implement exponential backoff for retry logic
> - Handle conflicts gracefully with clear user feedback
> - Test sync patterns with network throttling and offline mode
> - Consider using IndexedDB for queue storage to handle large sync operations
>
> **📚 Learn More:** See **[offline-sync.md](./offline-sync.md)** for comprehensive sync architecture, conflict resolution strategies, queue management, performance optimization, and production considerations.

---

## Testing Examples

### Example 19: Unit Testing with Jest

```typescript
import { DataContext, StorageLocations } from "i45";

describe("DataContext", () => {
  let context: DataContext<any>;

  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();

    context = new DataContext({
      storageKey: "TestData",
      storageLocation: StorageLocations.LocalStorage,
    });
  });

  test("should store and retrieve data", async () => {
    const testData = [{ id: 1, name: "Test" }];
    await context.store(testData);

    const retrieved = await context.retrieve();
    expect(retrieved).toEqual(testData);
  });

  test("should handle empty retrieval", async () => {
    const retrieved = await context.retrieve();
    expect(retrieved).toEqual([]);
  });

  test("should remove data", async () => {
    await context.store([{ id: 1 }]);
    await context.remove();

    const retrieved = await context.retrieve();
    expect(retrieved).toEqual([]);
  });

  test("should clear all storage", async () => {
    await context.store([{ id: 1 }]);
    await context.clear();

    const retrieved = await context.retrieve();
    expect(retrieved).toEqual([]);
  });

  test("should use custom storage key", async () => {
    const customContext = new DataContext({
      storageKey: "CustomKey",
    });

    await customContext.store([{ id: 1 }]);

    const value = localStorage.getItem("CustomKey");
    expect(value).toBeTruthy();
  });
});
```

### Example 20: Mocking localStorage

```typescript
// Mock localStorage for testing
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

// Use in tests
global.localStorage = new LocalStorageMock() as any;

// Now test with i45
const context = new DataContext();
await context.store([{ id: 1 }]);
// ... assertions
```

---

## Cross-Tab Synchronization

**Available in v3.2.0+**

Cross-tab synchronization keeps data synchronized across multiple browser tabs automatically.

### Example 1: Basic Cross-Tab Sync

```typescript
import { DataContext, StorageLocations } from "i45";

const context = new DataContext({
  storageKey: "shared-data",
  storageLocation: StorageLocations.LocalStorage,
  enableCrossTabSync: true,
  onCrossTabUpdate: (items) => {
    console.log("Another tab updated data:", items);
    updateUI(items);
  },
});

// Store data - all tabs will be notified
await context.store([{ id: 1, value: "Updated" }]);
```

### Example 2: Shopping Cart Sync

```typescript
interface CartItem {
  productId: number;
  name: string;
  quantity: number;
}

const cartContext = new DataContext<CartItem>({
  storageKey: "shopping-cart",
  enableCrossTabSync: true,
  onCrossTabUpdate: (cart) => {
    // Update cart badge in all tabs
    updateCartCount(cart.length);

    // Show notification
    showToast(`Cart updated: ${cart.length} items`);
  },
});

// Add to cart in one tab
async function addToCart(item: CartItem) {
  const cart = await cartContext.retrieve();
  cart.push(item);
  await cartContext.store(cart);
  // All other tabs see the update instantly
}
```

### Example 3: User Session Sync

```typescript
interface UserSession {
  userId: string;
  token: string;
}

const sessionContext = new DataContext<UserSession>({
  storageKey: "session",
  enableCrossTabSync: true,
  onCrossTabUpdate: (sessions) => {
    if (sessions.length === 0) {
      // User logged out in another tab
      redirectToLogin();
    }
  },
  onCrossTabRemove: () => {
    // Session cleared in another tab
    redirectToLogin();
  },
});

// Logout function
async function logout() {
  await sessionContext.remove();
  // All tabs are immediately logged out
}
```

### Example 4: React Hook with Cross-Tab Sync

```typescript
import { useEffect, useState } from "react";
import { DataContext } from "i45";

function useSharedState<T>(storageKey: string, initialValue: T[]) {
  const [data, setData] = useState<T[]>(initialValue);

  useEffect(() => {
    const context = new DataContext<T>({
      storageKey,
      enableCrossTabSync: true,
      onCrossTabUpdate: (items) => {
        setData(items);
      },
    });

    // Load initial data
    context.retrieve().then(setData);

    return () => context.destroy();
  }, [storageKey]);

  const updateData = async (newData: T[]) => {
    setData(newData);
    const context = new DataContext<T>({
      storageKey,
      enableCrossTabSync: true,
    });
    await context.store(newData);
  };

  return [data, updateData] as const;
}

// Usage
function App() {
  const [items, setItems] = useSharedState("items", []);

  return (
    <div>
      <h1>Items: {items.length}</h1>
      <button onClick={() => setItems([...items, { id: Date.now() }])}>
        Add Item
      </button>
      {/* Changes visible in all tabs instantly */}
    </div>
  );
}
```

### Example 5: Checking Sync Status

```typescript
import { DataContext, CrossTabManager, StorageLocations } from "i45";

// Check if cross-tab sync is supported
const isSupported = CrossTabManager.isSupported(StorageLocations.LocalStorage);

if (isSupported) {
  const context = new DataContext({
    storageKey: "data",
    enableCrossTabSync: true,
  });

  // Check if actively syncing
  console.log("Active:", context.isCrossTabSyncActive());

  // Get sync method being used
  console.log("Method:", context.getCrossTabSyncMethod());
  // Output: "broadcast" or "storage-events"

  // Get tab ID (when using BroadcastChannel)
  console.log("Tab ID:", context.getTabId());
}
```

### Example 6: Manual Refresh

```typescript
const context = new DataContext({
  storageKey: "data",
  enableCrossTabSync: true,
});

// Manually refresh to get latest from other tabs
const latestData = await context.refreshFromCrossTab();
console.log("Latest data:", latestData);
```

For more details, see the [Cross-Tab Synchronization Guide](./cross-tab-sync.md).

---

## Testing Examples

- [README.md](../README.md) - Getting started guide
- [api.md](./api.md) - Complete API reference
- [typescript.md](./typescript.md) - TypeScript usage guide
- [migration.md](./migration.md) - Migration from v2.x

---

**i45 v3.0.0+** | [GitHub](https://github.com/yourusername/i45) | [npm](https://www.npmjs.com/package/i45)
