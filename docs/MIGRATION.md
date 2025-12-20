# Migration Guide: v2.x → v3.0.0

**Last Updated:** December 20, 2025  
**Current Version:** v3.0.0-alpha.1

This guide helps you migrate from i45 v2.x to v3.0.0, which includes breaking changes and major improvements.

## Overview of Changes

i45 v3.0.0 is a **complete TypeScript rewrite** with significant API improvements and architectural refactoring:

- ✅ **TypeScript-first** with full type safety
- ✅ **New architecture** - modular design with clear separation of concerns
- ✅ **Simplified API** - removed deprecated methods
- ✅ **Better property naming** - use getters/setters instead of methods
- ✅ **Improved validation** - centralized validation utilities with descriptive errors
- ✅ **Enhanced error handling** - 6 custom error classes
- ✅ **Zero code duplication** - 300+ lines of duplicate code eliminated
- ✅ **100% ESM** - no CommonJS support
- ✅ **Updated dependencies** - i45-jslogger v2.0.1+
- ✅ **Comprehensive testing** - 172 tests with 92% coverage

## New Architecture (December 2025)

v3.0.0 introduces a completely refactored architecture:

```
/src
  /core                      # Core application logic
    DataContext.ts           # Main class (refactored, 32% smaller)
    StorageManager.ts        # Service orchestration (NEW)
  /services
    /base                    # Base abstractions
      IStorageService.ts     # Service interface (NEW)
      BaseStorageService.ts  # Abstract base class (refactored)
    LocalStorageService.ts   # Refactored implementation
    SessionStorageService.ts # Refactored implementation
  /errors                    # Individual error classes (NEW)
    PersistenceServiceNotEnabled.ts
    DataServiceUnavailable.ts
    StorageKeyError.ts
    StorageLocationError.ts
    DataRetrievalError.ts
    StorageQuotaError.ts     # NEW error class
    index.ts                 # Barrel export
  /models                    # Data models
    DataContextConfig.ts     # Configuration interface (NEW)
    storageItem.ts
    storageLocations.ts
    databaseSettings.ts
  /utils                     # Shared utilities (NEW)
    ValidationUtils.ts       # Centralized validation
    ErrorHandler.ts          # Error management
```

## Breaking Changes

### 1. Constructor Signature (New Config Object Pattern)

**v2.x (Old)**:

```javascript
const context = new DataContext("Items", StorageLocations.LocalStorage);
```

**v3.0.0 (New - Recommended)**:

````typescript
// Modern config object approach
const context = new DataContext<MyType>({
  storageKey: "Items",
  storageLocation: StorageLocations.LocalStorage,
  loggingEnabled: true,
  logger: new Logger()
});

// Legacy approach still supported for backward compatibility
const cError Handling - 6 Custom Error Classes

**v3.0.0 introduces custom error classes** for better error handling:

```typescript
import {
  PersistenceServiceNotEnabled,
  DataServiceUnavailable,
  StorageKeyError,
  StorageLocationError,
  DataRetrievalError,
  StorageQuotaError  // NEW in December 2025
} from 'i45';

try {
  await context.store(items);
} catch (error) {
  if (error instanceof StorageKeyError) {
    console.error('Invalid key:', error.key);
  } else if (error instanceof StorageQuotaError) {
    console.error('Storage full:', error.key, error.storageType);
  } else if (error instanceof DataRetrievalError) {
    console.error('Retrieval failed:', error.key, error.cause);
  }
}
````

### 5. Validation Changes - Centralized Validation

**v3.0.0 uses ValidationUtils** for consistent validation and throws errors for invalid inputs:

```typescript
// ❌ These now throw errors:
context.storageKey = ""; // StorageKeyError: Cannot be empty
context.storageKey = "   "; // StorageKeyError: Cannot be whitespace only
context.storageKey = "localStorage"; // Warning: Reserved name
await context.store(null); // Error: Items cannot be null
await context.store("not an array"); // Error: Items must be an array
context.storageLocation = "invalid"; // StorageLocationError: Invalid location
context.setStorageKey("MyKey"); // Method call ❌
context.setStorageLocation(StorageLocations.SessionStorage); // Method call ❌
```

**v3.0.0 (New)**:

```typescript
const context = new DataContext<MyType>();
context.storageKey = "MyKey"; // Property assignment ✅
context.storageLocation = StorageLocations.SessionStorage; // Property assignment ✅
```

### 2. Removed Deprecated Methods

The following methods have been **completely removed**:

- ❌ `setStorageKey()` - Use `context.storageKey = value` instead
- ❌ `StorageLocation()` - Use `context.storageLocation = value` instead
- ❌ `setStorageLocation()` - Use `context.storageLocation = value` instead

### 3. Generic Type Parameter

**v2.x (Old)**:

````javascript
const context = new DataContext("Items", StorageLocations.LocalStorage);
const items = await context.retrieve(); // Returns any[]
```6. Method Signatures - Explicit Methods

