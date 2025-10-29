export function getTimeRemaining(resetAt: string): string {
  const now = Date.now();
  const resetTime = new Date(resetAt).getTime();
  const diffMs = resetTime - now;

  if (diffMs <= 0) {
    return '0h 0m';
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}
