# i45 Revisions

## v3.1.0

### December 22, 2025

**New Features:**

- **Timestamp Tracking**: Automatic metadata tracking for stored data

  - `StorageMetadata<T>` interface with createdAt, updatedAt, version, and itemCount
  - Transparent wrapping/unwrapping - users work with plain arrays
  - Configurable via `trackTimestamps` option (default: true, opt-out available)
  - New methods: `getMetadata()`, `getMetadataFrom()`, `getMetadataAt()`
  - Helper functions: `isModifiedSince()`, `isStale()`, `getAge()` for time-based patterns
  - Version tracking with auto-increment for conflict resolution
  - Enables sync-since-timestamp, cache freshness, and conflict resolution patterns

- **Storage Quota Checking**: Added methods to check storage capacity and usage
  - `getRemainingStorage()`: Get overall storage quota using Storage API
  - `getStorageInfo(location?)`: Get quota info for specific storage location
  - New `StorageInfo` interface with quota/usage/remaining/percentUsed details
  - Helper functions: `formatBytes()` and `formatStorageInfo()` for display
  - Supports IndexedDB (via Storage API) and Web Storage (estimated limits)

**Improvements:**

- Applications can track when data was created and last modified
- Time-based synchronization patterns now possible with metadata timestamps
- Cache freshness checking with age-based validation
- Version-based conflict resolution for concurrent updates
- Non-breaking: existing code works without changes, metadata is transparent
- Applications can now check available storage before operations
- Graceful handling for browsers without Storage API support
- Web Storage quota estimation (10MB typical limit)
- Accurate IndexedDB quota via `navigator.storage.estimate()`

**Testing:**

- 47 new comprehensive tests for timestamp tracking functionality
- 24 new comprehensive tests for storage quota functionality
- Total test count increased from 205 to 272 tests
- All metadata tracking scenarios covered (wrapping, unwrapping, helpers)
- All quota checking scenarios covered (API support, edge cases, integration)

**Files Added:**

- `src/models/StorageMetadata.ts`: Metadata interface and 7 utility functions
- `src/models/DataContextConfig.ts`: Enhanced configuration with trackTimestamps
- `tests/metadata.test.ts`: 47 comprehensive tests
- `src/models/StorageInfo.ts`: Interface and utility functions
- `tests/storageQuota.test.ts`: 24 comprehensive tests
- `examples/storage-quota-example.ts`: 5 usage examples

**Files Modified:**

- `src/core/DataContext.ts`: Added metadata wrapping/unwrapping and quota checking methods
- `src/core/StorageManager.ts`: Updated to handle metadata objects
- `src/index.ts`: Export StorageMetadata, StorageInfo types and utilities
- `tests/dataContext.test.ts`: Updated tests for metadata structure

**Example Usage:**

```typescript
// Timestamp Tracking (automatic by default)
const context = new DataContext({
  storageKey: "books",
  trackTimestamps: true, // Default, can set false to disable
});

// Store data - metadata added automatically
await context.store([{ id: 1, title: "Book 1" }]);

// Retrieve unwrapped items
const items = await context.retrieve(); // [{ id: 1, title: "Book 1" }]

// Get metadata separately
const metadata = await context.getMetadata();
console.log(metadata);
// {
//   createdAt: "2025-12-22T20:28:43.891Z",
//   updatedAt: "2025-12-22T20:28:43.891Z",
//   itemCount: 1,
//   version: 1
// }

// Use helper functions for time-based patterns
import { isModifiedSince, isStale, getAge } from "i45";

if (isModifiedSince(metadata, lastSyncTime)) {
  console.log("Data modified, sync needed");
}

if (isStale(metadata, 5 * 60 * 1000)) {
  console.log("Cache is stale (>5 minutes old)");
}

const ageMs = getAge(metadata);
console.log(`Data age: ${Math.floor(ageMs / 1000)}s`);

// Storage Quota Checking
const info = await context.getRemainingStorage();
console.log(`${info.percentUsed}% used, ${info.remaining} bytes remaining`);

const localInfo = await context.getStorageInfo(StorageLocations.LocalStorage);
if (localInfo.percentUsed > 80) {
  console.warn("Storage is running low!");
}
```

---

## v3.0.1

### December 22, 2025

**New Features:**

- **IndexedDB Support**: Added `IndexedDBService` for large dataset storage (~50MB+ capacity)
  - Asynchronous storage operations with proper transaction management
  - Database: "i45Storage" with object store "items"
  - Supports all standard CRUD operations (save, retrieve, remove, clear)
  - `close()` method for connection cleanup
- **Async-First Interface**: All storage services now use async/await pattern
  - `IStorageService` interface updated to return `Promise<T>` for all operations
  - Consistent async API across localStorage, sessionStorage, and IndexedDB
  - Backward compatible at DataContext API level (was already async)

**Improvements:**

- Fixed empty string handling in IndexedDBService retrieval
- Added `structuredClone` polyfill for test environment compatibility
- Enhanced error handling for falsy values in storage retrieval

**Testing:**

- 32 new comprehensive tests for IndexedDBService
- Total test count increased from 173 to 205 tests
- IndexedDBService coverage: 89.61% statements, 91.3% branches
- All tests passing with `fake-indexeddb` for test environment

**Storage Locations:**

```typescript
enum StorageLocations {
  SessionStorage = "sessionStorage",
  LocalStorage = "localStorage",
  IndexedDB = "indexedDB", // NEW
}
```

**Dependencies:**

- Added `fake-indexeddb` as dev dependency for testing

**Files Changed:**

- New: `src/services/IndexedDBService.ts` (174 lines)
- New: `tests/indexedDBService.test.ts` (32 tests)
- Modified: All storage service interfaces to async
- Modified: `StorageLocations` enum to include IndexedDB
- Modified: Test setup for structuredClone polyfill