**v3.0.0 uses clear, explicit method names** (no complex overloading):

```typescript
// Store operations
await context.store(items);                    // Default key/location
await context.storeAs(key, items);             // Custom key
await context.storeAt(key, location, items);   // Full control

// Retrieve operations
const items = await context.retrieve();              // Default
const items = await context.retrieveFrom(key);       // Custom key
const items = await context.retrieveAt(key, location); // Full control

// Remove operations
await context.remove();                        // Default
await context.removeFrom(key);                 // Custom key
await context.removeAt(key, location);         // Full control
````

### 7. Logger Changes (i45-jslogger v2.0.1+

**v3.0.0 (New)**:

```typescript
interface UserData {
  id: number;
  name: string;
}

const context = new DataContext<UserData>(
  "Items",
  StorageLocations.LocalStorage
);
const items = await context.retrieve(); // Returns UserData[] ✅
```

### 4. Validation Changes

**v3.0.0 throws errors** for invalid inputs (v2.x only logged warnings):

```typescript
// ❌ These now throw errors:
context.storageKey = ""; // Error: Cannot be empty
cont8xt.storageKey = "   "; // Error: Cannot be whitespace only
await context.store(null); // Error: Items cannot be null
await context.store("not an array"); // Error: Items must be an array
```

### 5. Logger Changes (i45-jslogger v2.0.1)

**v2.x (Old)**:

```javascript
logger.enableLogging = true; // ❌ Old property name
logger.enableEvents = true; // ❌ Old property name
```

**v3.0.0 (New)**:

```typescript
logger.loggingEnabled = true; // ✅ New property name
logger.enableDispatchEvents = true; // ✅ New property name
```

### 6. ESM Only

**v2.x** supported both CommonJS and ESM:

```javascript
const { DataContext } = require("i45"); // ❌ No longer supported
```

**v3.0.0** is ESM only:

```typescript
import { DataContext } from "i45"; // ✅ Use import
```

## Migration Steps

### Step 1: Update Package

```bash
npm install i45@^3.0.0

# Also update i45-jslogger if using logging
npm install i45-jslogger@^2.0.1
```

### Step 2: Update Imports

**Before (v2.x)**:

```javascript
const { DataContext, StorageLocations } = require("i45");
```

**After (v3.0.0)**:

````typescript
// Basic imports
import { DataContext, StorageLocations } from 'i45';

// Import error classes
import { 4: Update Constructor Calls

**Before (v2.x)**:
```javascript
const context = new DataContext();
context.setStorageKey("MyData");
context.setStorageLocation(StorageLocations.SessionStorage);
````

**After (v3.0.0 - Recommended)**:

```typescript
// Use config object (recommended)
const context = new DataContext<MyType>({
  storageKey: "MyData",
  storageLocation: StorageLocations.SessionStorage,
  loggingEnabled: true,
  logger: new Logger(),
});
6;
// Or use legacy constructor (still supported)
const context = new DataContext<MyType>(
  "MyData",
  StorageLocations.SessionStorage
);
context.loggingEnabled = true;
context.logger = new Logger();
```

