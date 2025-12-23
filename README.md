# i45

**Type-safe browser storage wrapper for localStorage and sessionStorage**

[![npm version](https://img.shields.io/npm/v/i45)](https://www.npmjs.com/package/i45)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[NodeJS package](https://www.npmjs.com/package/i45) | [GitHub Repository](https://github.com/xnodeoncode/i45)

A powerful, type-safe wrapper for browser storage (localStorage and sessionStorage) with built-in logging, validation, and error handling. Built with TypeScript for maximum type safety and developer experience.

**Version 3.0.0-alpha.1** - Complete TypeScript rewrite with architectural refactoring (December 2025)

## Features

- ✨ **Full TypeScript support** with generic types: `DataContext<T>`
- 🔒 **Type-safe operations** - catch errors at compile time
- 🏗️ **Modern architecture** - modular design with service orchestration
- � **Three storage options** - localStorage, sessionStorage, and IndexedDB (~50MB+)
- ⏱️ **Automatic timestamp tracking** - transparent metadata with createdAt, updatedAt, version
- 🔄 **Time-based patterns** - sync-since-timestamp, cache freshness, conflict resolution- 🔗 **Cross-tab synchronization** (v3.2.0+) - automatic data sync between browser tabs- 💾 **Storage quota checking** - monitor capacity and usage across storage types
- 📦 **Simple API** - config object pattern or legacy constructor
- 🎯 **Zero code duplication** - 300+ lines eliminated through refactoring
- ✅ **Comprehensive validation** - centralized with `ValidationUtils`
- 🚨 **6 custom error classes** - specific, actionable error handling
- 🪵 **Built-in logging** via [i45-jslogger](https://www.npmjs.com/package/i45-jslogger)
- 🧪 **Well tested** - 272 tests with excellent coverage
- 🎯 **Zero dependencies** (except i45-jslogger and i45-sample-data)
- 📝 **Sample data included** via [i45-sample-data](https://www.npmjs.com/package/i45-sample-data)
- 🌳 **Tree-shakeable** ESM build
- 📖 **Comprehensive type definitions** (.d.ts)

**📚 Documentation:** [Migration Guide](./docs/migration.md) | [API Reference](./docs/api.md) | [TypeScript Guide](./docs/typescript.md) | [Examples](./docs/examples.md) | [Offline Sync Guide](./docs/offline-sync.md) | [Cross-Tab Sync Guide](./docs/cross-tab-sync.md)

## Installation

```bash
npm install i45
```

## Quick Start

### TypeScript (Recommended)

```typescript
import { DataContext, StorageLocations, Logger } from "i45";

// Define your data type
interface User {
  id: number;
  name: string;
  email: string;
}

// Create a type-safe context with config object (modern approach)
const context = new DataContext<User>({
  storageKey: "Users",
  storageLocation: StorageLocations.LocalStorage,
  trackTimestamps: true, // Automatic metadata (default: true)
  loggingEnabled: true,
  logger: new Logger(),
});

// Or use legacy constructor (still supported)
const legacyContext = new DataContext<User>(
  "Users",
  StorageLocations.LocalStorage
);

// Store data (fully typed!)
await context.store([
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
]);

// Retrieve data (returns User[])
const users = await context.retrieve();
console.log(users);

// Get metadata (timestamps, version, count)
const metadata = await context.getMetadata();
console.log(`Created: ${metadata.createdAt}, Version: ${metadata.version}`);
```

📖 **More examples:** [examples.md](./docs/examples.md) | [TypeScript Guide](./docs/typescript.md)

### JavaScript

```javascript
import { DataContext, SampleData } from "i45";

// Create an instance of the datacontext
// The default storage location is localStorage
const context = new DataContext();

// Store data using sample data
await context.store(SampleData.Lists.Astronomy);

// Retrieve data
const data = await context.retrieve();
console.log("Astronomy terms:", data);
```

## Architecture

i45 v3.0.0 features a completely refactored, modular architecture (December 2025).

📖 **See also:** [Migration Guide - Architecture](./docs/migration.md#new-architecture) | [API Reference](./docs/api.md)

```
/src
  /core                      # Core application logic
    DataContext.ts           # Main storage context
    StorageManager.ts        # Service orchestration
  /services
    /base                    # Abstract base classes
      IStorageService.ts     # Service interface
      BaseStorageService.ts  # Shared service logic
    LocalStorageService.ts
    SessionStorageService.ts
  /errors                    # Custom error classes
    StorageKeyError.ts
    StorageLocationError.ts
    DataRetrievalError.ts
    StorageQuotaError.ts
    PersistenceServiceNotEnabled.ts
    DataServiceUnavailable.ts
  /models                    # Data models
    DataContextConfig.ts
    storageItem.ts
    storageLocations.ts
  /utils                     # Shared utilities
    ValidationUtils.ts       # Centralized validation
    ErrorHandler.ts          # Error management
```

### Architecture Benefits

- **Single Responsibility**: Each module has one clear purpose
- **Zero Duplication**: 300+ lines of duplicate code eliminated
- **Easy Testing**: Isolated modules with 92% test coverage
- **Type Safe**: Strong typing throughout
- **Extensible**: Add new storage services by implementing interface

## Usage

- [TypeScript Usage](#typescript-usage)
- [Default Storage Settings](#default-storage-settings)
- [Custom Storage Settings](#custom-storage-settings)
- [Retrieving Data](#retrieving-data)
- [Retrieving Data from Custom Data Stores](#retrieving-data-from-custom-data-stores)
- [Removing Items and Clearing the Data Store](#removing-items-and-clearing-the-data-store)
- [Storage Locations](#storage-locations)
- [Using Sample Data](#using-sample-data)
- [Logging](#logging)

### TypeScript Usage

i45 v3.0 is built with TypeScript and provides full type safety.

📖 **See [typescript.md](./docs/typescript.md) for comprehensive TypeScript usage guide**

```typescript
import { DataContext, StorageLocations, type StorageItem } from "i45";

// Generic type for your data
interface Product {
  id: string;
  name: string;
  price: number;
}

// Type-safe context
const context = new DataContext<Product>(
  "products",
  StorageLocations.SessionStorage
);

// Store - TypeScript ensures correct types
await context.store([
  { id: "1", name: "Widget", price: 9.99 },
  { id: "2", name: "Gadget", price: 19.99 },
]);

// Retrieve - returns Product[]
const products = await context.retrieve();
products.forEach((p) => console.log(`${p.name}: $${p.price}`));
```

### Default Storage Settings

```javascript
import { DataContext, SampleData } from "i45";

// Create an instance - uses localStorage by default with key "i45"
const context = new DataContext();

// Store data
await context.store(SampleData.Lists.Astronomy);

// Retrieve data
const data = await context.retrieve();
console.log(data);
```

### Custom Storage Settings

#### Modern Config Object (Recommended)

```typescript
import { DataContext, StorageLocations, Logger } from "i45";

// Create context with configuration object
const context = new DataContext<BookType>({
  storageKey: "Books",
  storageLocation: StorageLocations.SessionStorage,
  loggingEnabled: true,
  logger: new Logger(),
});

// Store books collection
await context.store(SampleData.JsonData.Books);

// Retrieve data
const books = await context.retrieve();
console.log(books);
```

#### Legacy Constructor (Still Supported)

```javascript
import { DataContext, StorageLocations, SampleData } from "i45";

// Create context with positional parameters
const context = new DataContext("Books", StorageLocations.SessionStorage);

// Store books collection
await context.store(SampleData.JsonData.Books);

// Retrieve data
const books = await context.retrieve();
console.log(books);
```

### Retrieving Data

```javascript
import { DataContext, SampleData } from "i45";

// Create context
const context = new DataContext();

// Store data
await context.store(SampleData.JsonData.States);

// Retrieve and use
const states = await context.retrieve();
console.log("State data:", states);
```

### Explicit Method Signatures

v3.0.0 provides clear, explicit methods (no confusing overloads):

```typescript
import { DataContext, StorageLocations } from "i45";

const context = new DataContext<MyType>();

// Store with different scopes
await context.store(items); // Default key/location
await context.storeAs("customKey", items); // Custom key
await context.storeAt("key", StorageLocations.SessionStorage, items); // Full control

// Retrieve with different scopes
const data1 = await context.retrieve(); // Default
const data2 = await context.retrieveFrom("customKey"); // Custom key
const data3 = await context.retrieveAt("key", StorageLocations.SessionStorage); // Full control

// Remove with different scopes
await context.remove(); // Default
await context.removeFrom("customKey"); // Custom key
await context.removeAt("key", StorageLocations.SessionStorage); // Full control
```

### Retrieving Data from Custom Data Stores

```javascript
import { DataContext, StorageLocations, SampleData } from "i45";

// Create context with custom settings
const context = new DataContext("Questions", StorageLocations.SessionStorage);

// Store questions
await context.store(SampleData.JsonData.TriviaQuestions);

// Retrieve by key
const questions = await context.retrieve("Questions");
console.log(questions);

// Retrieve with specific location
const data = await context.retrieve("MyItems", StorageLocations.LocalStorage);
```

### Removing Items and Clearing the Data Store

```javascript
// Delete a specific data store by key
await context.remove("Questions");

// Clear all data from current storage location
await context.clear();
```

To clear all entries in all storage locations, call the clear() method.

**Warning:** Calling the clear() method will clear all entries in all storage locations.

```javascript
import { DataContext } from "i45";

var dataContext = new DataContext();

// create an array of countries using sample data.
var countries = SampleData.KeyValueLists.Countries;

// save the collection
dataContext.store("Countries", countries);

// removes the item from storage.
dataContext.remove("Countries");

// removes all items from all storage locations.
// *** WARNING *** calling clear() will clears all entries.
datacontext.clear();
```

### Storage Locations

StorageLocations is an enum of available storage options:

```typescript
import { StorageLocations } from "i45";

// Available options
StorageLocations.LocalStorage; // Uses window.localStorage (default, ~5-10MB)
StorageLocations.SessionStorage; // Uses window.sessionStorage (~5-10MB)
StorageLocations.IndexedDB; // Uses IndexedDB (~50MB+, async database)
```

#### Using StorageLocations

```javascript
import { DataContext, StorageLocations } from "i45";

// Specify storage location in constructor
const context = new DataContext("MyItems", StorageLocations.SessionStorage);

// Or use properties
context.storageLocation = StorageLocations.LocalStorage;

// Use IndexedDB for larger datasets
const largeDataContext = new DataContext({
  storageKey: "LargeDataset",
  storageLocation: StorageLocations.IndexedDB,
});
```

### Using Sample Data

The [i45-sample-data](https://www.npmjs.com/package/i45-sample-data) package provides sample datasets for development and testing:

```javascript
import { SampleData } from "i45";

// Access various sample datasets
const books = SampleData.JsonData.Books;
const states = SampleData.JsonData.States;
const astronomy = SampleData.Lists.Astronomy;
const countries = SampleData.KeyValueLists.Countries;

console.log(books);
```

### Logging

i45 integrates [i45-jslogger](https://www.npmjs.com/package/i45-jslogger) for comprehensive logging support.

📖 **See also:** [examples.md - Custom Logger](./docs/examples.md#custom-logger)

#### Built-In Logging

```javascript
import { DataContext } from "i45";

const context = new DataContext();

// Enable logging
context.loggingEnabled = true;

// Operations will now be logged
await context.store([{ id: 1, name: "Test" }]);
```

When enabled, log messages are written to the console and stored in localStorage.

#### Using a Custom Logger

Add custom logging clients to receive DataContext events:

```javascript
import { DataContext, Logger } from "i45";

// Create or use your existing logger
const customLogger = new Logger({
  logToConsole: true,
  logToStorage: false,
});

// Add to context
const context = new DataContext();
context.addClient(customLogger);

// Multiple loggers supported
context.addClient(fileSystemLogger);
context.addClient(apiLogger);
```

## API Reference

📖 **Complete API documentation:** [api.md](./docs/api.md)

### DataContext<T>

Main class for managing browser storage operations.

```typescript
class DataContext<T = any> {
  // Constructor - Config object (recommended)
  constructor(config?: DataContextConfig);

  // Constructor - Legacy (still supported)
  constructor(storageKey?: string, storageLocation?: StorageLocation);

  // Properties
  storageKey: string;
  storageLocation: StorageLocation;
  loggingEnabled: boolean;
  logger: Logger | null;

  // Store methods
  async store(items: T[]): Promise<DataContext<T>>;
  async storeAs(storageKey: string, items: T[]): Promise<DataContext<T>>;
  async storeAt(
    storageKey: string,
    storageLocation: StorageLocation,
    items: T[]
  ): Promise<DataContext<T>>;

  // Retrieve methods
  async retrieve(): Promise<T[]>;
  async retrieveFrom(storageKey: string): Promise<T[]>;
  async retrieveAt(
    storageKey: string,
    storageLocation: StorageLocation
  ): Promise<T[]>;

  // Remove methods
  async remove(): Promise<DataContext<T>>;
  async removeFrom(storageKey: string): Promise<DataContext<T>>;
  async removeAt(
    storageKey: string,
    storageLocation: StorageLocation
  ): Promise<DataContext<T>>;

  // Other methods
  async clear(): Promise<DataContext<T>>;
  addClient(logger: Logger): DataContext<T>;
  getCurrentSettings(): {
    storageKey: string;
    storageLocation: StorageLocation;
  };
  getData(): any[];
  printLog(): any[];
}
```

### DataContextConfig

Configuration object for DataContext (v3.0.0+):

```typescript
interface DataContextConfig {
  storageKey?: string; // Default: "Items"
  storageLocation?: StorageLocation; // Default: localStorage
  logger?: Logger | null; // Optional logger instance
  loggingEnabled?: boolean; // Default: false
}
```

### Types

```typescript
// Storage location type
export enum StorageLocations {
  SessionStorage = "sessionStorage",
  LocalStorage = "localStorage",
}
export type StorageLocation = `${StorageLocations}`;

// Storage item interface
export interface StorageItem {
  name: string;
  value: string;
}

// Database settings
export interface DatabaseSettings {
  storageKey: string;
  storageLocation: StorageLocation;
  loggingEnabled: boolean;
}
```

### Error Types

v3.0.0 provides 6 custom error classes for specific error handling.

📖 **Full error documentation:** [api.md - Error Classes](./docs/api.md#error-classes) | [Examples](./docs/examples.md#error-handling)

```typescript
import {
  PersistenceServiceNotEnabled,
  DataServiceUnavailable,
  StorageKeyError,
  StorageLocationError,
  DataRetrievalError,
  StorageQuotaError, // NEW in December 2025
} from "i45";

try {
  await context.store(data);
} catch (error) {
  if (error instanceof StorageKeyError) {
    console.error("Invalid storage key:", error.key);
  } else if (error instanceof StorageQuotaError) {
    console.error("Storage full:", error.key, error.storageType);
  } else if (error instanceof DataRetrievalError) {
    console.error("Failed to retrieve:", error.key, "Cause:", error.cause);
  } else if (error instanceof StorageLocationError) {
    console.error(
      "Invalid location:",
      error.location,
      "Valid:",
      error.validLocations
    );
  }
}
```

## Migration from v2.x

v3.0.0 includes breaking changes and major architectural improvements. See [migration.md](./docs/migration.md) for the complete migration guide.

### Key Changes

1. **New Architecture**: Modular design with service orchestration (December 2025)
2. **Config Object Pattern**: New recommended way to initialize DataContext
3. **TypeScript First**: Full TypeScript rewrite with generic types
4. **Explicit Methods**: `store()`, `storeAs()`, `storeAt()` instead of overloaded signatures
5. **6 Custom Errors**: Specific error classes for better error handling
6. **Centralized Validation**: `ValidationUtils` for consistent validation
7. **Zero Duplication**: 300+ lines of duplicate code eliminated
8. **Property Names**: `StorageItem.Name` → `name`, `StorageItem.Value` → `value` (camelCase)
9. **Async Operations**: All storage operations return Promises

### Quick Migration Example

```javascript
// v2.x (Old)
const context = new DataContext();
context.setStorageKey("MyData");
context.store(data); // May not be async

// v3.x (New - Config Object)
const context = new DataContext({
  storageKey: "MyData",
  loggingEnabled: true,
});
await context.store(data); // Always async

// v3.x (New - Legacy Constructor)
const context = new DataContext("MyData");
await context.store(data); // Always async
```

For detailed migration steps, error handling examples, and troubleshooting, see [migration.md](./docs/migration.md).

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Modern browsers with ES2015+ support

## Requirements

- Node.js 16+ (for development)
- Modern browser with localStorage/sessionStorage support

## Framework Integration

- **React:** See [examples.md - React Integration](./docs/examples.md#react-integration)
- **Vue:** See [examples.md - Vue Integration](./docs/examples.md#vue-integration)
- **TypeScript:** See [typescript.md](./docs/typescript.md) for type-safe integration patterns

## Testing

i45 v3.0.0 includes comprehensive testing:

- **205 tests** with Jest
- **91.7% statement coverage**
- Unit tests for all components including IndexedDBService
- Type safety tests
- Error handling tests
- Browser storage mocking with fake-indexeddb

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

📖 **Testing examples:** [examples.md - Testing Examples](./docs/examples.md#testing-examples)

## Documentation

### Core Documentation

- **[README.md](./README.md)** - This file (getting started and quick reference)
- **[api.md](./docs/api.md)** - Complete API reference with all methods, properties, and error classes
- **[typescript.md](./docs/typescript.md)** - TypeScript usage guide with patterns and best practices
- **[examples.md](./docs/examples.md)** - 20+ comprehensive examples including React/Vue integration
- **[offline-sync.md](./docs/offline-sync.md)** - Comprehensive offline sync patterns, conflict resolution, and queue management
- **[migration.md](./docs/migration.md)** - Complete v2.x → v3.x migration guide

### Additional Resources

- **[revisions.md](./docs/revisions.md)** - Version history and changelog
- **[REFACTORING-SUMMARY.md](../../../Documents/Orion/Projects/i45/REFACTORING-SUMMARY.md)** - December 2025 refactoring details

## License

MIT © [CIS Guru](mailto:cisguru@outlook.com)

## Links

- [npm package](https://www.npmjs.com/package/i45)
- [GitHub Repository](https://github.com/xnodeoncode/i45)
- [Issue Tracker](https://github.com/xnodeoncode/i45/issues)
- [i45-jslogger](https://www.npmjs.com/package/i45-jslogger) - Logging support
- [i45-sample-data](https://www.npmjs.com/package/i45-sample-data) - Sample datasets

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Changelog

See [revisions.md](./docs/revisions.md) for version history and release notes.
