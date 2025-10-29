export async function detectIncognito(): Promise<boolean> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const { quota } = await navigator.storage.estimate();
      if (quota && quota < 120000000) {
        return true;
      }
    }

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      try {
        localStorage.setItem('test', '1');
        localStorage.removeItem('test');
        return false;
      } catch {
        return true;
      }
    }

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