### Step 5

StorageKeyError,
StorageLocationError,
DataRetrievalError,
StorageQuotaError
} from 'i45';

// Import type definitions
import type {
StorageItem,
StorageLocation,
DataContextConfig
} from 'i45';

````

### Step 3: Convert to TypeScript (Recommended)

If using JavaScript, consider migrating to TypeScript to take full advantage of type safety:

```typescript
// Create types for your data
interface Product {
  id: number;
  name: string;
  price: number;
}

// Use generic type parameter
const products = new DataContext<Product>("Products");
````

### Step 3: Update Property Access

**Before (v2.x)**:

```javascript
context.setStorageKey("MyData");
context.setStorageLocation(StorageLocations.SessionStorage);
const key = context.getStorageKey();
```

**After (v3.0.0)**:
7: Add Error Handling

Since v3.0.0 throws errors for invalid inputs and has custom error classes, add proper error handling:

````typescript
import {
  StorageKeyError,
  StorageLocationError,
  DataRetrievalError,
  StorageQuotaError
} from 'i45';

try {
  await context.store(items);
} catch (error) {
  if (error instanceof StorageKeyError) {
    console.error("Invalid storage key:", error.key);
  } else if (error instanceof StorageQuotaError) {
    console.error("Storage full:", error.key, error.storageType);
  } else if (error instanceof DataRetrievalError) {
    console.error("Failed to retrieve:", error.key, "cause:", error.cause);
  } else {
    console.error("Storage operation failed:", error);
  }
**Before (v2.x)**:

```javascript
const logger = new Logger();
logger.enableLogging = true;
logger.enableEvents = true;
````

**After (v3.0.0)**:

````typescript
const logger = new Logger();
logger.loggingEnabled = true;
logger.en8: Update Method Calls

**Before (v2.x)** - Complex overloading:
```javascript
await context.store(items);
await context.store("customKey", items);  // Confusing signature
await context.store("key", StorageLocations.SessionStorage, items);
````

**After (v3.0.0)** - Explicit methods:

````typescript
await context.store(items);                           // Default
await context.storeAs("customKey", items);            // Custom key
await context.storeAt("key", StorageLocations.SessionStorage, items); // Full control

### Step 6: Update Imports

**Before (v2.x)**:

```javascript
const { DataContext, StorageLocations } = require("i45");
````

**After (v3.0.0)**:

```typescript
import { DataContext, StorageLocations } from "i45";
// or
import type { StorageItem, StorageLocation } from "i45";
```

## Complete Example

### v2.x Code:

````javascript
const { DataContext, StorageLocations } = require("i45");

const context = new DataContext();
context.setStorageKey("Users");
context.setStorageLocation(StorageLocations.SessionStorage);

