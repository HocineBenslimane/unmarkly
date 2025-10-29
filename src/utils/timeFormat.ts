export const getTimeRemaining = (resetAt: string): string => {
  const now = new Date().getTime();
  const reset = new Date(resetAt).getTime();
  const diff = reset - now;

  if (diff <= 0) {
    return '0h 0m';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

export const formatResetTime = (resetAt: string): string => {
  const date = new Date(resetAt);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
