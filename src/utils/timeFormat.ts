export function getTimeRemaining(resetAt: string): string {
  const now = Date.now();
  const reset = new Date(resetAt).getTime();
  const diff = reset - now;

  if (diff <= 0) {
    return '0h 0m';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}
