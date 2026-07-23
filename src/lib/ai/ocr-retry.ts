export function hasReachedOcrRetryLimit(retryCount: number) {
  return retryCount >= 3;
}
