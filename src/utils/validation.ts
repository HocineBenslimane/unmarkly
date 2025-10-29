export function validateSoraUrl(url: string): boolean {
  const soraUrlPattern = /^https:\/\/sora\.chatgpt\.com\/p\/[a-zA-Z0-9_-]+/;
  return soraUrlPattern.test(url);
}
