export const detectIncognito = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);

    if (isChrome || isEdge) {
      const fs = (window as any).webkitRequestFileSystem || (window as any).requestFileSystem;
      if (fs) {
        fs(
          (window as any).TEMPORARY,
          100,
          () => resolve(false),
          () => resolve(true)
        );
      } else {
        resolve(false);
      }
    } else if (isFirefox) {
      if (indexedDB == null) {
        resolve(true);
      } else {
        const db = indexedDB.open('test');
        db.onerror = () => resolve(true);
        db.onsuccess = () => resolve(false);
      }
    } else if (isSafari) {
      try {
        window.openDatabase(null as any, null as any, null as any, null as any);
        resolve(false);
      } catch (e) {
        resolve(true);
      }
    } else {
      resolve(false);
    }
  });
};
