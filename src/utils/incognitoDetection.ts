export async function detectIncognito(): Promise<boolean> {
  return new Promise((resolve) => {
    const isFirefox = 'MozAppearance' in document.documentElement.style;
    const isChrome = !!window.chrome;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isEdge = navigator.userAgent.includes('Edg');

    if (isFirefox) {
      const db = indexedDB.open('test');
      db.onerror = () => resolve(true);
      db.onsuccess = () => resolve(false);
    } else if (isChrome || isEdge) {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(({ quota }) => {
          resolve(quota !== undefined && quota < 120000000);
        });
      } else {
        const fs = (window as any).webkitRequestFileSystem || (window as any).requestFileSystem;
        if (!fs) {
          resolve(false);
        } else {
          fs(
            (window as any).TEMPORARY,
            100,
            () => resolve(false),
            () => resolve(true)
          );
        }
      }
    } else if (isSafari) {
      try {
        localStorage.setItem('test', '1');
        localStorage.removeItem('test');
        resolve(false);
      } catch (e) {
        resolve(navigator.cookieEnabled ? true : false);
      }
    } else {
      resolve(false);
    }
  });
}