const users = [ (Recommended):

```typescript
import { DataContext, StorageLocations, Logger } from "i45";
import { StorageKeyError, DataRetrievalError } from "i45";

interface User {
  id: number;
  name: string;
}

// Modern config object approach (recommended)
const context = new DataContext<User>({
  storageKey: "Users",
  storageLocation: StorageLocations.SessionStorage,
  loggingEnabled: true,
  logger: new Logger()
});

const users: User[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

try {
  await context.store(users);
  const data = await context.retrieve();
  console.log(data); // Type-safe: User[]
} ca1. Configuration Object Pattern

```typescript
// Clean, self-documenting configuration
const context = new DataContext<MyType>({
  storageKey: "MyData",
  storageLocation: StorageLocations.LocalStorage,
  loggingEnabled: true,
  logger: myLogger
});
````

### 2. Service Orchestration (StorageManager)

The new `StorageManager` class eliminates code duplication and provides a clean abstraction:

```typescript
// Internally handles all storage operations
// No more duplicated switch statements
// Single place for service selection logic
```

### 3. Centralized Validation (ValidationUtils)

All validation is centralized with consistent error messages:

```typescript
// validateStorageKey()
// validateStorageLocation()
// validateArray()
// isReservedKey()
// sanitizeKey()
```

6. Better Validation

```typescript
// All of these now throw descriptive errors:
context.storageKey = ""; // StorageKeyError: Cannot be empty
context.storageKey = "localStorage"; // Warning: Reserved name
await context.store(null); // Error: Items cannot be null
await context.storeAs("", items); // StorageKeyError: key cannot be empty
context.storageLocation = "invalid"; // StorageLocationError: Invalid location
```

8. Improved Type Exports

```typescript
// Type imports
import type {
  StorageItem,
  StorageLocation,
  DatabaseSettings,
  DataContextConfig, // NEW
} from "i45";

// Factory functions
import {
  createStorageItem,
  createDatabaseSettings,
  createDefaultConfig, // NEW
  mergeConfig, // NEW
} from "i45";

// Utility exports
import {
  ValidationUtils, // NEW
  ErrorHandler, // NEW
  StorageManager, // NEW
} from "i45";
```

### 9. Comprehensive Testing

- 172 tests (up from 0 in v2.x)
- 92.08% statement coverage
- Type safety tests
- Error handling tests
- Integration testsentralized validation with `ValidationUtils`
- Unified error handling with `ErrorHandler`
- No repeated switch statements
- 32% reduction in DataContext size (920 → 620 lines)ataServiceUnavailable,
  StorageKeyError,
  StorageLocationError,
  DataRetrievalError,
  StorageQuotaError // NEW
  } from 'i45';

```

### 5. tch (error) {
  if (error instanceof StorageKeyError) {
    console.error("Invalid key:", error.key);
  } else if (error instanceof DataRetrievalError) {
    console.error("Retrieval failed:", error.key, error.cause);
  } else {
    console.error("Storage operation failed:", error);
  }
}
```

### v3.0.0 Code (Legacy Constructor):

````typescript
import { DataContext, StorageLocations } from "i45";

interface User {
  id: number;
  name: string;
}
 or config object:

```typescript
// ❌ context.setStorageKey("key");
context.storageKey = "key"; // ✅

// Or use config object
const context = new DataContext({ storageKey: "key" }); // ✅
````

### Error: "Expected 2 arguments but got 3"

**Problem**: Using old overloaded method signatures.

**Solution**: Use explicit methods:

```typescript
// ❌ await context.store("key", location, items);
await context.storeAt("key", location, items);
```

### v3.0.0 Code:

```typescript
import { DataContext, StorageLocations } from "i45";

interface User {
  id: number;
  name: string;
}

const context = new DataContext<User>("Users", StorageLocations.SessionStorage);

