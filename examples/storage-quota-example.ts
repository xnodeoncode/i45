/**
 * Storage Quota Checking Example
 *
 * This example demonstrates how to use the storage quota checking functionality
 * to monitor storage usage and make decisions based on available capacity.
 */

import { DataContext, StorageLocations, formatStorageInfo } from "../src/index";

// Example 1: Check overall storage quota (using Storage API)
async function checkOverallQuota() {
  const context = new DataContext({
    storageKey: "my-app",
    storageLocation: StorageLocations.LocalStorage,
    loggingEnabled: false,
  });

  try {
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

// Example 2: Check quota for specific storage location
async function checkLocationQuota() {
  const context = new DataContext({
    storageKey: "my-app",
    storageLocation: StorageLocations.LocalStorage,
    loggingEnabled: false,
  });

  // Check localStorage
  const localInfo = await context.getStorageInfo(StorageLocations.LocalStorage);
  console.log("\nLocalStorage Quota:");
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
    console.log("\n❌ Storage API not supported for IndexedDB quota");
  }
}

// Example 3: Check before storing large dataset
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
    description: `This is a description for item ${i}`,
    timestamp: new Date().toISOString(),
  }));

  // Calculate approximate size (rough estimate)
  const dataSize = JSON.stringify(largeData).length * 2; // UTF-16 = 2 bytes per char
  console.log(`\nData to store: ${Math.round(dataSize / 1024)} KB`);

  // Check if we have enough space
  const info = await context.getStorageInfo();
  console.log(`Available space: ${Math.round(info.remaining / 1024)} KB`);

  if (info.remaining >= dataSize) {
    console.log("✅ Sufficient space available, storing data...");
    await context.store(largeData);

    // Check usage after storing
    const afterInfo = await context.getStorageInfo();
    console.log(`\nAfter storing:`);
    console.log(formatStorageInfo(afterInfo));
  } else {
    console.warn(
      "⚠️ Not enough space! Need to free up storage or use different location."
    );

    // Maybe try IndexedDB instead?
    console.log("Trying IndexedDB...");
    context.storageLocation = StorageLocations.IndexedDB;
    try {
      const idbInfo = await context.getStorageInfo();
      if (idbInfo.remaining >= dataSize) {
        console.log("✅ IndexedDB has enough space");
        await context.store(largeData);
      }
    } catch (error) {
      console.error("Could not use IndexedDB:", error);
    }
  }
}

// Example 4: Monitor storage usage over time
async function monitorStorageUsage() {
  const context = new DataContext({
    storageKey: "monitoring",
    storageLocation: StorageLocations.LocalStorage,
    loggingEnabled: false,
  });

  console.log("\n=== Storage Monitoring ===");

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

  // Store more data
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

// Example 5: Smart storage selection based on data size
async function smartStorageSelection() {
  console.log("\n=== Smart Storage Selection ===");

  const context = new DataContext({
    storageKey: "smart-data",
    storageLocation: StorageLocations.LocalStorage, // Default
    loggingEnabled: false,
  });

  // Small dataset (< 1MB) - use localStorage
  const smallData = Array.from({ length: 100 }, (_, i) => ({ id: i }));
  const smallSize = JSON.stringify(smallData).length * 2;

  if (smallSize < 1024 * 1024) {
    // < 1MB
    console.log("Small dataset: Using localStorage");
    context.storageLocation = StorageLocations.LocalStorage;
  } else {
    console.log("Large dataset: Using IndexedDB");
    context.storageLocation = StorageLocations.IndexedDB;
  }

  await context.store(smallData);
  const info = await context.getStorageInfo();
  console.log(
    `Stored in ${info.type}: ${Math.round(info.usage / 1024)} KB used`
  );

  // Cleanup
  await context.remove();
}

// Run all examples
async function runAllExamples() {
  console.log("========================================");
  console.log("Storage Quota Checking Examples");
  console.log("========================================");

  try {
    await checkOverallQuota();
    await checkLocationQuota();
    await checkBeforeStore();
    await monitorStorageUsage();
    await smartStorageSelection();
  } catch (error) {
    console.error("Error running examples:", error);
  }

  console.log("\n========================================");
  console.log("Examples Complete");
  console.log("========================================");
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  checkOverallQuota,
  checkLocationQuota,
  checkBeforeStore,
  monitorStorageUsage,
  smartStorageSelection,
};
