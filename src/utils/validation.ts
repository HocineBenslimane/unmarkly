export function validateSoraUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'sora.chatgpt.com' && urlObj.pathname.startsWith('/p/');
  } catch {
    return false;
  }
}