const users: User[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

try {
  await context.store(users);
  const data = await context.retrieve();
  console.log(data);
} catch (error) {
  console.error("Storage operation failed:", error);
}
```

## New Features in v3.0.0

### Type Safety

````typescript
interface Product {
  id: number;
  name: string;
  price: number;
}

const products = new DataContext<Product>("Pr with `ValidationUtils`.

**Solution**: Ensure data is valid before storing:

```typescript
if (Array.isArray(items) && items.length > 0) {
  await context.store(items);
} else {
  console.warn('No items to store');
}
````

### Custom Error Handling

**Problem**: Generic error catching doesn't provide enough detail.

**Solution**: Use instanceof checks with custom error classes:

````typescript
import {
  StorageKeyError,
  StorageQuotaError,
  DataRetrievalError
} from 'i45';

try {
  await context.store(items);
} catch (error) {
  if (error instanceof StorageQuotaError) {
    // Handle storage full
    console.error('Storage full for key:', error.key);
    // Maybe clear old data
  } else if (error instanceof StorageKeyError) {
    // Handle invalid key
    console.error('Invalid key:', error.key);
  } else if (error instanceof DataRetrievalError) {
    // Handle retrieval failure
   Performance Improvements

The December 2025 refactoring brings significant performance improvements:

- **Faster builds**: <1 second (0.9s average)
- **Smaller codebase**: 32% reduction in main class size
- **Better tree-shaking**: Modular architecture
- **Reduced bundle overhead**: Eliminated duplicate code

## Architecture Benefits

The new modular architecture provides:

1. **Single Responsibility**: Each module has one clear purpose
2. **Easy Testing**: Isolated modules are easier to test
3. **Better Maintainability**: Clear separation of concerns
4. **Easy Extension**: Add new storage services by implementing interface
5. **Type Safety**: Strong typing throughout

```typescript
// Example: Using the new utilities directly
import { ValidationUtils } from 'i45';

// Validate before operations
ValidationUtils.validateStorageKey(userInput);
ValidationUtils.validateArray(items);

// Check for reserved names
if (ValidationUtils.isReservedKey(key)) {
  console.warn('Using reserved key:', key);
}
````

## What's Next?

After migrating to v3.0.0:

1. **Review error handling** - Use custom error classes
2. **Enable TypeScript** - Full type safety benefits
3. **Update tests** - Test with new validation rules
4. **Monitor storage** - New error classes help catch issues
5. **Read the docs** - Check [API.md](./API.md) for complete reference

## Need Help?

- **GitHub Issues**: https://github.com/xnodeoncode/i45/issues
- **Discussions**: https://github.com/xnodeoncode/i45/discussions
- **Documentation**:
  - [README.md](../README.md) - Getting started
  - [API.md](./API.md) - Complete API reference
  - [TYPESCRIPT.md](./TYPESCRIPT.md) - TypeScript usage guide
  - [EXAMPLES.md](./EXAMPLES.md) - Comprehensive examples
- **Changelog**: See [CHANGES.md](../CHANGES.md) for detailed version history
- **Refactoring Details**: See REFACTORING-SUMMARY.md for December 2025 changes

## Summary

i45 v3.0.0 is a major upgrade focused on:

- ✅ **Type safety** - Full TypeScript with generics
- ✅ **Simpler, cleaner API** - Config object pattern
- ✅ **Better validation** - Centralized with ValidationUtils
- ✅ **Modern ESM-only architecture** - Tree-shakeable modules
- ✅ **Zero code duplication** - 300+ lines eliminated
- ✅ **Custom error classes** - 6 specific error types
- ✅ **Comprehensive testing** - 172 tests, 92% coverage
- ✅ **Modular design** - Clear separation of concerns

The migration effort is worthwhile for the improved developer experience, type safety, maintainability, and performanc

```typescript
import type { StorageItem, StorageLocation, DatabaseSettings } from "i45";

import { createStorageItem, createDatabaseSettings } from "i45";
```

## Troubleshooting

### Error: "module not found"

**Problem**: CommonJS require() no longer works.

**Solution**: Use ESM imports:

```typescript
import { DataContext } from "i45";
```

### Error: "property does not exist"

**Problem**: Using old method names.

**Solution**: Use property assignment:

```typescript
// ❌ context.setStorageKey("key");
context.storageKey = "key"; // ✅
```

### Error: "Cannot be null or undefined"

**Problem**: v3.0.0 validates inputs strictly.

**Solution**: Ensure data is valid before storing:

```typescript
if (Array.isArray(items) && items.length > 0) {
  await context.store(items);
}
```

### TypeScript Errors

**Problem**: Missing type definitions.

**Solution**: i45 v3.0.0 includes full TypeScript definitions. Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

## Need Help?

- **GitHub Issues**: https://github.com/xnodeoncode/i45/issues
- **Documentation**: See [README.md](../README.md) for complete API documentation
- **Testing**: See [TESTING.md](./TESTING.md) for test examples

## Summary

i45 v3.0.0 is a major upgrade focused on:

- ✅ Type safety
- ✅ Simpler, cleaner API
- ✅ Better validation
- ✅ Modern ESM-only architecture

While migration requires changes, the improved developer experience and type safety make it worthwhile!
