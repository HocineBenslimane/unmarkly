export async function detectIncognito(): Promise<boolean> {
  try {
    // Test localStorage
    if (!window.localStorage) {
      return true;
    }

    // Test indexedDB
    if (!window.indexedDB) {
      return true;
    }

    // Test persistent storage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.quota < 120000000) {
        return true;
      }
    }

    // Test FileSystem API
    if ('webkitRequestFileSystem' in window) {
      return new Promise((resolve) => {
        (window as any).webkitRequestFileSystem(
          0,
          0,
          () => resolve(false),
          () => resolve(true)
        );
      });
    }

    return false;
  } catch {
    return false;
  }
}
