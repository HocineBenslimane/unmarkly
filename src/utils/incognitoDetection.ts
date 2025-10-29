export async function detectIncognito(): Promise<boolean> {
  return new Promise((resolve) => {
    const tests: Array<() => Promise<boolean>> = [];

    // Test 1: localStorage availability
    tests.push(async () => {
      try {
        const testKey = '__incognito_test__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        return false;
      } catch (e) {
        return true;
      }
    });

    // Test 2: IndexedDB behavior
    tests.push(async () => {
      return new Promise((resolveTest) => {
        try {
          const db = indexedDB.open('__incognito_test__');
          db.onerror = () => resolveTest(true);
          db.onsuccess = () => {
            db.result.close();
            indexedDB.deleteDatabase('__incognito_test__');
            resolveTest(false);
          };
          setTimeout(() => resolveTest(false), 100);
        } catch (e) {
          resolveTest(true);
        }
      });
    });

    // Test 3: Storage quota (Chrome/Edge)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      tests.push(async () => {
        try {
          const { quota } = await navigator.storage.estimate();
          return quota !== undefined && quota < 120000000;
        } catch {
          return false;
        }
      });
    }

    // Test 4: FileSystem API (Chrome/Edge)
    const fs = (window as any).webkitRequestFileSystem || (window as any).requestFileSystem;
    if (fs) {
      tests.push(async () => {
        return new Promise((resolveTest) => {
          fs(
            (window as any).TEMPORARY,
            1,
            () => resolveTest(false),
            () => resolveTest(true)
          );
        });
      });
    }

    // Test 5: RequestFileSystem (older Chrome)
    if ((window as any).webkitRequestFileSystem) {
      tests.push(async () => {
        return new Promise((resolveTest) => {
          (window as any).webkitRequestFileSystem(
            (window as any).TEMPORARY,
            1,
            () => resolveTest(false),
            () => resolveTest(true)
          );
        });
      });
    }

    // Run all tests and resolve true if ANY test indicates incognito
    Promise.all(tests.map(test => test().catch(() => false)))
      .then(results => {
        const isIncognito = results.some(result => result === true);
        resolve(isIncognito);
      })
      .catch(() => resolve(false));
  });
}