## v3.0.0-alpha.1

### December 19, 2025

This is a major release representing a complete TypeScript migration and architectural overhaul of the i45 library.

**Breaking Changes:**

- **TypeScript Migration**: Entire codebase rewritten in TypeScript with full type safety
- **Generic DataContext**: Main class is now generic `DataContext<T>` for type-safe storage operations
- **Property Name Changes**: `StorageItem` now uses camelCase: `name` and `value` (previously `Name` and `Value`)
- **Logger Changes**: Removed `iLogger` and `iLoggerValidator` exports (simplified to just `Logger` from i45-jslogger)

**New Features:**

- TypeScript type definitions (`.d.ts`) generated for all exports
- Strict type checking with TypeScript compiler
- ESM build output with source maps
- Generic type support: `DataContext<T>` for type-safe operations
- Abstract `BaseStorageService` class with `IStorageService` interface

**Improvements:**

- Fixed typo in package.json description: "brower" → "browser"
- Removed duplicate `dataService.js` file
- All models converted to TypeScript interfaces/enums
- All services use proper inheritance pattern
- Better error handling with typed exceptions
- Comprehensive type safety throughout codebase

**Build System:**

- Rollup bundler with TypeScript plugin
- Automatic type declaration generation
- Source maps for debugging
- Clean ESM output format

**Files Changed:**

- All `.js` files converted to `.ts`
- New models: `storageLocations.ts`, `storageItem.ts`, `databaseSettings.ts`, `exceptions.ts`
- New services: `baseStorageService.ts`, `localStorageService.ts`, `sessionStorageService.ts`
- Main: `dataContext.ts` (now generic), `index.ts` (entry point)
- Build: `rollup.config.js`, updated `tsconfig.json`

**Migration Guide:**

```typescript
// v2.x (JavaScript)
const context = new DataContext();
await context.store([{ id: 1, name: "Test" }]);

// v3.x (TypeScript)
interface User {
  id: number;
  name: string;
}
const context = new DataContext<User>();
await context.store([{ id: 1, name: "Test" }]); // Type-safe!
```

**Requirements:**

- Node.js 16+ recommended
- TypeScript 5.x for type checking (if using TypeScript)
- Modern browsers with ES2015+ support

## v0.0.0-alpha.4

### October 3, 2024

- Added application files.
- Created NPM Package.
- Linked package for testing.

## v0.0.0-alpha.9

### October 31, 2024

- Cleaned up package files and directories.
- Added test project.

## v0.0.0-alpha.10

### November 1, 2024

- Updated README.md
- Updated versioning to reflect alpha stage of development.

## v0.0.0-alpha.15

### November 21, 2024

- Added default settings to reduce steps required to implement the data context.
- Users can now implement browser storage in three lines of code.

## v0.0.0-alpha.16

### November 25, 2024

- NOTE: i45 versions v0.0.0-alpha.16 and later are _not_ compatible with versions v0.0.0-alpha.15 and earlier.
- Upgrading to version v0.0.0-alpha.16 from any previous version could break existing code.
- Update documentation.

## v0.0.0-alpha-18

### December 8, 2024

- Added clear() method to data context to allow data removal.

## v.0.0-alpha-20

### May 12, 2025

- Added cookie validation.

## v.0.0-alpha-21

- Code refactoring and clean-up.
- Merged with i45-Sample-Data package.
- Implemented new public methods and chaining.
- PersistenceTypes have been deprecated, but remain for backward compatibility. Use StorageLocatons instead.
- Updated README.md

```javascript
// import modules
import { DataContext, StorageLocations } from "i45";

// create an instace of the context class.
const context = new DataContext();

// modify database properties as needed.
context.StorageLocation(StorageLocations.LocalStorage).DatabaseName("My Items");

// store a single value. The store method accepts an array of values.
context.store([1, "tennis ball", true, { id: 4, name: "John" }]);

// retrieve item from storage and do perform desired operation.
context.retrieve().then(async (i) => {
  console.log("My Items", i);
});

// clear storage.
context.remove();
```

### Merged i45-Sample-Data package

Full usage details can be found at [i45-Sample-Data](https://www.npmjs.com/package/i45-sample-data)

Sample data has been included in this package for convenience.

```javascript
import { SampleData } from "i45";

var books = SampleData.JsonData.Books;

console.log(books);
```

## v2.0.0

#### August 24, 2025

- This is a major release consisting of a complete refactoring of the data context. It is not compatible with 1.x.x versions.
- Consolidated the verbs removing deprecated methods and properties.
- Added remove() method to remove a specific data store.
- Refactored clear() method to clear all data stores.
- Added application logging support via the [i45-jslogger](https://www.npmjs.com/package/i45-jslogger) package.
- Logging is turned on/off via the enableLogging() method.
- Added default values to public method parameters to improve error handling.
- Deprecated methods removed.

## v2.1.0

#### August 28, 2025

- Added custom logging support via the registerLogger() method.
- The Logger must implement three of the browser console methods.
  - info(), warn(), and error().

```javascript
import { DataContext } from "i45";

// an instance of a logger is needed. it may be a class or any other module.
var myLogger = new CustomLogger();

var context = new DataContext();
context.registerLogger(myLogger);
```

- Upon successful registration, DataContext messages will be routed to the custom router.

## v2.2.0

### September 6, 2025

- Deprecated enableLogging, DataStoreName() and StorageLocations() methods.
- Added loggingEnabled, dataStoreName, and storageLocations properties with validation.
- Deprecated registerLogger() method. Added addClient() method.
- Allows for multiple clients to be added.
- Updated documentation.
