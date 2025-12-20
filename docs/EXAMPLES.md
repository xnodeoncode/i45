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

## See Also

- [README.md](../README.md) - Getting started guide
- [API.md](./API.md) - Complete API reference
- [TYPESCRIPT.md](./TYPESCRIPT.md) - TypeScript usage guide
- [MIGRATION.md](./MIGRATION.md) - Migration from v2.x

---

**i45 v3.0.0+** | [GitHub](https://github.com/yourusername/i45) | [npm](https://www.npmjs.com/package/i45)
