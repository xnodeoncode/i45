# i45 API Reference

Complete API documentation for i45 v3.0.0+

## Table of Contents

- [DataContext Class](#datacontext-class)
- [Configuration](#configuration)
- [Type Definitions](#type-definitions)
- [Error Classes](#error-classes)
- [Utilities](#utilities)
- [Sample Data](#sample-data)

---

## DataContext Class

The main class for managing browser storage operations with type safety.

### Constructor

#### Modern Approach (Recommended)

```typescript
new DataContext<T>(config?: DataContextConfig)
```

**Example:**

```typescript
import { DataContext, StorageLocations, Logger } from "i45";

const context = new DataContext<User>({
  storageKey: "Users",
  storageLocation: StorageLocations.LocalStorage,
  loggingEnabled: true,
  logger: new Logger(),
});
```

#### Legacy Approach (Still Supported)

```typescript
new DataContext<T>(storageKey?: string, storageLocation?: StorageLocation)
```

**Example:**

```typescript
import { DataContext, StorageLocations } from "i45";

const context = new DataContext<User>("Users", StorageLocations.LocalStorage);
```

### Properties

#### `storageKey: string`

The key used to store data in browser storage.

- **Default:** `"Items"`
- **Mutable:** Yes (can be changed after initialization)

```typescript
const context = new DataContext();
console.log(context.storageKey); // "Items"

context.storageKey = "MyData";
console.log(context.storageKey); // "MyData"
```

#### `storageLocation: StorageLocation`

The storage type (localStorage or sessionStorage).

- **Type:** `StorageLocation` (enum)
- **Default:** `StorageLocations.LocalStorage`
- **Mutable:** Yes

```typescript
import { StorageLocations } from "i45";

const context = new DataContext();
console.log(context.storageLocation); // StorageLocations.LocalStorage

context.storageLocation = StorageLocations.SessionStorage;
```

#### `loggingEnabled: boolean`

Controls whether operations are logged.

- **Default:** `false`
- **Mutable:** Yes

```typescript
const context = new DataContext({ loggingEnabled: true });
console.log(context.loggingEnabled); // true

context.loggingEnabled = false; // Disable logging
```

#### `logger: Logger | null`

The logger instance used for logging operations.

- **Default:** `null`
- **Type:** `Logger` from i45-jslogger or custom logger
- **Mutable:** Yes (use `addClient()` to set)

```typescript
import { Logger } from "i45";

const context = new DataContext();
console.log(context.logger); // null

context.addClient(new Logger());
console.log(context.logger); // Logger instance
```

---

### Store Methods

#### `async store(items: T[]): Promise<DataContext<T>>`

Stores data using the current `storageKey` and `storageLocation`.

**Parameters:**

- `items: T[]` - Array of items to store

**Returns:** `Promise<DataContext<T>>` - The context instance for chaining

**Throws:**

- `StorageKeyError` - If storage key is invalid
- `StorageLocationError` - If storage location is invalid
- `StorageQuotaError` - If storage quota exceeded
- `DataServiceUnavailable` - If storage service unavailable

**Example:**

```typescript
const context = new DataContext<User>({ storageKey: "Users" });
await context.store([
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
]);
```

#### `async storeAs(storageKey: string, items: T[]): Promise<DataContext<T>>`

Stores data with a custom key, using the current `storageLocation`.

**Parameters:**

- `storageKey: string` - Custom storage key
- `items: T[]` - Array of items to store

**Returns:** `Promise<DataContext<T>>`

**Throws:** Same as `store()`

**Example:**

```typescript
const context = new DataContext<User>();
await context.storeAs("BackupUsers", [{ id: 1, name: "Alice" }]);
```

#### `async storeAt(storageKey: string, storageLocation: StorageLocation, items: T[]): Promise<DataContext<T>>`

Stores data with full control over key and location.

**Parameters:**

- `storageKey: string` - Custom storage key
- `storageLocation: StorageLocation` - Storage type
- `items: T[]` - Array of items to store

**Returns:** `Promise<DataContext<T>>`

**Throws:** Same as `store()`

**Example:**

```typescript
import { DataContext, StorageLocations } from "i45";

const context = new DataContext<User>();
await context.storeAt("TempUsers", StorageLocations.SessionStorage, [
  { id: 1, name: "Alice" },
]);
```

---

### Retrieve Methods

#### `async retrieve(): Promise<T[]>`

Retrieves data using the current `storageKey` and `storageLocation`.

**Returns:** `Promise<T[]>` - Array of stored items

**Throws:**

- `StorageKeyError` - If storage key is invalid
- `StorageLocationError` - If storage location is invalid
- `DataRetrievalError` - If retrieval fails
- `DataServiceUnavailable` - If storage service unavailable

**Example:**

```typescript
const context = new DataContext<User>({ storageKey: "Users" });
const users = await context.retrieve();
console.log(users); // [{ id: 1, name: "Alice" }, ...]
```

#### `async retrieveFrom(storageKey: string): Promise<T[]>`

Retrieves data from a custom key, using the current `storageLocation`.

**Parameters:**

- `storageKey: string` - Custom storage key

**Returns:** `Promise<T[]>`

**Throws:** Same as `retrieve()`

**Example:**

```typescript
const context = new DataContext<User>();
const backupUsers = await context.retrieveFrom("BackupUsers");
```

#### `async retrieveAt(storageKey: string, storageLocation: StorageLocation): Promise<T[]>`

Retrieves data with full control over key and location.

**Parameters:**

- `storageKey: string` - Custom storage key
- `storageLocation: StorageLocation` - Storage type

**Returns:** `Promise<T[]>`

**Throws:** Same as `retrieve()`

**Example:**

```typescript
import { DataContext, StorageLocations } from "i45";

const context = new DataContext<User>();
const tempUsers = await context.retrieveAt(
  "TempUsers",
  StorageLocations.SessionStorage
);
```

---

### Remove Methods

#### `async remove(): Promise<DataContext<T>>`

Removes data using the current `storageKey` and `storageLocation`.

**Returns:** `Promise<DataContext<T>>` - The context instance for chaining

**Throws:**

- `StorageKeyError` - If storage key is invalid
- `StorageLocationError` - If storage location is invalid
- `DataServiceUnavailable` - If storage service unavailable

**Example:**

```typescript
const context = new DataContext<User>({ storageKey: "Users" });
await context.remove();
```

#### `async removeFrom(storageKey: string): Promise<DataContext<T>>`

Removes data from a custom key, using the current `storageLocation`.

**Parameters:**

- `storageKey: string` - Custom storage key

**Returns:** `Promise<DataContext<T>>`

**Throws:** Same as `remove()`

**Example:**

```typescript
const context = new DataContext<User>();
await context.removeFrom("BackupUsers");
```

#### `async removeAt(storageKey: string, storageLocation: StorageLocation): Promise<DataContext<T>>`

Removes data with full control over key and location.

**Parameters:**

- `storageKey: string` - Custom storage key
- `storageLocation: StorageLocation` - Storage type

**Returns:** `Promise<DataContext<T>>`

**Throws:** Same as `remove()`

**Example:**

```typescript
import { DataContext, StorageLocations } from "i45";

const context = new DataContext<User>();
await context.removeAt("TempUsers", StorageLocations.SessionStorage);
```

---

### Other Methods

#### `async clear(): Promise<DataContext<T>>`

Clears **all** data from the current `storageLocation` (not just the current key).

**Returns:** `Promise<DataContext<T>>`

**Throws:**

- `DataServiceUnavailable` - If storage service unavailable

**Example:**

```typescript
const context = new DataContext();
await context.clear(); // Clears entire localStorage
```

#### `addClient(logger: Logger): DataContext<T>`

Adds a custom logger instance to the context.

**Parameters:**

- `logger: Logger` - Logger instance from i45-jslogger or custom implementation

**Returns:** `DataContext<T>` - The context instance for chaining

**Example:**

```typescript
import { DataContext, Logger } from "i45";

const context = new DataContext();
const logger = new Logger();

context.addClient(logger).loggingEnabled = true;
```

#### `getCurrentSettings(): { storageKey: string; storageLocation: StorageLocation }`

Returns the current storage configuration.

**Returns:** Object with `storageKey` and `storageLocation`

**Example:**

```typescript
const context = new DataContext({ storageKey: "MyData" });
const settings = context.getCurrentSettings();
console.log(settings);
// { storageKey: "MyData", storageLocation: StorageLocations.LocalStorage }
```

#### `getData(): any[]`

Returns the currently loaded data (if any).

**Returns:** `any[]` - Array of data items

**Example:**

```typescript
const context = new DataContext<User>();
await context.store([{ id: 1, name: "Alice" }]);
const data = context.getData();
console.log(data); // [{ id: 1, name: "Alice" }]
```

#### `printLog(): any[]`

Returns the log entries (if logging is enabled).

**Returns:** `any[]` - Array of log entries

**Example:**

```typescript
const context = new DataContext({ loggingEnabled: true });
context.addClient(new Logger());
await context.store([{ id: 1, name: "Alice" }]);

const logs = context.printLog();
console.log(logs); // Array of log entries
```

---

## Configuration

### DataContextConfig Interface

Configuration object for DataContext initialization (v3.0.0+).

```typescript
interface DataContextConfig {
  storageKey?: string;
  storageLocation?: StorageLocation;
  logger?: Logger | null;
  loggingEnabled?: boolean;
}
```

**Properties:**

- **`storageKey?: string`**  
  The key used for storage operations.  
  Default: `"Items"`

- **`storageLocation?: StorageLocation`**  
  The storage type (localStorage or sessionStorage).  
  Default: `StorageLocations.LocalStorage`

- **`logger?: Logger | null`**  
  Logger instance for operation logging.  
  Default: `null`

- **`loggingEnabled?: boolean`**  
  Enable/disable logging.  
  Default: `false`

**Example:**

```typescript
const config: DataContextConfig = {
  storageKey: "UserPreferences",
  storageLocation: StorageLocations.SessionStorage,
  loggingEnabled: true,
  logger: new Logger(),
};

const context = new DataContext<Preferences>(config);
```

---

## Type Definitions

### StorageLocation Enum

```typescript
enum StorageLocations {
  LocalStorage = "localStorage",
  SessionStorage = "sessionStorage",
}
```

**Usage:**

```typescript
import { StorageLocations } from "i45";

const context = new DataContext({
  storageLocation: StorageLocations.SessionStorage,
});
```

### StorageItem Interface

Internal type representing a stored item.

```typescript
interface StorageItem {
  name: string;
  value: string;
}
```

**Note:** Users typically don't interact with this type directly. It's used internally for storage serialization.

---

## Error Classes

i45 provides 6 custom error classes for specific error handling.

### StorageKeyError

Thrown when a storage key is invalid (empty, whitespace-only, or too long).

**Properties:**

- `key: string` - The invalid key
- `message: string` - Error description

**Example:**

```typescript
import { StorageKeyError } from "i45";

try {
  const context = new DataContext({ storageKey: "" });
  await context.store([]);
} catch (error) {
  if (error instanceof StorageKeyError) {
    console.error("Invalid key:", error.key);
  }
}
```

### StorageLocationError

Thrown when a storage location is invalid.

**Properties:**

- `location: string` - The invalid location
- `validLocations: string[]` - Valid location values
- `message: string` - Error description

**Example:**

```typescript
import { StorageLocationError } from "i45";

try {
  const context = new DataContext();
  context.storageLocation = "invalidStorage" as any;
  await context.store([]);
} catch (error) {
  if (error instanceof StorageLocationError) {
    console.error("Invalid location:", error.location);
    console.error("Valid locations:", error.validLocations);
  }
}
```

### DataRetrievalError

Thrown when data retrieval fails (parse errors, missing data, etc.).

**Properties:**

- `key: string` - The storage key
- `cause?: Error` - The underlying error (if any)
- `message: string` - Error description

**Example:**

```typescript
import { DataRetrievalError } from "i45";

try {
  const data = await context.retrieve();
} catch (error) {
  if (error instanceof DataRetrievalError) {
    console.error("Failed to retrieve from:", error.key);
    if (error.cause) {
      console.error("Underlying error:", error.cause);
    }
  }
}
```

### StorageQuotaError

Thrown when storage quota is exceeded.

**Properties:**

- `key: string` - The storage key
- `storageType: string` - The storage type (localStorage/sessionStorage)
- `message: string` - Error description

**Example:**

```typescript
import { StorageQuotaError } from "i45";

try {
  await context.store(veryLargeArray);
} catch (error) {
  if (error instanceof StorageQuotaError) {
    console.error("Storage full:", error.storageType);
    console.error("Failed key:", error.key);
    // Handle quota error (e.g., clear old data, use different storage)
  }
}
```

### PersistenceServiceNotEnabled

Thrown when attempting to use persistence without enabling it.

**Properties:**

- `message: string` - Error description

**Example:**

```typescript
import { PersistenceServiceNotEnabled } from "i45";

try {
  // Some operation requiring persistence
} catch (error) {
  if (error instanceof PersistenceServiceNotEnabled) {
    console.error("Persistence not enabled");
  }
}
```

### DataServiceUnavailable

Thrown when the storage service is unavailable (browser storage disabled, etc.).

**Properties:**

- `serviceName: string` - The service name (e.g., "localStorage")
- `message: string` - Error description

**Example:**

```typescript
import { DataServiceUnavailable } from "i45";

try {
  await context.store([]);
} catch (error) {
  if (error instanceof DataServiceUnavailable) {
    console.error("Service unavailable:", error.serviceName);
    // Handle unavailable service (e.g., fallback to memory storage)
  }
}
```

---

## Utilities

### ValidationUtils

Centralized validation utilities (v3.0.0+).

**Methods:**

#### `static validateStorageKey(key: string): void`

Validates a storage key.

**Throws:** `StorageKeyError` if invalid

**Example:**

```typescript
import { ValidationUtils, StorageKeyError } from "i45";

try {
  ValidationUtils.validateStorageKey("MyKey"); // OK
  ValidationUtils.validateStorageKey(""); // Throws
} catch (error) {
  if (error instanceof StorageKeyError) {
    console.error("Invalid key");
  }
}
```

#### `static validateStorageLocation(location: string): void`

Validates a storage location.

**Throws:** `StorageLocationError` if invalid

**Example:**

```typescript
import { ValidationUtils, StorageLocationError, StorageLocations } from "i45";

try {
  ValidationUtils.validateStorageLocation(StorageLocations.LocalStorage); // OK
  ValidationUtils.validateStorageLocation("invalid"); // Throws
} catch (error) {
  if (error instanceof StorageLocationError) {
    console.error("Invalid location");
  }
}
```

#### `static validateItems(items: any[]): void`

Validates an items array.

**Throws:** `TypeError` if items is not an array

**Example:**

```typescript
import { ValidationUtils } from "i45";

try {
  ValidationUtils.validateItems([1, 2, 3]); // OK
  ValidationUtils.validateItems("invalid" as any); // Throws
} catch (error) {
  console.error("Items must be an array");
}
```

#### `static validateLogger(logger: any): void`

Validates a logger instance.

**Throws:** `TypeError` if logger doesn't have required methods

**Example:**

```typescript
import { ValidationUtils, Logger } from "i45";

try {
  ValidationUtils.validateLogger(new Logger()); // OK
  ValidationUtils.validateLogger({}); // Throws
} catch (error) {
  console.error("Invalid logger");
}
```

#### `static validateConfig(config: DataContextConfig): void`

Validates a configuration object.

**Throws:** Various errors if config is invalid

**Example:**

```typescript
import { ValidationUtils } from "i45";

try {
  ValidationUtils.validateConfig({
    storageKey: "MyKey",
    loggingEnabled: true,
  }); // OK
} catch (error) {
  console.error("Invalid config");
}
```

### ErrorHandler

Centralized error handling utilities (v3.0.0+).

**Methods:**

#### `static handle(error: unknown, context: string): never`

Handles and rethrows errors with context.

**Parameters:**

- `error: unknown` - The error to handle
- `context: string` - Contextual information

**Throws:** The original error (or wrapped error)

**Example:**

```typescript
import { ErrorHandler } from "i45";

try {
  // Some operation
} catch (error) {
  ErrorHandler.handle(error, "store operation");
}
```

### StorageManager

Service orchestration for storage operations (v3.0.0+).

**Note:** This class is used internally by `DataContext`. Users typically don't interact with it directly.

**Usage (internal):**

```typescript
import { StorageManager, StorageLocations } from "i45";

const manager = new StorageManager();
await manager.store("MyKey", StorageLocations.LocalStorage, data);
const retrieved = await manager.retrieve(
  "MyKey",
  StorageLocations.LocalStorage
);
await manager.remove("MyKey", StorageLocations.LocalStorage);
```

---

## Sample Data

i45 includes [i45-sample-data](https://www.npmjs.com/package/i45-sample-data) for quick testing and examples.

### SampleData.JsonData

Pre-loaded JSON datasets.

**Available Collections:**

```typescript
import { SampleData } from "i45";

// Access sample data
const states = SampleData.JsonData.States;
const books = SampleData.JsonData.Books;
const users = SampleData.JsonData.Users;
const products = SampleData.JsonData.Products;
const countries = SampleData.JsonData.Countries;
const terms = SampleData.JsonData.Terms;
```

**Example:**

```typescript
import { DataContext, SampleData } from "i45";

const context = new DataContext();
await context.store(SampleData.JsonData.Books);

const books = await context.retrieve();
console.log(books); // Array of book objects
```

### Data Types

Sample data provides TypeScript types:

```typescript
import { StateType, BookType, UserType } from "i45-sample-data";

const context = new DataContext<BookType>();
await context.store(SampleData.JsonData.Books);
```

---

## See Also

- [README.md](../README.md) - Getting started guide
- [MIGRATION.md](./MIGRATION.md) - Migration from v2.x
- [TYPESCRIPT.md](./TYPESCRIPT.md) - TypeScript usage guide
- [EXAMPLES.md](./EXAMPLES.md) - Comprehensive examples
- [CHANGES.md](../CHANGES.md) - Version history

---

**i45 v3.0.0+** | [GitHub](https://github.com/yourusername/i45) | [npm](https://www.npmjs.com/package/i45)
