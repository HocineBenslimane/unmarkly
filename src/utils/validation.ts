export function validateSoraUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const soraUrlPattern = /^https:\/\/sora\.chatgpt\.com\/p\/[a-zA-Z0-9_-]+/;
  return soraUrlPattern.test(url.trim());
}
