export function validateSoraUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim();

  const soraUrlPattern = /^https?:\/\/(www\.)?sora\.chatgpt\.com\/p\/[a-zA-Z0-9_-]+/;

  return soraUrlPattern.test(trimmedUrl);
}
